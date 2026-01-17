# 📝 NoteCraft Suite

A full-stack notes and reminders application with **offline-first support**, **JWT authentication**,  
**Google OAuth**, and **Swagger-documented REST APIs**.

This project is built as a **mono-repo** containing both frontend and backend.

---

## 🚀 Features

### 🔐 Authentication
- Email & password authentication
- Google OAuth login
- JWT access tokens with refresh token rotation
- Secure logout & password change

### 🗂 Notes & Folders
- Create, update, delete notes and folders
- Hierarchical folder structure
- Reminders with notification tracking

### 🌐 Offline-First
- Create & edit notes offline
- IndexedDB storage
- Automatic sync when back online

### 🧑 Profile
- Profile picture upload
- User metadata management

### 📚 API Documentation
- Fully documented REST APIs using **Swagger (OpenAPI 3.0)**
- Interactive Swagger UI for testing APIs

---

## 🏗 Architecture Overview
note-craft-suite/
│
├── frontend/        # React + TypeScript frontend (offline-first UI)
│
├── backend/         # Node.js + Express + MongoDB REST API
│   ├── src/
│   │   ├── routes/  # Auth, Notes, Profile APIs
│   │   ├── models/  # Mongoose schemas
│   │   ├── middleware/
│   │   └── swagger/ # OpenAPI definitions
│
└── README.md

##🛠 Prerequisites
Make sure you have the following installed:
Node.js (v18 or higher)
npm or yarn
MongoDB (local or Atlas)
Git

##⚙️ Environment Setup
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

##▶️ Running the Project Locally

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

##📚 API Documentation (Swagger)
Swagger UI is available once the backend is running:
http://localhost:4002/api-docs

Features:

Explore all REST APIs
View request/response schemas
Test APIs directly from the browser
Auth-protected endpoints using JWT Bearer tokens

##🧪 Using the Application

Register or log in using email/password or Google OAuth
Create folders and notes
Go offline and continue editing notes
Come back online and data syncs automatically
Set reminders and manage notifications

🧠 Offline Sync Strategy (High-Level)

IndexedDB used for local persistence
Notes created offline are marked as synced: false
When network reconnects:
Unsynced notes are pushed to the backend
Server timestamps resolve conflicts

##👤 Author

Sreenivas Yadav
Frontend / Full-Stack Developer

Portfolio: https://portfolio-website-ten-green-37.vercel.app

LinkedIn: https://www.linkedin.com/in/srinivas-yadav-b6a30527a
