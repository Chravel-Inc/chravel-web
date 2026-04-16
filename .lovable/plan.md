

## Objective
Remove invalid `.or('status.is.null,status.eq.active')` filters from all `trip_members` queries — the column doesn't exist, causing 400 errors.

## Changes

### 1. `src/services/tripService.ts` (2 occurrences)
- Line ~571: Remove `.or('status.is.null,status.eq.active')` from `getTripMembers`
- Line ~650: Remove `.or('status.is.null,status.eq.active')` from the second members query

### 2. `src/services/chatSearchService.ts` (1 occurrence)
- Line ~45: Remove `.or('status.is.null,status.eq.active')` from membership check

### 3. `src/services/paymentBalanceService.ts` (1 occurrence)  
- Line ~58: Remove `.or('status.is.null,status.eq.active')` from balance membership check

## Risk
**LOW** — removing a filter on a non-existent column. Currently these queries return 400 errors; after the fix they'll return actual data. No behavioral regression possible.

## User action required (terminal)
1. `git pull --rebase origin main` — sync Lovable's changes locally
2. Run the backfill script above — adds existing members to Stream channels
3. After both: reload the app, open the trip chat — messages should appear and sending should work

