import React from 'react';
import { Clock, MapPin } from 'lucide-react';
import type { SmartImportPreviewEvent } from '@/services/conciergeGateway';
import { CATEGORY_CONFIG, COLOR_CLASSES, formatDateTime, getEventKey } from './previewCardUtils';
import type { PreviewMode } from './previewCardUtils';
import { MODE_CONFIG } from './previewCardUtils';

interface PreviewEventListProps {
  events: SmartImportPreviewEvent[];
  excludedKeys: Set<string>;
  isProcessing: boolean;
  mode: PreviewMode;
  onToggle: (key: string) => void;
}

export const PreviewEventList: React.FC<PreviewEventListProps> = ({
  events,
  excludedKeys,
  isProcessing,
  mode,
  onToggle,
}) => {
  const config = MODE_CONFIG[mode];

  return (
    <div className="divide-y divide-white/5 max-h-64 overflow-y-auto">
      {events.map(event => {
        const key = getEventKey(event);
        const isSelected = !excludedKeys.has(key);
        const catConfig = CATEGORY_CONFIG[event.category || 'other'] || CATEGORY_CONFIG.other;
        const Icon = catConfig.icon;
        const colorClass = COLOR_CLASSES[catConfig.color] || COLOR_CLASSES.blue;

        return (
          <button
            key={key}
            type="button"
            onClick={() => !isProcessing && onToggle(key)}
            disabled={isProcessing}
            aria-label={`${isSelected ? 'Deselect' : 'Select'} ${event.title}`}
            aria-pressed={isSelected}
            className={`w-full flex items-start gap-3 px-4 py-2.5 min-h-[44px] text-left transition-colors ${
              isSelected ? 'hover:bg-white/5' : 'opacity-40 hover:opacity-60'
            } disabled:cursor-not-allowed`}
          >
            <input
              type="checkbox"
              checked={isSelected}
              readOnly
              className={`mt-0.5 shrink-0 w-4 h-4 rounded ${config.checkboxAccent} cursor-pointer`}
              tabIndex={-1}
              aria-hidden="true"
            />
            <Icon size={14} className={`mt-0.5 shrink-0 ${colorClass}`} />
            <div className="min-w-0 flex-1">
              <p
                className={`text-sm font-medium truncate ${
                  event.isDuplicate ? 'line-through text-gray-500' : 'text-white'
                }`}
              >
                {event.title}
              </p>
              <div className="flex items-center gap-3 mt-0.5">
                <span className="flex items-center gap-1 text-xs text-gray-400">
                  <Clock size={10} />
                  {formatDateTime(event.startTime)}
                </span>
                {event.location && (
                  <span className="flex items-center gap-1 text-xs text-gray-500 truncate">
                    <MapPin size={10} />
                    {event.location}
                  </span>
                )}
              </div>
              {event.notes && (
                <p className="text-[11px] text-gray-500 mt-0.5 truncate">{event.notes}</p>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
};
