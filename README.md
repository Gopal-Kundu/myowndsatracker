# LeetTracker — MERN Stack Progress Tracker

A high-performance, premium web application built using the MERN stack (MongoDB, Express, React, Node.js) to build custom DSA sheets, track revision progress, and enable lightning-fast lookups. Featuring user authentication, real-time CRUD operations, dynamic stats visualization, and a sleek, developer-centric dark user interface.

---

## 🚀 System Architecture

```
DSA Sheet/
├── backend/                  # Node.js + Express Backend
│   ├── .env.example          # Environment variables template
│   ├── package.json          # Backend dependencies (express, mongoose, etc.)
│   └── server.js             # Mongoose schemas, controllers, and Express routes
│
└── frontend/                 # Vite + React Frontend
    ├── public/               # Static assets
    ├── src/                  # React source files (App.jsx, index.css, main.jsx)
    ├── index.html            # Web app entry point & Google Fonts loader
    ├── package.json          # React dependencies (lucide-react, react, etc.)
    └── vite.config.js        # Vite config with backend proxy setup
```

---

## 🛠️ Step-by-Step Installation & Setup

### 1. Database Configuration
1. Go to the `backend/` directory.
2. Duplicate `.env.example` and rename the new file to `.env`:
   ```bash
   cp .env.example .env
   ```
3. Open the `.env` file and replace the `MONGODB_URI` placeholder with your actual **MongoDB Mongoose connection string**:
   ```env
   PORT=5000
   MONGODB_URI=your_mongodb_connection_string_here
   ```

### 2. User-Specific Sheet Initialization
When a new user registers, the application automatically initializes their account with a default set of DSA problems cloned from the template collection. This gives students and professionals an immediate starting list that they can fully customize, edit, delete, or expand.

---

## 🏃 Running the Application

To run the application, you need to start both the **backend server** and the **frontend dev server**.

### Start the Backend (Port 5000)
Navigate to the `backend` directory and start the server:
```bash
cd backend
npm run dev
```
*Note: This runs the server using `nodemon`, which will automatically reload if you make any changes to the backend files.*

### Start the Frontend (Port 5173)
Open a new terminal window, navigate to the `frontend` directory, and start the Vite development server:
```bash
cd frontend
npm run dev
```

### Accessing the Web Application
Once both servers are running, open your web browser and navigate to:
👉 **[http://localhost:5173](http://localhost:5173)**

---

## 🎯 Key Features Included

- **MongoDB Persistence**: Custom questions, edits, completions, and deletions are saved directly to your MongoDB database.
- **Dynamic Stats Board**: A circular progress ring calculates your overall completion percentage. Breakdowns for Easy, Medium, and Hard progress bars update reactively.
- **Interactive Table View**: An elegant LeetCode-style rows view displaying Status (interactive checkbox), Title (direct LeetCode external links), Topic badges, Difficulty levels, and CRUD Actions (Edit, Delete).
- **Edit Modal**: Instantly modify any question's Title, Topic, Link, or Difficulty. It hooks into the existing topics datalist for auto-completions.
- **Add Question Modal**: Easily add new questions to customize your study plan.
- **Filter and Search Suite**: Perform instant client-side searches and filter by Topic, Difficulty, or Done/Undone status.
- **Vite API Proxying**: The React app uses Vite's proxy server to automatically route `/api/*` requests to the Express backend, resolving CORS issues out-of-the-box.
