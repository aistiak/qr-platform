<!--
Sync Impact Report:
Version change: 0.0.0 → 1.0.0 (Initial constitution)
Modified principles: None (new)
Added sections: Core Principles (UX, Performance, Mobile Friendliness), Quality Standards, Development Workflow
Removed sections: None
Templates requiring updates:
  ✅ spec-template.md - No changes needed (already supports user-focused requirements)
  ✅ plan-template.md - No changes needed (Constitution Check section exists)
  ✅ tasks-template.md - No changes needed (task structure supports all principles)
Follow-up TODOs: None
-->

# QR Host Constitution

## Core Principles

### I. User Experience First (NON-NEGOTIABLE)
Every feature MUST prioritize intuitive, accessible, and delightful user interactions. User flows must be designed with clear feedback, minimal cognitive load, and error prevention. All interfaces MUST be tested with real users or validated against established UX patterns before implementation. Accessibility standards (WCAG 2.1 Level AA minimum) MUST be met for all user-facing features.

**Rationale**: Superior user experience drives adoption, retention, and satisfaction. Poor UX creates friction that undermines even technically excellent features.

### II. Performance Excellence
System MUST deliver sub-second response times for user interactions, with measurable performance targets defined for each feature. All operations MUST be optimized for speed: lazy loading, efficient data fetching, minimal payload sizes, and progressive enhancement. Performance budgets MUST be established and enforced. Core Web Vitals (LCP < 2.5s, FID < 100ms, CLS < 0.1) MUST be met for web interfaces.

**Rationale**: Performance directly impacts user satisfaction and business metrics. Slow experiences lead to abandonment and poor user perception.

### III. Mobile-First Design (NON-NEGOTIABLE)
All features MUST be designed and implemented mobile-first, ensuring full functionality and excellent experience on mobile devices. Touch targets MUST be appropriately sized (minimum 44x44px), layouts MUST be responsive, and interactions MUST work seamlessly on small screens. Mobile performance MUST be prioritized: optimize for slower networks, smaller screens, and touch interactions. Progressive Web App (PWA) capabilities SHOULD be considered for enhanced mobile experience.

**Rationale**: Mobile devices represent the primary access method for most users. Features that don't work well on mobile exclude a significant portion of the user base.

## Quality Standards

### Performance Targets
- Page load time: < 2 seconds on 3G networks
- Time to interactive: < 3 seconds
- API response time: < 200ms (p95)
- Image optimization: WebP format with fallbacks, lazy loading
- Code splitting: Route-based and component-based where applicable

### Mobile Requirements
- Responsive design: Breakpoints for mobile (320px+), tablet (768px+), desktop (1024px+)
- Touch-friendly: Minimum 44x44px touch targets, adequate spacing
- Offline capability: Core features work offline where applicable
- Mobile testing: All features tested on real devices or reliable emulators

### UX Standards
- Accessibility: WCAG 2.1 Level AA compliance
- Error handling: Clear, actionable error messages
- Loading states: Visual feedback for all async operations
- Navigation: Intuitive, consistent navigation patterns
- Feedback: Immediate visual/audio feedback for user actions

## Development Workflow

### Code Review Checklist
- [ ] Performance impact assessed (bundle size, render time, API calls)
- [ ] Mobile responsiveness verified (tested on multiple screen sizes)
- [ ] UX patterns consistent with established design system
- [ ] Accessibility requirements met (keyboard navigation, screen readers)
- [ ] Loading states and error handling implemented
- [ ] Performance budgets not exceeded

### Testing Requirements
- Mobile testing: All features MUST be tested on mobile devices or reliable emulators
- Performance testing: Load times and interaction responsiveness MUST be measured
- UX testing: User flows MUST be validated for clarity and ease of use
- Accessibility testing: Automated and manual accessibility checks MUST pass

### Performance Monitoring
- Core Web Vitals tracking MUST be implemented for web features
- Performance budgets MUST be enforced in CI/CD pipeline
- Performance regressions MUST be caught before deployment
- Mobile performance metrics MUST be tracked separately

## Governance

This constitution supersedes all other development practices. All features, code reviews, and technical decisions MUST align with these principles. Amendments to this constitution require:

1. Documentation of the proposed change and rationale
2. Impact assessment on existing features and templates
3. Update to dependent templates and documentation
4. Version increment following semantic versioning:
   - **MAJOR**: Backward incompatible principle removals or redefinitions
   - **MINOR**: New principle/section added or materially expanded guidance
   - **PATCH**: Clarifications, wording, typo fixes, non-semantic refinements

All PRs and reviews MUST verify compliance with constitution principles. Complexity or exceptions MUST be justified with clear rationale. Use this constitution as the primary reference for all development decisions.

**Version**: 1.0.0 | **Ratified**: 2026-01-24 | **Last Amended**: 2026-01-24
