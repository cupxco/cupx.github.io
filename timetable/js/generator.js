/**
 * generator.js
 * Core engine for academic timetable generation using backtracking algorithms.
 * Agnostic to DOM/UI. Returns structured JSON data.
 */

const TimetableGenerator = (function () {
    
    // --- Seeded Random Number Generator (Mulberry32) ---
    function createPRNG(seed) {
        return function() {
            let t = seed += 0x6D2B79F5;
            t = Math.imul(t ^ t >>> 15, t | 1);
            t ^= t + Math.imul(t ^ t >>> 7, t | 61);
            return ((t ^ t >>> 14) >>> 0) / 4294967296;
        }
    }

    // --- Helper to shuffle arrays based on PRNG ---
    function shuffleArray(array, prng) {
        const arr = [...array];
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(prng() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    }

    /**
     * Generates multiple distinct timetable options.
     * @param {Object} inputData - The configuration object.
     * @param {number} count - Number of options to generate.
     * @returns {Array} Array of successful timetable objects.
     */
    function generateMultipleOptions(inputData, count = 3) {
        const results = [];
        let baseSeed = Date.now();
        let attempts = 0;
        const maxGlobalAttempts = count * 10; // Prevent infinite looping if constraints are impossible

        while (results.length < count && attempts < maxGlobalAttempts) {
            baseSeed += attempts * 997; // Arbitrary prime step
            const result = generateTimetable(inputData, baseSeed);
            
            if (result.success) {
                results.push({
                    optionId: `Opt-${results.length + 1}`,
                    seed: baseSeed,
                    schedule: result.schedule
                });
            }
            attempts++;
        }

        return results;
    }

    /**
     * Generates a single timetable using a specific seed.
     * @param {Object} inputData - The configuration object.
     * @param {number} seed - Integer seed for PRNG.
     */
    function generateTimetable(inputData, seed) {
        const prng = createPRNG(seed);
        const { days, slots, classes, teachers, constraints } = inputData;
        
        // 1. Initialize State
        const classSchedule = {}; // classId -> day -> slot -> { subjectId, teacherId }
        const teacherSchedule = {}; // teacherId -> day -> slot -> classId
        
        classes.forEach(c => {
            classSchedule[c.id] = {};
            days.forEach(d => classSchedule[c.id][d] = {});
        });

        teachers.forEach(t => {
            teacherSchedule[t.id] = {};
            days.forEach(d => teacherSchedule[t.id][d] = {});
        });

        // 2. Flatten and prioritize requirements
        let requirements = [];
        classes.forEach(c => {
            c.subjects.forEach(sub => {
                requirements.push({
                    classId: c.id,
                    subjectId: sub.id,
                    frequency: sub.frequency,
                    doublePeriod: sub.doublePeriod || false,
                    // Find all teachers capable of teaching this subject
                    possibleTeachers: teachers.filter(t => t.subjects.includes(sub.id)).map(t => t.id)
                });
            });
        });

        // Prioritize: Highest frequency first, least flexible (fewest possible teachers) first
        requirements.sort((a, b) => {
            if (b.frequency !== a.frequency) return b.frequency - a.frequency;
            return a.possibleTeachers.length - b.possibleTeachers.length;
        });

        // Convert requirements to single allocation tasks
        let tasks = [];
        requirements.forEach(req => {
            let remaining = req.frequency;
            while (remaining > 0) {
                if (req.doublePeriod && remaining >= 2) {
                    tasks.push({ ...req, duration: 2 });
                    remaining -= 2;
                } else {
                    tasks.push({ ...req, duration: 1 });
                    remaining -= 1;
                }
            }
        });

        const state = {
            classSchedule,
            teacherSchedule,
            days,
            slots,
            constraints,
            teachersData: teachers
        };

        const maxBacktrackAttempts = 10000;
        let attemptCounter = { count: 0 };

        // 3. Start Backtracking
        const success = backtrack(tasks, 0, state, prng, attemptCounter, maxBacktrackAttempts);

        return {
            success,
            schedule: success ? state.classSchedule : null,
            attempts: attemptCounter.count
        };
    }

    /**
     * Core recursive backtracking algorithm.
     */
    function backtrack(tasks, taskIndex, state, prng, attemptCounter, maxAttempts) {
        // Base case: All tasks assigned
        if (taskIndex >= tasks.length) return true;
        
        // Early termination if too deep
        if (attemptCounter.count > maxAttempts) return false;
        attemptCounter.count++;

        const currentTask = tasks[taskIndex];
        
        // Create randomized search space for days and slots
        const shuffledDays = shuffleArray(state.days, prng);
        const shuffledSlots = shuffleArray(state.slots, prng);
        const shuffledTeachers = shuffleArray(currentTask.possibleTeachers, prng);

        for (const teacherId of shuffledTeachers) {
            for (const day of shuffledDays) {
                for (let i = 0; i < shuffledSlots.length; i++) {
                    const slot = shuffledSlots[i];
                    
                    // Handle double periods
                    const slotIndices = [state.slots.indexOf(slot)];
                    if (currentTask.duration === 2) {
                        if (i + 1 >= state.slots.length) continue; // Not enough consecutive slots left
                        // Require strictly consecutive temporal slots
                        if (state.slots.indexOf(slot) + 1 !== state.slots.indexOf(shuffledSlots[i+1])) {
                           // For simplification, we just check the next index in the original slots array
                           slotIndices.push(state.slots.indexOf(slot) + 1);
                        } else {
                           slotIndices.push(state.slots.indexOf(shuffledSlots[i+1]));
                        }
                        
                        // Bounds check
                        if(slotIndices[1] >= state.slots.length) continue;
                    }

                    const targetSlots = slotIndices.map(idx => state.slots[idx]);

                    if (isValidAssignment(currentTask, teacherId, day, targetSlots, state)) {
                        // Apply assignment
                        assignSlot(currentTask, teacherId, day, targetSlots, state, true);

                        // Recurse
                        if (backtrack(tasks, taskIndex + 1, state, prng, attemptCounter, maxAttempts)) {
                            return true;
                        }

                        // Backtrack: Undo assignment if recursion failed
                        assignSlot(currentTask, teacherId, day, targetSlots, state, false);
                    }
                }
            }
        }

        return false; // Trigger backtracking to previous task
    }

    /**
     * Checks if a proposed assignment violates any constraints.
     */
    function isValidAssignment(task, teacherId, day, targetSlots, state) {
        const { classSchedule, teacherSchedule, constraints, teachersData } = state;
        const teacherDef = teachersData.find(t => t.id === teacherId);

        for (const slot of targetSlots) {
            // 1. Conflict: Class already has a subject in this slot
            if (classSchedule[task.classId][day][slot]) return false;

            // 2. Conflict: Teacher is already teaching in this slot
            if (teacherSchedule[teacherId][day][slot]) return false;

            // 3. Constraint: Teacher availability
            if (teacherDef.availability && teacherDef.availability[day]) {
                if (!teacherDef.availability[day].includes(slot)) return false;
            }

            // 4. Constraint: Breaks / Unavailable slots globally
            if (constraints.breakSlots && constraints.breakSlots.includes(slot)) return false;
        }

        // 5. Constraint: Max periods per day for a class
        if (constraints.maxPeriodsPerDay) {
            const periodsToday = Object.keys(classSchedule[task.classId][day]).length;
            if (periodsToday + targetSlots.length > constraints.maxPeriodsPerDay) return false;
        }

        // 6. Constraint: Same subject multiple times a day (usually avoid unless double period)
        const subjectsToday = Object.values(classSchedule[task.classId][day]).map(s => s.subjectId);
        if (subjectsToday.includes(task.subjectId)) return false; 

        return true;
    }

    /**
     * Applies or removes an assignment from the global state.
     */
    function assignSlot(task, teacherId, day, targetSlots, state, isAssigning) {
        const { classSchedule, teacherSchedule } = state;

        targetSlots.forEach(slot => {
            if (isAssigning) {
                classSchedule[task.classId][day][slot] = { 
                    subjectId: task.subjectId, 
                    teacherId: teacherId,
                    isDouble: task.duration === 2
                };
                teacherSchedule[teacherId][day][slot] = task.classId;
            } else {
                delete classSchedule[task.classId][day][slot];
                delete teacherSchedule[teacherId][day][slot];
            }
        });
    }

    // --- Public API ---
    return {
        generateTimetable,
        generateMultipleOptions,
        isValidAssignment // Exposed for potential unit testing
    };

})();

export default TimetableGenerator;

