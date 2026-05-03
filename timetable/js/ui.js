/**
 * ui.js
 * Handles all UI rendering, screen transitions, and DOM interactions.
 * Uses clean semantic class names to match the CupX dark theme.
 */

const UI = (function () {
    // --- State & DOM Cache ---
    const screens = ['homeScreen', 'setupScreen', 'generatorScreen', 'resultsScreen'];
    let currentStep = 1;
    const TOTAL_STEPS = 3;

    // --- Core Functions ---

    function init() {
        setupEventDelegation();
    }

    function showScreen(targetScreenId) {
        screens.forEach(screenId => {
            const el = document.getElementById(screenId);
            if (!el) return;

            if (screenId === targetScreenId) {
                el.classList.remove('hidden');
                setTimeout(() => {
                    el.classList.remove('opacity-0');
                    el.classList.add('opacity-100');
                }, 50);
            } else {
                el.classList.remove('opacity-100');
                el.classList.add('opacity-0');
                setTimeout(() => {
                    el.classList.add('hidden');
                }, 300);
            }
        });
    }

    function renderHome(drafts = []) {
        const draftsContainer = document.querySelector('#draftsContainer ul');
        if (!draftsContainer) return;

        if (drafts.length === 0) {
            draftsContainer.innerHTML = '<li class="empty-state">No recent drafts found.</li>';
            return;
        }

        const html = drafts.map(draft => `
            <li class="draft-item" data-action="load-draft" data-id="${draft.id}">
                <div>
                    <p class="draft-title">${draft.name}</p>
                    <p class="draft-date">Last edited: ${new Date(draft.updatedAt).toLocaleDateString()}</p>
                </div>
                <svg class="draft-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M9 5l7 7-7 7"></path>
                </svg>
            </li>
        `).join('');

        draftsContainer.innerHTML = html;
    }

    function renderSetupStep(stepIndex) {
        currentStep = Math.max(1, Math.min(stepIndex, TOTAL_STEPS));
        
        const progressBar = document.querySelector('.progress-fill');
        if (progressBar) {
            progressBar.style.width = `${(currentStep / TOTAL_STEPS) * 100}%`;
        }

        const headerTitle = document.querySelector('.setup-header h2');
        const headerDesc = document.querySelector('.setup-header p');
        const stepInfo = getStepInfo(currentStep);
        
        if (headerTitle) headerTitle.textContent = `Step ${currentStep}: ${stepInfo.title}`;
        if (headerDesc) headerDesc.textContent = stepInfo.description;
    }

    function renderTimetableGrid(timetableData, viewType = 'Class') {
        const tbody = document.querySelector('#resultsScreen tbody');
        if (!tbody) return;

        tbody.innerHTML = '';

        // Extract slots and days from the data
        const times = timetableData.slots || ['09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '01:00 PM'];
        const days = timetableData.days || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

        const rowsHtml = times.map(time => {
            let row = `<tr><td>${time}</td>`;
            
            days.forEach(day => {
                const cellData = getCellData(timetableData.schedule || timetableData, day, time, viewType);
                
                if (cellData) {
                    row += `
                        <td>
                            <div class="subject-card" data-action="edit-entry" data-id="${cellData.id}">
                                <p class="subject-title">${cellData.subjectId || cellData.subject}</p>
                                <p class="subject-details">${cellData.teacherId || cellData.details || ''}</p>
                            </div>
                        </td>`;
                } else {
                    row += `<td></td>`;
                }
            });

            row += `</tr>`;
            return row;
        }).join('');

        tbody.innerHTML = rowsHtml;
    }

    function renderTabs(optionsArray, activeOptionId) {
        const nav = document.querySelector('#resultsScreen nav');
        if (!nav) return;

        const tabsHtml = optionsArray.map(opt => {
            const isActive = opt.id === activeOptionId;
            return `
                <button data-action="switch-tab" data-tab-id="${opt.id}" class="tab-btn ${isActive ? 'active' : ''}">
                    ${opt.label}
                </button>
            `;
        }).join('');

        nav.innerHTML = tabsHtml;
    }

    function showToast(message, type = 'success') {
        const container = document.getElementById('toastContainer');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `toast-message toast-${type}`;
        
        toast.innerHTML = `
            <span>${message}</span>
            <button class="toast-close" data-action="close-toast">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
            </button>
        `;

        container.appendChild(toast);

        // Auto remove after 3 seconds
        setTimeout(() => {
            removeToast(toast);
        }, 3000);
    }

    // --- Private Helper Functions ---

    function removeToast(toastElement) {
        toastElement.style.opacity = '0';
        toastElement.style.transform = 'translateY(100%)';
        setTimeout(() => {
            if (toastElement.parentElement) {
                toastElement.remove();
            }
        }, 300);
    }

    function toggleModal(show) {
        const modal = document.getElementById('editModal');
        if (!modal) return;
        
        if (show) {
            modal.classList.remove('hidden');
            setTimeout(() => modal.classList.remove('opacity-0'), 10);
        } else {
            modal.classList.add('opacity-0');
            setTimeout(() => modal.classList.add('hidden'), 300);
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

    function getCellData(scheduleObj, day, time, viewType) {
        // Find if any class has a subject in this day/time slot
        if (!scheduleObj) return null;
        for (const classId in scheduleObj) {
            if (scheduleObj[classId] && scheduleObj[classId][day] && scheduleObj[classId][day][time]) {
                return scheduleObj[classId][day][time];
            }
        }
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
                    const allTabs = target.parentElement.querySelectorAll('[data-action="switch-tab"]');
                    allTabs.forEach(tab => tab.classList.remove('active'));
                    target.classList.add('active');
                    break;
                case 'edit-entry':
                    toggleModal(true);
                    break;
                case 'close-modal':
                    toggleModal(false);
                    break;
                case 'close-toast':
                    removeToast(target.closest('.toast-message'));
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

    return {
        init, showScreen, renderHome, renderSetupStep,
        renderTimetableGrid, renderTabs, showToast, toggleModal
    };

})();

document.addEventListener('DOMContentLoaded', () => {
    UI.init();
});
