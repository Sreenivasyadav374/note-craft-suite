// The actual Express app lives one folder deeper (in src/index.ts).
// This file just imports and exports it so Vercel loads the whole thing.
import app from './src/index'; 

export default app;