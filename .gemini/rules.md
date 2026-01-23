# Payroll App - Project Rules & Conventions

## Project Overview

This is an **Electron desktop application** for managing payroll operations including worker management, attendance tracking, advances, expenses, and salary calculations. It uses a monorepo structure with separate frontend and backend packages.

---

## Tech Stack

### Core Technologies
- **Runtime**: Node.js 22.x, npm 10.x+
- **Desktop Framework**: Electron 39.x
- **Database**: SQLite via Prisma ORM

### Backend (`/backend`)
- **Framework**: NestJS 11.x
- **Language**: TypeScript 5.9.x
- **ORM**: Prisma 6.x with SQLite
- **Validation**: class-validator, class-transformer
- **API Documentation**: Swagger (@nestjs/swagger)
- **Testing**: Jest

### Frontend (`/frontend`)
- **Framework**: React 19.x with Vite 7.x
- **Language**: TypeScript 5.9.x
- **Styling**: TailwindCSS 4.x
- **State Management**: Zustand 5.x
- **Routing**: react-router-dom 7.x
- **Notifications**: react-hot-toast
- **PDF Generation**: pdfmake
- **Date Utilities**: date-fns

---

## Project Structure

```
payroll-app/
├── backend/                    # NestJS backend API
│   ├── src/
│   │   ├── advances/          # Advances module
│   │   ├── attendance/        # Attendance module
│   │   ├── expenses/          # Expenses module
│   │   ├── prisma/            # Prisma service module
│   │   ├── salaries/          # Salaries module
│   │   ├── shared/            # Shared services (e.g., DateService)
│   │   ├── workers/           # Workers module
│   │   │   ├── dto/           # Data Transfer Objects
│   │   │   ├── workers.controller.ts
│   │   │   ├── workers.module.ts
│   │   │   └── workers.service.ts
│   │   ├── app.module.ts
│   │   └── main.ts
│   └── prisma/
│       ├── schema.prisma      # Database schema
│       ├── migrations/
│       └── seed.ts
├── frontend/                   # React Vite frontend
│   └── src/
│       ├── components/
│       │   ├── ui/            # Reusable UI components
│       │   ├── modals/        # Modal components
│       │   ├── workers/       # Worker-specific components
│       │   └── export/        # PDF export components
│       ├── features/          # Feature-specific logic
│       ├── hooks/             # Custom React hooks
│       ├── layouts/           # Layout components
│       ├── pages/             # Page components
│       ├── services/          # API client services
│       ├── store/             # Zustand stores
│       ├── types/             # TypeScript type definitions
│       └── utils/             # Utility functions
├── electron/
│   └── main.js                # Electron main process
├── database/                   # SQLite database file
└── dist/                       # Built application output
```

---

## Coding Conventions

### TypeScript
- Use strict TypeScript with proper typing
- Backend uses `noImplicitAny: false`, frontend uses `strict: true`
- Use ES modules (`"type": "module"` in package.json)
- Target ES2022+ for both backend and frontend

### Naming Conventions
- **Files**: PascalCase for React components (`Button.tsx`), kebab-case for backend files (`workers.controller.ts`)
- **Variables/Functions**: camelCase
- **Classes**: PascalCase
- **Interfaces**: PascalCase (no `I` prefix)
- **DTOs**: PascalCase with `Dto` suffix (`CreateWorkerDto`)
- **Stores**: camelCase with `use` prefix and `Store` suffix (`useWorkerStore`)
- **Hooks**: camelCase with `use` prefix (`useSalaryLockStore`)

### Formatting (Biome)
- Indent: 2 spaces
- Line width: 100 characters
- Single quotes for strings
- Semicolons: always
- Trailing commas: all
- Arrow function parentheses: always
- Line endings: LF

### Linting
- Use Biome for root-level linting/formatting (`.json`, `.ts`, `.tsx`, `.js`, `.jsx`)
- Backend uses ESLint with Prettier integration
- Frontend uses ESLint with React-specific plugins
- Make sure all the files does not have any biome linting and formatting errors and warnings

