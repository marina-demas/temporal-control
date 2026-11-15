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
- PUT /parts/{uuid} updates unit and/or status; invalid changes return an error
  with the allowed statuses
- Failed requests throw an ApiError: { error: string, allowableStatuses?: PartStatus[] }

## Data model notes
- Status and unit belong to the part, not the configuration
- One part can appear in many configurations, so a status change affects every place
  that part is used. The UI should tell the user this before or when they change it.

## Already built (use these, do not rewrite)
- src/types.ts: TypeScript types for API data
- src/api.ts: one function per endpoint (getChildren, getPart, getAllowableStatuses, updatePart)
- src/hooks.ts: TanStack Query hooks (useChildren, usePart, useAllowableStatuses, useUpdatePart).
  useChildren takes an enabled flag so children load only when a row is expanded.
  useUpdatePart refreshes the part and its allowable statuses on success.
- Components must use these hooks, not call fetch or api.ts directly

## To build
- src/components/ConfigTree.tsx: the expandable configuration tree
- src/components/PartDetails.tsx: part details and status updates
- src/App.tsx: two-panel layout (tree on the left, details on the right)

## Rules
- Make small, focused changes, one feature at a time
- Use TypeScript types for all API data
- Show loading and error states for every request
- Never commit secrets or .env files

## Working with me
- Keep code simple and readable over clever. I review and must be able to
  explain every change, so explain what you changed and why.
- Propose a plan before writing code for anything larger than a small change