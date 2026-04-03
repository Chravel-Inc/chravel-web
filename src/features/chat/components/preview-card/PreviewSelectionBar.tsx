import React from 'react';

interface PreviewSelectionBarProps {
  selectedCount: number;
  totalCount: number;
  duplicateCount: number;
  allNonDuplicatesSelected: boolean;
  noneSelected: boolean;
  isProcessing: boolean;
  onSelectAll: () => void;
  onDeselectAll: () => void;
}

export const PreviewSelectionBar: React.FC<PreviewSelectionBarProps> = ({
  selectedCount,
  totalCount,
  duplicateCount,
  allNonDuplicatesSelected,
  noneSelected,
  isProcessing,
  onSelectAll,
  onDeselectAll,
}) => {
  const importableCount = totalCount - duplicateCount;
  const showDuplicateNote = duplicateCount > 0;

  return (
    <div className="flex items-center justify-between px-4 py-2 border-b border-white/5 bg-white/[0.01]">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onSelectAll}
          disabled={isProcessing || allNonDuplicatesSelected}
          className="text-xs text-blue-400 hover:text-blue-300 disabled:text-gray-600 disabled:cursor-not-allowed transition-colors min-h-[44px] px-1"
        >
          Select All
        </button>
        <span className="text-gray-600">·</span>
        <button
          type="button"
          onClick={onDeselectAll}
          disabled={isProcessing || noneSelected}
          className="text-xs text-blue-400 hover:text-blue-300 disabled:text-gray-600 disabled:cursor-not-allowed transition-colors min-h-[44px] px-1"
        >
          Deselect All
        </button>
      </div>
      <span className="text-xs text-gray-500">
        {selectedCount} of {showDuplicateNote ? `${importableCount} importable` : totalCount}{' '}
        selected
        {showDuplicateNote && (
          <span className="text-amber-400/60">
            {' '}
            ({duplicateCount} duplicate{duplicateCount !== 1 ? 's' : ''} skipped)
          </span>
        )}
      </span>
    </div>
  );
};
