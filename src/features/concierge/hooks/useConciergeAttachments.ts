import { useCallback, useRef, useState } from 'react';
import type { AttachmentIntent } from '@/features/concierge/types';

export function useConciergeAttachments() {
  const [attachedImages, setAttachedImages] = useState<File[]>([]);
  const [attachedDocuments, setAttachedDocuments] = useState<File[]>([]);
  const [attachmentIntent, setAttachmentIntent] = useState<AttachmentIntent>('smart_import');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const clearAttachments = useCallback(() => {
    setAttachedImages([]);
    setAttachedDocuments([]);
  }, []);

  return {
    attachedImages,
    setAttachedImages,
    attachedDocuments,
    setAttachedDocuments,
    attachmentIntent,
    setAttachmentIntent,
    fileInputRef,
    clearAttachments,
  };
}
