import React from 'react';
import { CalendarPlus, Trash2, X } from 'lucide-react';
import type { PreviewMode } from './previewCardUtils';
import { MODE_CONFIG } from './previewCardUtils';

interface PreviewCardHeaderProps {
  mode: PreviewMode;
  totalEvents: number;
  isProcessing: boolean;
  onDismiss: () => void;
}

export const PreviewCardHeader: React.FC<PreviewCardHeaderProps> = ({
  mode,
  totalEvents,
  isProcessing,
  onDismiss,
}) => {
  const config = MODE_CONFIG[mode];
  const HeaderIcon = mode === 'delete' ? Trash2 : CalendarPlus;

  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
      <div className="flex items-center gap-2">
        <HeaderIcon size={16} className={config.accentText} />
        <span className={`text-sm font-medium ${config.accentText}`}>{config.headerTitle}</span>
        <span className="text-xs text-gray-500">
          {totalEvents} event{totalEvents !== 1 ? 's' : ''} found
        </span>
      </div>
      {!isProcessing && (
        <button
          type="button"
          onClick={onDismiss}
          className="text-gray-500 hover:text-gray-300 transition-colors"
          aria-label={`Dismiss ${mode} preview`}
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
};