---

## Backend Patterns

### NestJS Module Structure
Each feature module follows this pattern:
```typescript
// module-name.module.ts
@Module({
  imports: [PrismaModule],
  controllers: [ModuleNameController],
  providers: [ModuleNameService],
  exports: [ModuleNameService],
})
export class ModuleNameModule {}
```

### DTO Pattern
- Use `class-validator` decorators for validation
- Place DTOs in a `dto/` subdirectory within each module
- Create separate DTOs for create, update, and other operations

### Prisma Usage
- Use a shared `PrismaService` injected via dependency injection
- Define schema in `backend/prisma/schema.prisma`
- Run migrations with `npx prisma migrate dev`
- Use seed script for initial data: `npm run seed`

### API Conventions
- RESTful endpoints under feature-based routes
- Use Swagger decorators for API documentation
- Backend runs on port 3001

---

## Frontend Patterns

### Component Structure
- Functional components with TypeScript interfaces
- Props interface defined inline or in the same file
- Named exports for components (also provide default export)

```typescript
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'danger';
  // ...
}

export const Button: React.FC<ButtonProps> = ({ variant = 'primary', ... }) => {
  // ...
};

export default Button;
```

### State Management (Zustand)
- Create stores in `/src/store/` directory
- Use `use` prefix for store hooks
- Include loading and error states in stores

```typescript
interface WorkerStore {
  workers: Worker[];
  loading: boolean;
  error: string | null;
  fetchWorkers: () => Promise<void>;
}

export const useWorkerStore = create<WorkerStore>((set, get) => ({
  // ...
}));
```

### Styling (TailwindCSS 4)
- Use `@theme` directive for custom design tokens in `index.css`
- Define color palette following Apple-inspired design system
- Use custom CSS variables for brand colors: `--color-primary`, `--color-secondary`, etc.
- Component styling uses Tailwind utility classes with `clsx` for conditional classes

### API Client
- Use Axios for HTTP requests
- API client configured in `/src/services/api.ts`
- Base URL typically `http://localhost:3001`

---

## Development Workflow

### Running the App
```bash
# Install dependencies (from root)
npm install
cd backend && npm install
cd ../frontend && npm install

# Development mode (runs Vite + Electron + Backend)
npm run dev

# Build for production
npm run build
```

### Backend-Specific Commands
```bash
cd backend
npm run start:dev    # Watch mode
npm run build        # Build
npm run seed         # Seed database
npm run test         # Run tests
```

### Frontend-Specific Commands
```bash
cd frontend
npm run dev          # Vite dev server
npm run build        # Production build
npm run lint         # ESLint
```

### Code Quality
```bash
# From root - Biome
npm run lint         # Check linting
npm run lint:fix     # Fix lint issues
npm run format       # Format code
npm run check        # Check all
npm run ci           # CI mode check
```

---

## Database Schema

Key models in Prisma schema:
- **Worker**: Core employee entity with wage tracking
- **Attendance**: Daily attendance records (PRESENT, HALF, ABSENT)
- **Advance**: Advance payments to workers
- **Expense**: Worker expenses with categorization
- **Salary**: Salary cycle records and payments
- **WageHistory**: Historical wage changes
- **WorkerStatusHistory**: Active/inactive status tracking

---

## Important Notes

1. **Electron Integration**: The app spawns the backend as a child process in development, and bundles it for production
2. **Database Location**: SQLite database file at `backend/database/database.db` (development) or relative to app in production
3. **Port Configuration**: Backend runs on port 3001, Vite dev server on port 5173
4. **Pre-commit Hooks**: Husky + lint-staged configured for automatic code checking
5. **ES Modules**: Project uses ES modules throughout - use `import/export` syntax

---

## File Patterns to Avoid Modifying

- `node_modules/`
- `dist/`
- `*.tsbuildinfo`
- `database.db` (binary database file)
- `generated/` (Prisma generated files)
