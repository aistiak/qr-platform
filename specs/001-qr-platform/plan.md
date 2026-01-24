# Implementation Plan: QR Platform

**Branch**: `001-qr-platform` | **Date**: 2026-01-24 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-qr-platform/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Build a full-stack QR code platform where users can create, manage, and track QR codes. Users authenticate with email/password, create QR codes that redirect to URLs or hosted images, manage their QR codes (pause, archive, delete, rename), export QR codes, view analytics, and administrators can manage users and QR codes. Built with Next.js (App Router) as a full-stack framework and MongoDB for data persistence, prioritizing mobile-first UX, performance, and accessibility.

## Technical Context

**Language/Version**: TypeScript 5.x, Node.js 20.x LTS  
**Primary Dependencies**: Next.js 14+ (App Router), React 18+, MongoDB (via Mongoose or native driver), NextAuth.js for authentication, QR code generation library (qrcode.js or similar), image processing library (sharp or similar)  
**Storage**: MongoDB (document database for users, QR codes, analytics, hosted images metadata)  
**File Storage**: Local filesystem or cloud storage (AWS S3, Cloudinary, or Vercel Blob) for uploaded images  
**Testing**: Jest, React Testing Library, Playwright for E2E testing
**Target Platform**: Web (browser-based), mobile-responsive, PWA-capable
**Project Type**: Web application (Next.js full-stack)

**Performance Goals**:

- Page load < 2s on 3G networks
- API routes < 200ms p95 response time
- QR code generation < 500ms
- Support 1,000 concurrent users
- Core Web Vitals: LCP < 2.5s, FID < 100ms, CLS < 0.1

**Constraints**:

- Mobile-first responsive design (320px+ breakpoints)
- Image uploads max 2MB (JPEG/PNG only)
- QR code limit: 20 per user (default, admin-configurable)
- WCAG 2.1 Level AA accessibility compliance
- Sub-second interaction feedback

**Scale/Scope**:

- 1,000+ concurrent users
- 10,000+ QR codes
- 100,000+ QR code scans/analytics events
- Real-time analytics aggregation

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### I. User Experience First (NON-NEGOTIABLE)

✅ **PASS**: Next.js App Router enables server components for fast initial loads, React Server Components reduce client-side JavaScript. Mobile-first responsive design with Tailwind CSS or similar. Loading states and error handling built into Next.js patterns. Accessibility: Next.js supports semantic HTML, ARIA attributes, and can integrate with accessibility testing tools.

### II. Performance Excellence

✅ **PASS**: Next.js App Router provides automatic code splitting, image optimization, and static generation. Server-side rendering and API routes enable sub-200ms API responses. MongoDB queries optimized with proper indexing. Image optimization via Next.js Image component. Performance budgets can be enforced via Lighthouse CI.

### III. Mobile-First Design (NON-NEGOTIABLE)

✅ **PASS**: Next.js responsive design patterns, touch-friendly UI components (44x44px minimum targets), mobile-optimized forms and interactions. PWA capabilities via Next.js PWA plugin. Mobile testing via Playwright on real device emulators.

**Gates Status**: ✅ All constitution principles satisfied. Proceeding to Phase 0 research.

## Project Structure

### Documentation (this feature)

```text
specs/001-qr-platform/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
app/                          # Next.js App Router
├── (auth)/                   # Auth route group
│   ├── signin/
│   │   └── page.tsx
│   └── signup/
│       └── page.tsx
├── (dashboard)/              # Protected dashboard route group
│   ├── dashboard/
│   │   └── page.tsx          # QR codes list
│   ├── qr/
│   │   ├── [id]/
│   │   │   ├── page.tsx      # QR code detail/edit
│   │   │   └── analytics/
│   │   │       └── page.tsx  # Analytics view
│   │   └── create/
│   │       └── page.tsx      # Create QR code
│   └── admin/
│       ├── page.tsx          # Admin dashboard
│       ├── users/
│       │   └── page.tsx      # Users list
│       └── users/[id]/
│           └── page.tsx      # User detail/edit
├── api/                      # API routes
│   ├── auth/
│   │   └── [...nextauth]/
│   │       └── route.ts      # NextAuth.js handler
│   ├── qr/
│   │   ├── route.ts          # GET (list), POST (create)
│   │   ├── [id]/
│   │   │   ├── route.ts      # GET, PATCH, DELETE
│   │   │   ├── pause/
│   │   │   │   └── route.ts
│   │   │   ├── archive/
│   │   │   │   └── route.ts
│   │   │   └── analytics/
│   │   │       └── route.ts
│   │   └── [id]/download/
│   │       └── route.ts      # Download QR image
│   ├── images/
│   │   ├── route.ts          # POST (upload)
│   │   └── [id]/
│   │       └── route.ts      # GET (serve image)
│   ├── scan/
│   │   └── [id]/
│   │       └── route.ts      # QR code scan handler (redirect or 404)
│   └── admin/
│       ├── users/
│       │   └── route.ts      # GET users list
│       └── users/[id]/
│           └── route.ts      # PATCH (update limit)
├── layout.tsx               # Root layout
├── page.tsx                 # Landing/home page
└── not-found.tsx            # 404 page

lib/                         # Shared utilities
├── db/
│   └── mongodb.ts           # MongoDB connection
├── models/                  # Mongoose models
│   ├── User.ts
│   ├── QRCode.ts
│   ├── QRCodeAccess.ts
│   └── HostedImage.ts
├── auth.ts                  # NextAuth configuration
├── qr/
│   ├── generator.ts         # QR code generation
│   └── validator.ts         # URL/image validation
└── utils/
    ├── image-upload.ts      # Image upload handler
    └── analytics.ts         # Analytics aggregation

components/                  # React components
├── ui/                      # Reusable UI components
│   ├── Button.tsx
│   ├── Input.tsx
│   ├── Card.tsx
│   ├── Modal.tsx
│   └── LoadingSpinner.tsx
├── qr/
│   ├── QRCodeCard.tsx
│   ├── QRCodeForm.tsx
│   ├── QRCodeViewer.tsx
│   └── AnalyticsChart.tsx
├── admin/
│   ├── UserList.tsx
│   └── UserEditForm.tsx
└── layout/
    ├── Header.tsx
    ├── Navigation.tsx
    └── Footer.tsx

public/                      # Static assets
├── images/                  # Hosted user images (or use cloud storage)
└── qr-codes/                # Generated QR code images (or use cloud storage)

types/                       # TypeScript types
├── user.ts
├── qrcode.ts
└── api.ts

tests/
├── unit/                    # Unit tests
├── integration/             # API integration tests
└── e2e/                     # Playwright E2E tests
```

**Structure Decision**: Next.js App Router structure with route groups for auth and dashboard separation. API routes follow RESTful patterns. Components organized by feature domain. MongoDB models in lib/models. File storage can be local (development) or cloud (production).

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No violations detected. All constitution principles are satisfied with the chosen architecture.
