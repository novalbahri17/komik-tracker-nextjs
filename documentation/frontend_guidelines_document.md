# Frontend Guideline Document for Komik Tracker Next.js

This document outlines the frontend architecture, design principles, styling, component structure, state management, routing, performance optimizations, testing strategy, and an overall summary for the Komik Tracker Next.js application. It’s written in clear, everyday language so that any team member can understand how the frontend is set up and why.

## 1. Frontend Architecture

**Framework & Language**
- **Next.js (App Router)**: Provides a hybrid of server-side rendering (SSR) and client-side interactivity. File-based routing in the `/app` folder makes page organization straightforward.
- **TypeScript**: Ensures type safety and better editor support, reducing runtime errors.

**Key Libraries & Tools**
- **Tailwind CSS**: A utility-first CSS framework for rapid styling and consistent design.
- **shadcn/ui**: A collection of accessible, themeable React components (Buttons, Cards, Tables, Dialogs, Toasts) built on Tailwind.
- **lucide-react**: Lightweight icon set used throughout the UI.
- **react-hook-form & Zod**: For fast, type-safe form state management and validation.
- **react-chartjs-2**: Renders Pie and Bar charts for the dashboard analytics.

**Scalability, Maintainability & Performance**
- **Server Components** fetch data on the server, sending minimal HTML to clients. This reduces bundle size and speeds up initial page load.
- **Client Components** handle interactivity—charts, forms, sidebar toggles—keeping UI responsive.
- **API Routes** in Next.js (`/app/api/*`) centralize data fetching and business logic, keeping frontend code clean.
- **File-based Routing & Layouts** allow easy splitting into public, auth, and protected areas, simplifying growth.

## 2. Design Principles

**Usability**
- Clear, consistent layouts (sidebar + header for protected pages, centered cards for auth pages).
- Meaningful feedback via Toast notifications and confirmation Dialogs.

**Accessibility**
- Semantic HTML elements and ARIA attributes in shadcn/ui components.
- Keyboard-friendly navigation in menus, dialogs, and forms.
- Sufficient contrast in light/dark themes for readability.

**Responsiveness**
- Mobile-first design with Tailwind’s responsive utilities.
- Collapsible sidebar on small screens; full sidebar on tablets and desktops.

**Consistency**
- Single source of truth for colors, fonts, and theme settings.
- Shared component library (shadcn/ui) ensures uniform look and feel.

## 3. Styling and Theming

**Styling Approach**
- **Tailwind CSS**: Utility classes for margin, padding, typography, colors, flex/grid layouts.
- No separate CSS files for components—styles live alongside markup via class names.

**Component Styles**
- **shadcn/ui** components pre-styled with Tailwind; easily customized via props or Tailwind overrides.

**Theming**
- Built-in **light/dark mode** support using Tailwind’s `dark:` variant and localStorage to persist user choice.
- Theme preference saved to the database on user profile, ensuring it sticks across devices.

**Visual Style**
- **Modern Flat Design** with subtle shadows and rounded corners.
- Occasional **glassmorphism** effect (semi-transparent, blurred backgrounds) in modals and dialogs for a sleek, layered look.

**Color Palette**
- Primary Blue: `#3B82F6` (blue-500)
- Secondary Green: `#10B981` (emerald-500)
- Accent Yellow: `#F59E0B` (amber-500)
- Danger Red: `#EF4444` (red-500)
- Neutral Gray: `#6B7280` (gray-500)
- Background Light: `#F9FAFB`
- Background Dark: `#111827`

**Typography**
- **Font Family:** Inter, system sans-serif fallback.
- **Headings:** Bold, larger sizes for hierarchy.
- **Body Text:** Regular weight, 16px base size for readability.

## 4. Component Structure

**Organization**
- `/components/ui/`: Reusable building blocks (Button, Input, Card, Dialog, Toast).
- `/components/app-sidebar.tsx` & `/components/site-header.tsx`: Layout shell for protected pages.
- `/components/data-table.tsx`: Common table with sorting, filtering, pagination.

**Reuse & Encapsulation**
- Each component has clear props and internal state (if needed) only for UI behavior.
- No mixed concerns: data fetching happens in pages or hooks, not deep inside UI components.

**Benefits**
- **Maintainability:** Changing a Button style in one place updates it everywhere.
- **Scalability:** New pages assemble existing components quickly, reducing duplication.

## 5. State Management

**Local & UI State**
- React’s `useState` and `useReducer` for component-specific interactions (e.g., sidebar open/close).
- **react-hook-form** handles form field state and validation.

**Global State**
- **Theme Context:** A small React Context holds light/dark mode across the app.
- **Auth Status:** User info fetched from `/api/auth/me`, stored in a Context or via a custom hook to avoid prop-drilling.

**Server State**
- Data fetched via **Next.js Server Components** (e.g., dashboard metrics) or **custom hooks** calling API routes.
- No third-party caching library—Next.js handles data freshness on each request; caching strategies can be added later if needed.

## 6. Routing and Navigation

**Next.js App Router**
- `/app/(public)/...`: Landing, about, features pages.
- `/app/(auth)/auth`: `login` & `register` pages with centered card layouts.
- `/app/(protected)/dashboard`, `/comics`, `/master`, `/settings`.

**Layouts**
- **Root Layout:** Common `<html>` and `<body>` tags, global styles, and theme providers.
- **Auth Layout:** Light background, centered card, minimal header.
- **Protected Layout:** Sidebar + header, main content area.

**Navigation**
- **Link** component from Next.js for client-side transitions.
- Sidebar toggles collapse/expand; mobile toggle button in the header.
- Breadcrumbs or simple page titles guide users through nested pages.

## 7. Performance Optimization

**Code Splitting & Lazy Loading**
- Next.js auto-splits routes. Heavy components (charts) are dynamically imported with `next/dynamic` and shown with a `Suspense` fallback.

**CSS Optimization**
- Tailwind’s JIT compiler removes unused styles in production builds.

**Image & Asset Optimization**
- Next.js `<Image>` for automatic resizing, lazy loading, and WebP support.

**Data Fetching**
- **Server Components** send only HTML and critical JSON, avoiding large client bundles.
- API responses are kept minimal and compressed.

## 8. Testing and Quality Assurance

**Unit Tests**
- Jest & React Testing Library for components and utility functions.
- Focus on form validation logic (Zod schemas) and small UI behaviors.

**Integration Tests**
- Test multi-component flows: login → dashboard, add/edit comic → table view.
- Use MSW (Mock Service Worker) to simulate API responses.

**End-to-End (E2E) Tests**
- Cypress or Playwright to automate critical user paths: authentication, CRUD on comics, theme switching.
- Run tests against a test database in CI.

**Linting & Formatting**
- ESLint with Next.js and TypeScript plugins.
- Prettier for consistent code style.
- Husky & lint-staged to enforce checks on every commit.

## 9. Conclusion and Overall Frontend Summary

The Komik Tracker Next.js frontend is built on a solid, modern foundation: Next.js for hybrid rendering, TypeScript for safety, Tailwind CSS for styling, and a component-driven approach for reuse. Design principles—usability, accessibility, and responsiveness—guide every UI decision. Performance is maximized through server components, dynamic imports, and asset optimization. A clear routing structure, robust form handling, and comprehensive testing ensure both developer productivity and a smooth user experience. With these guidelines in place, any team member can confidently navigate, maintain, and extend the frontend to meet future needs.