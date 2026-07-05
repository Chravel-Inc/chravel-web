## Verification: Concierge multi-language

Confirmed in code + project memory (`features/ai-concierge/multilingual-behavior`):
- `src/features/concierge/hooks/useConciergeLanguagePreference.ts` defaults to `'auto'`, which instructs Concierge to reply in the language of the user's most recent message.
- Users can also force a specific language via the Concierge Language Picker.
- Behavior is wired for both text and voice modes.

So "Multi-language support" is truthful to keep as a Growth Pro bullet (even though the underlying capability is universal).

## Copy changes — `src/pages/ForTeams.tsx`

Growth Pro card (lines ~330-338):
- Remove the "Analytics dashboard" `<li>` entirely.
- Leave "Advanced integrations" as-is (no "coming soon" / future language, per your Apple-review caution).
- Keep "Multi-language support".

Enterprise card (lines ~386-394):
- Remove the "SLA guarantees" `<li>` entirely.

No other files touched. No logic, styling, or business-rule changes.

## Out of scope
- `UpgradeModal.tsx` still references "enterprise-grade SLA guarantees" in prose. Not in the 14th (Choose Your Plan) section you flagged. Say the word if you want that scrubbed too.
