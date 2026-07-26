import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { execFileSync } from 'child_process';

/**
 * Drives the real script against a throwaway migrations directory so the regex behaviour is
 * exercised end to end, including its exit code — that is what CI depends on.
 */
const SCRIPT = path.resolve(__dirname, '../check-rls-coverage.ts');

let workdir: string;

function migrationsDir(): string {
  return path.join(workdir, 'supabase', 'migrations');
}

function writeMigration(name: string, sql: string): void {
  fs.writeFileSync(path.join(migrationsDir(), name), sql);
}

function run(): { status: number; output: string } {
  try {
    const output = execFileSync('npx', ['tsx', SCRIPT], {
      cwd: workdir,
      encoding: 'utf-8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    return { status: 0, output };
  } catch (error) {
    const err = error as { status?: number; stdout?: string; stderr?: string };
    return { status: err.status ?? 1, output: `${err.stdout ?? ''}${err.stderr ?? ''}` };
  }
}

beforeEach(() => {
  workdir = fs.mkdtempSync(path.join(os.tmpdir(), 'rls-coverage-'));
  fs.mkdirSync(migrationsDir(), { recursive: true });
});

afterEach(() => {
  fs.rmSync(workdir, { recursive: true, force: true });
});

describe('check-rls-coverage', () => {
  it('passes when every created table enables RLS', () => {
    writeMigration(
      '20260101000000_ok.sql',
      `CREATE TABLE IF NOT EXISTS public.widgets (id uuid PRIMARY KEY);
       ALTER TABLE public.widgets ENABLE ROW LEVEL SECURITY;`,
    );

    const { status, output } = run();
    expect(status).toBe(0);
    expect(output).toContain('Every public table enables Row Level Security');
  });

  it('fails when a table is created without RLS', () => {
    writeMigration(
      '20260101000000_missing.sql',
      'CREATE TABLE IF NOT EXISTS public.widgets (id uuid PRIMARY KEY);',
    );

    const { status, output } = run();
    expect(status).toBe(1);
    expect(output).toContain('public.widgets');
  });

  it('catches the broadcast_views bug: RLS enabled on the wrong table', () => {
    // The exact shape of the real defect — policies written for one table, RLS enabled on another.
    writeMigration(
      '20260101000000_wrong_target.sql',
      `CREATE TABLE IF NOT EXISTS public.broadcasts (id uuid PRIMARY KEY);
       ALTER TABLE public.broadcasts ENABLE ROW LEVEL SECURITY;
       CREATE TABLE IF NOT EXISTS public.broadcast_views (id uuid PRIMARY KEY, user_id uuid);
       -- Enable RLS
       ALTER TABLE public.broadcasts ENABLE ROW LEVEL SECURITY;
       CREATE POLICY "Users can view their own broadcast views"
         ON public.broadcast_views FOR SELECT USING (auth.uid() = user_id);`,
    );

    const { status, output } = run();
    expect(status).toBe(1);
    expect(output).toContain('public.broadcast_views');
    expect(output).not.toContain('public.broadcasts\n');
  });

  it('accepts RLS enabled in a later migration than the CREATE', () => {
    writeMigration(
      '20260101000000_create.sql',
      'CREATE TABLE IF NOT EXISTS public.widgets (id uuid PRIMARY KEY);',
    );
    writeMigration(
      '20260102000000_enable.sql',
      'ALTER TABLE public.widgets ENABLE ROW LEVEL SECURITY;',
    );

    expect(run().status).toBe(0);
  });

  it('ignores tables that are dropped again', () => {
    writeMigration(
      '20260101000000_create.sql',
      'CREATE TABLE IF NOT EXISTS public.temp_thing (id uuid PRIMARY KEY);',
    );
    writeMigration('20260102000000_drop.sql', 'DROP TABLE IF EXISTS public.temp_thing;');

    expect(run().status).toBe(0);
  });

  it('ignores tables in other schemas', () => {
    writeMigration(
      '20260101000000_other_schema.sql',
      'CREATE TABLE IF NOT EXISTS storage.buckets_extra (id uuid PRIMARY KEY);',
    );

    expect(run().status).toBe(0);
  });

  it('ignores CREATE TABLE inside a comment', () => {
    writeMigration(
      '20260101000000_commented.sql',
      '-- CREATE TABLE public.not_real (id uuid);\nSELECT 1;',
    );

    expect(run().status).toBe(0);
  });

  it('reports the creation site so the fix location is unambiguous', () => {
    writeMigration(
      '20260101000000_a.sql',
      '\n\nCREATE TABLE public.widgets (id uuid PRIMARY KEY);',
    );

    const { output } = run();
    expect(output).toContain('20260101000000_a.sql:3');
  });
});
