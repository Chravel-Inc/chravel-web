# 🧭 CHRAVEL ENGINEERING MANIFESTO
> **For Lovable AI** - Read this file for all coding standards
> **Full Documentation:** See ../CLAUDE.md for complete details
> **Non-negotiable:** Every edit must pass `npm run lint && npm run typecheck && npm run build` before commit

---

## ⚠️ CRITICAL: READ CLAUDE.md FOR FULL STANDARDS

This file provides quick reference for Lovable. **Always consult ../CLAUDE.md** for:
- Complete React patterns with examples
- Supabase integration rules and patterns
- Google Maps implementation patterns
- Error prevention strategies
- Full working code examples
- **Branching, sync & feature rollouts** → `../docs/BRANCHING_AND_ROLLOUTS.md`

---

## 🌿 BRANCHING & SYNC AWARENESS (Lovable-specific)

- Your changes commit to **`main`**, which **auto-deploys to production** — every edit is live. There is no staging environment.
- Write **idempotent** migrations (`CREATE ... IF NOT EXISTS`, `CREATE OR REPLACE`, `DROP ... IF EXISTS`, `ON CONFLICT`) — the single prod DB is shared, so a migration is global and immediate.
- Coding agents (Claude Code / Cursor / Codex) also work on this repo via short-lived branches and gate risky features behind `useFeatureFlag(...)`. Don't rip out flag checks or unfinished flagged code you don't recognize — it may be intentionally hidden until release.
- Migration filenames matter: Lovable = `YYYYMMDDHHMMSS-<uuid>.sql`; agents = `YYYYMMDDHHMMSS_slug.sql`. Automation depends on this split — see `../docs/MIGRATION_SYNC.md`.
- Full guide: **`../docs/BRANCHING_AND_ROLLOUTS.md`** · ../CLAUDE.md § Branching & Release Workflow.

---

## ⚙️ GLOBAL PRINCIPLES

### 1. Zero Syntax Errors
- Every `{}`, `()`, `[]`, and JSX tag must close cleanly
- Before returning code, mentally simulate: `npm run build`
- If uncertain about bracket balance → simplify the structure

### 2. TypeScript Strict Mode
- `"strict": true` in `tsconfig.json` enforced
- All function parameters and return types explicitly typed
- No `any` types unless interfacing with untyped third-party libs (comment why)

### 3. Vite/React Production Environment
- Code must compile in fresh Node 18+ environment
- No experimental syntax (e.g., decorators, stage-3 proposals)
- Test locally with `npm run dev` before pushing

### 4. Readability > Cleverness
- Explicit variable names: `userTrips` not `ut`
- Separate concerns: one function = one responsibility
- Comment complex logic (especially map calculations, state transitions)

---

## 🧠 REACT PATTERNS (Quick Reference)

### Component Structure
```tsx
// ✅ GOOD: Hooks first, handlers next, return last
export function TripCard({ trip }: { trip: Trip }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const router = useNavigate();

  const handleExpand = useCallback(() => {
    setIsExpanded(prev => !prev);
  }, []);

  return <div>{/* JSX */}</div>;
}
```

### Critical Rules
- ✅ Always type `useState`: `useState<Trip[]>([])`
- ✅ Always cleanup in `useEffect` returns
- ✅ Memoize handlers with `useCallback`
- ✅ Guard against null/undefined
- ❌ Never use hooks inside conditionals
- ❌ Never create duplicate state for derived values

---

## 🗄️ SUPABASE INTEGRATION

### Rules
1. **Never** call Supabase directly in JSX
2. **Always** go through `/src/integrations/supabase/client.ts`
3. **Handle** errors explicitly (don't ignore them)
4. **Type** all queries using generated Database types

### Standard Pattern
```tsx
const { data: trips, error } = await supabase
  .from('trips')
  .select('*')
  .eq('creator_id', userId);

if (error) {
  console.error('Failed to fetch trips:', error);
  setError(error.message);
  return;
}

setTrips(trips ?? []);
```

---

## 🗺️ GOOGLE MAPS RULES

### Critical Requirements
1. **One map instance per page** — use props/context for mode changes
2. **Always null-check** `mapRef.current` before any operation
3. **Debounce** high-frequency events (drag, zoom, bounds_changed)
4. **Clean up** event listeners in `useEffect` return
5. **Type all coordinates** as `{ lat: number; lng: number }`

### Example
```tsx
const mapRef = useRef<google.maps.Map | null>(null);

// Always check before using
if (mapRef.current) {
  mapRef.current.setCenter({ lat, lng });
}
```

See **CLAUDE.md** for complete map patterns and examples.

---

## 🧰 VALIDATION REQUIREMENTS

### Before Every Commit
```bash
npm run lint        # Auto-fix ESLint errors
npm run typecheck   # Validate TypeScript
npm run build       # Test production build
```

### Common Errors to Prevent
- ❌ Unclosed brackets/braces
- ❌ Missing return statements
- ❌ Untyped state variables
- ❌ Ignored error objects
- ❌ No cleanup in useEffect

---

## 🤖 LOVABLE AI SPECIFIC GUIDELINES

### When Generating Code
1. **Always validate syntax** - Would `npm run build` pass?
2. **Preserve existing patterns** - Don't break working code
3. **Add helpful comments** - Especially for complex logic
4. **Use stable APIs only** - No experimental features
5. **Follow project structure** - Check existing files first

### Prohibited Actions
1. ❌ Outputting partial/broken code
2. ❌ Using experimental TypeScript features
3. ❌ Creating duplicate implementations
4. ❌ Ignoring error handling
5. ❌ Leaving debug console.logs

---

## ✅ FINAL RULE

> **"If it doesn't build, it doesn't ship."**

Every change must:
1. Pass `npm run lint && npm run typecheck && npm run build`
2. Have clean syntax (balanced brackets, proper JSX)
3. Have explicit types (no undocumented `any`)
4. Follow patterns in **../CLAUDE.md**
5. Be ready for Vercel deployment

---

## 📚 PROJECT STRUCTURE

### Key Directories
- `/src/components/` — Reusable React components
- `/src/pages/` — Route pages
- `/src/integrations/supabase/` — Database client and types
- `/src/lib/` — Utility functions
- `/src/hooks/` — Custom React hooks
- `/src/types/` — TypeScript type definitions

### Quick Commands
```bash
npm run dev          # Start dev server
npm run lint         # Lint and auto-fix
npm run typecheck    # TypeScript validation
npm run build        # Production build
npm run validate     # Run all checks
npm run preview      # Preview production build
```

---

## 🔗 Related Documentation

- **../CLAUDE.md** — Complete engineering manifesto (READ THIS!)
- **../AI_GUIDELINES.md** — Quick reference for all AIs
- **../.cursorrules** — Cursor AI instructions (same standards)

---

**📖 For complete patterns and detailed examples: Always read ../CLAUDE.md**
**Last Updated:** 2025-10-31
**Maintained By:** AI Engineering Team + Meech
