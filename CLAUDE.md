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
- src/hooks.ts: TanStack Query hooks (useChildren, usePart, useAllowableStatuses, useUpdatePart).
  useChildren takes an enabled flag so children load only when a row is expanded.
  usePart caches parts for 5 minutes (staleTime).
  useUpdatePart refreshes the updated part and all allowable statuses on success.
- src/components/ConfigTree.tsx: the expandable tree. Exports SelectedNode
  ({ config, path }), passed to onSelect. path runs from the end unit to the
  selected config, inclusive.
- src/components/PartDetails.tsx: part details and status updates. Dropdown from
  allowable statuses (no type casts), Update button, "applies everywhere" note,
  success and error messages.
- src/App.tsx: holds the selected node and renders the tree and PartDetails side by side.
  PartDetails uses key={selected.config.uuid} so it resets when the selection changes.
- Components must use these hooks, not call fetch or api.ts directly

## To build
- Layout and usability polish: clear two-panel layout, breadcrumb for the selected path,
  readable styling for the details list, and a better experience for rows with no children

## Rules
- Make small, focused changes, one feature at a time
- Use TypeScript types for all API data
- Show loading and error states for every request
- Never commit secrets or .env files

## Working with me
- Keep code simple and readable over clever. I review and must be able to
  explain every change, so explain what you changed and why.
- Propose a plan before writing code for anything larger than a small change