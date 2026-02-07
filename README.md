# Vigil Eye 👁️

**Self-hosted error tracking and monitoring platform** for modern applications. Track errors, monitor performance, and get instant Telegram notifications when things go wrong.

## ✨ Features

- 🔍 **Error Tracking**: Automatic error grouping by fingerprint with stack traces
- 📊 **Multi-Environment Support**: Separate tracking for Production, Staging, and Development
- 🔔 **Telegram Notifications**: Real-time alerts with customizable triggers
- 📈 **Error Analytics**: Occurrence counts, trends, and spike detection
- 🎯 **Smart Grouping**: Automatic error deduplication and grouping
- 🔐 **Team Collaboration**: Project-based access with role management
- 🚀 **Non-Blocking SDK**: Zero performance impact on your application
- 🎨 **Modern Dashboard**: Beautiful React UI for error management

## 🏗️ Architecture

```
vigileye/
├── server/          # Go backend API
├── web/             # React dashboard
└── nestjs-sdk/      # NestJS SDK package
```

## 🛠️ Tech Stack

### Backend
- **Go 1.21+** with Gorilla Mux
- **PostgreSQL** for data persistence
- **JWT** authentication
- **Telegram Bot API** for notifications

### Frontend
- **React 19** with TypeScript
- **Vite** for blazing-fast builds
- **TailwindCSS** for styling
- **React Router v7** for navigation
- **TanStack Query** for data fetching
- **React Hook Form** for forms

### SDK
- **NestJS** integration package
- **TypeScript** support
- **Non-blocking** error logging

## 🚀 Quick Start

### Prerequisites
- Go 1.21+
- Node.js 18+
- PostgreSQL 14+
- Docker (optional)

### 1. Database Setup

**Using Docker:**
```bash
docker-compose up -d
```

**Manual PostgreSQL:**
```bash
createdb vigileye
psql vigileye < database/migrations.sql
```

### 2. Backend Setup

```bash
cd server

# Copy environment template
cp .env.example .env

# Update .env with your configuration
# DATABASE_URL=postgres://user:password@localhost:5432/vigileye?sslmode=disable
# JWT_SECRET=your-secret-key
# PORT=5001
# ENV=development
# ALLOWED_ORIGINS=http://localhost:5173
# TELEGRAM_HELPER_BOT_TOKEN=your-bot-token  # Optional
# BASE_URL=http://localhost:3000

# Install dependencies and run
go mod download
go run cmd/server/main.go
```

Server will start on `http://localhost:5001`

### 3. Frontend Setup

```bash
cd web

# Install dependencies
npm install

# Start development server
npm run dev
```

Dashboard will be available at `http://localhost:5173`

### 4. Create Your First Project

1. Register an account at `http://localhost:5173/register`
2. Create a new project
3. Copy the API key from your environment (Production/Staging/Development)
4. Integrate the SDK into your application

## 📦 SDK Integration

### NestJS

```bash
npm install git+https://github.com/prabalesh/vigileye-nestjs.git
```

```typescript
import { VigileEyeModule } from '@prabalesh/vigileye-nestjs';

@Module({
  imports: [
    VigileEyeModule.forRoot({
      apiKey: process.env.VIGILEYE_API_KEY,
      serverUrl: 'http://localhost:5001',
      enabled: process.env.NODE_ENV === 'production',
    }),
  ],
})
export class AppModule {}
```

### Manual API Integration

```bash
curl -X POST http://localhost:5001/api/log \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-environment-api-key" \
  -d '{
    "message": "Something went wrong",
    "level": "error",
    "stack": "Error: Something went wrong\n    at main.js:10:5",
    "source": "backend",
    "url": "/api/users",
    "method": "GET"
  }'
```

## 🔔 Telegram Notifications

### Setup

1. Create a Telegram bot via [@BotFather](https://t.me/BotFather)
2. Get your bot token
3. Create a group/channel and add your bot
4. Get the chat ID (use `/start` with the helper bot or check logs)

### Configure Notifications

In the dashboard:
1. Go to Project → Environment → Settings → Notifications
2. Enable Telegram notifications
3. Enter your bot token and chat ID
4. Configure triggers:
   - **New Error**: Alert on first occurrence
   - **Threshold**: Alert when error count exceeds limit in time window
   - **Spike on Ignored**: Alert when ignored errors spike 100x

### Notification Behavior

| Error Status | Recurs? | Notification Sent? |
|-------------|---------|-------------------|
| **New** | First time | ✅ Yes (if `new_error` enabled) |
| **Resolved** | Yes → Reopens | ✅ Yes (if `new_error` enabled) |
| **Ignored** | Yes → Stays ignored | ❌ No (silent) |
| **Ignored** | Yes + Spiking (100x) | ✅ Yes (if `spike_on_ignored` enabled) |

## 📚 API Documentation

### Authentication

**Register:**
```bash
POST /api/auth/register
Content-Type: application/json

{
  "username": "john",
  "email": "john@example.com",
  "password": "secure123"
}
```

**Login:**
```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "secure123"
}

# Returns: { "token": "jwt-token" }
```

### Error Ingestion

**Log Error:**
```bash
POST /api/log
X-API-Key: your-environment-api-key
Content-Type: application/json

{
  "message": "Error message",
  "level": "error",           # error, warn, info
  "source": "backend",        # backend, frontend, mobile
  "stack": "stack trace",
  "url": "/api/endpoint",
  "method": "GET",
  "user_id": "user-123",
  "status_code": 500,
  "extra_data": {}
}
```

### Projects & Environments

**Create Project:**
```bash
POST /api/projects
Authorization: Bearer jwt-token
Content-Type: application/json

{
  "name": "My App"
}
```

**Get Error Groups:**
```bash
GET /api/projects/{id}/error-groups?status=unresolved&level=error
Authorization: Bearer jwt-token
```

**Resolve Error Group:**
```bash
PATCH /api/projects/{id}/error-groups/{group_id}/resolve
Authorization: Bearer jwt-token
Content-Type: application/json

{
  "resolved": true
}
```

## 🎯 Error Management

### Error States

- **Unresolved**: Active errors requiring attention
- **Resolved**: Fixed errors (auto-reopen if they recur)
- **Ignored**: Errors you want to suppress (stay silent unless spiking)

### Error Grouping

Errors are automatically grouped by fingerprint based on:
- Error message
- Stack trace
- URL/endpoint

This prevents duplicate alerts for the same issue.

## 🔒 Security

- JWT-based authentication
- API key authentication for error ingestion
- Role-based access control (Admin/Member)
- Sensitive data redaction in SDK
- CORS protection

## 🌍 Environment Variables

### Backend (.env)

```bash
# Database
DATABASE_URL=postgres://user:password@localhost:5432/vigileye?sslmode=disable

# Authentication
JWT_SECRET=your-secret-key-min-32-chars

# Server
PORT=5001
ENV=development  # development, production

# CORS
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000

# Telegram (Optional)
TELEGRAM_HELPER_BOT_TOKEN=your-bot-token
BASE_URL=http://localhost:3000  # For notification links
```

### Frontend (.env)

```bash
VITE_API_URL=http://localhost:5001
```

## 📊 Database Schema

Key tables:
- `users` - User accounts
- `projects` - Top-level projects
- `project_members` - Team access control
- `environments` - Environment configs (prod/staging/dev)
- `error_groups` - Grouped errors by fingerprint
- `error_logs` - Individual error occurrences
- `notification_history` - Notification audit trail

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📝 License

MIT License - see LICENSE file for details

## 🙏 Acknowledgments

Built with ❤️ for developers who want full control over their error tracking.

---

**Questions?** Open an issue or reach out!
