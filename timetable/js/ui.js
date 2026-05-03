/**
 * ui.js
 * Handles all UI rendering, screen transitions, and DOM interactions.
 * Built for mobile-first responsiveness using Tailwind CSS utilities.
 */

const UI = (function () {
    // --- State & DOM Cache ---
    const screens = ['homeScreen', 'setupScreen', 'generatorScreen', 'resultsScreen'];
    let currentStep = 1;
    const TOTAL_STEPS = 3;

    // --- Core Functions ---

    /**
     * Initializes the UI module, caching necessary elements and setting up event delegation.
     */
    function init() {
        setupEventDelegation();
    }

    /**
     * Transitions between main application screens with a fade effect.
     * @param {string} targetScreenId - The ID of the screen to show.
     */
    function showScreen(targetScreenId) {
        screens.forEach(screenId => {
            const el = document.getElementById(screenId);
            if (!el) return;

            if (screenId === targetScreenId) {
                el.classList.remove('hidden');
                // Small delay to allow display:block to apply before fading in
                setTimeout(() => {
                    el.classList.remove('opacity-0');
                    el.classList.add('opacity-100');
                }, 50);
            } else {
                el.classList.remove('opacity-100');
                el.classList.add('opacity-0');
                // Wait for fade out to complete before hiding
                setTimeout(() => {
                    el.classList.add('hidden');
                }, 300);
            }
        });
    }

    /**
     * Renders the home screen (drafts, etc.).
     */
    function renderHome(drafts = []) {
        const draftsContainer = document.querySelector('#homeScreen ul');
        if (!draftsContainer) return;

        if (drafts.length === 0) {
            draftsContainer.innerHTML = '<li class="text-sm text-gray-500 italic py-4">No recent drafts found.</li>';
            return;
        }

        const html = drafts.map(draft => `
            <li class="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex justify-between items-center hover:bg-gray-50 transition-colors cursor-pointer" data-action="load-draft" data-id="${draft.id}">
                <div>
                    <p class="font-medium text-gray-800 pointer-events-none">${draft.name}</p>
                    <p class="text-xs text-gray-500 mt-1 pointer-events-none">Last edited: ${draft.date}</p>
                </div>
                <svg class="w-5 h-5 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
            </li>
        `).join('');

        draftsContainer.innerHTML = html;
    }

    /**
     * Renders the setup form based on the current step.
     */
    function renderSetupStep(stepIndex) {
        currentStep = Math.max(1, Math.min(stepIndex, TOTAL_STEPS));
        
        // Update Progress Bar
        const progressBar = document.querySelector('#setupScreen .bg-indigo-600');
        if (progressBar) {
            progressBar.style.width = `${(currentStep / TOTAL_STEPS) * 100}%`;
        }

        // Update Header
        const headerTitle = document.querySelector('#setupScreen h2');
        const headerDesc = document.querySelector('#setupScreen p');
        const stepInfo = getStepInfo(currentStep);
        
        if (headerTitle) headerTitle.textContent = `Step ${currentStep}: ${stepInfo.title}`;
        if (headerDesc) headerDesc.textContent = stepInfo.description;

        // In a real app, you would hide/show different form inputs here based on stepIndex
    }

    /**
     * Renders the list of classes in the setup screen.
     */
    function renderClasses(classesData) {
        // Implementation would map classesData to DOM elements
        // Keep DOM updates minimal by comparing old and new state if necessary
    }

    /**
     * Renders the list of teachers in the setup screen.
     */
    function renderTeachers(teachersData) {
        // Implementation would map teachersData to DOM elements
    }

    /**
     * Renders the timetable grid with mobile-friendly sticky headers.
     * @param {Object} timetableData - The generated schedule.
     * @param {string} viewType - 'Class', 'Teacher', or 'Master'.
     */
    function renderTimetableGrid(timetableData, viewType = 'Class') {
        const tbody = document.querySelector('#resultsScreen tbody');
        if (!tbody) return;

        // Clear existing efficiently
        tbody.innerHTML = '';

        // Example generation of rows (assuming structured data)
        const times = ['09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '01:00 PM'];
        const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

        const rowsHtml = times.map(time => {
            let row = `<tr class="hover:bg-gray-50 transition-colors">
                <td class="px-4 py-4 border-r border-gray-100 text-gray-500 font-medium bg-white sticky left-0 z-10 whitespace-nowrap">${time}</td>`;
            
            days.forEach(day => {
                // Determine if there is a class here from timetableData
                const cellData = getCellData(timetableData, day, time, viewType);
                
                if (cellData) {
                    row += `
                        <td class="px-4 py-4 border-r border-gray-100 align-top min-w-[120px]">
                            <div class="bg-blue-50 border-l-4 border-blue-500 p-2 rounded shadow-sm cursor-pointer hover:bg-blue-100 transition-colors touch-manipulation" data-action="edit-entry" data-id="${cellData.id}">
                                <p class="font-bold text-blue-900 text-xs sm:text-sm pointer-events-none">${cellData.subject}</p>
                                <p class="text-blue-700 text-xs mt-1 pointer-events-none">${cellData.details}</p>
                            </div>
                        </td>`;
                } else {
                    row += `<td class="px-4 py-4 border-r border-gray-100 min-w-[120px]"></td>`;
                }
            });

            row += `</tr>`;
            return row;
        }).join('');

        tbody.innerHTML = rowsHtml;
    }

    /**
     * Renders the navigation tabs and handles the active state visually.
     */
    function renderTabs(optionsArray, activeOptionId) {
        const nav = document.querySelector('#resultsScreen nav');
        if (!nav) return;

        const tabsHtml = optionsArray.map(opt => {
            const isActive = opt.id === activeOptionId;
            const baseClasses = "whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors touch-manipulation";
            const activeClasses = "border-indigo-500 text-indigo-600";
            const inactiveClasses = "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300";

            return `
                <button data-action="switch-tab" data-tab-id="${opt.id}" class="${baseClasses} ${isActive ? activeClasses : inactiveClasses}">
                    ${opt.label}
                </button>
            `;
        }).join('');

        nav.innerHTML = tabsHtml;
    }

    /**
     * Displays a toast notification.
     */
    function showToast(message, type = 'success') {
        const container = document.getElementById('toastContainer');
        if (!container) return;

        // Create toast element
        const toast = document.createElement('div');
        toast.className = `bg-gray-800 text-white px-4 py-3 rounded-lg shadow-lg flex items-center justify-between pointer-events-auto transform transition-all translate-y-full opacity-0 mb-2`;
        
        toast.innerHTML = `
            <span class="text-sm font-medium">${message}</span>
            <button class="text-gray-400 hover:text-white focus:outline-none p-1" data-action="close-toast">
                <svg class="h-4 w-4 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
        `;

        container.appendChild(toast);

        // Animate in
        requestAnimationFrame(() => {
            toast.classList.remove('translate-y-full', 'opacity-0');
        });

        // Auto remove after 3 seconds
        setTimeout(() => {
            removeToast(toast);
        }, 3000);
    }

    // --- Private Helper Functions ---

    function removeToast(toastElement) {
        toastElement.classList.add('translate-y-full', 'opacity-0');
        setTimeout(() => {
            if (toastElement.parentElement) {
                toastElement.remove();
            }
        }, 300); // Wait for transition
    }

    function toggleModal(show) {
        const modal = document.getElementById('editModal');
        if (!modal) return;
        
        if (show) {
            modal.classList.remove('hidden');
        } else {
            modal.classList.add('hidden');
        }
    }

    function getStepInfo(step) {
        const steps = {
            1: { title: "Subjects & Constraints", description: "Define the core requirements for your schedule." },
            2: { title: "Teachers & Availability", description: "Add staff and their working hours." },
            3: { title: "Rooms & Resources", description: "Allocate physical spaces for classes." }
        };
        return steps[step] || steps[1];
    }

    function getCellData(data, day, time, viewType) {
        // Mock function: In reality, this searches the passed data structure
        // Returning mock data for demonstration
        if (day === 'Monday' && time === '09:00 AM') return { id: 1, subject: 'Physics 101', details: 'Room 304' };
        if (day === 'Wednesday' && time === '11:00 AM') return { id: 2, subject: 'Calculus II', details: 'Room 102' };
        return null;
    }

    // --- Event Delegation ---

    function setupEventDelegation() {
        document.body.addEventListener('click', (e) => {
            const target = e.target.closest('[data-action]');
            if (!target) return;

            const action = target.getAttribute('data-action');

            switch (action) {
                case 'switch-tab':
                    // Handle tab UI update
                    const allTabs = target.parentElement.querySelectorAll('[data-action="switch-tab"]');
                    allTabs.forEach(tab => {
                        tab.classList.remove('border-indigo-500', 'text-indigo-600');
                        tab.classList.add('border-transparent', 'text-gray-500');
                    });
                    target.classList.remove('border-transparent', 'text-gray-500');
                    target.classList.add('border-indigo-500', 'text-indigo-600');
                    
                    // In a real app, you would fetch new data and call renderTimetableGrid here
                    break;

                case 'edit-entry':
                    toggleModal(true);
                    break;

                case 'close-modal':
                    toggleModal(false);
                    break;

                case 'close-toast':
                    removeToast(target.closest('div'));
                    break;
                
                case 'next-step':
                    renderSetupStep(currentStep + 1);
                    break;
                    
                case 'prev-step':
                    renderSetupStep(currentStep - 1);
                    break;
            }
        });
    }

    // --- Public API ---
    return {
        init,
        showScreen,
        renderHome,
        renderSetupStep,
        renderClasses,
        renderTeachers,
        renderTimetableGrid,
        renderTabs,
        showToast,
        toggleModal
    };

})();

// Initialize UI when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    UI.init();
});

