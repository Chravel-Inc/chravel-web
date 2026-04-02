import React, { useState, useCallback, useMemo } from 'react';
import { AlertTriangle, Check, Hotel } from 'lucide-react';
import type { SmartImportPreviewEvent } from '@/services/conciergeGateway';
import {
  PreviewCardHeader,
  PreviewWarningBanner,
  PreviewSelectionBar,
  PreviewEventList,
  PreviewCardFooter,
  getEventKey,
  MODE_CONFIG,
} from './preview-card';
import type { PreviewMode } from './preview-card';

export interface SmartImportPreviewCardProps {
  mode?: PreviewMode;
  previewEvents: SmartImportPreviewEvent[];
  tripId: string;
  totalEvents: number;
  duplicateCount: number;
  /** If a lodging event was detected, include hotel name for basecamp prompt */
  lodgingName?: string;
  onConfirm: (events: SmartImportPreviewEvent[]) => void;
  onDismiss: () => void;
  isImporting?: boolean;
  importResult?: { imported: number; failed: number; alreadyMissing?: number } | null;
  importError?: string | null;
  onRetry?: () => void;
}

export const SmartImportPreviewCard: React.FC<SmartImportPreviewCardProps> = ({
  mode = 'import',
  previewEvents,
  totalEvents,
  duplicateCount,
  lodgingName,
  onConfirm,
  onDismiss,
  isImporting = false,
  importResult = null,
  importError = null,
  onRetry,
}) => {
  const config = MODE_CONFIG[mode];

  // Build initial excluded set: duplicates are excluded by default in import mode
  const [excludedKeys, setExcludedKeys] = useState<Set<string>>(() => {
    if (mode === 'import') {
      const dupeKeys = new Set<string>();
      for (const event of previewEvents) {
        if (event.isDuplicate) {
          dupeKeys.add(getEventKey(event));
        }
      }
      return dupeKeys;
    }
    return new Set<string>();
  });

  const duplicateKeys = useMemo(() => {
    const keys = new Set<string>();
    for (const event of previewEvents) {
      if (event.isDuplicate) {
        keys.add(getEventKey(event));
      }
    }
    return keys;
  }, [previewEvents]);

  const toggleEvent = useCallback((key: string) => {
    setExcludedKeys(prev => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }, []);

  const selectedEvents = useMemo(
    () => previewEvents.filter(e => !excludedKeys.has(getEventKey(e))),
    [previewEvents, excludedKeys],
  );

  const nonDuplicateCount = totalEvents - duplicateCount;
  const allNonDuplicatesSelected =
    selectedEvents.length >= nonDuplicateCount && nonDuplicateCount > 0;
  const noneSelected = selectedEvents.length === 0;

  const selectAll = useCallback(() => {
    // Select all non-duplicates; keep duplicates excluded
    setExcludedKeys(new Set(duplicateKeys));
  }, [duplicateKeys]);

  const deselectAll = useCallback(() => {
    const allKeys = new Set<string>();
    for (const event of previewEvents) {
      allKeys.add(getEventKey(event));
    }
    setExcludedKeys(allKeys);
  }, [previewEvents]);

  const handleConfirm = useCallback(() => {
    if (selectedEvents.length === 0) return;
    onConfirm(selectedEvents);
  }, [selectedEvents, onConfirm]);

  const showSelectionBar = previewEvents.length >= 3;

  // Error state
  if (importError) {
    return (
      <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 space-y-2">
        <div className="flex items-center gap-2">
          <AlertTriangle size={18} className="text-red-400" />
          <p className="text-sm font-medium text-red-300">{config.errorLabel}</p>
        </div>
        <p className="text-xs text-red-400/80">{importError}</p>
        <div className="flex gap-2 pt-1">
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="px-3 py-1.5 text-xs font-medium text-white bg-red-600 hover:bg-red-500 rounded-lg transition-colors"
            >
              Retry
            </button>
          )}
          <button
            type="button"
            onClick={onDismiss}
            className="px-3 py-1.5 text-xs text-gray-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
          >
            Dismiss
          </button>
        </div>
      </div>
    );
  }

  // Success state
  if (importResult) {
    const count = mode === 'delete' ? importResult.imported : importResult.imported;
    const alreadyMissing = importResult.alreadyMissing || 0;
    return (
      <div
        className={`rounded-xl border ${config.successBorder} ${config.successBg} p-4 space-y-2`}
      >
        <div className="flex items-center gap-2">
          <Check size={18} className="text-green-400" />
          <p className={`text-sm font-medium ${config.successText}`}>
            {config.successLabel} {count} event{count !== 1 ? 's' : ''}
            {mode === 'delete' ? ' from' : ' to'} Calendar
          </p>
        </div>
        {alreadyMissing > 0 && (
          <p className="text-xs text-amber-400">
            {alreadyMissing} event{alreadyMissing !== 1 ? 's' : ''} were already gone.
          </p>
        )}
        {importResult.failed > 0 && (
          <p className="text-xs text-red-400">
            {importResult.failed} event{importResult.failed !== 1 ? 's' : ''} failed
          </p>
        )}
        {mode === 'import' && lodgingName && importResult.imported > 0 && (
          <div className="flex items-center gap-2 pt-1 border-t border-green-500/20">
            <Hotel size={14} className="text-amber-400 shrink-0" />
            <p className="text-xs text-gray-300">
              Tip: Say{' '}
              <span className="text-amber-300 font-medium">"Make {lodgingName} the basecamp"</span>{' '}
              to set it as your trip base.
            </p>
          </div>
        )}
      </div>
    );
  }

  // Empty state
  if (previewEvents.length === 0) {
    const emptyText = mode === 'delete' ? 'No matching events found' : 'No new events to import';
    return (
      <div className="rounded-xl border border-gray-500/30 bg-gray-500/5 p-4 space-y-2">
        <p className="text-sm text-gray-400">{emptyText}</p>
        <button
          type="button"
          onClick={onDismiss}
          className="px-3 py-1.5 text-xs text-gray-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
        >
          Dismiss
        </button>
      </div>
    );
  }

  return (
    <div className={`rounded-xl border ${config.accentBorder} ${config.accentBg} overflow-hidden`}>
      <PreviewCardHeader
        mode={mode}
        totalEvents={totalEvents}
        isProcessing={isImporting}
        onDismiss={onDismiss}
      />

      {duplicateCount > 0 && (
        <PreviewWarningBanner
          message={`${duplicateCount} event${duplicateCount !== 1 ? 's' : ''} already in your calendar (deselected)`}
        />
      )}

      {showSelectionBar && (
        <PreviewSelectionBar
          selectedCount={selectedEvents.length}
          totalCount={totalEvents}
          duplicateCount={duplicateCount}
          allNonDuplicatesSelected={allNonDuplicatesSelected}
          noneSelected={noneSelected}
          isProcessing={isImporting}
          onSelectAll={selectAll}
          onDeselectAll={deselectAll}
        />
      )}

      <PreviewEventList
        events={previewEvents}
        excludedKeys={excludedKeys}
        isProcessing={isImporting}
        mode={mode}
        onToggle={toggleEvent}
      />

      <PreviewCardFooter
        mode={mode}
        selectedCount={selectedEvents.length}
        totalCount={totalEvents}
        isProcessing={isImporting}
        onConfirm={handleConfirm}
        onDismiss={onDismiss}
      />
    </div>
  );
};
