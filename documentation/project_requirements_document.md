# Project Requirements Document: Komik Tracker Next.js

## 1. Project Overview
Komik Tracker is a web application that helps comic book enthusiasts securely track, manage, and analyze their personal collections. Users can register, log in, add new comics with detailed metadata (type, status, genre, platform), and view interactive charts that visualize their reading progress and collection breakdown. The app solves the common problem of scattered, manual record-keeping by offering a centralized, structured platform with robust data validation and role-based controls.

This project is being built to deliver a production-grade experience focused on security, performance, and ease of use. Key objectives include:
- A secure authentication system using JWTs and HttpOnly cookies to protect user sessions.
- A responsive, themeable UI powered by Tailwind CSS and shadcn/ui for light/dark mode support.
- Real-time analytics with Pie and Bar charts to help users understand their collection at a glance.
- A scalable backend with Prisma ORM and MySQL/TiDB support for consistent data integrity.

## 2. In-Scope vs. Out-of-Scope
**In-Scope (First Version)**
- User authentication (register, login, logout) with JWT and bcrypt.
- Password reset via email using Resend.
- Comic management (Create, Read, Update, Delete) with soft-delete (recycle bin).
- Master data management (types, statuses, genres, platforms) with role-based access (member vs. admin).
- Interactive dashboard showing KPIs and charts (react-chartjs-2).
- Responsive UI components (cards, tables, dialogs, toasts) with Tailwind CSS + shadcn/ui.
- Form handling and validation using react-hook-form and Zod.
- Theme persistence (light/dark) in local storage and user settings.
- Docker + docker-compose for local development, Vercel deployment.

**Out-of-Scope (Later Phases)**
- Native mobile apps (iOS/Android).
- Social or OAuth logins (Google, Facebook, etc.).
- Offline or PWA support.
- Bulk import/export beyond simple JSON export.
- Community features (sharing, commenting, ratings).
- Multi-language or localization.

## 3. User Flow
A new visitor lands on the public landing page. They can click “Sign Up” to create an account with email and password. After registering, the system sends a welcome email and automatically logs them in. Alternatively, returning users click “Sign In” and provide credentials; upon success, an HttpOnly cookie with a JWT is set and they’re redirected to the protected dashboard.

On the dashboard, users see a sidebar for navigation and a main content area displaying KPIs (total comics, reading progress) plus interactive Pie and Bar charts. From the sidebar they access:
- **Comics**: view a paginated, searchable list; add/edit/delete entries via modal forms.
- **Master Data**: manage types, statuses, genres, and platforms (admins only for default data).
- **Recycle Bin**: restore or permanently delete soft-deleted comics.
- **Settings**: update profile, change password, toggle light/dark theme.

## 4. Core Features
- **Authentication & Authorization**: JWT-based, HttpOnly cookies, role info in token, custom Next.js middleware for route protection.
- **Password Reset Flow**: Short-lived tokens, Resend service for email, secure reset endpoint.
- **Comic CRUD**: Prisma-backed API routes with full create, read, update, soft-delete, and pagination/filtering.
- **Master Data Management**: Enum endpoints enforcing `memberLocked` flags, RBAC logic.
- **Interactive Dashboard**: Pie and Bar charts showing genre distribution, reading status, platform breakdown.
- **Responsive UI Components**: Tailwind CSS + shadcn/ui (Button, Card, Table, Dialog, Toast).
- **Form Handling & Validation**: react-hook-form + Zod for client/server validation.
- **Theming & Settings**: Light/dark toggle, persistence in DB and localStorage.
- **Recycle Bin**: Soft-delete implementation with `deletedAt` timestamp, restore and permanent delete.
- **Containerization & Deployment**: Docker + docker-compose, Vercel with environment secrets.

## 5. Tech Stack & Tools
- **Frontend**: Next.js (App Router), React, TypeScript
- **Styling & UI**: Tailwind CSS, shadcn/ui, lucide-react icons
- **Forms & Validation**: react-hook-form, Zod
- **Charts**: react-chartjs-2 (Chart.js wrapper)
- **Backend**: Next.js API Routes (Node.js), Prisma ORM
- **Database**: MySQL-compatible (TiDB/MySQL) via Prisma
- **Authentication**: jsonwebtoken, bcrypt
- **Email Service**: Resend SDK for transactional emails
- **Containerization**: Docker, docker-compose
- **Deployment**: Vercel (Environment Variables: DATABASE_URL, JWT_SECRET, RESEND_API_KEY)
- **IDE & Plugins** (optional): VSCode, Windsurf, Cursor

## 6. Non-Functional Requirements
- **Performance**: SSR for initial load, SSR caching, API response ≤200 ms under normal load.
- **Security**: OWASP Top 10 compliance, HttpOnly & Secure cookies, input sanitization, HTTPS only.
- **Scalability**: Stateless API, horizontal scaling support.
- **Usability**: Lighthouse score ≥90, WCAG 2.1 AA accessibility.
- **Reliability**: 99.9% uptime, automated CI tests (unit, integration, E2E).

## 7. Constraints & Assumptions
- A MySQL (or TiDB) instance is accessible and configured.
- Vercel environment supports required Node.js version (≥18).
- Valid Resend API key and SMTP configuration available.
- JWT_SECRET and other environment variables securely stored in Vercel.
- No external OAuth or SSO integrations at this stage.
- Modern evergreen browsers targeted (Chrome, Firefox, Safari, Edge).

## 8. Known Issues & Potential Pitfalls
- **Database Migrations**: Keep Prisma schema and prod/dev branches in sync; add CI checks.
- **JWT Expiry & Refresh**: Decide on token lifetime or add refresh-token flow later.
- **Email Rate Limits**: Monitor Resend usage; queue emails if limits approached.
- **Chart Hydration**: Use dynamic import (`ssr: false`) to avoid SSR/client mismatch.
- **Soft-Delete Consistency**: Ensure queries exclude `deletedAt` rows by default.
- **Cookie Domain/Path**: Configure correctly for subdomains or custom domains.
- **Seed Idempotency**: Make seed script safe to rerun without duplicating master data.

---

This document serves as the single source of truth for all subsequent technical specifications (Tech Stack docs, Frontend/Backend guidelines, file structure, middleware rules, etc.). All requirements, flows, and constraints are clearly defined to avoid ambiguity and enable smooth, parallel development by AI or engineering teams.