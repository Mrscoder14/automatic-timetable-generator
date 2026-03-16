import mongoose from 'mongoose';

const allocationSchema = new mongoose.Schema({
    slotId: { type: String, required: true },
    day: { type: String, required: true },
    type: { type: String, required: true },
    subjectId: { type: String },
    teacherId: { type: String },
    roomId: { type: String },
    labId: { type: String },
    batchId: { type: String },
    year: { type: String } // To track which year this allocation belongs to
});

export const Allocation = mongoose.model('Allocation', allocationSchema);
