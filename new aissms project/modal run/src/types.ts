export type SlotType = 'lecture' | 'practical' | 'free';

export interface Teacher {
    id: string;
    name: string;
    subjects?: string[];
}

export interface Subject {
    id: string;
    name: string;
    type: 'theory' | 'practical';
    lecturesPerWeek: number;
    practicalsPerWeek: number;
    teacherIds?: string[]; // IDs of teachers capable of teaching this
    practicalBatchMap?: { [batchId: string]: string }; // specific teacher for specific batch (practical only)
}

export interface Lab {
    id: string;
    name: string;
    capacity?: number;
}

export interface Room {
    id: string;
    name: string;
    type: 'classroom' | 'lab';
}

export interface Batch {
    id: string;
    name: string;
    rollStart?: string;
    rollEnd?: string;
}

export interface Division {
    id: string;
    year: 'Second Year' | 'Third Year';
    name: string;
    batches: Batch[];
}

export interface Allocation {
    slotId: string;
    day: string;
    type: SlotType | 'break';
    subjectId: string;
    teacherId: string;
    roomId?: string;
    labId?: string;
    batchId?: string; // "All" or specific batch
    year?: string;
    startTime?: string;
    endTime?: string;
    durationInSlots?: number;
}

export interface TimeConfig {
    startTime: string; // "09:00"
    endTime: string;   // "17:00"
    slotDuration: number; // minutes, e.g. 60
    breakAfterSlots: number[]; // [3]
    breakDuration: number; // minutes
    customBreaks?: { startTime: string; endTime: string; duration: number }[];
}

export interface InputData {
    teachers: Teacher[];
    subjects: Subject[];
    rooms: Room[];
    timeConfig: TimeConfig;
    batches: Batch[];
}

export interface TimetableState {
    year: string;
    isLocked: boolean;
    allocations: Allocation[];
    inputData: InputData;
}
