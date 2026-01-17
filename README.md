📝 NoteCraft Suite

A production-grade, full-stack notes & reminders application with offline-first support,
JWT authentication, Google OAuth, and Swagger-documented REST APIs.

Built as a monorepo containing both frontend and backend, following real-world architecture and best practices.

🚀 Features
🔐 Authentication

Email & password authentication

Google OAuth login

JWT access tokens with refresh token rotation

Secure logout & password change

🗂 Notes & Folders

Create, update, delete notes and folders

Hierarchical folder structure (nested folders)

File vs folder separation

Reminders with notification tracking

🌐 Offline-First Experience

Create & edit notes while offline

Persistent storage using IndexedDB

Automatic background sync when back online

Conflict-safe updates using server timestamps

🧑 User Profile

Profile picture upload

User metadata management

📚 API Documentation

Fully documented REST APIs using Swagger (OpenAPI 3.0)

Interactive Swagger UI for exploring and testing APIs

Request & response schemas included

JWT-protected endpoints supported directly in Swagger

🏗 Architecture Overview
note-craft-suite/
│
├── frontend/                 # React + TypeScript frontend
│   ├── src/
│   │   ├── components/
│   │   ├── context/          # Auth & Notes context
│   │   ├── services/         # API layer
│   │   └── hooks/
│
├── backend/                  # Node.js + Express backend
│   ├── src/
│   │   ├── routes/           # Auth, Notes, Profile routes
│   │   ├── models/           # Mongoose schemas
│   │   ├── middleware/       # Auth, validation, error handling
│   │   ├── swagger/          # OpenAPI definitions
│   │   └── index.ts
│
└── README.md

🛠 Prerequisites

Make sure you have the following installed:

Node.js (v18 or higher)

npm or yarn

MongoDB (local instance or MongoDB Atlas)

Git

⚙️ Environment Setup
Backend (/backend/.env)

Create a .env file inside the backend folder:

PORT=4002
MONGO_URI=mongodb://localhost:27017/notecraft

JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_refresh_secret

GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

Frontend (/frontend/.env)
VITE_API_BASE_URL=http://localhost:4002

▶️ Running the Project Locally
1️⃣ Clone the Repository
git clone https://github.com/your-username/note-craft-suite.git
cd note-craft-suite

2️⃣ Start the Backend
cd backend
npm install
npm run dev


Backend will start at:

http://localhost:4002

3️⃣ Start the Frontend

Open a new terminal:

cd frontend
npm install
npm run dev


Frontend will be available at:

http://localhost:5173

📚 API Documentation (Swagger)

Swagger UI is available once the backend is running:

http://localhost:4002/api-docs

What you can do in Swagger:

Explore all REST endpoints

View request & response schemas

Test APIs directly from the browser

Authenticate using JWT Bearer tokens

🧪 Using the Application

Register or log in using email/password or Google OAuth

Create folders and notes

Go offline and continue editing notes

Come back online — changes sync automatically

Set reminders and manage notifications

🧠 Offline Sync Strategy (High-Level)

IndexedDB is used for local persistence

Notes created offline are marked as synced: false

When network connectivity is restored:

Unsynced notes are pushed to the backend

Server timestamps are used to resolve conflicts

👤 Author

Sreenivas Yadav
Frontend / Full-Stack Developer

🌐 Portfolio:
https://portfolio-website-ten-green-37.vercel.app

🔗 LinkedIn:
https://www.linkedin.com/in/srinivas-yadav-b6a30527a

⭐ Why This Project

This project demonstrates:

Real-world authentication flows

Offline-first application design

Clean REST API architecture

Swagger documentation best practices

Scalable frontend & backend separation
