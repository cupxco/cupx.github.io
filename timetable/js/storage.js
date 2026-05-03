/**
 * storage.js
 * Handles local data persistence, file import/export, and schema validation.
 * UI-agnostic module returning structured JS objects and Promises.
 */

const StorageManager = (function () {
    const DRAFTS_KEY = 'timemaster_drafts';
    const CURRENT_VERSION = 1;
    const AUTO_SAVE_DELAY_MS = 1500;
    
    let autoSaveTimeout = null;

    // --- Internal Helpers ---

    /**
     * Validates the structure of imported or loaded JSON data.
     * @param {Object} data - The parsed JSON object.
     * @returns {Object} { valid: boolean, error: string|null }
     */
    function validateSchema(data) {
        if (!data || typeof data !== 'object') {
            return { valid: false, error: 'Data must be a valid JSON object.' };
        }
        
        // Version check (allows handling future schema changes)
        if (data.version && data.version > CURRENT_VERSION) {
            return { valid: false, error: `Unsupported version. Maximum supported is ${CURRENT_VERSION}.` };
        }

        const requiredArrays = ['classes', 'teachers', 'days', 'slots'];
        for (const field of requiredArrays) {
            if (!Array.isArray(data[field])) {
                return { valid: false, error: `Missing or invalid required field: '${field}'. Must be an array.` };
            }
        }

        // Add more granular validation here if necessary (e.g., checking internal object properties)
        return { valid: true, error: null };
    }

    // --- Core Storage Functions ---

    /**
     * Retrieves all saved drafts from localStorage.
     * @returns {Array} Array of draft objects.
     */
    function getAllDrafts() {
        try {
            const item = localStorage.getItem(DRAFTS_KEY);
            const drafts = item ? JSON.parse(item) : [];
            // Sort by most recently updated
            return drafts.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
        } catch (error) {
            console.error('Storage parse error:', error);
            return []; // Return empty array on corruption
        }
    }

    /**
     * Saves a draft to localStorage.
     * @param {Object} data - The timetable configuration data.
     * @param {string} [id] - Optional ID. If not provided, creates a new draft.
     * @returns {Object} { success: boolean, id: string, error: string }
     */
    function saveDraft(data, id = null) {
        try {
            const drafts = getAllDrafts();
            const draftId = id || `draft_${Date.now()}`;
            const draftName = data.name || `Draft ${new Date().toLocaleDateString()}`;
            
            const newRecord = {
                id: draftId,
                name: draftName,
                updatedAt: new Date().toISOString(),
                version: CURRENT_VERSION,
                data: data
            };

            const existingIndex = drafts.findIndex(d => d.id === draftId);
            if (existingIndex >= 0) {
                drafts[existingIndex] = newRecord;
            } else {
                drafts.push(newRecord);
            }

            localStorage.setItem(DRAFTS_KEY, JSON.stringify(drafts));
            return { success: true, id: draftId };
        } catch (error) {
            // Usually triggers if localStorage is full (QuotaExceededError) or disabled
            return { success: false, error: 'Failed to save draft. Storage quota might be exceeded.' };
        }
    }

    /**
     * Loads a specific draft by ID, or the most recent draft if no ID is provided.
     * @param {string} [id] - The ID of the draft to load.
     * @returns {Object} { success: boolean, data: Object, error: string }
     */
    function loadDraft(id = null) {
        const drafts = getAllDrafts();
        
        if (drafts.length === 0) {
            return { success: false, error: 'No drafts found.' };
        }

        const draft = id ? drafts.find(d => d.id === id) : drafts[0];

        if (!draft) {
            return { success: false, error: `Draft with ID '${id}' not found.` };
        }

        return { success: true, data: draft.data, id: draft.id };
    }

    /**
     * Deletes a draft by ID.
     * @param {string} id - The ID of the draft to delete.
     * @returns {Object} { success: boolean, error: string }
     */
    function deleteDraft(id) {
        try {
            let drafts = getAllDrafts();
            const initialLength = drafts.length;
            
            drafts = drafts.filter(d => d.id !== id);
            
            if (drafts.length === initialLength) {
                return { success: false, error: 'Draft not found.' };
            }

            localStorage.setItem(DRAFTS_KEY, JSON.stringify(drafts));
            return { success: true };
        } catch (error) {
            return { success: false, error: 'Failed to delete draft.' };
        }
    }

    /**
     * Debounced wrapper for saveDraft. Useful for triggering on user input changes.
     * @param {Object} data - The data to save.
     * @param {string} id - The draft ID to overwrite.
     * @param {Function} [callback] - Optional callback fired when save completes.
     */
    function autoSave(data, id, callback = null) {
        if (autoSaveTimeout) {
            clearTimeout(autoSaveTimeout);
        }
        
        autoSaveTimeout = setTimeout(() => {
            const result = saveDraft(data, id);
            if (callback) callback(result);
        }, AUTO_SAVE_DELAY_MS);
    }

    // --- Import / Export ---

    /**
     * Exports the data as a downloadable JSON Blob URL.
     * @param {Object} data - The timetable data to export.
     * @returns {string} Object URL representing the JSON file (UI must trigger download & revoke URL).
     */
    function exportInputJSON(data) {
        const payload = {
            version: CURRENT_VERSION,
            exportedAt: new Date().toISOString(),
            ...data
        };
        
        const jsonString = JSON.stringify(payload, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        return URL.createObjectURL(blob); 
    }

    /**
     * Reads and validates a JSON file provided by a file input.
     * @param {File} file - The file object from an HTML <input type="file">.
     * @returns {Promise<Object>} Resolves with { success: boolean, data: Object, error: string }
     */
    function importInputJSON(file) {
        return new Promise((resolve) => {
            if (!file || file.type !== 'application/json') {
                return resolve({ success: false, error: 'Please upload a valid JSON file.' });
            }

            const reader = new FileReader();
            
            reader.onload = (event) => {
                try {
                    const parsedData = JSON.parse(event.target.result);
                    
                    const validation = validateSchema(parsedData);
                    if (!validation.valid) {
                        return resolve({ success: false, error: validation.error });
                    }

                    resolve({ success: true, data: parsedData });
                } catch (error) {
                    resolve({ success: false, error: 'File contains malformed or invalid JSON.' });
                }
            };

            reader.onerror = () => {
                resolve({ success: false, error: 'An error occurred while reading the file.' });
            };

            reader.readAsText(file);
        });
    }

    // --- Public API ---
    return {
        getAllDrafts,
        saveDraft,
        loadDraft,
        deleteDraft,
        autoSave,
        exportInputJSON,
        importInputJSON
    };

})();

// If using ES modules in the future, you can uncomment this:
// export default StorageManager;

