import mongoose from 'mongoose';

const subjectSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    type: { type: String, enum: ['theory', 'practical'], required: true },
    lecturesPerWeek: { type: Number, default: 0 },
    practicalsPerWeek: { type: Number, default: 0 },
    teacherIds: [{ type: String }],
    practicalBatchMap: { type: Map, of: String }
});

export const Subject = mongoose.model('Subject', subjectSchema);
