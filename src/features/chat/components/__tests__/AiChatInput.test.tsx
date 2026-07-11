/**
 * Lean AiChatInput regressions — source contracts only.
 * Full component mounts that pull chat/media helpers can hang Vitest workers
 * in constrained cloud agents; behavior is covered by AIConciergeChat.controls.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, it, expect } from 'vitest';

describe('AiChatInput composer contracts', () => {
  const source = readFileSync(resolve(__dirname, '../AiChatInput.tsx'), 'utf8');

  it('shows Ask-anything placeholder so the textarea is not a blank dead region', () => {
    expect(source).toMatch(/Ask anything about this trip/);
  });

  it('exposes an explicit Send disabled state with aria-disabled + test id', () => {
    expect(source).toMatch(/concierge-send-btn/);
    expect(source).toMatch(/aria-disabled=\{sendDisabled\}/);
    expect(source).toMatch(/const sendDisabled = !canSend \|\| isTyping \|\| disabled/);
  });

  it('does not render a duplicate in-field dictation mic (waveform owns dictation)', () => {
    expect(source).not.toMatch(/data-testid="concierge-dictation-btn"/);
    expect(source).not.toMatch(/from 'lucide-react'.*Mic|,\s*Mic\s*[,}]/);
    expect(source).toMatch(/no in-field mic/i);
  });
});
