# Architecture Overview

## System Design

The Modular Dashboard Platform follows a microservice architecture with a React-based SPA frontend.

```
┌──────────┐    ┌──────────────┐    ┌───────────────┐
│ Frontend │───▶│ nginx proxy  │───▶│ Backend APIs  │
│ (React)  │    │              │    │               │
└──────────┘    └──────────────┘    └───────┬───────┘
                                            │
                    ┌───────────────────────┼───────────────────────┐
                    │                       │                       │
             ┌──────▼──────┐        ┌───────▼──────┐       ┌───────▼───────┐
             │ Auth Service│        │Layout Service│       │Widget Service │
             │  (Express)  │        │  (Express)   │       │  (Express)    │
             │  Port 3001  │        │  Port 3002   │       │  Port 3003    │
             └──────┬──────┘        └───────┬──────┘       └───────┬───────┘
                    │                       │                       │
                    │               ┌───────┴──────┐       ┌───────▼───────┐
                    │               │              │       │  Connector    │
             ┌──────▼──────┐  ┌─────▼────┐  ┌─────▼────┐  │  (FastAPI)    │
             │ PostgreSQL  │  │ MongoDB  │  │  Redis   │  │  Port 8000    │
             │             │  │          │  │          │  └───────────────┘
             └─────────────┘  └──────────┘  └──────────┘
```

## Services

| Service | Tech | Port | Database | Purpose |
|---------|------|------|----------|---------|
| **Auth** | Express/TypeORM | 3001 | PostgreSQL | User management, JWT auth, RBAC |
| **Layout** | Express/Mongoose | 3002 | MongoDB + PostgreSQL | Dashboard layouts, versioning |
| **Widget** | Express/Socket.IO | 3003 | Redis | Widget data proxy, real-time updates |
| **Connector** | FastAPI | 8000 | — | External data source connectivity |
| **Frontend** | React/Vite | 80 (nginx) | — | SPA dashboard UI |

## Data Flow

1. **Authentication**: User logs in → Auth Service validates → JWT issued → stored client-side
2. **Layout Loading**: Frontend requests layout → Layout Service fetches from MongoDB → cached in Redis
3. **Widget Data**: Frontend requests data → Widget Service → Connector Service → External DB → Response cached in Redis
4. **Real-time Updates**: Widget Service publishes via Redis pub/sub → Socket.IO broadcasts to subscribed clients

## Key Design Decisions

- **RBAC with Redis caching**: Permissions are fetched from PostgreSQL and cached in Redis for 5 minutes
- **Layout versioning**: MongoDB for current state, PostgreSQL snapshots for version history
- **Connector abstraction**: Python FastAPI service supports PostgreSQL, MySQL, REST, and GraphQL data sources
- **Distributed locking**: Redis-based locks prevent concurrent layout edits
