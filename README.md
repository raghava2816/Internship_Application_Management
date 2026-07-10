# AI Internship Tracker Pro (MERN Stack SaaS)

AI Internship Tracker Pro is a production-grade, commercial-ready SaaS application designed to help candidates organize applications, parse resume ATS structures, practice verbal mock interviews, analyze code repositories, and secure engineering offers. 

Out of the box, the platform operates in a **Zero-Setup Mode**: it auto-connects to MongoDB and OpenAI engines if environment keys are active, otherwise falling back to custom simulated local engines (with localStorage persistence) to provide a complete, feature-rich portfolio showcase instantly.

---

## Technical Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS, Framer Motion, Recharts, Axios
- **Backend**: Node.js, Express, TypeScript, Mongoose ODM, JWT Auth, Multer
- **AI Integrations**: OpenAI GPT-4, SpeechRecognition & SpeechSynthesis Web APIs (Voice mode)
- **Deployment**: Docker, Docker Compose, Nginx web proxy configurations

---

## Project Structure

```
Intership_Finder_Project/
├── backend/
│   ├── src/
│   │   ├── config/          # Database (MongoDB) and OpenAI config
│   │   ├── controllers/     # Route logic handlers (Auth, Applications, Resumes, AI)
│   │   ├── middleware/      # JWT guards, rate limiters, central exception handlers
│   │   ├── models/          # Mongoose Schemas (User, Application, Resume, Interview, Log)
│   │   ├── routes/          # API Route namespaces
│   │   ├── services/        # OpenAI GPT prompt mappings & local fallback generators
│   │   └── index.ts         # Server bootstrap
│   ├── package.json
│   ├── tsconfig.json
│   └── Dockerfile
├── frontend/
│   ├── public/
│   │   └── manifest.json    # PWA configuration rules
│   ├── src/
│   │   ├── components/      # UI components (Buttons, Cards, Dialogs, Selects, Headers)
│   │   ├── context/         # React Contexts (AuthContext, ThemeContext, AppDataContext)
│   │   ├── pages/           # Pages (Dashboard, Tracker, Resume, Interview, Coach, Admin, Auth)
│   │   ├── App.tsx          # Router layout and ProtectedRoute logic
│   │   ├── index.css        # Global CSS, glassmorphism variables, scrolls
│   │   └── main.tsx         # DOM injection bootstrap
│   ├── package.json
│   ├── vite.config.ts
│   └── Dockerfile
├── docker-compose.yml       # Spawns Frontend, Backend & MongoDB container networks
├── .env.example             # Env variable guide
└── README.md
```

---

## Key Features

1. **Application Manager**: Tracks roles using Kanban cards, Chronological Timelines, Schedules Calendars, or paginated Tables. Supports bulk actions and CSV exports.
2. **AI ATS Resume Analyzer**: Parses files to compute compatibility percentages, visualizes metrics using Recharts, identifies missing keywords, and handles multiple document versions.
3. **Mock Interview Voice Suite**: Tailors technical questions based on active resume context. Features Text-To-Speech (audio read-out) and Speech-to-Text (speech recognition input) with automated grading feedback.
4. **AI Career Coach & RAG**: Chat advisor with semantic templates, custom negotiation arguments, and job match recommendations.
5. **Portfolio & Git Auditor**: Evaluates GitHub repository structures (Readme formats, clean code metrics, test suite gaps) and recommends actions.
6. **System Admin Center**: Traces user activity audit tables, CPU/RAM workloads, storage volumes, and database connection states.

---

## Database Schema (Mongoose)

### 1. User
- `name` (String, required)
- `email` (String, unique)
- `password` (String, hashed with bcrypt)
- `role` ('user' | 'admin')
- `settings` (theme preference, email/push notifications)

### 2. Application
- `ownerId` (Ref: User)
- `company` (String), `role` (String)
- `status` (Wishlist, Applied, OA, Technical Round, HR, Offer, Accepted, Rejected)
- `predictions` (Interview/Offer likelihoods computed by AI)
- `stages` (Historical log array tracking date/time progression)

### 3. Resume
- `ownerId` (Ref: User)
- `fileName` (String), `version` (e.g. 'v1.0')
- `textContent` (String)
- `atsReport` (Overall Score, formatting, grammar scores, missing keywords, Checklist item audits)

---

## Local Setup Instructions

### Prerequisites
- Node.js (v18+)
- MongoDB running locally (if not using mock mode)

### 1. Backend Server Setup
```bash
cd backend
npm install
# Create a .env file matching .env.example
npm run dev
```
Server starts on `http://localhost:5000`.

### 2. Frontend Development Server Setup
```bash
cd ../frontend
npm install
npm run dev
```
Open your browser to `http://localhost:3000`.

### Reviewer Bypass Credentials
To review page metrics without registering:
- **Demo Candidate Account**: `demo@tracker.com` / `password123`
- **System Administrator Account**: `admin@tracker.com` / `password123`

---

## Container Deployment (Docker Compose)

To spin up all services (MongoDB, API server, and Nginx Web proxy) inside container environments, execute:
```bash
docker-compose up --build
```
- **Web App Interface**: `http://localhost:3000`
- **API Server Endpoint**: `http://localhost:5000`
