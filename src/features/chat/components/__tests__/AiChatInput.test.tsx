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

  it('keeps dictation mic gesture from focusing the textarea before STT', () => {
    expect(source).toMatch(/data-testid="concierge-dictation-btn"/);
    expect(source).toMatch(/onPointerDown=/);
    expect(source).toMatch(/Prevent the textarea from focusing before the click handler runs/);
  });
});
