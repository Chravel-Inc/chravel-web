export type IngestSource =
  | 'message'
  | 'poll'
  | 'broadcast'
  | 'file'
  | 'calendar'
  | 'link'
  | 'trip_batch';

type QueryResult<T> = Promise<{
  data: T | null;
  error?: { message?: string } | null;
}>;

interface QueryBuilder<T> {
  select(columns: string): QueryBuilder<T>;
  eq(column: string, value: unknown): QueryBuilder<T>;
  maybeSingle(): QueryResult<T>;
}

interface SupabaseLikeClient {
  from(table: string): QueryBuilder<unknown>;
}

interface SourceResolution {
  found: boolean;
  content: string;
}

export function isServiceRoleRequest(
  authorizationHeader: string | null,
  serviceRoleKey: string | null | undefined,
): boolean {
  return Boolean(
    authorizationHeader && serviceRoleKey && authorizationHeader === `Bearer ${serviceRoleKey}`,
  );
}

export async function verifyActiveTripMembership(
  supabase: SupabaseLikeClient,
  userId: string,
  tripId: string,
): Promise<boolean> {
  const { data: membership, error } = await supabase
    .from('trip_members')
    .select('user_id')
    .eq('trip_id', tripId)
    .eq('user_id', userId)
    .eq('status', 'active')
    .maybeSingle();

  return !error && !!membership;
}

export async function resolveSourceContentForTrip(
  supabase: SupabaseLikeClient,
  source: IngestSource,
  sourceId: string,
  tripId: string,
): Promise<SourceResolution> {
  switch (source) {
    case 'message': {
      const { data: message, error } = await supabase
        .from('trip_chat_messages')
        .select('content, author_name')
        .eq('id', sourceId)
        .eq('trip_id', tripId)
        .maybeSingle();

      if (error || !message) {
        return { found: false, content: '' };
      }

      return {
        found: true,
        content: `${message.author_name}: ${message.content}`,
      };
    }

    case 'poll': {
      const { data: poll, error } = await supabase
        .from('trip_polls')
        .select('question, options, total_votes')
        .eq('id', sourceId)
        .eq('trip_id', tripId)
        .maybeSingle();

      if (error || !poll) {
        return { found: false, content: '' };
      }

      const pollRecord = poll as {
        question: string;
        options: Array<{ text?: string } | string> | null;
        total_votes: number | null;
      };

      const options = Array.isArray(pollRecord.options)
        ? pollRecord.options.map(option => (typeof option === 'string' ? option : option.text || '')).join(', ')
        : '';

      return {
        found: true,
        content: `POLL: ${pollRecord.question}\nOptions: ${options}\nTotal votes: ${pollRecord.total_votes}`,
      };
    }

    case 'file': {
      const { data: file, error } = await supabase
        .from('trip_files')
        .select('name, content_text, ai_summary')
        .eq('id', sourceId)
        .eq('trip_id', tripId)
        .maybeSingle();

      if (error || !file) {
        return { found: false, content: '' };
      }

      return {
        found: true,
        content: `FILE: ${file.name}\n${file.ai_summary || file.content_text || 'No content available'}`,
      };
    }

    case 'calendar': {
      const { data: event, error } = await supabase
        .from('trip_events')
        .select('title, description, location, start_time, end_time')
        .eq('id', sourceId)
        .eq('trip_id', tripId)
        .maybeSingle();

      if (error || !event) {
        return { found: false, content: '' };
      }

      return {
        found: true,
        content: [
          `EVENT: ${event.title}`,
          event.description || '',
          event.location ? `Location: ${event.location}` : '',
          `Starts: ${event.start_time}`,
          event.end_time ? `Ends: ${event.end_time}` : '',
        ]
          .filter(Boolean)
          .join('\n'),
      };
    }

    case 'link': {
      const { data: link, error } = await supabase
        .from('trip_links')
        .select('title, description, url')
        .eq('id', sourceId)
        .eq('trip_id', tripId)
        .maybeSingle();

      if (error || !link) {
        return { found: false, content: '' };
      }

      return {
        found: true,
        content: `LINK: ${link.title}\n${link.description || ''}\nURL: ${link.url}`,
      };
    }

    default:
      return {
        found: false,
        content: '',
      };
  }
}
