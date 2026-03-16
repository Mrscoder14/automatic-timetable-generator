
import { generateTimetable } from './scheduler';
import { InputData, TimeConfig } from '../types';

const timeConfig: TimeConfig = {
    startTime: "08:10",
    endTime: "16:00",
    slotDuration: 60,
    breakAfterSlots: [],
    breakDuration: 0,
    customBreaks: [
        { startTime: '10:10', endTime: '10:30', duration: 20 },
        { startTime: '12:30', endTime: '13:00', duration: 30 }
    ]
};

const inputData: InputData = {
    teachers: [
        { id: 't1', name: 'T1', subjects: ['s1'] },
        { id: 't2', name: 'T2', subjects: ['s2'] },
        { id: 't3', name: 'T3', subjects: ['s3'] },
        { id: 't4', name: 'T4', subjects: ['s4'] },
        { id: 't5', name: 'T5', subjects: ['s5'] }
    ],
    subjects: [
        { id: 's1', name: 'S1 (L6, P0)', type: 'theory', lecturesPerWeek: 6, practicalsPerWeek: 0, teacherIds: ['t1'] },
        { id: 's2', name: 'S2 (L0, P6)', type: 'practical', lecturesPerWeek: 0, practicalsPerWeek: 6, teacherIds: ['t2'] },
        { id: 's3', name: 'S3 (L4, P4)', type: 'theory', lecturesPerWeek: 4, practicalsPerWeek: 4, teacherIds: ['t3'] },
        { id: 's4', name: 'S4 (L5, P0)', type: 'theory', lecturesPerWeek: 5, practicalsPerWeek: 0, teacherIds: ['t4'] },
        { id: 's5', name: 'S5 (L0, P6)', type: 'practical', lecturesPerWeek: 0, practicalsPerWeek: 6, teacherIds: ['t5'] }
    ],
    rooms: [
        { id: 'r1', name: 'CR1', type: 'classroom' },
        { id: 'r2', name: 'CR2', type: 'classroom' },
        { id: 'l1', name: 'L1', type: 'lab' },
        { id: 'l2', name: 'L2', type: 'lab' }
    ],
    batches: [
        { id: 'b1', name: 'A' },
        { id: 'b2', name: 'B' },
        { id: 'b3', name: 'C' }
    ],
    timeConfig: timeConfig
};


try {
    const year = "Third Year";
    console.log(`Generating timetable for ${year}...`);
    const allocations = generateTimetable(year, inputData, []);

    console.log(`Generated ${allocations.length} allocations.`);

    const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
    
    console.log("\nTimetable Matrix (8:10 - 12:30):");
    console.log("Slot | Mon      | Tue      | Wed      | Thu      | Fri      |");
    console.log("------------------------------------------------------------");
    
    ["1", "2", "3", "4"].forEach(sId => {
        let line = `${sId}    | `;
        DAYS.forEach(day => {
            const allocs = allocations.filter(a => a.day === day && a.slotId === sId);
            if (allocs.length === 0) {
                line += "FREE     | ";
            } else if (allocs[0].type === 'lecture') {
                line += `${allocs[0].subjectId.padEnd(8)} | `;
            } else {
                // Practical - check if all batches are present
                const batches = allocs.map(a => a.batchId);
                line += `P:${batches.join(',')}`.padEnd(8) + " | ";
            }
        });
        console.log(line);
    });

    const errors: string[] = [];
    
    // 1. Check "no free slots" in 8:10-12:30
    DAYS.forEach(day => {
        ["1", "2"].forEach(sId => {
            const hasLecture = allocations.some(a => a.day === day && a.slotId === sId && a.type === 'lecture');
            if (!hasLecture) errors.push(`Missing LECTURE in mandatory slot ${sId} on ${day}`);
        });
        ["3", "4"].forEach(sId => {
            inputData.batches.forEach(b => {
                const hasPrac = allocations.some(a => a.day === day && a.slotId === sId && a.batchId === b.id && a.type === 'practical');
                if (!hasPrac) errors.push(`Batch ${b.name} missing PRACTICAL in mandatory slot ${sId} on ${day}`);
            });
        });
    });

    // 2. Check full coverage (Hours)
    inputData.subjects.forEach(sub => {
        const lectureHours = allocations.filter(a => a.subjectId === sub.id && a.type === 'lecture').length; 
        const practicalHours = allocations.filter(a => a.subjectId === sub.id && a.type === 'practical').reduce((sum, a) => sum + (a.durationInSlots || 1), 0);
        
        // Practical hours are recorded per batch, so for S5 (P6) with 2 batches, we expect 12 total practical hours in allocations
        const expectedLectures = sub.lecturesPerWeek;
        const expectedPracticals = sub.practicalsPerWeek * inputData.batches.length;

        if (lectureHours < expectedLectures) errors.push(`Subject ${sub.name}: Covered only ${lectureHours}/${expectedLectures} lecture hours`);
        if (practicalHours < expectedPracticals) errors.push(`Subject ${sub.name}: Covered only ${practicalHours}/${expectedPracticals} practical hours`);
    });

    if (errors.length > 0) {
        console.error("\nVERIFICATION FAILED:");
        errors.forEach(e => console.error(` - ${e}`));
    } else {
        console.log("\nVERIFICATION SUCCESSFUL: All mandatory slots filled and coverage met.");
    }

} catch (e) {
    console.error("Execution Error:", e);
}

