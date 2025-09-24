import { MongoClient } from 'mongodb';

let cachedClient = null;
let cachedDb = null;

async function connectToDatabase() {
  if (cachedClient && cachedDb) return { client: cachedClient, db: cachedDb };
  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  const db = client.db('note-craft-suite');
  cachedClient = client;
  cachedDb = db;
  return { client, db };
}

// helper to parse JSON body
async function parseBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', chunk => (data += chunk));
    req.on('end', () => {
      try { resolve(JSON.parse(data || '{}')); } catch { reject(new Error('Invalid JSON')); }
    });
  });
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
  const noteId = parsedUrl.searchParams.get("id") || req.url.split("/").pop();

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const { db } = await connectToDatabase();
    const collection = db.collection('notes');

    switch (req.method) {
      case 'GET':
        if (noteId) {
          const note = await collection.findOne({ id: noteId });
          return res.status(200).json(note);
        }
        const notes = await collection.find({}).toArray();
        return res.status(200).json(notes);

      case 'POST':
        const newNote = await parseBody(req);
        await collection.insertOne(newNote);
        return res.status(201).json(newNote);

      case 'PUT':
        const updateData = await parseBody(req);
        const updateResult = await collection.findOneAndUpdate(
          { id: noteId },
          { $set: updateData },
          { returnDocument: "after" }
        );
        return res.status(200).json(updateResult.value);

      case 'DELETE':
        await collection.deleteOne({ id: noteId });
        return res.status(204).end();

      default:
        res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
