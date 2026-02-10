# Research: QR Host

**Date**: 2026-01-24  
**Feature**: QR Host Implementation

## Technology Decisions

### Next.js App Router

**Decision**: Use Next.js 14+ with App Router for full-stack development.

**Rationale**: 
- App Router provides server components, API routes, and client components in a unified framework
- Server-side rendering improves initial page load performance
- Built-in image optimization supports mobile performance targets
- API routes enable RESTful endpoints without separate backend
- TypeScript support for type safety
- Excellent developer experience with hot reload and error handling

**Alternatives considered**:
- **Remix**: Similar full-stack approach but smaller ecosystem
- **Express + React**: More setup complexity, separate frontend/backend concerns
- **Next.js Pages Router**: App Router provides better performance and developer experience

### MongoDB with Mongoose

**Decision**: Use MongoDB as document database with Mongoose ODM.

**Rationale**:
- Document model fits QR code, user, and analytics data naturally
- Flexible schema allows evolution without migrations
- Mongoose provides validation, middleware, and type safety
- Horizontal scaling capabilities for future growth
- Good performance for read-heavy analytics queries with proper indexing

**Alternatives considered**:
- **PostgreSQL**: Relational model overkill for this use case, more complex joins
- **Prisma + PostgreSQL**: More rigid schema, migration overhead
- **Firebase**: Vendor lock-in, less control over data structure

### NextAuth.js

**Decision**: Use NextAuth.js v5 (Auth.js) for authentication.

**Rationale**:
- Seamless Next.js integration
- Built-in session management
- Password hashing (bcrypt) included
- Extensible for future OAuth providers
- TypeScript support
- Security best practices built-in

**Alternatives considered**:
- **Custom JWT implementation**: More security risk, more code to maintain
- **Clerk/Auth0**: External dependency, additional cost, less control

### QR Code Generation Library

**Decision**: Use `qrcode` npm package (node-qrcode).

**Rationale**:
- Pure JavaScript, works in Node.js and browser
- Supports multiple output formats (PNG, SVG, Data URL)
- Configurable error correction levels
- Lightweight and well-maintained
- No external API dependencies

**Alternatives considered**:
- **QRCode.js**: Browser-only, doesn't work in API routes
- **External QR API**: Network dependency, cost, latency

### Image Processing

**Decision**: Use `sharp` for server-side image processing.

**Rationale**:
- Fast image resizing and format conversion
- Validates image formats and sizes
- Optimizes images for web delivery
- Works in Next.js API routes
- Supports JPEG/PNG validation

**Alternatives considered**:
- **jimp**: Slower performance, less features
- **ImageMagick**: Heavier dependency, more complex setup

### File Storage Strategy

**Decision**: Use local filesystem for development, cloud storage (Vercel Blob or AWS S3) for production.

**Rationale**:
- Local storage simplifies development setup
- Cloud storage provides scalability and CDN benefits
- Vercel Blob integrates seamlessly with Next.js deployments
- Cost-effective for image hosting
- Automatic CDN distribution improves performance

**Alternatives considered**:
- **MongoDB GridFS**: Not optimized for file serving, adds database load
- **Cloudinary**: Additional service dependency, potential cost at scale

### State Management

**Decision**: Use React Server Components + React hooks (useState, useQuery) for state management.

**Rationale**:
- Server Components reduce client-side JavaScript
- React Query (TanStack Query) for server state caching
- No need for Redux/Zustand for this application scope
- Simpler mental model, better performance

**Alternatives considered**:
- **Redux**: Overkill for this application, adds complexity
- **Zustand**: Unnecessary for server component architecture

### Styling

**Decision**: Use Tailwind CSS with shadcn/ui components.

**Rationale**:
- Mobile-first responsive design built-in
- Utility-first approach enables rapid development
- shadcn/ui provides accessible, customizable components
- Small bundle size with JIT compilation
- Excellent developer experience

**Alternatives considered**:
- **CSS Modules**: More verbose, less mobile-first utilities
- **Styled Components**: Runtime overhead, larger bundle
- **Material UI**: Larger bundle, less customization flexibility

### Testing Strategy

**Decision**: Jest + React Testing Library for unit/integration, Playwright for E2E.

**Rationale**:
- Jest integrates well with Next.js
- React Testing Library promotes accessible component testing
- Playwright provides real browser testing for mobile responsiveness
- Can test API routes, components, and user flows

**Alternatives considered**:
- **Cypress**: Less mobile testing capabilities, more complex setup
- **Vitest**: Newer, less ecosystem maturity

## Architecture Patterns

### API Route Pattern

**Decision**: RESTful API routes in `app/api/` directory.

**Rationale**:
- Standard HTTP methods (GET, POST, PATCH, DELETE)
- Clear resource-based URLs
- Easy to test and document
- Works with Next.js middleware for auth

### Data Access Pattern

**Decision**: Mongoose models in `lib/models/`, direct model usage in API routes.

**Rationale**:
- Simple, no unnecessary abstraction layers
- Mongoose provides validation and middleware
- Type safety with TypeScript
- Easy to add caching layer later if needed

**Alternatives considered**:
- **Repository pattern**: Unnecessary abstraction for this scope
- **Service layer**: Can be added later if business logic grows

### QR Code Redirect Pattern

**Decision**: Dedicated `/scan/[id]` API route that checks status and redirects or returns 404.

**Rationale**:
- Centralized logic for status checking (active/paused/archived)
- Analytics tracking in one place
- Can add rate limiting and security checks
- Clean separation from dashboard routes

## Performance Optimizations

### Image Optimization

- Use Next.js Image component for automatic optimization
- Serve uploaded images via optimized API route
- Lazy load QR code images in lists
- WebP format with JPEG/PNG fallbacks

### Database Indexing

- Index on User.email (unique)
- Index on QRCode.userId and QRCode.status
- Index on QRCodeAccess.qrCodeId and QRCodeAccess.timestamp for analytics queries
- Compound indexes for common query patterns

### Caching Strategy

- Static generation for public pages where possible
- React Query for API response caching
- CDN caching for static assets and images
- Analytics aggregation can be cached (5-minute TTL)

## Security Considerations

### Authentication

- Password hashing with bcrypt (NextAuth.js default)
- Session management via secure HTTP-only cookies
- CSRF protection via NextAuth.js
- Rate limiting on auth endpoints

### Authorization

- Middleware to check user roles (admin vs regular user)
- API route validation of user ownership for QR code operations
- Admin routes protected by role check

### Input Validation

- Zod schemas for API route validation
- Mongoose schema validation for database layer
- File upload validation (size, format) before processing

## Mobile-First Considerations

### Responsive Breakpoints

- Mobile: 320px - 767px
- Tablet: 768px - 1023px
- Desktop: 1024px+

### Touch Targets

- Minimum 44x44px for all interactive elements
- Adequate spacing between touch targets
- Mobile-optimized forms and inputs

### PWA Support

- Next.js PWA plugin for service worker
- Offline capability for viewing cached QR codes
- Install prompt for mobile devices

## Accessibility

### WCAG 2.1 Level AA Compliance

- Semantic HTML elements
- ARIA labels where needed
- Keyboard navigation support
- Screen reader compatibility
- Color contrast ratios
- Focus indicators

### Testing Tools

- axe DevTools for automated accessibility testing
- Lighthouse accessibility audit
- Manual keyboard navigation testing
- Screen reader testing (NVDA, VoiceOver)
