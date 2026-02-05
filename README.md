# Vigileye

Vigileye is a monorepo for surveillance and monitoring applications.

## Structure

- `server/`: Go backend
- `web/`: React dashboard

## Tech Stack

- **Server:** Go 1.21+ with Postgres
- **Web:** React 18 + Vite + TypeScript + TailwindCSS + React Router v6

## Getting Started

### Backend
```bash
cd server
go mod download
go run main.go
```

### Frontend
```bash
cd web
npm install
npm run dev
```

### Infrastructure
```bash
docker-compose up -d
```
