# Multi-Tenant Management & Workflow App

A full-stack multi-tenant project and task management application with role-based access control, organization-level isolation, audit logging, and a structured task workflow.

## Features

- **Multi-tenancy** — Each organization (tenant) is fully isolated
- **Authentication** — JWT access tokens + refresh token rotation
- **Organization signup** — Create an organization + admin user in one step
- **User invitations** — Admin can invite members with role assignment
- **Role-based access control**
  - Organization level: `ADMIN`, `MEMBER`
  - Project level: `MANAGER`, `MEMBER`
- **Projects**
  - Create, update, archive / unarchive
  - Manage project members and roles
- **Tasks**
  - Create, assign, unassign, update, delete
  - Status workflow: `TODO` → `IN_PROGRESS` → `DONE`
  - My Tasks view
- **User management** — List users, change roles, deactivate / reactivate
- **Profiles** — Name, avatar, job title, timezone
- **Audit logging** — Organization-wide, project-level, and personal activity logs
- **Dashboard** — Stats for users, projects, and active tasks

## Tech Stack

| Layer      | Technologies                                      |
|------------|---------------------------------------------------|
| **Backend**  | Node.js, Express 5, PostgreSQL, JWT, bcrypt, CORS |
| **Frontend** | React 19, Vite, Tailwind CSS, React Router, Axios, Lucide Icons |

## Project Structure

```
multi_tenent_management_workflow_app/
├── backend/
│   ├── src/
│   │   ├── controllers/     # Business logic
│   │   ├── middlewares/     # Auth, RBAC, org context, guards
│   │   ├── routes/          # API routes
│   │   ├── workflows/       # Task state machine
│   │   ├── guards/          # Last-admin / last-manager protections
│   │   ├── utils/           # Audit logger
│   │   ├── db/              # PostgreSQL pool
│   │   ├── app.js
│   │   └── server.js
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── api/             # Axios instance + API modules
│   │   ├── auth/            # Auth context
│   │   ├── components/
│   │   ├── pages/
│   │   └── App.jsx
│   └── package.json
└── .gitignore
```

## Prerequisites

- Node.js 18+
- PostgreSQL 14+
- npm or yarn

## Setup

### 1. Clone the repository

```bash
git clone https://github.com/Koushik-Pula/multi_tenent_management_workflow_app.git
cd multi_tenent_management_workflow_app
```

### 2. Backend

```bash
cd backend
npm install
```

Create a `.env` file in the `backend` folder:

```env
PORT=5000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=your_database_name
DB_USER=your_db_user
DB_PASSWORD=your_db_password

JWT_SECRET=your_access_token_secret
JWT_REFRESH_SECRET=your_refresh_token_secret

FRONTEND_URL=http://localhost:5173
```

> **Note:** The repository does not include a SQL schema file. You will need to create the required tables (`organizations`, `users`, `user_details`, `invites`, `projects`, `project_members`, `tasks`, `audit_logs`, `refresh_tokens`, etc.) based on the queries used in the controllers before the app will run.

Start the backend:

```bash
npm run dev
```

The API will be available at `http://localhost:5000`.

### 3. Frontend

```bash
cd ../frontend
npm install
npm run dev
```

The frontend runs at `http://localhost:5173` and is configured to talk to the backend on port 5000.

## Key API Routes

| Method | Endpoint                              | Description                     | Access              |
|--------|---------------------------------------|---------------------------------|---------------------|
| POST   | `/auth/signup`                        | Create org + admin              | Public              |
| POST   | `/auth/login`                         | Login                           | Public              |
| POST   | `/auth/refresh`                       | Refresh tokens                  | Public              |
| POST   | `/users/invite`                       | Invite user                     | ADMIN               |
| POST   | `/users/accept-invite`                | Accept invite                   | Public              |
| GET    | `/users`                              | List organization users         | ADMIN               |
| GET    | `/users/stats`                        | Dashboard stats                 | Authenticated       |
| POST   | `/projects`                           | Create project                  | ADMIN               |
| GET    | `/projects`                           | List projects                   | ADMIN / MEMBER      |
| POST   | `/projects/:id/members`               | Add project member              | ADMIN / MANAGER     |
| POST   | `/tasks/projects/:projectId/tasks`    | Create task                     | ADMIN / MANAGER     |
| PATCH  | `/tasks/.../status`                   | Update task status              | Project member      |
| GET    | `/audits/audit-logs`                  | Org audit logs                  | ADMIN               |

## Roles & Permissions

| Role          | Scope     | Capabilities                                      |
|---------------|-----------|---------------------------------------------------|
| **ADMIN**     | Organization | Full org control, user management, all projects |
| **MEMBER**    | Organization | Access projects they are added to               |
| **MANAGER**   | Project      | Manage project members & tasks                  |
| **MEMBER**    | Project      | Work on assigned tasks                          |

## Task Workflow

Tasks follow a strict state machine defined in `backend/src/workflows/taskworkflow.js`:

```
TODO  →  IN_PROGRESS  →  DONE
```

## Development

- Backend uses `nodemon` for hot reload (`npm run dev`)
- Frontend uses Vite with HMR
- CORS is configured to allow `http://localhost:5173`

## License

ISC
