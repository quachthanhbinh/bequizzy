# BeQuizzy

A modern quiz platform built with Go/Gin backend and Next.js frontend.

## Tech Stack

- **Backend**: Go 1.23+, Gin Framework, GORM, PostgreSQL
- **Frontend**: Next.js 14, TypeScript, Tailwind CSS, shadcn/ui
- **Database**: PostgreSQL 16+ (Supabase)
- **Cache**: Redis
- **Auth**: Supabase Auth
- **Design**: Modern flat pink pastel color scheme

## Getting Started

### Prerequisites

- Go 1.23+
- Node.js 20+
- Docker & Docker Compose
- golang-migrate CLI

### Local Development

1. Clone the repository
```bash
git clone https://github.com/yourusername/bequizzy.git
cd bequizzy
```

2. Start infrastructure services
```bash
docker-compose up -d postgres redis
```

3. Run database migrations
```bash
migrate -path migrations -database "postgresql://bequizzy:bequizzy_dev@localhost:5435/bequizzy?sslmode=disable" up
```

4. Start backend services
```bash
# Terminal 1 - API Gateway
cd services/api-gateway
air

# Terminal 2 - Workspace Service
cd services/workspace-service
air
```

5. Start frontend
```bash
cd apps/portal
npm install
npm run dev
```

Visit http://localhost:3000

## Project Structure

```
bequizzy/
├── apps/              # Frontend applications
│   ├── portal/        # Main app
│   └── page/          # Landing page
├── services/          # Go microservices
│   ├── api-gateway/
│   ├── workspace-service/
│   └── ...
├── migrations/        # Database migrations
├── design-system/     # Design tokens & components
└── docs/             # Documentation
```

## Development Workflow

This project uses **Spec-Driven Development (SDD)**:

```
BRAINSTORM → SPEC → REVIEW → PLAN → IMPLEMENT (TDD) → VERIFY
```

Use `/new-feature` command to start a new feature with the full SDD pipeline.

## Contributing

1. Create a feature branch
2. Follow the SDD workflow
3. Ensure all tests pass
4. Submit a pull request

## License

[Your License Here]
