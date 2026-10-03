# OpsManager

OpsManager is a full-stack work item tracking dashboard for operations teams. It combines a React frontend with an Express API and SQLite database to let users create, search, filter, update, and comment on operational tasks while enforcing role-based permissions and optimistic concurrency when work items are updated.

## Project overview

This project is designed to model a lightweight internal operations system where different roles can collaborate on work items:

- Admins can manage work items and see full operational context
- Agents can create and update assigned tasks
- Viewers can inspect work items without modifying them

Core features include:

- Secure login with JWT-based authentication
- Role-based access control for updates and actions
- Dashboard search and filtering by state
- Work item detail views with comments and audit history
- Optimistic concurrency checks using a version field
- SQLite-backed persistence for quick local setup

## Tech stack

- Frontend: React + Vite + Tailwind CSS
- Backend: Node.js + Express
- Database: SQLite with better-sqlite3
- Authentication: JWT
- Testing: Jest + Supertest

## Local setup

### Prerequisites

- Node.js 18+ recommended
- npm 9+

### 1. Install backend dependencies

```bash
cd backend
npm install
```

### 2. Install frontend dependencies

```bash
cd ../frontend
npm install
```

### 3. Start the backend server

In one terminal:

```bash
cd backend
node server.js
```

The backend runs on:

- http://localhost:3001

### 4. Start the frontend app

In a second terminal:

```bash
cd frontend
npm run dev
```

The app runs on:

- http://localhost:5173

### 5. Log in

The project seeds demo accounts automatically on first database initialization. Use any of the following credentials:

- admin / admin123
- agent1 / agent123
- agent2 / agent123
- viewer1 / viewer123

## Project structure

```text
Assignment/
├── backend/
│   ├── app.js
│   ├── db.js
│   ├── server.js
│   ├── tests/
│   ├── package.json
│   └── database.sqlite
├── frontend/
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── vite.config.js
├── ENGINEERING_DECISIONS.md
├── README.md
└── .gitignore
```

## Testing

### Backend tests

Run the backend test suite:

```bash
cd backend
npm test
```

This executes the Jest suite covering authentication and work item behavior, including:

- unauthenticated access rejection
- work item creation
- correct optimistic concurrency updates
- conflict handling on stale versions
- role-based permission enforcement

### Frontend validation

Build the frontend bundle to catch production issues:

```bash
cd frontend
npm run build
```

## Notes

- The database file is stored locally in the backend folder and is created automatically when the server starts.
- No separate environment variables are required for default local development.
- The app is intentionally lightweight and demo-oriented, making it easy to run and extend for additional operational workflows.
