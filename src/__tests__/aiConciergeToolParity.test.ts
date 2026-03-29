import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import {
  ALL_TOOL_DECLARATIONS,
  type ToolDeclaration,
} from '../../supabase/functions/_shared/concierge/toolRegistry.ts';
import { VOICE_FUNCTION_DECLARATIONS } from '../../supabase/functions/_shared/voiceToolDeclarations.ts';

const repoRoot = path.resolve(__dirname, '../..');

function readRepoFile(relativePath: string): string {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

function parseQuotedNames(source: string, pattern: RegExp): Set<string> {
  const names = new Set<string>();
  for (const match of source.matchAll(pattern)) {
    const name = match[1];
    if (name) names.add(name);
  }
  return names;
}

interface ToolSchema {
  params: string[];
  required: string[];
}

function parseToolSchema(tool: ToolDeclaration): ToolSchema {
  return {
    params: Object.keys(tool.parameters.properties || {}),
    required: tool.parameters.required || [],
  };
}

function parseAllToolSchemas(tools: ToolDeclaration[]): Map<string, ToolSchema> {
  const schemas = new Map<string, ToolSchema>();
  for (const tool of tools) {
    schemas.set(tool.name, parseToolSchema(tool));
  }
  return schemas;
}

// Mutation tools that must have idempotency_key in both voice and text declarations
const MUTATION_TOOLS = [
  'addToCalendar',
  'createTask',
  'createPoll',
  'savePlace',
  'setBasecamp',
  'addToAgenda',
  'createBroadcast',
  'createNotification',
  'updateCalendarEvent',
  'deleteCalendarEvent',
  'updateTask',
  'deleteTask',
  'settleExpense',
  'generateTripImage',
  'setTripHeaderImage',
  'emitSmartImportPreview',
  'emitReservationDraft',
];

describe('AI concierge tool parity', () => {
  const textDeclarations = ALL_TOOL_DECLARATIONS;
  const voiceDeclarations = VOICE_FUNCTION_DECLARATIONS;

  it('keeps voice declarations aligned with text declarations', () => {
    const textTools = new Set(textDeclarations.map(tool => tool.name));
    const voiceTools = new Set(voiceDeclarations.map(tool => tool.name));

    expect(voiceTools).toEqual(textTools);
  });

  it('keeps shared executor coverage aligned with text declarations', () => {
    const executorSource = readRepoFile('supabase/functions/_shared/functionExecutor.ts');

    const textTools = new Set(textDeclarations.map(tool => tool.name));
    const executorTools = parseQuotedNames(executorSource, /case\s+'([^']+)'/g);

    expect(executorTools).toEqual(textTools);
  });

  it('parameter names match between voice and text declarations (excluding idempotency_key)', () => {
    const textSchemas = parseAllToolSchemas(textDeclarations);
    const voiceSchemas = parseAllToolSchemas(voiceDeclarations);

    const mismatches: string[] = [];

    for (const [toolName, textSchema] of textSchemas) {
      const voiceSchema = voiceSchemas.get(toolName);
      if (!voiceSchema) continue; // tool name parity is covered by the first test

      const textParams = new Set(textSchema.params.filter(p => p !== 'idempotency_key'));
      const voiceParams = new Set(voiceSchema.params.filter(p => p !== 'idempotency_key'));

      const onlyInText = [...textParams].filter(p => !voiceParams.has(p));
      const onlyInVoice = [...voiceParams].filter(p => !textParams.has(p));

      if (onlyInText.length > 0 || onlyInVoice.length > 0) {
        const parts: string[] = [`${toolName}:`];
        if (onlyInText.length > 0) parts.push(`only in text=[${onlyInText.join(', ')}]`);
        if (onlyInVoice.length > 0) parts.push(`only in voice=[${onlyInVoice.join(', ')}]`);
        mismatches.push(parts.join(' '));
      }
    }

    expect(mismatches).toEqual([]);
  });

  it('required fields match between voice and text declarations (excluding idempotency_key)', () => {
    const textSchemas = parseAllToolSchemas(textDeclarations);
    const voiceSchemas = parseAllToolSchemas(voiceDeclarations);

    const mismatches: string[] = [];

    for (const [toolName, textSchema] of textSchemas) {
      const voiceSchema = voiceSchemas.get(toolName);
      if (!voiceSchema) continue;

      const textRequired = new Set(textSchema.required.filter(r => r !== 'idempotency_key'));
      const voiceRequired = new Set(voiceSchema.required.filter(r => r !== 'idempotency_key'));

      const onlyInText = [...textRequired].filter(r => !voiceRequired.has(r));
      const onlyInVoice = [...voiceRequired].filter(r => !textRequired.has(r));

      if (onlyInText.length > 0 || onlyInVoice.length > 0) {
        const parts: string[] = [`${toolName}:`];
        if (onlyInText.length > 0) parts.push(`only in text=[${onlyInText.join(', ')}]`);
        if (onlyInVoice.length > 0) parts.push(`only in voice=[${onlyInVoice.join(', ')}]`);
        mismatches.push(parts.join(' '));
      }
    }

    expect(mismatches).toEqual([]);
  });

  it('mutation tools have idempotency_key in both voice and text declarations', () => {
    const textSchemas = parseAllToolSchemas(textDeclarations);
    const voiceSchemas = parseAllToolSchemas(voiceDeclarations);

    const missing: string[] = [];

    for (const toolName of MUTATION_TOOLS) {
      const textSchema = textSchemas.get(toolName);
      const voiceSchema = voiceSchemas.get(toolName);

      if (textSchema && !textSchema.params.includes('idempotency_key')) {
        missing.push(`${toolName}: missing idempotency_key in text`);
      }
      if (voiceSchema && !voiceSchema.params.includes('idempotency_key')) {
        missing.push(`${toolName}: missing idempotency_key in voice`);
      }
    }

    expect(missing).toEqual([]);
  });
});
