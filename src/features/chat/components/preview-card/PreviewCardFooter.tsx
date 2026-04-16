import React, { useState, useCallback, useEffect, useRef } from 'react';
import { CalendarPlus, Trash2 } from 'lucide-react';
import type { PreviewMode } from './previewCardUtils';
import { MODE_CONFIG } from './previewCardUtils';

/** Threshold for requiring double-click confirmation on destructive actions */
const LARGE_DELETE_THRESHOLD = 4;
/** How long the "Confirm" state persists before resetting */
const CONFIRM_TIMEOUT_MS = 5000;

interface PreviewCardFooterProps {
  mode: PreviewMode;
  selectedCount: number;
  totalCount: number;
  isProcessing: boolean;
  onConfirm: () => void;
  onDismiss: () => void;
}

export const PreviewCardFooter: React.FC<PreviewCardFooterProps> = ({
  mode,
  selectedCount,
  totalCount,
  isProcessing,
  onConfirm,
  onDismiss,
}) => {
  const config = MODE_CONFIG[mode];
  const ConfirmIcon = mode === 'delete' ? Trash2 : CalendarPlus;

  // Double-click confirmation for large destructive deletes
  const [awaitingSecondConfirm, setAwaitingSecondConfirm] = useState(false);
  const confirmTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const needsDoubleConfirm = mode === 'delete' && selectedCount >= LARGE_DELETE_THRESHOLD;

  useEffect(() => {
    return () => {
      if (confirmTimeoutRef.current) clearTimeout(confirmTimeoutRef.current);
    };
  }, []);

  // Reset second-confirm state when selection count changes
  useEffect(() => {
    setAwaitingSecondConfirm(false);
    if (confirmTimeoutRef.current) {
      clearTimeout(confirmTimeoutRef.current);
      confirmTimeoutRef.current = null;
    }
  }, [selectedCount]);

  const handleConfirmClick = useCallback(() => {
    if (selectedCount === 0) return;

    if (needsDoubleConfirm && !awaitingSecondConfirm) {
      setAwaitingSecondConfirm(true);
      confirmTimeoutRef.current = setTimeout(() => {
        setAwaitingSecondConfirm(false);
        confirmTimeoutRef.current = null;
      }, CONFIRM_TIMEOUT_MS);
      return;
    }

    setAwaitingSecondConfirm(false);
    if (confirmTimeoutRef.current) {
      clearTimeout(confirmTimeoutRef.current);
      confirmTimeoutRef.current = null;
    }
    onConfirm();
  }, [selectedCount, needsDoubleConfirm, awaitingSecondConfirm, onConfirm]);

  const confirmButtonLabel = (() => {
    if (isProcessing) return config.confirmingLabel;
    if (awaitingSecondConfirm) return `Confirm: Remove ${selectedCount} events?`;
    return config.confirmLabel;
  })();

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-white/5 bg-white/[0.02]">
      <span className="text-xs text-gray-500">
        {selectedCount} of {totalCount} selected
      </span>
      <div className="flex items-center gap-2">
        {!isProcessing && (
          <button
            type="button"
            onClick={onDismiss}
            aria-label={`Cancel ${mode}`}
            className="px-3 py-1.5 min-h-[44px] text-xs text-gray-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
          >
            Cancel
          </button>
        )}
        <button
          type="button"
          onClick={handleConfirmClick}
          disabled={selectedCount === 0 || isProcessing}
          className={`px-4 py-1.5 text-xs font-medium text-white ${config.confirmBg} ${config.confirmHoverBg} rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 ${
            awaitingSecondConfirm ? 'animate-pulse ring-1 ring-red-400/50' : ''
          }`}
        >
          {isProcessing ? (
            <>
              <div className="h-3 w-3 animate-spin gold-gradient-spinner" />
              {config.confirmingLabel}
            </>
          ) : (
            <>
              <ConfirmIcon size={12} />
              {confirmButtonLabel}
            </>
          )}
        </button>
      </div>
    </div>
  );
};
