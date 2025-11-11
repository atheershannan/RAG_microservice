# EDUCORE - Contextual Assistant (RAG / Knowledge Graph) Microservice

Central contextual intelligence layer for EDUCORE learning ecosystem.

## Project Structure

```
rag-microservice/
├── BACKEND/          # Backend services (Node.js + Express + gRPC)
│   ├── src/
│   ├── tests/
│   ├── package.json
│   └── ...
├── FRONTEND/         # Frontend widget (React + Material-UI)
│   ├── src/
│   ├── tests/
│   ├── package.json
│   └── ...
├── DATABASE/         # Database schema and migrations
│   ├── prisma/
│   │   ├── schema.prisma
│   │   ├── seed.js
│   │   └── migrations/
│   └── proto/        # Protocol Buffer definitions
└── FULLSTACK_TEMPLATES/  # Development templates and documentation
```

## Overview

This microservice provides RAG (Retrieval-Augmented Generation) and Knowledge Graph capabilities for the EDUCORE platform, serving as the central contextual intelligence layer that integrates with 10 other microservices.

## Features

- **RAG Query Processing** - Contextual query answering with source citations
- **Vector Search** - Semantic similarity search using pgvector
- **Knowledge Graph** - Unified knowledge graph integrating all microservices
- **Personalized Assistance** - Role and profile-based responses
- **Access Control** - RBAC, ABAC, and fine-grained permissions
- **Multi-tenant Isolation** - Complete tenant data isolation

## Tech Stack

### Backend
- **Runtime:** Node.js 20 LTS + JavaScript (ES2022+)
- **Framework:** Express.js + @grpc/grpc-js
- **Database:** PostgreSQL 15+ with pgvector
- **ORM:** Prisma
- **Cache:** Redis 7+
- **Message Queue:** Apache Kafka
- **AI:** OpenAI API

### Frontend
- **Framework:** React 18
- **State Management:** Redux Toolkit + RTK Query
- **UI Library:** Material-UI (MUI)
- **Real-time:** Supabase Realtime
- **Build Tool:** Vite

## Quick Start

### Prerequisites

- Node.js 20+
- PostgreSQL 15+ with pgvector extension
- Redis 7+
- Kafka (optional for development)

### Backend Setup

```bash
cd BACKEND

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Set up database
npm run db:migrate
npm run db:generate
npm run db:seed

# Start development server
npm run dev
```

### Frontend Setup

```bash
cd FRONTEND

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Start development server
npm run dev
```

### Database Setup

```bash
cd DATABASE

# Generate Prisma client
npx prisma generate --schema=prisma/schema.prisma

# Run migrations
npx prisma migrate dev --schema=prisma/schema.prisma

# Seed database
node prisma/seed.js
```

## Development

### Running Tests

**Backend:**
```bash
# Prepare test environment (requires Docker)
cp env.test.example .env.test
npm run test:setup
npm run test:migrate

# Execute test suites
npm test
npm run test:unit
npm run test:integration
npm run test:coverage

# Tear down test environment
npm run test:teardown
```

**Frontend:**
```bash
cd FRONTEND
npm test
npm run test:unit
npm run test:e2e
```

### Test Infrastructure

The backend test suites rely on PostgreSQL (pgvector), Redis, and Kafka. A ready-to-use Docker Compose file is provided:

```bash
docker-compose -f docker-compose.test.yml up -d   # start services
docker-compose -f docker-compose.test.yml down -v # stop and remove services
```

Ensure `.env.test` exists (copy from `env.test.example`) before running integration tests so that the test harness can connect to the infrastructure.

### Code Quality

```bash
# Backend
npm run lint
npm run format

# Frontend
cd FRONTEND
npm run lint
npm run format
```

## API Documentation

See `FULLSTACK_TEMPLATES/Stage_02_System_and_Architecture/ENDPOINTS_SPEC.md` for complete API documentation.

## License

MIT
