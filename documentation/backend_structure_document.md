# Backend Structure Document

## 1. Backend Architecture

Overall, our backend is built around a modern Next.js setup, using the App Router and API Routes for server-side logic. We follow these design patterns and frameworks:

• Next.js App Router
  • Enables a hybrid of server-rendered and client-rendered pages
  • File-based routing makes it easy to organize public, auth, and protected areas

• API Routes (REST-style)
  • Each folder under `/api` corresponds to a group of related endpoints
  • Handlers written in TypeScript for consistency and type safety

• Middleware for Route Protection
  • A global `middleware.ts` file inspects an `auth_token` cookie on every request
  • Verifies the JWT, extracts the user’s role, and applies allowlist/blocklist rules

• Singleton Pattern for Database Client
  • A single Prisma client instance (`lib/db.ts`) is shared across requests
  • Prevents connection exhaustion and improves performance

How this supports our goals:

• Scalability
  • Next.js serverless functions auto-scale on Vercel
  • Prisma connection pooling ensures efficient database usage

• Maintainability
  • Clear separation of concerns: auth, data access, validation, and presentation are in distinct folders
  • TypeScript and Zod schemas catch errors at build time

• Performance
  • Server Components handle initial data fetching on the server
  • Optimized Prisma queries reduce over-fetching and improve query speeds

## 2. Database Management

We use a relational database that can scale horizontally:

• Database Type: MySQL-compatible (e.g., TiDB or MySQL)
• ORM: Prisma

Key data management practices:

• Data Modeling
  • Entities are defined in `prisma/schema.prisma` and migrated via Prisma Migrate
  • Master data (types, statuses, genres, platforms) seeded with a `memberLocked` flag

• Soft Deletes
  • A `deletedAt` timestamp column marks records as deleted without removing them
  • Enables a recycle bin feature and easy restores

• Connection Handling
  • Prisma client singleton prevents opening new connections on every request
  • Uses environment variable `DATABASE_URL` for connection string

• Migrations and Seeding
  • Migrations managed through `npx prisma migrate` commands
  • A seed script (`prisma/seed.ts`) populates default master data on setup

## 3. Database Schema

Below is a human-readable summary followed by the SQL definitions for key tables.

### Human-Readable Schema Overview

• Users
  • Stores registered user details, hashed passwords, roles, and timestamps

• PasswordResetTokens
  • Tracks one-time tokens for password resets with expiration

• Master Data Tables (Types, Statuses, Genres, Platforms)
  • Each table contains a name, a `memberLocked` flag, and timestamps

• Comics
  • Each comic record links to a user and master data entries
  • Tracks reading progress, soft delete status, and timestamps

• Settings
  • Stores user preferences such as theme (light/dark)

• ActivityLogs
  • Records user actions (create, update, delete) for audit and history

### SQL Schema (MySQL)

```sql
-- Users
drop table if exists User;
create table User (
  id            char(36)      not null primary key,
  email         varchar(255)  not null unique,
  passwordHash  varchar(255)  not null,
  role          enum('member','admin') default 'member',
  createdAt     datetime      default current_timestamp,
  updatedAt     datetime      default current_timestamp on update current_timestamp
);

-- Password Reset Tokens
drop table if exists PasswordResetToken;
create table PasswordResetToken (
  id         char(36)      not null primary key,
  token      varchar(255)  not null unique,
  userId     char(36)      not null,
  expiresAt  datetime      not null,
  used       boolean       default false,
  foreign key (userId) references User(id)
);

-- Master Data Tables
-- Types, Statuses, Genres, Platforms share the same structure:
create table Type (
  id            int           not null auto_increment primary key,
  name          varchar(100)  not null unique,
  memberLocked  boolean       default true,
  createdAt     datetime      default current_timestamp,
  updatedAt     datetime      default current_timestamp on update current_timestamp
);

-- Repeat the above block for Status, Genre, Platform by renaming the table

-- Comics
drop table if exists Comic;
create table Comic (
  id             char(36)      not null primary key,
  title          varchar(255)  not null,
  description    text,
  typeId         int           not null,
  statusId       int           not null,
  genreId        int           not null,
  platformId     int           not null,
  chaptersRead   int           default 0,
  totalChapters  int           default 0,
  userId         char(36)      not null,
  deletedAt      datetime,
  createdAt      datetime      default current_timestamp,
  updatedAt      datetime      default current_timestamp on update current_timestamp,
  foreign key (typeId) references Type(id),
  foreign key (statusId) references Status(id),
  foreign key (genreId) references Genre(id),
  foreign key (platformId) references Platform(id),
  foreign key (userId) references User(id)
);

-- Settings
drop table if exists Setting;
create table Setting (
  id        char(36)     not null primary key,
  userId    char(36)     not null unique,
  theme     enum('light','dark') default 'light',
  foreign key (userId) references User(id)
);

-- Activity Logs
drop table if exists ActivityLog;
create table ActivityLog (
  id          char(36)      not null primary key,
  userId      char(36)      not null,
  action      varchar(50)   not null,
  entityType  varchar(50)   not null,
  entityId    varchar(36)   not null,
  timestamp   datetime      default current_timestamp,
  foreign key (userId) references User(id)
);
```  

