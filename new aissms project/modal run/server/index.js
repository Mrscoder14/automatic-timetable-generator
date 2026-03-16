import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/db.js";
import routes from "./routes.js";

dotenv.config();
connectDB();

const app = express();
app.use(express.json());
app.use(cors());

// Logging middleware - put this here
app.use((req, res, next) => {
    console.log(req.method, req.path, req.body);
    next();
});

// Routes
app.use('/api', routes);


app.get("/", (req, res) => {
    res.send("Backend running");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
