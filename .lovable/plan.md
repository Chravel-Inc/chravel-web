

## Fix: Drag-and-Drop Not Working in Calendar Import Modal

### Root Cause

The Radix UI `DialogOverlay` is a `fixed inset-0` element that covers the entire viewport. When you drag a file from your desktop into the browser, the drag events first hit the overlay. The overlay has no drag handlers and default browser behavior takes over — the file either gets opened by the browser or the drag is silently consumed.

The `react-dropzone` hook's `preventDropOnDocument: true` option adds document-level handlers that call `preventDefault` on stray drops, but the Radix portal rendering can interfere with event propagation between the overlay and the dropzone inside the dialog content.

Additionally, the Radix `DialogContent` component has internal focus-trapping and pointer-event management that can intercept native drag events before they reach the dropzone div.

### Fix

**File: `src/components/ui/dialog.tsx`** (1 change)

Add `pointer-events: none` to the `DialogOverlay` so drag events pass through it to the content underneath. The overlay still blocks clicks (Radix handles dismissal via its own `onPointerDownOutside` mechanism on the content, not via overlay click handlers).

**File: `src/features/calendar/components/CalendarImportModal.tsx`** (1 change)

Add explicit `onDragOver` with `preventDefault` on the `DialogContent` element as a safety net. This ensures the browser doesn't intercept drag events at the dialog level before they reach the nested dropzone div. Pass it via the `className` or `onDragOver` prop.

Specifically:
- On the `<DialogContent>` element, add `onDragOver={(e) => e.preventDefault()}` to allow drops inside
- This is the standard fix for "drop not working inside modals" — the browser's default `dragover` behavior is to reject drops unless `preventDefault` is called

**File: `src/hooks/useSmartImportDropzone.ts`** (no changes needed)

The hook configuration is correct. The issue is entirely in the DOM layer above it.

### Why This Is Safe

- `pointer-events: none` on the overlay only affects mouse/touch/drag events — Radix Dialog dismissal uses `onPointerDownOutside` on the Content component, not overlay click detection
- The `onDragOver` preventDefault on DialogContent is a no-op for non-drag interactions
- All three import modals (Calendar, Agenda, Lineup) share this `DialogContent` and `useSmartImportDropzone`, so the fix applies to all of them automatically

### Verification

- Drag a PDF from desktop into the import modal dropzone — should show "Drop your file here..." feedback and process the file on drop
- Verify "Choose File" click still works
- Verify URL import still works
- Verify clicking outside the dialog still closes it
- Verify the same fix works on the Agenda and Lineup import modals

