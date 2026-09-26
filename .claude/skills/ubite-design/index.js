/* The design system's single entry point for production code (see _adherence.oxlintrc.json:
   "Import design-system components from 'index.js', not component internals").
   The UI kits keep using _ds_bundle.js; the apps import from here, so a change to a component
   reaches the kits (after `node scripts/ds-bundle.mjs --all`) and the product at once. */
export { Logo, LogoSplash } from './components/brand/Logo.jsx';
export { Wordmark } from './components/brand/Wordmark.jsx';
export { Illustration, Pattern, useReducedMotion } from './components/brand/Illustration.jsx';
export { Button, IconButton } from './components/core/Button.jsx';
export { Card, SectionHeader } from './components/core/Card.jsx';
export { Chip, Badge, DietaryTag } from './components/core/Chip.jsx';
export { Input, Skeleton } from './components/core/Input.jsx';
export { Spotlight } from './components/core/Spotlight.jsx';
export { CrowdingIndicator, PersonMeter, QualityBadge, FreshnessStamp } from './components/crowding/CrowdingIndicator.jsx';
export { EmptyState, OfflineBanner, WaitReport, CrowdingByHour } from './components/feedback/EmptyState.jsx';
export { Icon, GLYPHS } from './components/icons/Icon.jsx';
export { AppShell, AppHeader, AppFooter, Announcement, Sheet, Toast } from './components/layout/AppShell.jsx';
export { DishRow, DishPhoto, CategoryHeader } from './components/menu/DishRow.jsx';
export { DishDetailHeader } from './components/menu/DishDetailHeader.jsx';
export { RatingStars, LoyaltyDots } from './components/menu/RatingStars.jsx';
