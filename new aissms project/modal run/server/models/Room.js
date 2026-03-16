import mongoose from 'mongoose';

const roomSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    type: { type: String, enum: ['classroom', 'lab'], required: true },
    capacity: { type: Number }
});

export const Room = mongoose.model('Room', roomSchema);
