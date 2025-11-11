# Backend - RAG Microservice

Backend implementation for the EDUCORE Contextual Assistant microservice.

## Structure

```
BACKEND/
├── src/
│   ├── config/          # Configuration files (database, redis, openai, kafka)
│   ├── controllers/     # Express/gRPC request handlers
│   ├── services/        # Business logic services
│   ├── middleware/      # Express/gRPC middleware (auth, tenant, permissions)
│   ├── utils/           # Utility functions (logger, cache, retry, validation)
│   ├── clients/         # External service clients (OpenAI, EDUCORE services)
│   ├── grpc/            # gRPC server and services
│   └── index.js         # Application entry point
├── tests/               # Test files
│   ├── unit/            # Unit tests
│   ├── integration/     # Integration tests
│   └── e2e/             # End-to-end tests
└── package.json
```

## Quick Start

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env

# Database setup (schema is in ../DATABASE/prisma/)
npm run db:generate
npm run db:migrate
npm run db:seed

# Start development server
npm run dev
```

## Scripts

- `npm start` - Start production server
- `npm run dev` - Start development server with watch mode
- `npm test` - Run all tests
- `npm run test:unit` - Run unit tests only
- `npm run test:integration` - Run integration tests
- `npm run test:coverage` - Run tests with coverage
- `npm run lint` - Lint code
- `npm run format` - Format code

## Database

The Prisma schema is located at `../DATABASE/prisma/schema.prisma`.

To generate Prisma client:
```bash
npm run db:generate
```

To run migrations:
```bash
npm run db:migrate
```

To seed database:
```bash
npm run db:seed
```



