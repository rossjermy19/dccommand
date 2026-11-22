# Despatch Cloud Command Centre — Project Rules & Guidelines

## 1. Project Overview & Identity
- **Project**: DC Command Centre (Despatch Cloud Command Centre)
- **User**: Ross Jermy (Head of Sales / Executive)
- **Company**: Despatch Cloud (WMS, Voila shipping, Neuro, Helm, courier reseller & carrier integrations)
- **Purpose**: High-velocity deal radar, pipeline command centre, ghosting prevention, and AI-powered meeting intelligence.

---

## 2. Language & Spelling Standards
> [!IMPORTANT]
> **Strictly British English (UK English) at all times.**
> - Use British spellings in all code, comments, UI labels, toasts, notifications, commit messages, and assistant responses.
> - Examples: `synchronise` (not synchronize), `prioritise`, `analyse`, `organise`, `categorise`, `optimise`, `centre` (not center), `colour`, `programme`.
> - The application title is always **DC Command Centre**.

---

## 3. HubSpot Configuration & Ownership
- **Owner ID**: `75550922` (Ross Jermy).
- Always sync and display deals belonging to Ross.
- If a deal was historically assigned to another/archived user (e.g. Brian Bhatti `29820463`) but belongs to Ross (e.g. Stok.ly), ensure it is attributed/reassigned to Ross in HubSpot (`75550922`).
- HubSpot API queries filter out `closedlost` (`5030008022`) from active pipeline views.

---

## 4. Pipeline Stages & Board Structure
The board follows this exact 12-column sequence (left to right):
1. **New Lead** (`appointmentscheduled` / `5030008011`)
2. **Backburning** (`1638150379` / `5030008012` / `5536133318`) — 30-day review rhythm.
3. **Contact Made** (`qualifiedtobuy` / `5030008013`)
4. **Liberty J** (`liberty_j`) — Partner handoff stage; flags deals waiting $>7$ days for chase.
5. **No Response** (`1352329431` / `5030008014`)
6. **Meeting Booked** (`1209215206` / `5030008015`)
7. **Meeting Held** (`presentationscheduled` / `5030008016`)
8. **Upside** (`1465977055` / `5030008017`)
9. **Expected to Close** (`1965601015` / `5030008018`)
10. **Committed** (`decisionmakerboughtin` / `5030008019`)
11. **Contract Sent** (`contractsent` / `5030008020`)
12. **Closed Won** (`closedwon` / `5030008021`) — Celebratory green theme.

---

## 5. Closed Won Column Rules
- **Active Calendar Year Only**: The Closed Won column strictly displays deals closed between 1 January and 31 December of the current active year (`new Date().getFullYear()`).
- **Reverse Chronological Sort**: Deals in Closed Won are always ordered newest-to-oldest by close date (most recently won deal at the very top, descending back towards January).
- **Automatic Year Reset**: When 31 December turns into 1 January, the column automatically resets for the new year. Never delete or purge historical deals from HubSpot; the filter naturally excludes previous years.
- **Scope**: This filtering and ordering applies exclusively to the Closed Won column; other columns remain unaffected.

---

## 6. Daily Desk Command / Mission Control Surfacing Rules
- **Never Surface Active Closing Deals**: Deals in `Expected to Close`, `Upside`, `Committed`, or `Contract Sent` must **NEVER** appear on the Daily Desk Command / Mission Control action list. Ross is already actively working on closing these deals.
- **Never Surface Closed Won**: Won deals are celebrated in the Closed Won column and never surfaced on the daily action list.
- **Immediate Task Alerts**: Any deal with a task due **TODAY** or **OVERDUE** must immediately trigger a high-priority warning alert on the Daily Desk Command.
- **Clearing Deals**: Adding notes, logging calls/meetings, or updating tasks resets the inactivity timer (`lastContactedDate`) and clears the deal from the daily action list.
- **Backburning Review**: Deals in Backburning trigger a periodic check-in prompt once every 30 days (1 month cadence).

---

## 7. Tags & Quick Filters
- **Aligned Room**: Indicates an Aligned buyer room has been created for the prospect. Can be toggled directly from deal cards.
- **High Chance / Gold**: Highlights high-conviction, strategic opportunities in gold.
- **Liberty J Chase**: Visual badge for deals with Liberty J $>7$ days without partner updates.

---

## 8. Tech Stack & Architecture
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript (`strict: true`)
- **Styling**: Tailwind CSS, Lucide React icons
- **State & Data**: React hooks (`useMemo`, `useState`), REST API routes in `src/app/api/`
- **Integrations**: HubSpot CRM API, Fireflies AI, Aligned, Gemini / OpenAI

---

## 9. Development Commands
- `npm run dev`: Starts local Next.js development server (default: `http://localhost:3000`).
- `npm run build`: Type-checks and creates production build.
- `npx tsx --env-file=.env <script>`: Executes TypeScript scripts in Node using environment variables.
