## What the circled button is

It's the **voice-note transcription toggle** (Captions icon) in `src/features/chat/components/ChatInput.tsx` (lines 581–600). It flips `voiceTranscriptionEnabled`, which controls whether recorded voice notes get auto-transcribed. It doesn't do anything visible on tap, which is why it feels broken.

## Change

1. **Remove** the Captions button from the composer row so the right side has only the mic/send button (matching the left-side `+`).
2. **Relocate** the toggle into the `+` dropdown menu as a new item labeled "Transcribe voice notes" with a check indicator when enabled — keeps the functionality accessible without cluttering the composer.

## Files

- `src/features/chat/components/ChatInput.tsx`
  - Delete the Captions `<button>` block (lines 581–600).
  - Add a `DropdownMenuCheckboxItem` (or plain `DropdownMenuItem` with a check) inside the existing `+` dropdown, bound to `voiceTranscriptionEnabled` / `setVoiceTranscriptionEnabled`.

## Result

Composer row: `[ + ]  [ textarea ]  [ 🎤 / ➤ ]` — exactly as requested. Transcription preference lives in the `+` menu.