
import express from 'express';
import { Teacher } from './models/Teacher.js';
import { Subject } from './models/Subject.js';
import { Room } from './models/Room.js';
import { Allocation } from './models/Allocation.js';
import User from './models/User.js';

const router = express.Router();

// --- Auth ---
router.post('/signup', async (req, res) => {
    try {
        const { username, password, role } = req.body;
        // Check existing
        const existing = await User.findOne({ username });
        if (existing) {
            return res.status(400).json({ message: "Username already exists" });
        }

        const user = new User({ username, password, role });
        await user.save();
        res.json({ message: "User created", user: { username: user.username, role: user.role } });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ username, password }); // Plain text match for prototype
        if (!user) {
            return res.status(401).json({ message: "Invalid credentials" });
        }
        res.json({
            message: "Login successful",
            user: {
                id: user._id,
                username: user.username,
                role: user.role
            }
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// --- Teachers ---
router.get('/teachers', async (req, res) => {
    try {
        const teachers = await Teacher.find();
        res.json(teachers);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.post('/teachers', async (req, res) => {
    try {
        const teacher = new Teacher(req.body);
        const newTeacher = await teacher.save();
        res.json(newTeacher);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// --- Subjects ---
router.get('/subjects', async (req, res) => {
    try {
        const subjects = await Subject.find();
        res.json(subjects);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.post('/subjects', async (req, res) => {
    try {
        const subject = new Subject(req.body);
        const newSubject = await subject.save();
        res.json(newSubject);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// --- Rooms ---
router.get('/rooms', async (req, res) => {
    try {
        const rooms = await Room.find();
        res.json(rooms);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.post('/rooms', async (req, res) => {
    try {
        const room = new Room(req.body);
        const newRoom = await room.save();
        res.json(newRoom);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// --- Allocations (Timetable) ---
router.get('/allocations', async (req, res) => {
    try {
        const allocations = await Allocation.find();
        res.json(allocations);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.post('/allocations', async (req, res) => {
    try {
        const allocation = new Allocation(req.body);
        const newAllocation = await allocation.save();
        res.json(newAllocation);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Save allocations for a specific year (replaces existing)
router.post('/allocations/save-year', async (req, res) => {
    try {
        const { year, allocations } = req.body;
        if (!year) return res.status(400).json({ message: "Year is required" });

        // Remove existing allocations for this year
        await Allocation.deleteMany({ year });

        // Add year field to all allocations
        const allocationsWithYear = allocations.map(a => ({ ...a, year }));

        if (allocationsWithYear.length > 0) {
            await Allocation.insertMany(allocationsWithYear);
        }

        res.json({ message: `Saved allocations for ${year}` });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Bulk Save Endpoint (Optional but helpful for initial sync)
router.post('/sync-all', async (req, res) => {
    try {
        const { teachers, subjects, rooms } = req.body;

        if (teachers) {
            await Teacher.deleteMany({});
            await Teacher.insertMany(teachers);
        }
        if (subjects) {
            await Subject.deleteMany({});
            await Subject.insertMany(subjects);
        }
        if (rooms) {
            await Room.deleteMany({});
            await Room.insertMany(rooms);
        }

        res.json({ message: "Data synced successfully" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

export default router;
