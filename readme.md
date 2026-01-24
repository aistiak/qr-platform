# QR Platform

A full-stack QR code platform built with Next.js and MongoDB, allowing users to create, manage, and track QR codes with analytics.

## Features

- 🔐 User authentication (sign up, sign in)
- 📱 Create QR codes that redirect to URLs or hosted images
- 🎯 Manage QR codes (pause, archive, delete, rename)
- 📊 View analytics for each QR code
- 📥 Download and share QR codes
- 👨‍💼 Admin dashboard for user and QR code management

## Quick Start with Docker

### Prerequisites

- Docker Desktop or Docker Engine 20.10+
- Docker Compose 2.0+

### Single Command Setup

1. **Create `.env.local` file** (recommended for production):

```bash
echo "NEXTAUTH_SECRET=$(openssl rand -base64 32)" > .env.local
```

**Note**: If `.env.local` doesn't exist, Docker Compose will use a default secret. For production, always set a secure `NEXTAUTH_SECRET`.

2. **Start the entire stack**:

```bash
docker-compose up
```

This single command will:
- Start MongoDB container
- Start Next.js development server
- Set up networking and volumes
- Enable hot reload for development

3. **Access the application**:

- Application: http://localhost:3000
- MongoDB: localhost:27017

4. **Stop everything**:

```bash
docker-compose down
```

### Docker Commands

```bash
# Start in background
docker-compose up -d

# View logs
docker-compose logs -f

# Rebuild after dependency changes
docker-compose up --build

# Stop and remove volumes (clean slate)
docker-compose down -v
```

## Manual Setup

See [Quickstart Guide](./specs/001-qr-platform/quickstart.md) for detailed manual setup instructions.

## Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript 5.x
- **Database**: MongoDB 7.0
- **Authentication**: NextAuth.js v5
- **Styling**: Tailwind CSS + shadcn/ui
- **Testing**: Jest, React Testing Library, Playwright

## Project Structure

```
app/              # Next.js App Router
lib/              # Shared utilities and models
components/      # React components
public/           # Static assets
specs/            # Feature specifications and documentation
```

## Documentation

- [Feature Specification](./specs/001-qr-platform/spec.md)
- [Implementation Plan](./specs/001-qr-platform/plan.md)
- [Quickstart Guide](./specs/001-qr-platform/quickstart.md)
- [API Contracts](./specs/001-qr-platform/contracts/api.yaml)
- [Data Model](./specs/001-qr-platform/data-model.md)

## Development

```bash
# Install dependencies
npm install

# Run development server (requires MongoDB)
npm run dev

# Run tests
npm test

# Run E2E tests
npx playwright test
```

## Environment Variables

See `.env.example` for required environment variables.

## License

MIT
