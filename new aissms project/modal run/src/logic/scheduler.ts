import { Allocation, InputData, TimeConfig, Subject, Batch } from '../types';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

// Helper to generate slots based on config
export function generateSlots(config: TimeConfig, extendBy: number = 0) {
    const slots = [];
    let currentTime = new Date(`2000-01-01T${config.startTime}`);
    const endTime = new Date(`2000-01-01T${config.endTime}`);

    // Safety break loop
    let i = 0;
    while (i < 20) {

        if (extendBy === 0) {
            if (currentTime >= endTime) break;
        } else {
            const extendedEnd = new Date(endTime.getTime() + (extendBy * 60 * 60 * 1000)); // Add hours
            if (currentTime >= extendedEnd) break;
        }

        const timeString = currentTime.toTimeString().substring(0, 5);

        // 1. Check for CUSTOM Break (Priority)
        const customBreak = config.customBreaks?.find(b => b.startTime === timeString);
        if (customBreak) {
            slots.push({
                id: `break-custom-${timeString}`,
                startTime: customBreak.startTime,
                endTime: customBreak.endTime,
                type: 'break'
            });
            currentTime.setMinutes(currentTime.getMinutes() + customBreak.duration);
            continue; // Skip the rest of the loop, proceed to next slot
        }

        // 2. Check for Standard Break (Legacy)
        if (config.breakAfterSlots.includes(i)) {
            const breakStart = currentTime.toTimeString().substring(0, 5);
            currentTime.setMinutes(currentTime.getMinutes() + config.breakDuration);
            const breakEnd = currentTime.toTimeString().substring(0, 5);
            slots.push({
                id: `break-${i}`,
                startTime: breakStart,
                endTime: breakEnd,
                type: 'break'
            });
        }

        const start = currentTime.toTimeString().substring(0, 5);
        currentTime.setMinutes(currentTime.getMinutes() + config.slotDuration);

        const end = currentTime.toTimeString().substring(0, 5);

        slots.push({
            id: (i + 1).toString(),
            startTime: start,
            endTime: end,
            type: 'academic'
        });
        i++;
    }
    return slots;
}

export const generateTimetable = (
    _year: string,
    data: InputData,
    lockedAllocations: Allocation[]
): Allocation[] => {
    // 0. Pre-Flight Validation
    const validationErrors: string[] = [];
    data.subjects.forEach(subject => {
        if (!subject.teacherIds || subject.teacherIds.length === 0) {
            validationErrors.push(`Subject '${subject.name}' has no assigned faculty.`);
        }
    });

    if (validationErrors.length > 0) {
        throw new Error("Validation Failed:\n" + validationErrors.join("\n"));
    }

    // 1. Try Standard Generation
    const standardSlots = generateSlots(data.timeConfig, 0);
    const result = attemptGeneration(_year, data, lockedAllocations, standardSlots);

    // If successful, return.
    // Note: We are strict now, so we might want to throw if unplaced > 0, 
    // but returning what we have is often better UX than crashing.
    if (result.unplacedCount > 0) {
        console.warn(`Standard generation incomplete. Unplaced: ${result.unplacedCount}`);
    }
    return result.allocations;
};

// --- Strict Solver ---

