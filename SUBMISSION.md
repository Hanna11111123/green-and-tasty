# Homework Frontend #6 — Owner group pre-order screen

**Author:** Hanna Demchyk
**Levels done:** practice, level 1 (layout), level 2 (logic on the mock backend)
**Not done:** level 3 (real API + 15 s sync) and the Remove Guest bonus.

Open: `http://localhost:4200/reservations/demo-reservation/group-order?demo`

## What was done
- **Practice / level 1:** `ParticipantCardComponent` (title, status as text, dishes with 40×40 photo or initial, Subtotal) and `GroupOrderPageComponent` (header with address, date, time, "N of M guests", Grand Total). Route `/reservations/:reservationId/group-order`. Semantic markup (`<main>`, one `<h1>`, `<ul>/<li>`, `<article>`), colors from `abstracts/colors`, works at 375 px.
- **Level 2:** `GroupOrdersService` (invite, sessions, owner session id, status, submit). The page reads `reservationId` from the URL, state is in `signal()`, derived values in `computed()`. Own card is "My Pre-Order". "Consolidated pre-order" block uses `consolidatePreOrder()`; Grand Total counts only submitted carts ($50.50 in the demo, not the API total). Yellow warning for participants who haven't submitted. Status badge (Collecting pre-orders / Sent to Restaurant). States: loading, error with "Try again", "Group reservation not found", empty. Submit Pre-Order opens `<app-modal>`; the request goes once even on a double click; after success a toast, the badge changes and the screen becomes read-only.

## Checks
- `npx tsc -p tsconfig.app.json --noEmit` — OK
- `npx tsc -p tsconfig.spec.json --noEmit` — OK
- `BACKEND_URL=https://example.com npm run build` — OK, bundle check passed
- `npm run test:hw` — all tests green (practice, level 1, level 2)

## Screenshots
See `screenshots/` (review screen, confirm dialog, sent state).

## AI usage
I used Claude Code as an assistant. It wrote most of the code and I checked the result: ran the tests, opened the page in the browser, went through the Submit flow, and compared the layout with `homework-design/01-owner-review.png`.
