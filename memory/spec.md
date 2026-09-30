# WasteGuard Predictive Waste Platform

## What it does
Hackathon-ready Smart City waste platform with a complete citizen → AI analysis → admin dispatch → worker cleanup evidence → admin verification → citizen reward flow.

## Data model
- `users`: string UUID, email, name, role, password hash, vehicle/active state, created timestamp.
- `complaints`: WasteGuard complaint code, AI analysis, severity/fill estimate, before/after images, location, citizen, worker assignment, lifecycle timeline and verification.
- `pickups`: citizen bulk-waste request, date/address/coordinates, status.
- `notifications`, `rewards`, `counters`: resolution messages, points/badges and sequential WG complaint IDs.

## Key flows
1. Citizen uploads a real waste photo; Gemini 3.8 Flash analyzes it with an explicit DEMO fallback, then creates a WG complaint.
2. Admin reviews metrics and simulated predictive hotspots, then assigns an active worker/Truck 03.
3. Worker opens the optimized demo route, starts the task and submits before/after evidence.
4. Admin verifies the cleanup; the complaint resolves, citizen receives a notification and earns points.

## Auth and roles
Email/password auth with an httpOnly cookie session. After the first login, the persistent Citizen / Admin / Worker tabs switch between the seeded workspace personas through `/api/auth/switch-role`; no second sign-in is needed for the role detail previews. Demo accounts are documented in `memory/test_credentials.md`. Citizens can create reports and pickups; admins can assign/update; workers can start/complete assigned tasks.

## Map behavior
Uses browser `navigator.geolocation` when permission is granted and a no-key OpenStreetMap embed centered on the captured/default coordinates.