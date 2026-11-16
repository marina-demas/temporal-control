# Temporal Control

A web app for field technicians to browse time machine configurations, view part details, and update part statuses within the allowed transitions.

Built with React, TypeScript, Vite, and TanStack Query.

## Running it

1. Install dependencies:
   ```
   npm install
   ```
2. Create a `.env` file in the project root (see `.env.example`):
   ```
   VITE_API_BASE_URL=<API URL ending in /prod/api>
   VITE_API_KEY=<your API key>
   ```
3. Start the dev server:
   ```
   npm run dev
   ```
4. Open http://localhost:5173

To check types and build for production, run `npm run build`. To lint, run `npm run lint`.

## Tests

`npm test` runs 13 Vitest tests across 4 files:

- **api.test.ts:** API errors become one ApiError type with the server's message and allowed statuses, network failures get a friendly message, and requests send the API key and the right PUT body.
- **PartDetails.test.tsx:** the dropdown only offers allowable statuses, "No status changes available" shows when locked, Update stays disabled until a new status is picked, and updating sends the lowercase status and shows a success message.
- **ConfigTree.test.tsx:** end units load sorted by serial, expanding a row shows its children, and rows without children have no expand arrow.
- **ErrorBoundary.test.tsx:** a component that crashes while rendering shows the fallback screen instead of a blank page.

The API is mocked and fake environment values are set in `vite.config.ts`, so tests never need a real `.env` or the live API.

## How it works

- The left panel is the configuration tree. The 20 time machines are listed by serial number. Expanding a row shows its components, each with its part number, name, and quantity.
- Selecting a row shows its details on the right: a breadcrumb path back to the time machine, the part's details, its current status, and status update controls.
- Breadcrumb items are clickable, so you can jump back up the tree in one click.
- If the connection drops, a banner explains the wait, rows show "Waiting for connection...", and Update is disabled until it returns. Loading resumes automatically.
- On narrower screens (900px or less, like a tablet in portrait), the panels stack.

## Approach and decisions

**Parts vs. configurations.** Status and unit belong to the part, not the configuration, and one part can appear in many configurations across many machines. So a status change applies everywhere that part is used, and the UI says so in a callout before the user updates.

**Data layer.** `api.ts` has one function per endpoint and turns every failure into a single ApiError type, including network failures. `hooks.ts` wraps those in TanStack Query hooks. Components only use the hooks, never fetch directly.

**Caching.** Parts are cached by uuid, so a part that appears in many rows is fetched once. All 20 time machines share one part, and the Network tab shows a single request for it. Parts are cached for 5 minutes since they rarely change, and an update refreshes them immediately.

**Status rules live in the backend.** The dropdown only offers what the allowable-statuses endpoint returns, and the UI hardcodes no status rules. Allowable statuses depend on a part's relationships, so after any update, all cached allowable statuses are refreshed rather than guessing which parts were affected.

**Rows without components.** The API doesn't say whether a configuration has children, so each visible row checks right away. That way rows with no components show no expand arrow instead of a dead end. The tradeoff is a few extra small requests, including 20 on first load.

**Offline.** TanStack Query pauses requests while offline instead of failing them, which at first made rows render blank. Loading checks now cover paused requests, and a banner explains the wait. Update is disabled while offline; an update already in flight when the signal drops is paused by TanStack and sent when the connection returns.

**Built for field technicians.** Plain language, a first-time hint, 44px click targets, visible keyboard focus, and status badges that always show the status word so meaning never depends on color alone.

**Crash safety.** A React error boundary wraps the app, so a rendering crash shows a "Something went wrong" screen with a reload button instead of a blank page.

## Known limitations

- If a parent row is collapsed after selecting something inside it, then a breadcrumb item inside that parent is clicked, the tree highlight is hidden. The details panel still shows the right part.
- The API key is in the browser bundle. In production, requests would go through a backend that holds the key.

## With more time

- **Search by serial or part number.** A technician standing at machine 00014 knows its serial. Search would jump straight to it instead of scrolling the tree.
- **Where-used view.** Before changing a part's status, show which machines use it. That needs an API endpoint the service doesn't have yet, since it only returns children.
- **Unit editing.** The API also supports updating a part's unit, but the mission focused on status. Unit is a free-text field with no defined list of valid values, and a typo would change the part everywhere it's used. I'd want to confirm the allowed units with the operations team before adding it.
- **Shareable links.** Store the selected path in the URL. The API only returns children, not parents, so the URL would need the full path of configuration uuids for the app to expand the tree to the right spot.
- **Auto-expand the selected path** in the tree, which would fix the known limitation above.
- **A hasChildren field** in the API's children response, which would remove the extra requests for rows without components.
- **Generated types.** Generate the TypeScript types from the Swagger spec instead of writing them by hand.
- **End-to-end tests.** Playwright tests in a real browser for what unit tests can't cover: the full select and update flow against a test API, real layout (panels stacking on a tablet), keyboard navigation with focus outlines, and offline behavior using Playwright's offline mode.
- **Prettier with a pre-commit hook.** Automatic formatting on every commit, so style stays consistent without anyone thinking about it.
- **CI.** A GitHub Actions workflow that runs lint, tests, and the build on every pull request.
- **Mock Service Worker.** Mock the API at the network level, so tests and local development can run against realistic responses without the live service.
- **Error tracking.** The app has a React error boundary with a fallback screen. With more time, I'd connect it to a service like Sentry or Airbrake, so a crash on a technician's tablet in the field gets reported instead of silently failing.

## How I used AI

I used Claude to help plan the approach and build the data layer (types, API client, hooks), and Claude Code with the provided key to build the UI and tests. I reviewed and approved every edit.

How I worked with Claude Code:
- `CLAUDE.md` described the API, the data model, and my working rules, and I updated it after each step.
- I blocked Claude Code from reading `.env`, so API keys never entered the AI context.
- For each feature, I asked for a plan first, approved or changed it, then had Claude stop after each step so I could test and commit.
- I reviewed every change. Some things I caught or decided: a dropdown edge case where the current status wasn't an allowed option (a real bug), removing a type cast, button styles that hid the selection highlight, click targets that measured 32px instead of the planned 44px, an offline bug found by testing in dev tools, skipping a larger change (auto-expanding hidden rows) in favor of noting it as a limitation, and rejecting a review finding about stale cached status after verifying the shared cache live.
- I rejected shell commands that would have edited files without reviewable diffs, and added a rule for it to `CLAUDE.md`.
- Claude also caught my mistakes, like a staleTime typo.

Total Claude Code spend: about $3.28 of the $20 budget.