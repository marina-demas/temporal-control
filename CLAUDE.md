# Temporal Control Interface

Frontend for browsing time machine configurations and managing parts.
Users are field technicians with minimal training, so the UI must be simple and clear.

## Stack
React, TypeScript, Vite, TanStack Query. No UI component library.
Do not add new dependencies without asking first.

## API
- Base URL and key come from .env (VITE_API_BASE_URL, VITE_API_KEY)
- Every request sends the key in the "x-api-key" header
- GET /configs/children with no parentUuid returns the 20 end units (serials 00001 to 00020),
  all built from the same part (TM-1000 Time Machine)
- GET /configs/children?parentUuid={uuid} returns a configuration's children
- Children only include uuid, partUuid, quantity, and endUnitSerialNo (null below the top level),
  so each row must fetch its part with GET /parts/{partUuid}
- GET /parts/{uuid}/allowable-statuses may return only the current status,
  meaning no changes are allowed
- PUT /parts/{uuid} updates unit and/or status and returns the updated part; invalid changes
  return an error with the allowed statuses
- Failed requests throw an ApiError (a class extending Error, in types.ts). Show error.message
  to the user; allowableStatuses is set on invalid status changes.

## Data model notes
- Status and unit belong to the part, not the configuration
- One part can appear in many configurations, so a status change affects every place
  that part is used. The UI should tell the user this before or when they change it.
- Allowable statuses depend on a part's relationships, so display Part.status as the
  current status and use allowable statuses only for the dropdown options.

## Already built (use these, do not rewrite)
- src/types.ts: TypeScript types for API data, including the ApiError class
- src/api.ts: one function per endpoint (getChildren, getPart, getAllowableStatuses, updatePart).
  Checks env vars at startup and wraps network failures in an ApiError.
- src/hooks.ts: TanStack Query hooks (useChildren, usePart, useAllowableStatuses, useUpdatePart,
  useOnlineStatus). usePart caches parts for 5 minutes (staleTime).
  useUpdatePart refreshes the updated part and all allowable statuses on success.
  useOnlineStatus reads TanStack's onlineManager, so it matches when queries pause.
- src/components/ConfigTree.tsx: the expandable tree. Exports SelectedNode
  ({ config, path }). Takes selectedUuid and onSelect from App. Each visible row
  fetches its children right away, so rows with no children show no toggle.
- src/components/Breadcrumb.tsx: the path to the selected part. Ancestors are
  buttons that select that item; the last item is plain text.
- src/components/PartDetails.tsx: breadcrumb, details grid, status badge, and status
  updates. Dropdown from allowable statuses (no type casts), Update button,
  "applies everywhere" callout, success and error messages.
- src/App.tsx: owns the selected node and passes it to ConfigTree and PartDetails.
  PartDetails uses key={selected.config.uuid} so it resets when the selection changes.
- src/App.css and src/index.css: plain CSS, light mode only, 44px click targets,
  visible keyboard focus
- Offline: loading checks use isPending (not isLoading) so paused queries show
  "Waiting for connection..." instead of rendering blank. App shows an offline banner,
  and the Update button is disabled while offline.
- Tests (npm test): Vitest and Testing Library. api.test.ts covers error handling and requests
  with a mocked fetch; PartDetails and ConfigTree tests mock api.ts so the real hooks still run.
  vite.config.ts provides fake env values so tests never need a real .env.
- src/components/ErrorBoundary.tsx: class component wrapped around the whole app in main.tsx.
  Shows "Something went wrong" and a reload button if rendering crashes. componentDidCatch
  has a comment where an error tracking service (Sentry, Airbrake) would be called.
  One test covers the fallback.
- Components must use these hooks, not call fetch or api.ts directly

## To build
Nothing planned right now.

## Known limitations
- If a parent row is collapsed after selecting something inside it, then a breadcrumb
  item inside that parent is clicked, the tree highlight is hidden. The details panel
  still shows the right part.

## Rules
- Make small, focused changes, one feature at a time
- Use TypeScript types for all API data
- Show loading and error states for every request
- Never commit secrets or .env files
- Create and change files with normal edits, not shell commands like sed or cat >, so every change can be reviewed as a diff

## Working with me
- Keep code simple and readable over clever. I review and must be able to
  explain every change, so explain what you changed and why.
- Propose a plan before writing code for anything larger than a small change