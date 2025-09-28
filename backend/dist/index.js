"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
// Assuming these are in backend/src/routes/auth.ts and backend/src/routes/notes.ts
const auth_1 = __importDefault(require("./routes/auth"));
const notes_1 = __importDefault(require("./routes/notes"));
dotenv_1.default.config();
// Initialize Express app
const app = (0, express_1.default)();
const PORT = process.env.PORT || 4002;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/note-craft';
// --- MongoDB Connection Setup for Serverless ---
// Use cached connection for performance on Vercel
let isConnected = null;
const connectToDatabase = () => {
    if (isConnected) {
        return isConnected;
    }
    // Connect and cache the promise
    isConnected = mongoose_1.default.connect(MONGO_URI);
    isConnected.catch((err) => {
        console.error('MongoDB connection error:', err);
        isConnected = null;
        throw err;
    });
    return isConnected;
};
// --- Middleware ---
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Middleware to ensure database connection before routing
app.use(async (req, res, next) => {
    try {
        await connectToDatabase();
        next();
    }
    catch (error) {
        // Log the error but continue to allow non-DB routes (like auth checks) to function 
        // if possible, though authentication likely needs the DB.
        console.error('Database connection failed in middleware:', error);
        // We will allow the request to continue, but routes must handle connection errors.
        next();
    }
});
// --- Route Handlers (These map to your frontend fetch calls) ---
// Maps to: /api/auth/login, /api/auth/register
app.use('/api/auth', auth_1.default);
// Maps to: /api/notes
app.use('/api/notes', notes_1.default);
app.get("/", (req, res) => {
    res.json({ status: "Backend running ✅", version: "1.0.0" });
});
// --- Serverless Export & Local Execution ---
// MANDATORY: Export the app instance for Vercel's serverless function handler.
exports.default = app;
// LOCAL DEVELOPMENT: Start the server only when the file is run directly
if (require.main === module) {
    connectToDatabase().then(() => {
        app.listen(PORT, () => {
            console.log(`Backend server running on http://localhost:${PORT}`);
        });
    }).catch((err) => {
        console.error('Failed to start server due to MongoDB connection error:', err);
    });
}
