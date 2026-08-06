// ARCHIVED 2026-08-05: live-deployed function with no repo source, captured before undeployment. Do not deploy.
const AI_IMAGES_ENABLED = Deno.env.get('AI_IMAGES_ENABLED') === 'true';
const GOOGLE_API_KEY = Deno.env.get('GOOGLE_CUSTOM_SEARCH_API_KEY');
const GOOGLE_CSE_ID = Deno.env.get('GOOGLE_CUSTOM_SEARCH_ENGINE_ID');

console.info({
  AI_IMAGES_ENABLED,
  hasGoogleKey: Boolean(GOOGLE_API_KEY),
  hasCseId: Boolean(GOOGLE_CSE_ID),
});

Deno.serve(async req => {
  const body = {
    AI_IMAGES_ENABLED,
    hasGoogleKey: Boolean(GOOGLE_API_KEY),
    hasCseId: Boolean(GOOGLE_CSE_ID),
  };

  return new Response(JSON.stringify(body), {
    headers: { 'Content-Type': 'application/json', Connection: 'keep-alive' },
  });
});