## 4. API Design and Endpoints

We follow a RESTful approach with clear, resource-based endpoints. All routes live under `/api`.

• Auth Endpoints (`/api/auth`)
  • POST `/register` – Create a new user (returns a JWT in an HttpOnly cookie)
  • POST `/login` – Authenticate user and set Jwt cookie
  • POST `/logout` – Clear the auth cookie
  • POST `/forgot` – Request password reset (sends email via Resend)
  • POST `/reset` – Reset password using token

• Comic Endpoints (`/api/comics`)
  • GET `/` – List comics with filtering, sorting, pagination
  • POST `/` – Create new comic
  • GET `/:id` – Get one comic’s details
  • PUT `/:id` – Update comic (including soft delete)
  • DELETE `/:id` – Soft-delete a comic (sets `deletedAt`)

• Master Data Endpoints (`/api/enums`)
  • GET `/types`, `/statuses`, `/genres`, `/platforms` – Fetch default and custom entries
  • POST, PUT, DELETE on each resource – Custom entries only (respect `memberLocked` rules)

• Settings Endpoint (`/api/settings`)
  • GET `/` – Get user’s settings
  • PUT `/` – Update user’s settings (theme, etc.)

• Utility Endpoints
  • GET `/export` – Export user’s collection as JSON
  • GET `/activity` – List activity logs for the user

Each endpoint validates input with Zod, ensures the user is authenticated (if required), and returns standardized JSON.

## 5. Hosting Solutions

• Development
  • Docker & docker-compose spin up Next.js and MySQL
  • Mirrors production as closely as possible

• Production
  • Vercel for Next.js App Router and API Routes
  • Managed MySQL (e.g., PlanetScale, TiDB Cloud, Amazon RDS)

Benefits:

• Reliability
  • Vercel provides built-in health checks, redundancy, and automatic failover
  • Managed database services handle backups and recovery

• Scalability
  • Serverless functions on Vercel auto-scale to meet traffic spikes
  • TiDB/MySQL can scale horizontally for large datasets

• Cost-Effectiveness
  • Pay-as-you-go pricing on Vercel minimizes idle server costs
  • Managed database tiers let you choose capacity that fits your budget

## 6. Infrastructure Components

• Load Balancing
  • Vercel’s global edge network distributes incoming traffic across regions

• Content Delivery Network (CDN)
  • Static assets (JS, CSS, images) are cached at Vercel’s edge nodes

• Caching
  • Next.js ISR/SSG caching for published pages
  • Client-side caching with SWR for fast revalidation of data

• Containerization
  • Dockerfile defines the Next.js service image
  • docker-compose configures local MySQL and the app side by side

• Email Delivery
  • Resend service handles transactional email for password resets and confirmations

## 7. Security Measures

• Authentication & Authorization
  • JWTs signed with a strong secret (`JWT_SECRET`) and stored in HttpOnly cookies
  • Middleware enforces protected routes and checks user roles for RBAC

• Password Protection
  • bcrypt hashes all user passwords before storage

• Data Validation
  • Zod schemas validate all incoming request bodies and query parameters

• Encryption & Transport
  • HTTPS enforced for all API and frontend traffic

• Rate Limiting & Headers
  • Optionally implement rate limiting middleware to prevent abuse
  • Set secure HTTP headers (e.g., via Helmet) to protect against common web attacks

• Regulatory Compliance
  • User data is stored securely and only minimal personal data (email) is kept
  • Audit logs (ActivityLog) track user actions for accountability

## 8. Monitoring and Maintenance

• Performance Monitoring
  • Vercel Analytics tracks request latencies and error rates
  • Database metrics monitored via managed DB dashboards

• Error Tracking
  • Integrate Sentry (or similar) to capture runtime exceptions and stack traces

• Logging
  • Structured logs from API routes and middleware are collected by Vercel

• Testing & CI/CD
  • GitHub Actions run unit tests (Zod validations, helper functions) and integration tests (API routes) on every push
  • End-to-end tests verify user flows like login, comic CRUD, and password reset

• Maintenance Practices
  • Regular Prisma migrations and schema reviews
  • Seed scripts updated alongside master data changes
  • Dependency updates and security patching via automated tooling (Dependabot)

## 9. Conclusion and Overall Backend Summary

This backend structure brings together a robust, scalable, and secure foundation for your Komik Tracker application. By using Next.js App Router and serverless API Routes, Prisma with a MySQL-compatible database, and JWT-based authentication, we achieve:

• A clear separation of concerns that simplifies maintenance and onboarding
• An auto-scaling, global deployment model on Vercel for high performance
• Industry-standard security practices that protect user data and comply with regulations

Unique strengths:

• Hybrid SSR/Client rendering balances SEO and interactivity
• Soft deletes and a recycle bin provide data safety for users
• Role-based access control enforced via JWTs and middleware
• Containerized local development ensures parity with production

With this setup, your team can confidently build and extend the Komik Tracker features, knowing the backend will reliably support growth and evolving requirements.