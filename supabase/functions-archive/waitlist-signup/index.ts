// ARCHIVED 2026-08-05: live-deployed function with no repo source, captured before undeployment. Do not deploy.
// Early access waitlist signup handler.
//
// Stores the submitted email in the `waitlist` table and notifies the team
// at CA@saintmarlolabs.com via Resend.
//
// Required secrets (set with `supabase secrets set ...`):
//   RESEND_API_KEY     - Resend API key for sending the notification email.
// Optional secrets:
//   WAITLIST_NOTIFY_TO - recipient for signup notifications
//                        (defaults to CA@saintmarlolabs.com).
//   WAITLIST_FROM      - verified Resend "from" address
//                        (defaults to "Broadcast Ntwrk <onboarding@resend.dev>").
//
// SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are injected automatically.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const NOTIFY_TO = Deno.env.get('WAITLIST_NOTIFY_TO') ?? 'CA@saintmarlolabs.com';
const FROM = Deno.env.get('WAITLIST_FROM') ?? 'Broadcast Ntwrk <onboarding@resend.dev>';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

Deno.serve(async req => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405);
  }

  let email = '';
  let source = 'landing';
  try {
    const body = await req.json();
    email = String(body?.email ?? '')
      .trim()
      .toLowerCase();
    if (body?.source) source = String(body.source);
  } catch {
    return json({ error: 'Invalid request body' }, 400);
  }

  if (!EMAIL_RE.test(email)) {
    return json({ error: 'Please enter a valid email.' }, 400);
  }

  // Persist the signup. Duplicate emails are not an error.
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );
  const { error: dbError } = await supabase
    .from('waitlist')
    .upsert({ email, source }, { onConflict: 'email', ignoreDuplicates: true });

  if (dbError) {
    console.error('waitlist insert failed:', dbError.message);
    return json({ error: 'Could not save your spot. Try again.' }, 500);
  }

  // Notify the team. A missing/failed email must not fail the signup.
  const resendKey = Deno.env.get('RESEND_API_KEY');
  if (resendKey) {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: FROM,
          to: [NOTIFY_TO],
          reply_to: email,
          subject: `New early access signup: ${email}`,
          text:
            `A new person joined the Broadcast Ntwrk early access list.\n\n` +
            `Email: ${email}\nSource: ${source}\nWhen: ${new Date().toISOString()}`,
        }),
      });
      if (!res.ok) {
        console.error('resend send failed:', res.status, await res.text());
      }
    } catch (err) {
      console.error('resend send threw:', err);
    }
  } else {
    console.warn('RESEND_API_KEY not set — skipping notification email.');
  }

  return json({ ok: true });
});
