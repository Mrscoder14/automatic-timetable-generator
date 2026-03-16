import express from "express";
import User from "./models/User.js";

const router = express.Router();

// Route to add a user
router.post("/add-user", async (req, res) => {
    try {
        const user = new User(req.body); // req.body should have name, email, age
        const savedUser = await user.save();
        res.json(savedUser); // Send saved data back
    } catch (err) {
        console.error("Error saving user:", err.message);
        res.status(500).json({ error: err.message });
    }
});

export default router;