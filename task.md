# Migration Task List

- [x] Initialize configuration and environment files
    - [x] Create `firebase.json`
    - [x] Create `.firebaserc`
    - [x] Create `.env.example`
- [x] Fix TypeScript compilation bugs
    - [x] Export `SecurityRuleContext` in `src/firebase/errors.ts`
    - [x] Define and export `Message` interface in `src/app/lib/tool-types.ts`
    - [x] Correct destructuring of `useAuth` in `src/app/admin-portal/page.tsx`
    - [x] Update `src/components/ui/calendar.tsx` to support `react-day-picker` v9 Chevron component
- [x] Verify project builds successfully
    - [x] Run `npm run typecheck`
    - [x] Run `npm run build`