function attemptGeneration(
    _year: string,
    data: InputData,
    lockedAllocations: Allocation[],
    slotConfig: any[]
): { success: boolean; allocations: Allocation[]; unplacedCount: number } {

    const allocations: Allocation[] = [...lockedAllocations];
    const newAllocations: Allocation[] = [];
    const batchList = data.batches;

    // Build Resource Usage Map
    const resourceUsage = new Set<string>();
    // Key format: "Day-SlotId-ResourceId"

    const markUsage = (day: string, slotId: string, keys: string[]) => {
        keys.forEach(k => resourceUsage.add(`${day}-${slotId}-${k}`));
    };

    const isAvailable = (day: string, slotId: string, keys: string[]) => {
        return !keys.some(k => resourceUsage.has(`${day}-${slotId}-${k}`));
    };

    // Initialize Usage from Locked Allocations
    lockedAllocations.forEach(alloc => {
        // Namespace the batch ID by its original year so it doesn't block batches with the same ID in the new year
        // CRITICAL: If batchId is 'All', it should only block students of THAT year.
        const batchKeys = alloc.batchId === 'All' 
            ? batchList.filter(() => alloc.year === _year).map(b => `B-${alloc.year}-${b.id}`)
            : [`B-${alloc.year || 'Unknown'}-${alloc.batchId}`];

        markUsage(alloc.day, alloc.slotId, [`T-${alloc.teacherId}`, ...batchKeys]);
        if (alloc.roomId) markUsage(alloc.day, alloc.slotId, [`R-${alloc.roomId}`]);
    });

    // --- Task Queue Initialization ---
    // We need to track remaining requirements for EACH Batch
    interface PendingTask {
        id: string; // unique
        type: 'theory' | 'practical';
        subject: Subject;
        batchId: string; // "All" for theory/common, specific ID for practical
        duration: number;
        remaining: number;
        total: number; // Keep track of total to aid sorting
    }

    let pendingTasks: PendingTask[] = [];

    data.subjects.forEach(sub => {
        // Theory (Common)
        if (sub.lecturesPerWeek > 0) {
            pendingTasks.push({
                id: `theory-${sub.id}`,
                type: 'theory',
                subject: sub,
                batchId: 'All',
                duration: 1,
                remaining: sub.lecturesPerWeek,
                total: sub.lecturesPerWeek
            });
        }
        // Practical (Per Batch)
        if (sub.practicalsPerWeek > 0) {
            batchList.forEach(batch => {
                pendingTasks.push({
                    id: `prac-${sub.id}-${batch.id}`,
                    type: 'practical',
                    subject: sub,
                    batchId: batch.id,
                    duration: 2, // Hardcoded 2 hour practicals
                    remaining: sub.practicalsPerWeek,
                    total: sub.practicalsPerWeek
                });
            });
        }
    });

    // Initial Sort: Heaviest tasks first to avoid packing issues
    pendingTasks.sort((a, b) => b.total - a.total);

    const academicSlots = slotConfig.filter(s => s.type === 'academic');
    let unplacedCount = 0;

    // Helper: Try to schedule a Specific Type in a Specific Slot
    const tryScheduleBlock = (day: string, slotIndex: number, type: 'practical' | 'lecture', forceFill: boolean = false): boolean => {
        const slot = academicSlots[slotIndex];
        if (!slot) return false;

        const nextSlot = academicSlots[slotIndex + 1];

        // --- Strategy A: Parallel Practicals ---
        if (type === 'practical') {
            // Requirement: We need 2 slots available
            if (!nextSlot || nextSlot.startTime !== slot.endTime) return false; // Must be continuous
            if (!isAvailable(day, nextSlot.id, batchList.map(b => `B-${_year}-${b.id}`))) return false;

            const potentialAllocations: { batch: Batch, task: PendingTask, teacher: any, room: any }[] = [];
            const usedTeachersInThisStep = new Set<string>();
            const usedRoomsInThisStep = new Set<string>();

            // For "Perfect" generation, we attempt to schedule ALL batches in parallel if possible.
            // We favor slots where more batches can be accommodated.
            
            // Priority for Third Year: Fill Slots 2 and 3 exactly.
            // If this is TY and we are NOT in those slots, we might still allow practicals in afternoon.
            
            // Shuffle batches to avoid greedy deadlock
            const shuffledBatches = [...batchList].sort(() => Math.random() - 0.5);

            for (const batch of shuffledBatches) {
                if (isAvailable(day, slot.id, [`B-${_year}-${batch.id}`])) {
                    // Check if this batch already has a practical block today
                    const dailyPracCount = allocations.filter(a =>
                        a.day === day &&
                        a.batchId === batch.id && 
                        a.year === _year &&
                        a.type === 'practical'
                    ).length / 2; // Each block is 2 slots

                    if (dailyPracCount >= 2) {
                        continue; 
                    }
                } else {
                    continue; // Batch is busy
                }

                const batchPracs = pendingTasks.filter(t =>
                    t.type === 'practical' &&
                    t.batchId === batch.id &&
                    t.remaining > 0
                );

                if (batchPracs.length === 0) {
                    continue; // Skip batch but continue checking others
                }

                // Sort tasks for this batch by remaining hours
                const shuffledTasks = [...batchPracs].sort((a, b) => b.remaining - a.remaining);

                let validAlloc = null;
                for (const task of shuffledTasks) {
                    let teacherCandidates = data.teachers.filter(t => task.subject.teacherIds?.includes(t.id));

                    if (task.subject.practicalBatchMap && task.subject.practicalBatchMap[batch.id]) {
                        const specificTid = task.subject.practicalBatchMap[batch.id];
                        teacherCandidates = teacherCandidates.filter(t => t.id === specificTid);
                    }
                    teacherCandidates = teacherCandidates.filter(t => !usedTeachersInThisStep.has(t.id));

                    const teacher = teacherCandidates.find(t =>
                        isAvailable(day, slot.id, [`T-${t.id}`]) &&
                        isAvailable(day, nextSlot.id, [`T-${t.id}`])
                    );
                    if (!teacher) continue;

                    const suitableRooms = data.rooms.filter(r => r.type === 'lab');
                    const room = suitableRooms.find(r =>
                        !usedRoomsInThisStep.has(r.id) &&
                        isAvailable(day, slot.id, [`R-${r.id}`]) &&
                        isAvailable(day, nextSlot.id, [`R-${r.id}`])
                    );

                    if (teacher && room) {
                        validAlloc = { batch, task, teacher, room };
                        break;
                    }
                }
                if (validAlloc) {
                    potentialAllocations.push(validAlloc);
                    usedTeachersInThisStep.add(validAlloc.teacher.id);
                    usedRoomsInThisStep.add(validAlloc.room.id);
                }
            }

            if (potentialAllocations.length > 0) {
                // Commit whichever batches could be scheduled
                potentialAllocations.forEach(p => {
                    const alloc1 = {
                        slotId: slot.id, day, type: 'practical',
                        subjectId: p.task.subject.id, teacherId: p.teacher.id,
                        batchId: p.batch.id, roomId: p.room.name,
                        labId: p.room.id,
                        year: _year
                    } as Allocation;
                    const alloc2 = {
                        slotId: nextSlot.id, day, type: 'practical',
                        subjectId: p.task.subject.id, teacherId: p.teacher.id,
                        batchId: p.batch.id, roomId: p.room.name,
                        year: _year
                    } as Allocation;
                    allocations.push(alloc1, alloc2);
                    newAllocations.push(alloc1, alloc2);
                    markUsage(day, slot.id, [`T-${p.teacher.id}`, `R-${p.room.id}`, `B-${_year}-${p.batch.id}`]);
                    markUsage(day, nextSlot.id, [`T-${p.teacher.id}`, `R-${p.room.id}`, `B-${_year}-${p.batch.id}`]);
                    p.task.remaining--;
                });
                return true;
            }
        }

        // --- Strategy B: Common Theory Lecture ---
        if (type === 'lecture') {
            // Check Daily Lecture Limit: Max 4 lectures per day
            // Since common lectures apply to "All", we just check globally or for any batch.
            const dailyLectureCount = allocations.filter(a =>
                a.day === day &&
                a.type === 'lecture' &&
                a.year === _year
            ).length;

            if (dailyLectureCount >= 4) {
                return false;
            }

            // Strict rules for Third Year: 
            // 8:10-10:10 (slots 0, 1) MUST be Lectures.
            // 10:30-12:30 (slots 2, 3) MUST NOT be Lectures.
            if (_year === 'Third Year') {
                if (slotIndex >= 2 && slotIndex < 4) return false;
            }

            // For Second Year: Strictly avoid morning lectures (0, 1) to keep them for practicals
            if (_year === 'Second Year' && slotIndex < 2) {
                return false;
            }


            // Priority subjects for Third Year morning slots
            const prioritySubjects = ['ETI', 'MAD', 'DWM', 'WMN', 'MAN', 'CSS'];

            const theoryTasks = pendingTasks.filter(t => {
                if (t.type !== 'theory' || t.remaining <= 0) return false;

                // Check if this subject is already scheduled on this day
                const alreadyScheduled = allocations.some(a =>
                    a.day === day &&
                    a.subjectId === t.subject.id &&
                    a.type === 'lecture'
                );

                // Relax rule IF forceFill is true (cleanup) OR if subject MUST have multiple per day
                const daysRemaining = 5 - (DAYS.indexOf(day)); 
                return (forceFill || t.remaining > daysRemaining) ? true : !alreadyScheduled;
            });

            // Sort by remaining hours to prioritize heavy subjects
            theoryTasks.sort((a, b) => b.remaining - a.remaining);

            // If Third Year morning slot, prioritize specific subjects
            if (_year === 'Third Year' && slotIndex < 2) {
                theoryTasks.sort((a, b) => {
                    const aPrio = prioritySubjects.some(p => a.subject.name.toUpperCase().includes(p)) ? 1 : 0;
                    const bPrio = prioritySubjects.some(p => b.subject.name.toUpperCase().includes(p)) ? 1 : 0;
                    return bPrio - aPrio;
                });
            }

            // If we have tasks but they are all skipped because they are already scheduled today,
            // we might end up with free slots even if we have remaining load.
            // But that matches the user requirement "only one lecture of each subject on one day".

            for (const task of theoryTasks) {
                const eligibleTeachers = data.teachers.filter(t => task.subject.teacherIds?.includes(t.id));
                const teacher = eligibleTeachers.find(t => isAvailable(day, slot.id, [`T-${t.id}`]));
                if (!teacher) continue;

                const eligibleRooms = data.rooms.filter(r => r.type === 'classroom');
                const room = eligibleRooms.find(r => isAvailable(day, slot.id, [`R-${r.id}`]));

                    if (teacher && room) {
                        const batchKey = "All";
                        const alloc = {
                            slotId: slot.id, day, type: 'lecture',
                            subjectId: task.subject.id, teacherId: teacher.id,
                            batchId: batchKey, roomId: room.name,
                            year: _year
                        } as Allocation;
                        allocations.push(alloc);
                        newAllocations.push(alloc);
                        const batchKeys = batchList.map(b => `B-${_year}-${b.id}`);
                        markUsage(day, slot.id, [`T-${teacher.id}`, `R-${room.id}`, ...batchKeys]);
                        task.remaining--;
                        return true;
                    }
            }
        }

        return false;
    };

    // --- MAIN SCHEDULING LOOP ---

    // Heuristic Preferences based on Year
    // SY: Prefer Morning (Slot 0 -> 8:10)
    // TY: Prefer Mid-Day (Slot 2 -> 10:30) or Afternoon
    let preferredPracStartIndices: number[] = [];

    // Determine preferences
    // Note: This relies on the strict strings "Second Year" / "Third Year"
    if (_year === 'Second Year') {
        preferredPracStartIndices = [0, 4]; // Prioritize Morning (8:10) and Afternoon (1:00)
    } else if (_year === 'Third Year') {
        preferredPracStartIndices = [2]; // Prioritize 10:30 - strictly after morning lectures
    }

    // We REMOVED strict limits (TARGET_PRAC_BLOCKS/TARGET_LECTURES) 
    // to allow filling the day completely if needed (matches "Free Slots" fix and "Heavy Load" requirement).

    // Pass 1: Preferred Practical Blocks HORIZONTALLY
    // Scan preferred indices FIRST across all days
    for (const sIdx of preferredPracStartIndices) {
        if (sIdx < academicSlots.length - 1) { // bounds check
            DAYS.forEach(day => {
                tryScheduleBlock(day, sIdx, 'practical');
            });
        }
    }

    // Pass 2: Any other Practical Blocks (Filling gaps if heavy load) HORIZONTALLY
    for (let sIdx = 0; sIdx < academicSlots.length - 1; sIdx++) {
        // Strict rule for Third Year: 8:10 to 10:10 (slots 0, 1) reserved for lectures.
        // Also 10:30 to 12:30 (slots 2, 3) already covered by Pass 1 preference.
        if (_year === 'Third Year' && sIdx < 4) continue;

        DAYS.forEach(day => {
            tryScheduleBlock(day, sIdx, 'practical');
        });
    }

    // Pass 3: Lectures - HORIZONTAL FILLING
    // We iterate Slots according to Year-specific priorities, THEN Days.

    let lecturePriorityIndices: number[] = [];
    if (_year === 'Second Year') {
        lecturePriorityIndices = [2, 3, 4, 5, 0, 1]; // 10:30-12:30 High, 1:00-3:00 Fallback, Morning Avoid
    } else {
        // Default (including Third Year): Morning first
        lecturePriorityIndices = Array.from({ length: academicSlots.length }, (_, i) => i);
    }

    for (const sIdx of lecturePriorityIndices) {
        if (sIdx >= academicSlots.length) continue;
        for (const day of DAYS) {
            const slot = academicSlots[sIdx];
            if (batchList.some(b => !isAvailable(day, slot.id, [`B-${_year}-${b.id}`]))) continue;

            tryScheduleBlock(day, sIdx, 'lecture');
        }
    }

    // Pass 4: Final Cleanup (Horizontal Fill again for any leftover gaps)
    // Try to ensure no unplaced tasks remain if slots exist.
    let hasPending = pendingTasks.some(t => t.remaining > 0);

    if (hasPending) {
        // Prioritize TY morning slots specifically to ensure "no free slots"
        if (_year === 'Third Year') {
            for (let sIdx = 0; sIdx < 4; sIdx++) {
                const typeToTry: 'lecture' | 'practical' = sIdx < 2 ? 'lecture' : 'practical';
                for (const day of DAYS) {
                    const slot = academicSlots[sIdx];
                    if (!slot) continue;
                    
                    // IF SLOT IS ALREADY FILLED, SKIP
                    const isFilled = typeToTry === 'lecture' 
                        ? allocations.some(a => a.day === day && a.slotId === slot.id && a.year === _year)
                        : batchList.every(b => allocations.some(a => a.day === day && a.slotId === slot.id && a.batchId === b.id && a.year === _year));
                    
                    if (isFilled) continue;

                    // Relax the "one lecture per day" rule for mandatory slots
                    tryScheduleBlock(day, sIdx, typeToTry, true);
                }
            }
        }

        // Final thorough cleanup for EVERY slot to ensure full coverage
        for (let sIdx = 0; sIdx < academicSlots.length; sIdx++) {
            for (const day of DAYS) {
                const slot = academicSlots[sIdx];
                if (!slot) continue;
                
                // Try to fill any unplaced practicals first
                if (sIdx < academicSlots.length - 1) {
                    if (!(_year === 'Third Year' && sIdx < 2)) {
                        tryScheduleBlock(day, sIdx, 'practical', true);
                    }
                }

                // Try to fill any unplaced lectures
                if (!(_year === 'Third Year' && sIdx >= 2 && sIdx < 4)) {
                    // Try to place a lecture if there's space for ANY batch
                    // (Actually lectures are common, so we check if all batches are free)
                    if (batchList.every(b => isAvailable(day, slot.id, [`B-${_year}-${b.id}`]))) {
                         tryScheduleBlock(day, sIdx, 'lecture', true);
                    }
                }
            }
        }
    }

    // Calc unplaced
    unplacedCount = pendingTasks.reduce((acc, t) => acc + t.remaining, 0);

    return { success: true, allocations: newAllocations, unplacedCount };
}
