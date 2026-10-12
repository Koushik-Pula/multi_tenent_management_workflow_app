# Multi-Tenant Workflow & Management Platform

A robust, full-stack multi-tenant project and task orchestration platform built with Node.js, Express, PostgreSQL, and React. Engineered with organization-level data isolation, dual-token JWT authentication with refresh token rotation, role-based access control (RBAC), and immutable audit logging.

---

## Architecture & System Highlights

- **Multi-Tenant Data Isolation**: Organization-level context enforcement across all resource mutations and queries to guarantee strict isolation.
- **Defense-in-Depth Auth**: Short-lived JWT access tokens paired with cryptographically hashed, rotating refresh tokens stored in PostgreSQL.
- **Granular RBAC**:
  - **Organization Tier**: `ADMIN` (Org settings, member invitations, team management), `MEMBER` (Scoped project view).
  - **Project Tier**: `MANAGER` (Task delegation, member assignment), `MEMBER` (Task execution).
- **Audit Ledger**: Comprehensive activity logging capturing entity modifications, actor signatures, and JSONB metadata.
- **Deterministic Workflow State Machine**: Predictable task lifecycles enforcing `TODO` → `IN_PROGRESS` → `DONE` transitions with guard validations.

---

## Tech Stack

| Domain | Technologies |
| :--- | :--- |
| **Backend** | Node.js (v18+), Express 5, PostgreSQL 15, `pg` Pool, JWT, bcrypt |
| **Frontend** | React 19, Vite, Tailwind CSS, React Router v6, Axios, Lucide React |
| **DevOps & Tooling** | Docker, Docker Compose, Postman |

---

## Project Structure

```text
multi_tenent_management_workflow_app/
├── backend/
│   ├── src/
│   │   ├── controllers/      # Route handlers and business logic
│   │   ├── middlewares/      # JWT auth, org context extraction, RBAC
│   │   ├── routes/           # REST endpoint definitions
│   │   ├── workflows/        # Deterministic state machine transitions
│   │   ├── guards/           # Edge-case safety (e.g., last admin safeguards)
│   │   ├── utils/            # Audit logging utilities
│   │   ├── db/               # Connection pooling and schema migrations
│   │   │   ├── pool.js       # PostgreSQL client pool configuration
│   │   │   └── schema.sql    # DDL schema definitions and indexes
│   │   ├── app.js            # Express application middleware pipeline
│   │   └── server.js         # HTTP server entrypoint
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── api/              # Axios client and interceptors
│   │   ├── auth/             # Authentication context and token management
│   │   ├── components/       # Reusable UI component library
│   │   ├── pages/            # Application views (Dashboard, Tasks, Settings)
│   │   └── App.jsx
│   └── package.json
├── docker-compose.yml        # PostgreSQL container orchestrator
└── README.md
```

---

## Quickstart Guide

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v18+)
- [Docker](https://www.docker.com/) & Docker Compose (or local PostgreSQL 15+)
- Git

### 2. Clone Repository
```bash
git clone https://github.com/Koushik-Pula/multi_tenent_management_workflow_app.git
cd multi_tenent_management_workflow_app
```

### 3. Spin Up PostgreSQL Database
Using Docker Compose automatically mounts the schema and initializes all tables and relational indexes:

```bash
docker compose up -d
```

*(Alternatively, run the SQL script located in `backend/src/db/schema.sql` against your existing PostgreSQL instance).*

### 4. Backend Setup
```bash
cd backend
npm install
```

Create a `.env` file inside `backend/`:
```env
PORT=5000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=workflow_db
DB_USER=postgres
DB_PASSWORD=postgrespassword

JWT_SECRET=super_secret_access_token_key_change_in_production
JWT_REFRESH_SECRET=super_secret_refresh_token_key_change_in_production

FRONTEND_URL=http://localhost:5173
```

Start the API server:
```bash
npm run dev
```
Backend API will boot at `http://localhost:5000`.

### 5. Frontend Setup
In a new terminal window:
```bash
cd frontend
npm install
npm run dev
```
Access the client dashboard at `http://localhost:5173`.

---

## Core API Reference

### Authentication & Tenant Onboarding
| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `POST` | `/auth/signup` | Register organization + root admin | Public |
| `POST` | `/auth/login` | Authenticate credentials and issue tokens | Public |
| `POST` | `/auth/refresh` | Rotate refresh token and issue new access token | Public |

### Organization & Team Management
| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `POST` | `/users/invite` | Send organization invite with assigned role | `ADMIN` |
| `POST` | `/users/accept-invite` | Complete registration from invite token | Public |
| `GET` | `/users` | List all members in the tenant org | `ADMIN` |
| `GET` | `/users/stats` | Aggregate dashboard metrics | Authenticated |

### Projects & Task Execution
| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `POST` | `/projects` | Create a new organizational project | `ADMIN` |
| `GET` | `/projects` | List projects available to the authenticated actor | `ADMIN` / `MEMBER` |
| `POST` | `/projects/:id/members` | Add user to project team | `ADMIN` / `MANAGER` |
| `POST` | `/tasks/projects/:projectId/tasks` | Create task within project scope | `ADMIN` / `MANAGER` |
| `PATCH` | `/tasks/:id/status` | Advance task state machine (`TODO` → `DONE`) | Assigned / `MANAGER` |
| `GET` | `/audits/audit-logs` | Retrieve tenant-scoped audit timeline | `ADMIN` |

---

## Database Design & Indexes

The PostgreSQL database enforces relational integrity with composite foreign keys, cascading deletions, and performance indexing:
- `idx_users_org` on `users(org_id)`
- `idx_projects_org` on `projects(org_id)`
- `idx_tasks_project` on `tasks(project_id)`
- `idx_audit_logs_org` on `audit_logs(org_id)`

---
