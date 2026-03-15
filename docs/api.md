# API Reference

All endpoints are prefixed with the service base URL. Authentication is via `Authorization: Bearer <JWT>` header.

## Auth Service (`:3001`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/auth/login` | — | Login with email/password, returns JWT |
| `POST` | `/auth/logout` | ✓ | Logout (client-side token drop) |
| `GET` | `/auth/me` | ✓ | Get current user info from token |
| `POST` | `/auth/check-permission` | ✓ | Check if user has a specific permission |
| `GET` | `/users` | ✓ | List all users (requires `user:read`) |
| `GET` | `/users/:id` | ✓ | Get user by ID |
| `POST` | `/users` | ✓ | Create user (requires `user:create`) |
| `PUT` | `/users/:id` | ✓ | Update user (requires `user:update`) |
| `DELETE` | `/users/:id` | ✓ | Delete user (requires `user:delete`) |
| `GET` | `/roles` | ✓ | List all roles |
| `POST` | `/roles` | ✓ | Create role (requires `user:manage_roles`) |
| `PUT` | `/roles/:id` | ✓ | Update role |
| `DELETE` | `/roles/:id` | ✓ | Delete role |

### Login Request/Response

```json
// POST /auth/login
{ "email": "user@example.com", "password": "Password123" }

// Response 200
{ "token": "eyJhbG...", "user": { "id": "uuid", "email": "...", "roles": [...] } }
```

## Layout Service (`:3002`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/layouts` | ✓ | List all layouts |
| `GET` | `/layouts/:layoutId` | ✓ | Get layout by ID (with Redis caching) |
| `POST` | `/layouts` | ✓ | Create new layout |
| `PUT` | `/layouts/:layoutId` | ✓ | Update layout (with distributed lock) |
| `POST` | `/layouts/:layoutId/snapshot` | ✓ | Publish version snapshot |
| `DELETE` | `/layouts/:layoutId` | ✓ | Delete layout |

## Widget Service (`:3003`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/widgets/:widgetId/data` | ✓ | Fetch widget data via connector |
| `POST` | `/widgets/:widgetId/refresh` | ✓ | Force cache invalidation and refresh |

### WebSocket Events (Socket.IO)

| Event | Direction | Payload | Description |
|-------|-----------|---------|-------------|
| `subscribe_widget` | Client → Server | `widgetId: string` | Join widget room |
| `unsubscribe_widget` | Client → Server | `widgetId: string` | Leave widget room |
| `widget_updated` | Server → Client | `{ widgetId }` | Widget data has been refreshed |

## Connector Service (`:8000`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/query/:connector_id` | ✓ | Execute query on a data source |
| `POST` | `/refresh/:widget_id` | ✓ | Refresh widget data |
| `GET` | `/health/:connector_id` | — | Check connector health |

## Health Checks

All services expose `GET /health` returning `{ "status": "OK", "service": "<name>" }`.
