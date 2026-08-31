# Live Support Chat System

Role-based live support desk: candidates open tickets, supervisors assign agents from their team, agents chat in real time and close threads, and admins manage org structure and analytics.

This is a Bun + Turborepo monorepo with a React frontend, an Express REST API, a WebSocket chat server, and PostgreSQL (Prisma).

## Architecture

```mermaid
flowchart LR
  subgraph Client
    FE["React frontend\n(Vite + Tailwind)"]
  end

  subgraph Servers
    API["REST API\nExpress :3000"]
    WS["WebSocket server\nws :8080"]
  end

  subgraph Data
    DB[(PostgreSQL)]
  end

  FE -->|"HTTP + JWT"| API
  FE -->|"WS + JWT"| WS
  API --> DB
  WS --> DB
```

```mermaid
flowchart TD
  C[Candidate] -->|creates ticket| CONV[Conversation OPEN]
  A[Admin] -->|assigns agent to supervisor| TEAM[Supervisor team 1:1]
  S[Supervisor] -->|assigns team agent to ticket| CONV
  AG[Agent] -->|joins room, chats| WS[WebSocket room]
  C -->|joins room, chats| WS
  AG -->|closes ticket| CONV2[Conversation CLOSE]
  CONV --> WS
```

### Roles (RBAC)

| Role | What they do |
| --- | --- |
| **Candidate** | Sign up, open one support conversation at a time, chat, view history |
| **Supervisor** | See the open queue, assign an agent from their own team |
| **Agent** | Chat on assigned open tickets, close a conversation |
| **Admin** | Assign/unassign agents to supervisors, view analytics |

Chat is only between the **candidate** and the **assigned agent**. Supervisors and admins do not join the live room.

## Monorepo layout

```
apps/fe          React UI
apps/backend     REST auth, conversations, admin, assign, close
apps/ws          Realtime join / message / close notify
packages/db      Prisma schema + PostgreSQL client
packages/common  Shared types
```

## Prerequisites

- [Bun](https://bun.sh) 1.4+
- PostgreSQL
- Same `JWT_SECRET` and `DATABASE_URL` on the API and WebSocket servers

## Installation

### 1. Clone and install

```bash
git clone <repo-url>
cd LiveSupportChatSystem
bun install
```

### 2. Environment files

**`packages/db/.env`** and **`apps/backend/.env`** and **`apps/ws/.env`:**

```env
DATABASE_URL=postgresql://USER:PASSWORD@localhost:5432/livesupport
JWT_SECRET=replace-with-a-long-random-string
PORT=3000
```

Use the same `DATABASE_URL` and `JWT_SECRET` in backend and `ws`. Backend defaults to port `3000`; the WebSocket server defaults to `8080` (`PORT` in `apps/ws/.env` if you override it).

**`apps/fe/.env`:**

```env
VITE_API_URL=http://localhost:3000
VITE_WS_URL=ws://localhost:8080
```

### 3. Database

From `packages/db`:

```bash
cd packages/db
bun --bun x prisma migrate deploy
bun --bun x prisma generate
```

For local development you can use `prisma migrate dev` instead of `deploy`.

### 4. Run the three apps

From the repo root, three terminals:

```bash
bun run --filter backend dev
```

```bash
bun run --filter ws dev
```

```bash
bun run --filter fe dev
```

Or start each app by path:

```bash
bun run --cwd apps/backend dev
bun run --cwd apps/ws dev
bun run --cwd apps/fe dev
```

Open the UI at `http://localhost:5173`.

Health check: `GET http://localhost:3000/health`.

## Typical flow

1. Sign up as **Admin**, **Supervisor**, **Agent**, and **Candidate** (separate accounts).
2. Admin attaches each agent to one supervisor (`/admin/agents`).
3. Candidate starts a conversation.
4. Supervisor assigns a team agent to that ticket.
5. Candidate and agent chat; agent can **Close chat**.
6. Candidate dashboard lists all tickets with agent and Open/Closed status.

## Stack

- **Frontend:** React, React Router, TanStack Query, Axios, Tailwind
- **API:** Express, Zod, JWT, bcrypt
- **Realtime:** `ws` (JWT on the query string)
- **Data:** PostgreSQL, Prisma 7
- **Tooling:** Bun workspaces, Turborepo
