// ARCHIVED 2026-08-05: live-deployed function with no repo source, captured before undeployment. Do not deploy.
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Authorization,Content-Type',
};

console.info('cors module loaded');
