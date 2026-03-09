# VigilAI Platform

A comprehensive SaaS platform for VigilAI that provides user management, dashboard, incident tracking, and automated fix management.

## Tech Stack

- **Framework:** Next.js 14 with App Router
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Database:** PostgreSQL with Prisma ORM
- **Authentication:** NextAuth.js v5
- **State Management:**
  - React Query (TanStack Query) for server state
  - Zustand for client state
- **Real-time:** Socket.io
- **Charts:** Recharts
- **Validation:** Zod

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database
- npm or yarn

### Installation

1. Clone the repository and navigate to the platform directory:

```bash
cd platform
```

2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:

```bash
cp .env.example .env.local
```

Edit `.env.local` with your database credentials and other configuration.

4. Set up the database:

```bash
# Generate Prisma client
npm run db:generate

# Run migrations
npm run db:migrate

# Seed the database (optional)
npm run db:seed
```

5. Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
platform/
├── app/                    # Next.js App Router pages
│   ├── (auth)/            # Authentication pages
│   ├── (dashboard)/       # Dashboard pages
│   └── api/               # API routes
├── components/            # React components
│   ├── layout/           # Layout components
│   ├── dashboard/        # Dashboard components
│   ├── incidents/        # Incident components
│   ├── pull-requests/    # PR components
│   ├── applications/     # Application components
│   ├── api-keys/         # API key components
│   ├── settings/         # Settings components
│   └── ui/               # Reusable UI components
├── lib/                   # Utility functions
├── hooks/                 # Custom React hooks
├── stores/                # Zustand stores
├── types/                 # TypeScript type definitions
├── prisma/                # Prisma schema and migrations
└── public/                # Static assets
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier
- `npm run type-check` - Run TypeScript type checking
- `npm run db:generate` - Generate Prisma client
- `npm run db:push` - Push schema changes to database
- `npm run db:migrate` - Run database migrations
- `npm run db:seed` - Seed the database
- `npm run db:studio` - Open Prisma Studio

## Features

- 🔐 **Authentication** - Email/password and OAuth (GitHub, Google)
- 📊 **Dashboard** - Real-time metrics and charts
- 🚨 **Incident Management** - Track and manage application incidents
- 🔑 **API Key Management** - Generate and manage SDK API keys
- 📱 **Application Management** - Monitor multiple applications
- 🔧 **Pull Request Tracking** - Track automated fixes
- ⚙️ **Settings** - User preferences and team management
- 🔔 **Notifications** - Email, Slack, and webhook notifications
- 📈 **Real-time Updates** - WebSocket-based live updates

## Environment Variables

See `.env.example` for all available environment variables.

Required variables:

- `DATABASE_URL` - PostgreSQL connection string
- `NEXTAUTH_SECRET` - Secret for NextAuth.js
- `NEXTAUTH_URL` - Application URL

## Development

### Code Style

This project uses ESLint and Prettier for code formatting. Run:

```bash
npm run format
npm run lint
```

### Type Checking

Run TypeScript type checking:

```bash
npm run type-check
```

### Database Management

View and edit data with Prisma Studio:

```bash
npm run db:studio
```

## Deployment

The platform is designed to be deployed on Vercel:

1. Push your code to GitHub
2. Import the project in Vercel
3. Configure environment variables
4. Deploy

See the [deployment documentation](./docs/deployment.md) for detailed instructions.

## License

Proprietary - VigilAI Platform
