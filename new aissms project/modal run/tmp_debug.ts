import { generateTimetable, generateSlots } from './src/logic/scheduler.ts';
import { InputData } from './src/types.ts';

const data: InputData = {
    timeConfig: {
        startTime: '08:10',
        endTime: '16:00',
        slotDuration: 60,
        breakAfterSlots: [], breakDuration: 60,
        customBreaks: [
            { startTime: '10:10', endTime: '10:30', duration: 20 },
            { startTime: '12:30', endTime: '13:00', duration: 30 }
        ]
    },
    batches: [
        { id: '1', name: 'Batch A', rollStart: '1', rollEnd: '20' },
        { id: '2', name: 'Batch B', rollStart: '21', rollEnd: '40' },
        { id: '3', name: 'Batch C', rollStart: '41', rollEnd: '60' }
    ],
    teachers: [
        { id: 't1', name: 'Sonawane', subjects: [] },
        { id: 't2', name: 'Shetkar', subjects: [] },
        { id: 't3', name: 'Palandurkar', subjects: [] }
    ],
    rooms: [
        { id: 'r1', name: '320', type: 'classroom' },
        { id: 'r2', name: 'Lab', type: 'lab' }
    ],
    subjects: [
        {
            id: 's1', name: 'WMN', type: 'theory',
            lecturesPerWeek: 3, practicalsPerWeek: 0,
            teacherIds: ['t1']
        },
        {
            id: 's2', name: 'DWM', type: 'theory',
            lecturesPerWeek: 3, practicalsPerWeek: 0,
            teacherIds: ['t2']
        },
        {
            id: 's3', name: 'MAD', type: 'theory',
            lecturesPerWeek: 3, practicalsPerWeek: 0,
            teacherIds: ['t3']
        }
    ]
};

const result = generateTimetable('Third Year', data, []);
console.log(result.filter(a => a.type === 'lecture').map(a => `${a.day} ${a.slotId}: ${a.subjectId} (${a.teacherId})`));
