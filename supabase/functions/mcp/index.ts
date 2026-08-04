// Hand-owned as of 2026-08-04. THIS FILE IS NOW THE SINGLE SOURCE for the `mcp` edge function.
//
// It used to be generated from src/lib/mcp/{index,tools/echo}.ts by `mcpPlugin()` in vite.config.ts.
// The plugin's banner claims that deleting it makes the plugin "leave the file alone" — it does not.
// writeIfChanged() THROWS on a user-authored file ("refusing to overwrite user-authored file"),
// which fails `npm run build` outright. So the plugin was removed from vite.config.ts and the
// generator sources were deleted, rather than leaving two copies to drift silently. To hand control
// back, restore mcpPlugin() and let it regenerate this file — but see the size problem below first.
//
// WHY THIS FILE IS HAND-OWNED — the `npm:` specifiers made this function undeployable.
//
// `supabase functions deploy` bundles an `npm:` specifier by vendoring the package's entire
// dependency tarball closure, not just the modules actually imported. @lovable.dev/mcp-js depends
// on `esbuild`, which ships prebuilt platform binaries, so the deployed artifact weighed ~25 MB and
// the platform rejected it:
//
//     Deploying Function: mcp (script size: 25 MB)
//     unexpected update function status 413: {"message":"request entity too large"}
//
// Because the deploy step ran every function in ONE command, and functions deploy alphabetically,
// that single 413 aborted the run at `mcp` and the 42 functions sorting after it — every stream-*,
// stripe-webhook, revenuecat-webhook, send-email-with-retry, push-notifications, web-push-send —
// silently never deployed. Every CI run from 2026-07-30 onward failed this way.
//
// `esbuild` is a BUILD-time dependency of the Vite plugin, not a runtime one. Tracing the module
// graph of the two entrypoints used below reaches only `jose` and `@modelcontextprotocol/sdk`;
// esbuild is reachable only from `stacks/supabase/vite` and `cli/extract-manifest`, neither of which
// runs here. Upgrading does not help — every published version through 0.26.1 pins esbuild as a
// hard dependency.
//
// esm.sh serves a bundled ESM build that resolves only the real import graph, so it ships the
// handler without esbuild's binaries. The rest of this repo's edge functions already import through
// esm.sh, so it is known-reachable from the Supabase build environment.
//
// zod is pinned to one exact version and threaded through `?deps=` so esm.sh reuses that same build
// inside mcp-js. Two zod instances would break defineTool's schema handling, which relies on
// instanceof checks against the zod classes.

import { auth, defineMcp, defineTool } from 'https://esm.sh/@lovable.dev/mcp-js@0.20.0?deps=zod@4.4.3';
import { createSupabaseHandler } from 'https://esm.sh/@lovable.dev/mcp-js@0.20.0/stacks/supabase?deps=zod@4.4.3';
import { z } from 'https://esm.sh/zod@4.4.3';

// src/lib/mcp/tools/echo.ts
const echoTool = defineTool({
  name: 'echo',
  title: 'Echo',
  description: 'Echo the input text back to the caller. Useful for verifying MCP connectivity.',
  inputSchema: {
    text: z.string().min(1).describe('Text to echo back.'),
  },
  annotations: {
    readOnlyHint: true,
    idempotentHint: true,
    openWorldHint: false,
  },
  handler: ({ text }: { text: string }) => ({
    content: [{ type: 'text', text }],
  }),
});

// src/lib/mcp/index.ts
const projectRef = 'jmjiyekmxwsxkfnqwyaa';

const mcpDefinition = defineMcp({
  name: 'chravel-mcp',
  title: 'Chravel MCP',
  version: '0.1.0',
  instructions:
    'Chravel agent integrations. Use `echo` to verify connectivity. Additional trip-aware tools will be added over time. Callers authenticate as a Chravel user via Supabase OAuth; tools act as that user.',
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: 'authenticated',
  }),
  tools: [echoTool],
});

Deno.serve(createSupabaseHandler(mcpDefinition, { functionName: 'mcp' }));
