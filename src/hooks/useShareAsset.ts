import { useState } from 'react';
import {
  uploadToStorage,
  uploadVoiceNoteToStorage,
  insertMediaIndex,
  insertFileIndex,
} from '@/services/uploadService';
import { insertLinkIndex, fetchOpenGraphData } from '@/services/linkService';
import {
  sendChannelMessageWithCanonicalTransport,
  sendTripMessageWithCanonicalTransport,
} from '@/services/stream/canonicalTripMessageTransport';
import { autoParseContent, ParsedContent } from '@/services/chatContentParser';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { UNKNOWN_MEMBER_LABEL } from '@/lib/resolveDisplayName';

type ShareKind = 'image' | 'video' | 'file' | 'link';

export interface UploadProgress {
  fileId: string;
  fileName: string;
  progress: number; // 0-100
  status: 'uploading' | 'completed' | 'error';
}

export interface VoiceNoteShareMeta {
  durationMs: number;
  waveform: number[];
  /** Optional browser speech-recognition transcript captured while recording. */
  transcript?: string;
}

export interface ShareAssetChannelScope {
  /** Pro sub-channel id — attachments post to the sub-channel, not the trip chat */
  channelId: string;
  channelName?: string;
}

export function useShareAsset(tripId: string, channelScope?: ShareAssetChannelScope) {
  const [isUploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, UploadProgress>>({});
  const [error, setError] = useState<string | null>(null);
  const [parsedContent, setParsedContent] = useState<ParsedContent | null>(null);
  const { user } = useAuth();
  const userId = user?.id || '';
  const channelId = channelScope?.channelId;

  /**
   * Route the message to the right Stream channel. From a Pro sub-channel
   * composer, attachments MUST land in that sub-channel — falling through to
   * the trip channel would leak channel-scoped content to the whole trip.
   */
  async function sendMessageWithCanonicalTransport(
    payload: Record<string, unknown>,
  ): Promise<{ id: string } | unknown> {
    if (channelScope) {
      return sendChannelMessageWithCanonicalTransport(
        channelScope.channelId,
        channelScope.channelName,
        tripId,
        payload,
      );
    }
    return sendTripMessageWithCanonicalTransport(tripId, payload);
  }

  /** Extract the Stream message id from a transport result (legacy path may not return one). */
  function messageIdOf(result: unknown): string | undefined {
    const id = (result as { id?: unknown } | null | undefined)?.id;
    return typeof id === 'string' && id ? id : undefined;
  }

  /**
   * Media-index writes run AFTER the chat send, so a failed index must not
   * be reported as a failed share (the message is already in chat). Retry
   * once for transient errors, then surface a soft warning.
   */
  async function indexNonFatal<T>(label: string, insert: () => Promise<T>): Promise<T | null> {
    try {
      return await insert();
    } catch {
      try {
        return await insert();
      } catch (err) {
        if (import.meta.env.DEV) {
          console.warn(`[useShareAsset] ${label} index insert failed after retry:`, err);
        }
        toast.warning('Shared to chat, but it may not appear in the Media tab.');
        return null;
      }
    }
  }

  async function shareFile(
    kind: ShareKind,
    file: File,
    onProgress?: (progress: number) => void,
    voiceMeta?: VoiceNoteShareMeta,
  ) {
    const fileId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    setUploading(true);
    setError(null);

    // Initialize progress tracking
    setUploadProgress(prev => ({
      ...prev,
      [fileId]: {
        fileId,
        fileName: file.name,
        progress: 0,
        status: 'uploading',
      },
    }));

    // Simulate progress updates (Supabase doesn't provide native progress)
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => {
        const current = prev[fileId];
        if (current && current.progress < 90) {
          const newProgress = Math.min(current.progress + 10, 90);
          if (onProgress) onProgress(newProgress);
          return {
            ...prev,
            [fileId]: { ...current, progress: newProgress },
          };
        }
        return prev;
      });
    }, 200);

    try {
      // 1) Upload to storage
      const subdir = kind === 'image' ? 'images' : kind === 'video' ? 'videos' : 'files';
      const { publicUrl, key } = await uploadToStorage(file, tripId, subdir);

      // Mark as completed
      clearInterval(progressInterval);
      setUploadProgress(prev => ({
        ...prev,
        [fileId]: {
          fileId,
          fileName: file.name,
          progress: 100,
          status: 'completed',
        },
      }));
      if (onProgress) onProgress(100);

      // 2) Send the chat message FIRST, then index. The previous order
      // (index → send) left orphaned Media-tab rows when the send failed,
      // and never recorded the real Stream message id on the index row.
      if (kind === 'image' || kind === 'video') {
        const refId = crypto.randomUUID();
        const messageResult = await sendMessageWithCanonicalTransport({
          trip_id: tripId,
          user_id: userId,
          author_name: user?.email?.split('@')[0] || UNKNOWN_MEMBER_LABEL,
          content: '', // Empty content for pure media upload
          privacy_mode: 'standard',
          media_type: kind,
          media_url: publicUrl,
          attachments: [
            {
              type: kind,
              ref_id: refId,
              url: publicUrl,
            },
          ],
        });

        const row = await indexNonFatal('media', () =>
          insertMediaIndex({
            tripId,
            id: refId,
            mediaType: kind,
            url: publicUrl,
            uploadPath: key,
            filename: file.name,
            fileSize: file.size,
            mimeType: file.type,
            uploadedBy: userId,
            messageId: messageIdOf(messageResult),
            channelId,
          }),
        );

        // 🆕 Auto-parse content for receipts and itineraries
        if (kind === 'image') {
          try {
            const parsed = await autoParseContent(
              publicUrl,
              'image',
              file.type,
              tripId,
              (messageResult as any)?.id?.toString(),
            );
            if (parsed && parsed.suggestions && parsed.suggestions.length > 0) {
              setParsedContent(parsed);
              // Show toast with parsing result
              if (parsed.type === 'receipt') {
                toast.success('Receipt detected! Check suggestions below.', {
                  duration: 5000,
                });
              } else if (parsed.type === 'itinerary') {
                toast.success(`Found ${parsed.itinerary?.events.length || 0} calendar events!`, {
                  duration: 5000,
                });
              }
            }
          } catch (parseError) {
            if (import.meta.env.DEV) {
              console.warn('[useShareAsset] Content parsing failed:', parseError);
            }
          }
        }

        toast.success(`${kind === 'image' ? 'Photo' : 'Video'} uploaded successfully`);
        return { type: kind, ref: row };
      } else {
        // Handle document / voice-note upload
        const isVoiceNote =
          Boolean(voiceMeta) ||
          file.type.startsWith('audio/') ||
          /\.(webm|mp3|m4a|ogg|wav|opus)$/i.test(file.name);

        const refId = crypto.randomUUID();
        const messageResult = await sendMessageWithCanonicalTransport({
          trip_id: tripId,
          user_id: userId,
          author_name: user?.email?.split('@')[0] || UNKNOWN_MEMBER_LABEL,
          // Voice notes keep caption empty so the bubble is player-first.
          content: isVoiceNote ? '' : file.name,
          privacy_mode: 'standard',
          media_type: isVoiceNote ? 'audio' : 'document',
          media_url: publicUrl,
          attachments: [
            {
              type: isVoiceNote ? 'audio' : 'file',
              ref_id: refId,
              url: publicUrl,
              mime_type: file.type || 'application/octet-stream',
              ...(voiceMeta
                ? {
                    duration_ms: voiceMeta.durationMs,
                    waveform: voiceMeta.waveform,
                    ...(voiceMeta.transcript ? { transcript: voiceMeta.transcript } : {}),
                  }
                : {}),
            },
          ],
        });

        const row = await indexNonFatal('file', () =>
          insertFileIndex({
            tripId,
            name: file.name,
            fileType: file.type || 'application/octet-stream',
            uploadedBy: userId,
            channelId,
          }),
        );

        // 🆕 Auto-parse documents for itineraries (PDFs, etc.)
        if (
          !isVoiceNote &&
          (file.type === 'application/pdf' || file.name.toLowerCase().includes('itinerary'))
        ) {
          try {
            const parsed = await autoParseContent(
              publicUrl,
              'document',
              file.type,
              tripId,
              (messageResult as any)?.id?.toString(),
            );
            if (parsed && parsed.suggestions && parsed.suggestions.length > 0) {
              setParsedContent(parsed);
              toast.success(`Found ${parsed.itinerary?.events.length || 0} calendar events!`, {
                duration: 5000,
              });
            }
          } catch (parseError) {
            if (import.meta.env.DEV) {
              console.warn('[useShareAsset] Document parsing failed:', parseError);
            }
          }
        }

        toast.success(isVoiceNote ? 'Voice note sent' : 'File uploaded successfully');
        return { type: isVoiceNote ? 'audio' : 'file', ref: row };
      }
    } catch (e) {
      clearInterval(progressInterval);
      const errorMsg = e instanceof Error ? e.message : 'Upload failed';
      setError(errorMsg);
      setUploadProgress(prev => ({
        ...prev,
        [fileId]: {
          fileId,
          fileName: file.name,
          progress: 0,
          status: 'error',
        },
      }));
      toast.error(errorMsg);
      throw e;
    } finally {
      // Clean up progress after a delay
      setTimeout(() => {
        setUploadProgress(prev => {
          const updated = { ...prev };
          delete updated[fileId];
          return updated;
        });
      }, 2000);
      setUploading(false);
    }
  }

  async function shareLink(url: string) {
    setUploading(true);
    setError(null);

    try {
      // Validate URL
      try {
        new URL(url);
      } catch {
        throw new Error('Invalid URL format');
      }

      // Fetch Open Graph data
      const ogData = await fetchOpenGraphData(url);

      // Send the chat message first so the index row can carry the real
      // Stream message id (Media → source-message navigation).
      const refId = crypto.randomUUID();
      const messageResult = await sendMessageWithCanonicalTransport({
        trip_id: tripId,
        user_id: userId,
        author_name: user?.email?.split('@')[0] || UNKNOWN_MEMBER_LABEL,
        content: url,
        privacy_mode: 'standard',
        link_preview: {
          url,
          title: ogData.title,
          image: ogData.image,
          description: ogData.description,
          domain: ogData.domain,
        },
        attachments: [
          {
            type: 'link',
            ref_id: refId,
            url,
          },
        ],
      });

      // Insert link index (dedupes on trip_id+url internally)
      const row = await indexNonFatal('link', () =>
        insertLinkIndex({
          tripId,
          url,
          ogTitle: ogData.title,
          ogImage: ogData.image,
          ogDescription: ogData.description,
          domain: ogData.domain,
          submittedBy: userId,
          messageId: messageIdOf(messageResult),
          channelId,
        }),
      );

      toast.success('Link shared successfully');
      return { type: 'link', ref: row };
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : 'Link share failed';
      setError(errorMsg);
      toast.error(errorMsg);
      throw e;
    } finally {
      setUploading(false);
    }
  }

  /**
   * Upload multiple images as a single Stream message so the mosaic renderer
   * receives one attachments[] array (1/2/3/4-up). Videos/docs stay one-per-message.
   */
  async function shareImageBatch(files: File[]) {
    setUploading(true);
    setError(null);
    const uploaded: Array<{ id: string; url: string; filename: string }> = [];

    try {
      const staged: Array<{ id: string; url: string; key: string; file: File }> = [];
      for (const file of files) {
        const { publicUrl, key } = await uploadToStorage(file, tripId, 'images');
        staged.push({ id: crypto.randomUUID(), url: publicUrl, key, file });
      }

      // Send first, then index each image with the real message id.
      const first = staged[0];
      const messageResult = await sendMessageWithCanonicalTransport({
        trip_id: tripId,
        user_id: userId,
        author_name: user?.email?.split('@')[0] || UNKNOWN_MEMBER_LABEL,
        content: '',
        privacy_mode: 'standard',
        media_type: 'image',
        media_url: first.url,
        attachments: staged.map(item => ({
          type: 'image',
          ref_id: item.id,
          url: item.url,
        })),
      });

      const messageId = messageIdOf(messageResult);
      for (const item of staged) {
        await indexNonFatal('media', () =>
          insertMediaIndex({
            tripId,
            id: item.id,
            mediaType: 'image',
            url: item.url,
            uploadPath: item.key,
            filename: item.file.name,
            fileSize: item.file.size,
            mimeType: item.file.type,
            uploadedBy: userId,
            messageId,
            channelId,
          }),
        );
        uploaded.push({ id: item.id, url: item.url, filename: item.file.name });
      }

      toast.success(
        uploaded.length === 1
          ? 'Photo uploaded successfully'
          : `${uploaded.length} photos uploaded`,
      );
      return uploaded.map(item => ({ type: 'image' as const, ref: { id: item.id } }));
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : 'Upload failed';
      setError(errorMsg);
      toast.error(errorMsg);
      throw e;
    } finally {
      setUploading(false);
    }
  }

  async function shareVoiceNote(file: File, meta: VoiceNoteShareMeta) {
    const fileId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    setUploading(true);
    setError(null);
    setUploadProgress(prev => ({
      ...prev,
      [fileId]: {
        fileId,
        fileName: file.name,
        progress: 0,
        status: 'uploading',
      },
    }));

    try {
      const { publicUrl, key } = await uploadVoiceNoteToStorage(file, tripId);
      setUploadProgress(prev => ({
        ...prev,
        [fileId]: {
          fileId,
          fileName: file.name,
          progress: 100,
          status: 'completed',
        },
      }));

      const refId = crypto.randomUUID();
      await sendMessageWithCanonicalTransport({
        trip_id: tripId,
        user_id: userId,
        author_name: user?.email?.split('@')[0] || UNKNOWN_MEMBER_LABEL,
        content: meta.transcript ? 'Voice note' : '',
        privacy_mode: 'standard',
        media_type: 'audio',
        media_url: publicUrl,
        attachments: [
          {
            type: 'audio',
            ref_id: refId,
            url: publicUrl,
            mime_type: file.type || 'audio/webm',
            duration_ms: meta.durationMs,
            waveform: meta.waveform,
            ...(meta.transcript ? { transcript: meta.transcript } : {}),
            upload_path: key,
          },
        ],
      });

      const row = await indexNonFatal('voice-note', () =>
        insertFileIndex({
          tripId,
          name: file.name,
          fileType: file.type || 'audio/webm',
          uploadedBy: userId,
          channelId,
        }),
      );

      toast.success('Voice note sent');
      return { type: 'audio' as const, ref: row };
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : 'Upload failed';
      setError(errorMsg);
      setUploadProgress(prev => ({
        ...prev,
        [fileId]: {
          fileId,
          fileName: file.name,
          progress: 0,
          status: 'error',
        },
      }));
      toast.error(errorMsg);
      throw e;
    } finally {
      setTimeout(() => {
        setUploadProgress(prev => {
          const updated = { ...prev };
          delete updated[fileId];
          return updated;
        });
      }, 2000);
      setUploading(false);
    }
  }

  async function shareMultipleFiles(files: FileList, type: 'image' | 'video' | 'document') {
    const fileArray = Array.from(files);

    // Multi-image selections become one mosaic message (Phase 3 contract).
    if (type === 'image' && fileArray.length > 1) {
      try {
        return await shareImageBatch(fileArray);
      } catch (error) {
        if (import.meta.env.DEV) {
          console.error('Failed to upload image batch:', error);
        }
        return [];
      }
    }

    const results = [];

    for (const file of fileArray) {
      try {
        const kind: ShareKind = type === 'document' ? 'file' : type;
        const result = await shareFile(kind, file);
        results.push(result);
      } catch (error) {
        if (import.meta.env.DEV) {
          console.error(`Failed to upload ${file.name}:`, error);
        }
      }
    }

    return results;
  }

  return {
    shareFile,
    shareLink,
    shareMultipleFiles,
    shareVoiceNote,
    isUploading,
    uploadProgress,
    error,
    parsedContent, // 🆕 Return parsed content for UI to display suggestions
    clearParsedContent: () => setParsedContent(null), // 🆕 Clear parsed content
  };
}
