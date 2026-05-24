import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
// Assuming these are in backend/src/routes/auth.ts and backend/src/routes/notes.ts
import authRoutes from './routes/auth';
import googleAuthRoutes from './routes/google-auth';
import notesRoutes from './routes/notes';
import profileRoutes from './routes/profile';

dotenv.config();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 4002;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/note-craft';

// --- MongoDB Connection Setup for Serverless ---
// Use cached connection for performance on Vercel
let isConnected: Promise<typeof mongoose> | null = null;

const connectToDatabase = () => {
    if (isConnected) {
        return isConnected;
    }

    // Connect and cache the promise
    isConnected = mongoose.connect(MONGO_URI);

    isConnected.catch((err) => {
        console.error('MongoDB connection error:', err);
        isConnected = null; 
        throw err;
    });

    return isConnected;
};

// --- Middleware ---

app.use(cors());
app.use(express.json());

// Middleware to ensure database connection before routing
app.use(async (req, res, next) => {
    try {
        await connectToDatabase();
        next();
    } catch (error) {
        // Log the error but continue to allow non-DB routes (like auth checks) to function 
        // if possible, though authentication likely needs the DB.
        console.error('Database connection failed in middleware:', error);
        // We will allow the request to continue, but routes must handle connection errors.
        next(); 
    }
});


// --- Route Handlers (These map to your frontend fetch calls) ---

// Maps to: /api/auth/login, /api/auth/register, /api/auth/google
app.use('/api/auth', authRoutes);
app.use('/api/auth', googleAuthRoutes);

// Maps to: /api/notes
app.use('/api/notes', notesRoutes);

// Maps to: /api/profile
app.use('/api/profile', profileRoutes);

app.get("/", (req, res) => {
  res.json({ status: "Backend running ✅", version: "1.0.0" });
});


// --- Serverless Export & Local Execution ---

// MANDATORY: Export the app instance for Vercel's serverless function handler.
export default app;

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
