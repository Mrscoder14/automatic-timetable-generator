import mongoose from 'mongoose';

const teacherSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    subjects: [{ type: String }] // Storing subject IDs
});

export const Teacher = mongoose.model('Teacher', teacherSchema);
