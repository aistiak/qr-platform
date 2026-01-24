# Tasks: QR Platform

**Input**: Design documents from `/specs/001-qr-platform/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Tests are not explicitly requested in the specification, so test tasks are not included. Tests can be added later if needed.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Next.js App Router**: `app/` for routes, `lib/` for utilities, `components/` for React components
- Paths follow Next.js 14+ App Router structure from plan.md

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [x] T001 Create Next.js project structure with App Router in app/
- [x] T002 Initialize TypeScript configuration in tsconfig.json
- [x] T003 [P] Install and configure Tailwind CSS with postcss.config.js and tailwind.config.js
- [x] T004 [P] Setup ESLint and Prettier configuration files
- [x] T005 [P] Create environment variable template in .env.example
- [x] T006 [P] Setup Docker Compose configuration in docker-compose.yml
- [x] T007 [P] Create .dockerignore file
- [x] T008 [P] Create .gitignore file for Next.js project
- [x] T009 Initialize package.json with Next.js, React, TypeScript, and core dependencies

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T010 Setup MongoDB connection utility in lib/db/mongodb.ts
- [x] T011 [P] Create User Mongoose model in lib/models/User.ts with schema, validation, and indexes
- [x] T012 [P] Create QRCode Mongoose model in lib/models/QRCode.ts with schema, validation, and indexes
- [x] T013 [P] Create QRCodeAccess Mongoose model in lib/models/QRCodeAccess.ts with schema, validation, and indexes
- [x] T014 [P] Create HostedImage Mongoose model in lib/models/HostedImage.ts with schema, validation, and indexes
- [x] T015 Setup NextAuth.js configuration in lib/auth.ts with CredentialsProvider
- [x] T016 Create NextAuth.js API route handler in app/api/auth/[...nextauth]/route.ts
- [x] T017 Create authentication middleware utility in lib/utils/auth-middleware.ts
- [x] T018 Create error handling utility in lib/utils/error-handler.ts
- [x] T019 Create API response utility in lib/utils/api-response.ts
- [x] T020 Setup database indexes creation script in scripts/create-indexes.ts
- [x] T021 Create root layout component in app/layout.tsx with metadata and providers
- [x] T022 Create landing page in app/page.tsx
- [x] T023 Create 404 page in app/not-found.tsx

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - User Authentication (Priority: P1) 🎯 MVP

**Goal**: Users can create accounts and securely sign in to access the platform

**Independent Test**: Can be fully tested by creating a new account, signing in, and signing out. Delivers secure access to the platform and establishes user identity.

### Implementation for User Story 1

- [x] T024 [US1] Create sign up API route in app/api/auth/signup/route.ts with validation and password hashing
- [x] T025 [US1] Create sign in API route in app/api/auth/signin/route.ts with credential validation
- [x] T026 [US1] Create sign out API route in app/api/auth/signout/route.ts
- [x] T027 [US1] Create sign up page component in app/(auth)/signup/page.tsx with form and validation
- [x] T028 [US1] Create sign in page component in app/(auth)/signin/page.tsx with form and validation
- [x] T029 [US1] Create reusable Input component in components/ui/Input.tsx with accessibility
- [x] T030 [US1] Create reusable Button component in components/ui/Button.tsx with loading states
- [x] T031 [US1] Create form validation schemas in lib/utils/validation.ts using Zod
- [x] T032 [US1] Add error message display components for authentication forms
- [x] T033 [US1] Implement session management and redirect logic after authentication
- [x] T034 [US1] Add loading states and feedback during authentication operations

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently. Users can sign up, sign in, and sign out.

---

## Phase 4: User Story 2 - Create and Access QR Codes (Priority: P1)

**Goal**: Users can create QR codes that redirect to URLs or display hosted images. When scanned, the QR code redirects users to the target destination.

**Independent Test**: Can be fully tested by creating a QR code with a target URL, scanning it with a mobile device, and verifying the redirect works. Delivers a working QR code that serves its purpose.

### Implementation for User Story 2

- [ ] T035 [US2] Create QR code generation utility in lib/qr/generator.ts using qrcode library
- [ ] T036 [US2] Create URL validation utility in lib/qr/validator.ts
- [ ] T037 [US2] Create image upload handler in lib/utils/image-upload.ts with size and format validation
- [ ] T038 [US2] Create image upload API route in app/api/images/route.ts (POST) with file validation
- [ ] T039 [US2] Create image serving API route in app/api/images/[id]/route.ts (GET)
- [ ] T040 [US2] Create QR code creation API route in app/api/qr/route.ts (POST) with limit checking
- [ ] T041 [US2] Create QR code list API route in app/api/qr/route.ts (GET) for user's QR codes
- [ ] T042 [US2] Create QR code scan handler API route in app/api/scan/[id]/route.ts with redirect logic
- [ ] T043 [US2] Create QR code creation page component in app/(dashboard)/qr/create/page.tsx with form
- [ ] T044 [US2] Create QR code list page component in app/(dashboard)/dashboard/page.tsx
- [ ] T045 [US2] Create QRCodeCard component in components/qr/QRCodeCard.tsx for displaying QR codes
- [ ] T046 [US2] Create QRCodeForm component in components/qr/QRCodeForm.tsx with URL and image upload options
- [ ] T047 [US2] Create QRCodeViewer component in components/qr/QRCodeViewer.tsx for displaying QR code image
- [ ] T048 [US2] Create Card component in components/ui/Card.tsx for reusable card layout
- [ ] T049 [US2] Create LoadingSpinner component in components/ui/LoadingSpinner.tsx
- [ ] T050 [US2] Implement QR code limit enforcement in QR code creation logic
- [ ] T051 [US2] Add error handling for invalid URLs and image upload failures
- [ ] T052 [US2] Create protected route middleware for dashboard routes

**Checkpoint**: At this point, User Story 2 should be fully functional. Users can create QR codes with URLs or images, view their QR codes, and scan them to redirect.

---

## Phase 5: User Story 3 - Manage QR Codes (Priority: P2)

**Goal**: Users can organize and control their QR codes by pausing, deleting, archiving, and adding custom names to them.

**Independent Test**: Can be fully tested by creating multiple QR codes, renaming them, pausing one, archiving another, and deleting a third. Delivers organizational control over QR codes.

### Implementation for User Story 3

- [x] T053 [US3] Create QR code detail API route in app/api/qr/[id]/route.ts (GET) for single QR code
- [x] T054 [US3] Create QR code update API route in app/api/qr/[id]/route.ts (PATCH) for custom name and status
- [x] T055 [US3] Create QR code delete API route in app/api/qr/[id]/route.ts (DELETE)
- [x] T056 [US3] Create QR code pause API route in app/api/qr/[id]/pause/route.ts
- [x] T057 [US3] Create QR code archive API route in app/api/qr/[id]/archive/route.ts
- [x] T058 [US3] Update QR code scan handler to check status and return 404 for paused/archived codes
- [x] T059 [US3] Create QR code detail/edit page component in app/(dashboard)/qr/[id]/page.tsx
- [x] T060 [US3] Update QR code list page to filter by status (active, paused, archived)
- [x] T061 [US3] Add pause/resume functionality to QRCodeCard component
- [x] T062 [US3] Add archive/restore functionality to QRCodeCard component
- [x] T063 [US3] Add delete confirmation modal component in components/ui/Modal.tsx
- [x] T064 [US3] Add edit custom name functionality in QR code detail page
- [x] T065 [US3] Create archived QR codes section in dashboard with restore functionality
- [x] T066 [US3] Update QR code status transitions validation in QRCode model

**Checkpoint**: At this point, User Story 3 should be fully functional. Users can manage their QR codes: rename, pause, resume, archive, restore, and delete.

---

## Phase 6: User Story 4 - Export and Share QR Codes (Priority: P2)

**Goal**: Users can download QR codes as images, print them, and share them with others through various methods.

**Independent Test**: Can be fully tested by creating a QR code, downloading it as an image, printing it, and sharing it. Delivers QR codes in formats usable outside the platform.

### Implementation for User Story 4

- [ ] T067 [US4] Create QR code download API route in app/api/qr/[id]/download/route.ts with image generation
- [ ] T068 [US4] Add download button functionality to QRCodeCard component
- [ ] T069 [US4] Implement print functionality using browser print API in QRCodeViewer component
- [ ] T070 [US4] Add Web Share API integration for mobile sharing in QRCodeCard component
- [ ] T071 [US4] Create share link generation utility in lib/utils/share.ts
- [ ] T072 [US4] Add share button with multiple sharing options (link, image, social) to QRCodeCard
- [ ] T073 [US4] Ensure QR code images are high quality and scannable at various sizes
- [ ] T074 [US4] Create print-friendly CSS styles for QR code printing
- [ ] T075 [US4] Add download format options (PNG, SVG) to download functionality

**Checkpoint**: At this point, User Story 4 should be fully functional. Users can download, print, and share their QR codes.

---

## Phase 7: User Story 5 - View QR Code Analytics (Priority: P3)

**Goal**: Users can view analytics for each QR code showing how many times it has been accessed over time, with time-based breakdowns.

**Independent Test**: Can be fully tested by creating a QR code, scanning it multiple times, and viewing the analytics to see the access count and time-based data. Delivers insights into QR code usage.

### Implementation for User Story 5

- [ ] T076 [US5] Update QR code scan handler to record access events in QRCodeAccess collection
- [ ] T077 [US5] Create analytics aggregation utility in lib/utils/analytics.ts for time-based breakdowns
- [ ] T078 [US5] Create QR code analytics API route in app/api/qr/[id]/analytics/route.ts with time period filtering
- [ ] T079 [US5] Create analytics page component in app/(dashboard)/qr/[id]/analytics/page.tsx
- [ ] T080 [US5] Create AnalyticsChart component in components/qr/AnalyticsChart.tsx for visualizing access data
- [ ] T081 [US5] Add total access count display to QR code detail page
- [ ] T082 [US5] Implement daily, weekly, and monthly analytics breakdowns
- [ ] T083 [US5] Add time period selector (day, week, month) to analytics page
- [ ] T084 [US5] Create empty state component for QR codes with zero accesses
- [ ] T085 [US5] Update QRCode model to compute accessCount from QRCodeAccess collection
- [ ] T086 [US5] Add analytics link/button to QRCodeCard component

**Checkpoint**: At this point, User Story 5 should be fully functional. Users can view analytics for their QR codes with time-based breakdowns.

---

## Phase 8: User Story 6 - Admin Dashboard (Priority: P3)

**Goal**: Administrators can view all users and all QR codes in the platform, providing oversight and management capabilities.

**Independent Test**: Can be fully tested by signing in as an admin, viewing the list of all users, viewing the list of all QR codes, and verifying the data is accurate. Delivers platform-wide visibility for administrators.

### Implementation for User Story 6

- [ ] T087 [US6] Create admin middleware utility in lib/utils/admin-middleware.ts to check admin role
- [ ] T088 [US6] Create admin users list API route in app/api/admin/users/route.ts (GET)
- [ ] T089 [US6] Create admin user update API route in app/api/admin/users/[id]/route.ts (PATCH) for QR code limit
- [ ] T090 [US6] Create admin QR codes list API route in app/api/admin/qr/route.ts (GET)
- [ ] T091 [US6] Create admin dashboard page component in app/(dashboard)/admin/page.tsx
- [ ] T092 [US6] Create admin users list page component in app/(dashboard)/admin/users/page.tsx
- [ ] T093 [US6] Create admin user detail/edit page component in app/(dashboard)/admin/users/[id]/page.tsx
- [ ] T094 [US6] Create UserList component in components/admin/UserList.tsx for displaying all users
- [ ] T095 [US6] Create UserEditForm component in components/admin/UserEditForm.tsx for editing user QR code limit
- [ ] T096 [US6] Add admin navigation link to dashboard navigation
- [ ] T097 [US6] Protect admin routes with admin middleware
- [ ] T098 [US6] Add user role display and QR code limit editing in admin user detail page
- [ ] T099 [US6] Create admin QR codes view showing all QR codes with user information

**Checkpoint**: At this point, User Story 6 should be fully functional. Administrators can view all users and QR codes, and modify user QR code limits.

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T100 [P] Create Header component in components/layout/Header.tsx with navigation and user menu
- [ ] T101 [P] Create Navigation component in components/layout/Navigation.tsx with mobile-responsive menu
- [ ] T102 [P] Create Footer component in components/layout/Footer.tsx
- [ ] T103 [P] Add mobile-responsive breakpoints and touch-friendly interactions across all components
- [ ] T104 [P] Implement loading states and error boundaries throughout the application
- [ ] T105 [P] Add accessibility attributes (ARIA labels, keyboard navigation) to all interactive elements
- [ ] T106 [P] Optimize images and implement lazy loading for QR code images
- [ ] T107 [P] Add performance monitoring and Core Web Vitals tracking
- [ ] T108 [P] Implement PWA capabilities with service worker and manifest
- [ ] T109 [P] Add comprehensive error messages and user feedback throughout the application
- [ ] T110 [P] Create TypeScript types in types/user.ts, types/qrcode.ts, and types/api.ts
- [ ] T111 [P] Add input validation and sanitization across all forms
- [ ] T112 [P] Implement rate limiting for API routes
- [ ] T113 [P] Add logging for critical operations (auth, QR creation, admin actions)
- [ ] T114 [P] Create database migration script for initial indexes setup
- [ ] T115 [P] Update README.md with setup and deployment instructions
- [ ] T116 [P] Run quickstart.md validation and update if needed

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2 → P3)
- **Polish (Phase 9)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P1)**: Can start after Foundational (Phase 2) - Depends on US1 for authentication
- **User Story 3 (P2)**: Can start after Foundational (Phase 2) - Depends on US2 for QR code existence
- **User Story 4 (P2)**: Can start after Foundational (Phase 2) - Depends on US2 for QR code existence
- **User Story 5 (P3)**: Can start after Foundational (Phase 2) - Depends on US2 for QR codes and scan handler
- **User Story 6 (P3)**: Can start after Foundational (Phase 2) - Depends on US1 for user management

### Within Each User Story

- Models before services (if applicable)
- Services before API routes
- API routes before UI components
- Core implementation before integration
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel
- All Foundational tasks marked [P] can run in parallel (within Phase 2)
- Once Foundational phase completes, User Stories 1 and 2 can start (US2 after US1 auth is ready)
- User Stories 3, 4, 5, 6 can proceed in parallel after US2 is complete
- All Polish tasks marked [P] can run in parallel
- Models within a story marked [P] can run in parallel
- Different user stories can be worked on in parallel by different team members (respecting dependencies)

---

## Parallel Example: User Story 2

```bash
# Launch all models for User Story 2 together:
Task: "Create QR code generation utility in lib/qr/generator.ts"
Task: "Create URL validation utility in lib/qr/validator.ts"
Task: "Create image upload handler in lib/utils/image-upload.ts"

