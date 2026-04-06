/**
 * useSmartImportDropzone
 *
 * Shared hook for Smart Import modals (Calendar, Agenda, Lineup).
 * Provides working drag-and-drop, file type validation, and consistent UX.
 * Uses react-dropzone for robust DnD handling (fixes desktop drop not firing).
 */

import { useCallback, type DragEventHandler } from 'react';
import { useDropzone, FileRejection } from 'react-dropzone';
import { toast } from 'sonner';

/** Accepted MIME types and extensions for Smart Import */
export const SMART_IMPORT_ACCEPT = {
  'text/calendar': ['.ics'],
  'text/csv': ['.csv'],
  'application/vnd.ms-excel': ['.xls'],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
  'application/pdf': ['.pdf'],
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/webp': ['.webp'],
} as const;

export interface UseSmartImportDropzoneOptions {
  /** Called when a valid file is selected (click or drop) */
  onFileSelected: (file: File) => void | Promise<void>;
  /** Disabled when parsing/importing (prevents double-submit) */
  disabled?: boolean;
}

export interface UseSmartImportDropzoneReturn {
  getRootProps: ReturnType<typeof useDropzone>['getRootProps'];
  getInputProps: ReturnType<typeof useDropzone>['getInputProps'];
  isDragActive: boolean;
}

type DropzoneGetRootProps = ReturnType<typeof useDropzone>['getRootProps'];
type DropzoneRootPropsOptions = Parameters<DropzoneGetRootProps>[0];
type DropzoneCaptureHandler = DragEventHandler<HTMLElement>;

function withPreventDefaultCapture(handler?: DropzoneCaptureHandler): DropzoneCaptureHandler {
  return event => {
    handler?.(event);
    event.preventDefault();
  };
}

/**
 * Validates file type against Smart Import accepted types.
 * Used for manual validation when react-dropzone's accept doesn't cover edge cases.
 */
export function isSmartImportFileTypeValid(file: File): boolean {
  const ext = '.' + (file.name.split('.').pop()?.toLowerCase() ?? '');
  const mime = file.type?.toLowerCase() ?? '';

  const validMimes = Object.keys(SMART_IMPORT_ACCEPT) as (keyof typeof SMART_IMPORT_ACCEPT)[];
  const validExts = validMimes.flatMap(
    m => SMART_IMPORT_ACCEPT[m as keyof typeof SMART_IMPORT_ACCEPT],
  );

  if (validExts.some(e => e === ext)) return true;
  if ((validMimes as readonly string[]).includes(mime)) return true;

  // Fallback: check common patterns (exact MIME or extension)
  const patterns = [
    /\.ics$/i,
    /\.csv$/i,
    /\.xlsx?$/i,
    /\.pdf$/i,
    /\.(jpe?g|png|webp)$/i,
    /^text\/calendar/i,
    /^text\/csv/i,
    /^application\/pdf/i,
    /^image\/(jpeg|png|webp)/i,
    /^application\/vnd\.(ms-excel|openxmlformats)/i,
  ];
  return patterns.some(p => p.test(file.name) || p.test(mime));
}

export function useSmartImportDropzone({
  onFileSelected,
  disabled = false,
}: UseSmartImportDropzoneOptions): UseSmartImportDropzoneReturn {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (file) {
        onFileSelected(file);
      }
    },
    [onFileSelected],
  );

  const onDropRejected = useCallback((rejections: FileRejection[]) => {
    const first = rejections[0];
    if (!first) return;

    const errors = first.errors;
    const msg = errors[0]?.message ?? 'Invalid file type';
    toast.error('Invalid file type', {
      description: msg || 'Please use ICS, CSV, Excel, PDF, or image files (JPEG, PNG, WebP).',
    });
  }, []);

  const { getRootProps: baseGetRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    onDropRejected,
    accept: SMART_IMPORT_ACCEPT,
    maxFiles: 1,
    multiple: false,
    disabled,
    noClick: false,
    noKeyboard: false,
    preventDropOnDocument: true,
  });

  const getRootProps = useCallback<DropzoneGetRootProps>(
    (props?: DropzoneRootPropsOptions) =>
      baseGetRootProps({
        ...props,
        onDragEnterCapture: withPreventDefaultCapture(props?.onDragEnterCapture),
        onDragOverCapture: withPreventDefaultCapture(props?.onDragOverCapture),
        onDropCapture: withPreventDefaultCapture(props?.onDropCapture),
      }),
    [baseGetRootProps],
  );

  return {
    getRootProps,
    getInputProps,
    isDragActive,
  };
}
