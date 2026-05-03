/**
 * app.js
 * Main application controller.
 * Orchestrates state management, module communication, and high-level event handling.
 */

const AppController = (function (UI, Generator, Storage, Exporter) {
    // --- Global Application State ---
    const state = {
        inputData: null,          
        generatedOptions: [],     
        selectedOptionId: null,   
        currentDraftId: null      
    };

    function init() {
        if (!UI || !Generator || !Storage || !Exporter) {
            console.error("Critical modules missing. Cannot initialize AppController.");
            return;
        }

        UI.init();

        const drafts = Storage.getAllDrafts();
        UI.renderHome(drafts);
        UI.showScreen('homeScreen');

        setupAppLevelListeners();
    }

    function setupAppLevelListeners() {
        document.body.addEventListener('click', (e) => {
            const target = e.target.closest('[data-action]');
            if (!target) return;

            const action = target.getAttribute('data-action');
            const dataId = target.getAttribute('data-id');

            switch (action) {
                case 'new-timetable': handleNewTimetable(); break;
                case 'load-draft': if (dataId) handleLoadDraft(dataId); break;
                case 'generate-timetable': handleGenerateTimetable(); break;
                case 'switch-tab':
                    const tabId = target.getAttribute('data-tab-id');
                    if (tabId) handleTabSwitch(tabId);
                    break;
                case 'export-pdf': handleExport('pdf'); break;
                case 'export-excel': handleExport('excel'); break;
                case 'export-csv': handleExport('csv'); break;
            }
        });

        const fileInput = document.getElementById('fileImportInput');
        if (fileInput) {
            fileInput.addEventListener('change', (e) => {
                if (e.target.files.length > 0) {
                    handleImportFile(e.target.files[0]);
                }
            });
        }
    }

    function handleNewTimetable() {
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
            state.currentDraftId = null; 
            UI.showToast('File imported successfully!');
            
            // Check if it already has generated results
            if (state.inputData.generatedResults && state.inputData.generatedResults.length > 0) {
                state.generatedOptions = state.inputData.generatedResults;
                handleTabSwitch(state.generatedOptions[0].optionId);
                UI.showScreen('resultsScreen');
            } else {
                UI.renderSetupStep(1);
                UI.showScreen('setupScreen');
            }
        } else {
            UI.showToast(`Import failed: ${result.error}`, 'error');
        }
    }

    function handleGenerateTimetable() {
        state.inputData = collectFormData(); 

        UI.showScreen('generatorScreen');

        setTimeout(() => {
            const results = Generator.generateMultipleOptions(state.inputData, 3);
            
            if (results.length > 0) {
                state.generatedOptions = results;
                state.selectedOptionId = results[0].optionId;

                state.inputData.generatedResults = results;
                const saveRes = Storage.saveDraft(state.inputData, state.currentDraftId);
                if (saveRes.success) state.currentDraftId = saveRes.id;

                const tabsData = results.map((res, index) => ({
                    id: res.optionId,
                    label: `Option ${['A', 'B', 'C'][index] || index + 1}`
                }));

                UI.renderTabs(tabsData, state.selectedOptionId);
                
                // Pass full data so UI has access to days/slots
                const uiData = {
                    schedule: results[0].schedule,
                    days: state.inputData.days,
                    slots: state.inputData.slots
                };
                UI.renderTimetableGrid(uiData, 'Class');
                
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
        
        const uiData = {
            schedule: selectedOption.schedule,
            days: state.inputData.days,
            slots: state.inputData.slots
        };
        UI.renderTimetableGrid(uiData, 'Class');
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
            case 'pdf': success = Exporter.exportToPDF(dataToExport); break;
            case 'excel': success = Exporter.exportToExcel(dataToExport); break;
            case 'csv': success = Exporter.exportToCSV(dataToExport); break;
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
            classes: [{ id: 'Class A', subjects: [{ id: 'Math', frequency: 3 }, { id: 'Science', frequency: 2 }] }],
            teachers: [
                { id: 'Mr. Smith', subjects: ['Math'], availability: { 'Monday': ['09:00 AM', '10:00 AM'], 'Tuesday': ['09:00 AM'] } },
                { id: 'Mrs. Jones', subjects: ['Science'], availability: { 'Wednesday': ['11:00 AM', '12:00 PM'] } }
            ],
            days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
            slots: ['09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '01:00 PM'],
            constraints: { maxPeriodsPerDay: 4, breakSlots: [] }
        };
    }

    function collectFormData() {
        // In the future, this reads from HTML inputs:
        // const subjectInput = document.getElementById('subjectInput').value;
        // For now, it returns the state or an empty functional schema so it doesn't crash
        return state.inputData || getEmptyInputSchema();
    }

    return { init };

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
