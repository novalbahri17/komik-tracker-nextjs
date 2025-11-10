# Komik Tracker Next.js - Tech Stack Document

This document explains the technology choices for the Komik Tracker Next.js application in everyday language. It shows how each tool and library helps us build a secure, fast, and user-friendly comic-tracking platform.

## 1. Frontend Technologies

We chose a modern React-based stack to create an interactive, responsive user interface.

- **Next.js (App Router)**
  - Provides a hybrid of server-side rendering (SSR) and single-page app (SPA) behavior.
  - File-based routing makes it easy to organize pages into public, auth, and protected sections.
  - Server Components let us fetch data on the server for faster page loads.

- **TypeScript**
  - Adds type checking to JavaScript, reducing bugs and improving developer productivity.

- **Tailwind CSS**
  - A utility-first CSS framework for rapid styling without leaving your HTML.
  - Built-in support for dark/light mode theming.

- **shadcn/ui & lucide-react**
  - A collection of pre-built, themeable UI components (buttons, cards, tables, dialogs, toasts).
  - Lucide icons provide a consistent icon set throughout the app.

- **react-hook-form & Zod**
  - `react-hook-form` manages form state efficiently with minimal re-renders.
  - `Zod` schemas define and validate data shapes in TypeScript, ensuring reliable user input.

- **react-chartjs-2**
  - A React wrapper around Chart.js to display Pie and Bar charts for dashboard metrics.

## 2. Backend Technologies

Our backend runs on Next.js API routes and connects to a MySQL-compatible database through Prisma.

- **Next.js API Routes**
  - Handle registration, login, logout, password reset, and CRUD operations for comics and master data.
  - Live alongside pages in the same codebase for seamless development.

- **Prisma ORM + MySQL/TiDB**
  - Prisma provides a type-safe way to define data models (User, Comic, Genre, Platform, etc.) and run database queries.
  - We use a MySQL-compatible database (TiDB or MySQL) for reliable, scalable storage.
  - A singleton Prisma client in `lib/db.ts` ensures efficient database connections.

- **jsonwebtoken & bcrypt**
  - `bcrypt` hashes user passwords before storing them in the database.
  - `jsonwebtoken` signs and verifies JWTs to manage user sessions.
  - Tokens are stored in HttpOnly cookies for safety.

- **Custom Middleware (`middleware.ts`)**
  - Checks the `auth_token` cookie on each request.
  - Verifies the JWT and redirects unauthenticated users away from protected routes.

## 3. Infrastructure and Deployment

To ensure reliability, consistency, and easy deployments, we use containerization, version control, and a modern hosting platform.

- **Docker & docker-compose**
  - A `Dockerfile` brings up the Next.js app containerized.
  - `docker-compose.yaml` runs both the app and a local MySQL instance together, mirroring production.

- **Git & GitHub**
  - Source code lives in a Git repository for version control and collaboration.
  - Pull requests and code reviews help maintain code quality.

- **CI/CD (Vercel)**
  - On each push to main, Vercel automatically builds and deploys the app.
  - Environment variables (DATABASE_URL, JWT_SECRET, RESEND_API_KEY) are managed securely in Vercel’s dashboard.
  - Tests (unit, integration, end-to-end) run before every deployment to catch regressions early.

## 4. Third-Party Integrations

We integrate external services to handle email delivery, analytics, and more.

- **Resend**
  - A transactional email service used to send password reset emails and confirmations.
  - Generates and verifies short-lived, single-use tokens for secure password resets.

- **Chart.js (via react-chartjs-2)**
  - Delivers interactive data visualizations (tooltips, filtering, drill-downs) in the dashboard.

- **Optional Analytics** (future)
  - Can plug in services like Google Analytics or Plausible to track user behavior and app performance.

## 5. Security and Performance Considerations

We’ve built in safeguards and optimizations to keep data safe and the app snappy.

- **Authentication & Authorization**
  - Passwords hashed with `bcrypt`.
  - JWTs stored in HttpOnly cookies to prevent cross-site scripting (XSS) attacks.
  - Role information inside JWTs enforces Role-Based Access Control (RBAC) on APIs and pages.

- **Data Validation**
  - Zod schemas validate both form input on the client and request bodies on the server.
  - Prevents invalid data from reaching the database.

- **Performance Optimizations**
  - Next.js Server Components and SSR reduce initial load times.
  - Prisma queries include filters, sorting, and pagination at the database level for efficient data retrieval.
  - Debounced search and pagination reduce excessive network requests in large data tables.

- **Secure Configuration**
  - Environment variables keep secrets out of the codebase.
  - HTTPS enforced in production environments.

## 6. Conclusion and Overall Tech Stack Summary

By combining Next.js with TypeScript, Tailwind CSS, and Prisma, we achieve a modern, full-stack foundation that balances developer productivity with security and performance. 

Unique aspects that set this project apart:

- **Unified Codebase**: Pages, API routes, and middleware all live together in Next.js, simplifying development and deployment.
- **UI Consistency**: shadcn/ui and Tailwind CSS provide a cohesive, themeable design system from day one.
- **Scalable Data Layer**: Prisma with a MySQL-compatible database offers type-safe models, efficient queries, and easy migrations.
- **Robust Auth**: Custom JWT flows, HttpOnly cookies, and RBAC ensure only authorized users can access or modify data.
- **Containerized Workflow**: Docker and docker-compose deliver consistent environments for development and production.

Together, these technologies deliver a secure, performant, and user-friendly Komik Tracker application that can scale and evolve with your needs.