📝 NoteCraft Suite
A robust, full-stack notes and reminders application featuring offline-first support, JWT authentication, Google OAuth, and Swagger-documented REST APIs. This project is structured as a monorepo for seamless development between frontend and backend.

🚀 Features
🔐 Authentication & Security
Flexible Login: Email/Password authentication or Google OAuth 2.0.

Secure Sessions: JWT-based access tokens with refresh token rotation.

Account Management: Secure logout and password change functionality.

🗂 Notes & Folders
Organization: Full CRUD operations for notes and folders.

Hierarchy: Nested folder structures for better categorization.

Reminders: Integrated reminder system with notification tracking.

🌐 Offline-First Experience
Persistence: Use IndexedDB to create and edit notes without an internet connection.

Auto-Sync: Data automatically synchronizes with the cloud once the connection is restored.

📚 API Documentation
Swagger (OpenAPI 3.0): Fully documented REST endpoints.

Interactive UI: Test API requests directly from the browser.

🏗 Architecture Overview
Plaintext

note-craft-suite/
├── frontend/          # React + TypeScript (Vite)
│   └── src/           # Offline-first UI & IndexedDB logic
├── backend/           # Node.js + Express + MongoDB
│   ├── src/
│   │   ├── routes/    # Auth, Notes, & Profile APIs
│   │   ├── models/    # Mongoose (MongoDB) schemas
│   │   ├── middleware/# Auth & Error handling
│   │   └── swagger/   # OpenAPI definitions
└── README.md
🛠 Prerequisites
Ensure you have the following installed:

Node.js (v18 or higher)

MongoDB (Local instance or Atlas cluster)

npm or yarn

Git

⚙️ Environment Setup
1. Backend (/backend/.env)
Create a .env file in the backend directory:

Code snippet

PORT=4002
MONGO_URI=mongodb://localhost:27017/notecraft
JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_refresh_secret
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
2. Frontend (/frontend/.env)
Create a .env file in the frontend directory:

Code snippet

VITE_API_BASE_URL=http://localhost:4002
▶️ Running the Project Locally
1. Clone the Repository
Bash

git clone https://github.com/your-username/note-craft-suite.git
cd note-craft-suite
2. Start the Backend
Bash

cd backend
npm install
npm run dev
The server will run at: http://localhost:4002

3. Start the Frontend
Open a new terminal window:

Bash

cd frontend
npm install
npm run dev
The UI will usually be available at: http://localhost:5173

📖 API Documentation
Once the backend is running, you can explore and test the APIs via Swagger:

🔗 http://localhost:4002/api-docs

Note: For protected endpoints, use the Authorize button in Swagger and provide your JWT Bearer token.

🧠 Offline Sync Strategy
To ensure a seamless user experience, NoteCraft Suite employs the following:

Local Storage: Uses IndexedDB for high-performance browser storage.

State Tracking: Notes created offline are flagged with synced: false.

Background Sync: Upon network reconnection, the app pushes unsynced changes to the server.

Conflict Resolution: Server-side timestamps are used to resolve conflicts between local and remote data.

👤 Author
Sreenivas Yadav Frontend / Full-Stack Developer

Portfolio: View My Work

LinkedIn: Srinivas Yadav
