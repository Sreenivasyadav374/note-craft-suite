import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';
import notesRoutes from './routes/notes';

dotenv.config();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 4002;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/note-craft';

// --- MongoDB Connection Setup ---

// Use a promise to track the database connection status
let isConnected: Promise<typeof mongoose> | null = null;

const connectToDatabase = () => {
    if (isConnected) {
        console.log('Using existing MongoDB connection');
        return isConnected;
    }

    // Connect and cache the promise
    console.log('Connecting to MongoDB...');
    isConnected = mongoose.connect(MONGO_URI);

    isConnected.then(() => {
        console.log('Successfully connected to MongoDB');
    }).catch((err) => {
        console.error('MongoDB connection error:', err);
        isConnected = null; // Reset connection if failed
        throw err;
    });

    return isConnected;
};

// --- Middleware and Routes ---

app.use(cors());
app.use(express.json());

// Before handling routes, ensure database connection is initiated
// Note: The actual request handling will wait for the connection promise to resolve
// which may add latency to the first cold start, but ensures connectivity.
app.use(async (req, res, next) => {
    try {
        await connectToDatabase();
        next();
    } catch (error) {
        // Handle connection failure gracefully
        res.status(503).json({ error: 'Service Unavailable: Database connection failed' });
    }
});

// Route handlers
app.use('/api/auth', authRoutes);
app.use('/api/notes', notesRoutes);

// --- Serverless Export & Local Execution ---

// VERCEL REQUIREMENT: Export the app instance for the serverless function handler.
// Vercel handles wrapping this Express app to respond to requests.
export default app;

// LOCAL DEVELOPMENT: Start the server only when the file is run directly (npm start)
if (require.main === module) {
    // Ensure connection is established before listening (optional, but good practice)
    connectToDatabase().then(() => {
        app.listen(PORT, () => {
            console.log(`Backend server running on http://localhost:${PORT}`);
        });
    }).catch((err) => {
        console.error('Failed to start server due to MongoDB error.');
    });
}