
import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true }, // Note: Storing plain text for prototype. in prod use bcrypt.
    role: {
        type: String,
        enum: ['admin', 'viewer'],
        default: 'viewer'
    }
});

const User = mongoose.model("User", userSchema);

export default User;