# Launch all API routes for User Story 2 together (after models):
Task: "Create image upload API route in app/api/images/route.ts"
Task: "Create image serving API route in app/api/images/[id]/route.ts"
Task: "Create QR code creation API route in app/api/qr/route.ts"
Task: "Create QR code list API route in app/api/qr/route.ts"
Task: "Create QR code scan handler API route in app/api/scan/[id]/route.ts"
```

---

## Implementation Strategy

### MVP First (User Stories 1 & 2 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1 (Authentication)
4. Complete Phase 4: User Story 2 (Create and Access QR Codes)
5. **STOP and VALIDATE**: Test User Stories 1 & 2 independently
6. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (Authentication working)
3. Add User Story 2 → Test independently → Deploy/Demo (MVP - QR codes working!)
4. Add User Story 3 → Test independently → Deploy/Demo (Management features)
5. Add User Story 4 → Test independently → Deploy/Demo (Export/Share)
6. Add User Story 5 → Test independently → Deploy/Demo (Analytics)
7. Add User Story 6 → Test independently → Deploy/Demo (Admin)
8. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 (Authentication)
   - Developer B: Prepares for User Story 2 (waits for US1)
3. Once User Story 1 is complete:
   - Developer A: User Story 2 (QR Creation)
   - Developer B: User Story 3 (Management)
   - Developer C: User Story 4 (Export/Share)
4. Once User Story 2 is complete:
   - Developer A: User Story 5 (Analytics)
   - Developer B: User Story 6 (Admin)
   - Developer C: Polish tasks
5. Stories complete and integrate independently

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
- All tasks include exact file paths for clarity
- Mobile-first responsive design must be considered in all UI tasks
- Performance and accessibility must be considered in all implementation tasks
