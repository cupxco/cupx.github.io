/**
 * app.js
 * Main application controller.
 * Orchestrates state management, module communication, and high-level event handling.
 */

const AppController = (function (UI, Generator, Storage, Exporter) {
    // --- Global Application State ---
    const state = {
        inputData: null,          // Holds the parsed/entered timetable configuration
        generatedOptions: [],     // Holds the array of generated timetable options
        selectedOptionId: null,   // Currently active tab/option ID
        currentDraftId: null      // ID of the currently loaded draft (if any)
    };

    // --- Initialization ---

    /**
     * Bootstraps the application, loads initial data, and sets up listeners.
     */
    function init() {
        if (!UI || !Generator || !Storage || !Exporter) {
            console.error("Critical modules missing. Cannot initialize AppController.");
            return;
        }

        // 1. Initialize UI (which sets up its own presentation listeners)
        UI.init();

        // 2. Load recent drafts from storage and render home screen
        const drafts = Storage.getAllDrafts();
        UI.renderHome(drafts);
        UI.showScreen('homeScreen');

        // 3. Set up application-level business logic listeners
        setupAppLevelListeners();
    }

    // --- Event Handling ---

    /**
     * Intercepts clicks and form submissions for application-level actions.
     * Keeps DOM binding separate from core logic.
     */
    function setupAppLevelListeners() {
        document.body.addEventListener('click', (e) => {
            const target = e.target.closest('[data-action]');
            if (!target) return;

            const action = target.getAttribute('data-action');
            const dataId = target.getAttribute('data-id');

            switch (action) {
                case 'new-timetable':
                    handleNewTimetable();
                    break;
                case 'load-draft':
                    if (dataId) handleLoadDraft(dataId);
                    break;
                case 'generate-timetable':
                    handleGenerateTimetable();
                    break;
                case 'switch-tab':
                    const tabId = target.getAttribute('data-tab-id');
                    if (tabId) handleTabSwitch(tabId);
                    break;
                case 'export-pdf':
                    handleExport('pdf');
                    break;
                case 'export-excel':
                    handleExport('excel');
                    break;
                case 'export-csv':
                    handleExport('csv');
                    break;
            }
        });

        // Listen for file imports
        const fileInput = document.getElementById('fileImportInput');
        if (fileInput) {
            fileInput.addEventListener('change', (e) => {
                if (e.target.files.length > 0) {
                    handleImportFile(e.target.files[0]);
                }
            });
        }
    }

    // --- Core Action Handlers ---

    function handleNewTimetable() {
        // Reset state
        state.inputData = getEmptyInputSchema();
        state.generatedOptions = [];
        state.selectedOptionId = null;
        state.currentDraftId = null;

        UI.renderSetupStep(1);
        UI.showScreen('setupScreen');
    }

    function handleLoadDraft(draftId) {
        const result = Storage.loadDraft(draftId);
        
        if (result.success) {
            state.inputData = result.data;
            state.currentDraftId = result.id;
            UI.showToast(`Draft loaded successfully.`);
            
            // If the draft already has generated results, skip to results. 
            // Otherwise, go to setup.
            if (state.inputData.generatedResults && state.inputData.generatedResults.length > 0) {
                state.generatedOptions = state.inputData.generatedResults;
                handleTabSwitch(state.generatedOptions[0].optionId);
                UI.showScreen('resultsScreen');
            } else {
                UI.renderSetupStep(1);
                UI.showScreen('setupScreen');
            }
        } else {
            UI.showToast(result.error, 'error');
        }
    }

    async function handleImportFile(file) {
        const result = await Storage.importInputJSON(file);
        
        if (result.success) {
            state.inputData = result.data;
            state.currentDraftId = null; // New draft from file
            UI.showToast('File imported successfully!');
            UI.renderSetupStep(1);
            UI.showScreen('setupScreen');
        } else {
            UI.showToast(`Import failed: ${result.error}`, 'error');
        }
    }

    function handleGenerateTimetable() {
        // 1. Collect latest data from forms (Mocked here - would normally query DOM forms)
        state.inputData = collectFormData(); 

        // 2. Transition to Loading Screen
        UI.showScreen('generatorScreen');

        // 3. Use setTimeout to allow the browser to paint the loading screen before blocking thread
        setTimeout(() => {
            // Generate 3 options
            const results = Generator.generateMultipleOptions(state.inputData, 3);
            
            if (results.length > 0) {
                state.generatedOptions = results;
                state.selectedOptionId = results[0].optionId;

                // Auto-save the successful generation to drafts
                state.inputData.generatedResults = results;
                const saveRes = Storage.saveDraft(state.inputData, state.currentDraftId);
                if (saveRes.success) state.currentDraftId = saveRes.id;

                // Prepare UI Data
                const tabsData = results.map((res, index) => ({
                    id: res.optionId,
                    label: `Option ${['A', 'B', 'C'][index] || index + 1}`
                }));

                UI.renderTabs(tabsData, state.selectedOptionId);
                UI.renderTimetableGrid(results[0].schedule, 'Class');
                
                UI.showScreen('resultsScreen');
                UI.showToast('Timetable generated successfully!');
            } else {
                UI.showScreen('setupScreen');
                UI.showToast('Could not generate timetable. Constraints might be too strict.', 'error');
            }
        }, 300);
    }

    function handleTabSwitch(optionId) {
        const selectedOption = state.generatedOptions.find(opt => opt.optionId === optionId);
        if (!selectedOption) return;

        state.selectedOptionId = optionId;
        UI.renderTimetableGrid(selectedOption.schedule, 'Class');
    }

    function handleExport(format) {
        const activeOption = state.generatedOptions.find(opt => opt.optionId === state.selectedOptionId);
        if (!activeOption) {
            UI.showToast('No active timetable to export.', 'error');
            return;
        }

        const dataToExport = {
            classSchedule: activeOption.schedule,
            days: state.inputData.days,
            slots: state.inputData.slots
        };

        let success = false;
        switch (format) {
            case 'pdf':
                success = Exporter.exportToPDF(dataToExport);
                break;
            case 'excel':
                success = Exporter.exportToExcel(dataToExport);
                break;
            case 'csv':
                success = Exporter.exportToCSV(dataToExport);
                break;
        }

        if (success) {
            UI.showToast(`Exported to ${format.toUpperCase()} successfully!`);
        } else {
            UI.showToast(`Failed to export to ${format.toUpperCase()}.`, 'error');
        }
    }

    // --- Data Helpers ---

    function getEmptyInputSchema() {
        return {
            classes: [],
            teachers: [],
            days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
            slots: ['09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '01:00 PM', '02:00 PM'],
            constraints: { maxPeriodsPerDay: 5, breakSlots: ['12:00 PM'] }
        };
    }

    function collectFormData() {
        // In a real app, this function would query the DOM forms inside `#setupScreen`
        // and construct the inputData object. For now, we return the existing state
        // or the empty schema to prevent null errors.
        return state.inputData || getEmptyInputSchema();
    }

    // --- Public API ---
    return {
        init
    };

})(
    typeof UI !== 'undefined' ? UI : null,
    typeof TimetableGenerator !== 'undefined' ? TimetableGenerator : null,
    typeof StorageManager !== 'undefined' ? StorageManager : null,
    typeof DataExporter !== 'undefined' ? DataExporter : null
);

// Initialize application when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    AppController.init();
});

