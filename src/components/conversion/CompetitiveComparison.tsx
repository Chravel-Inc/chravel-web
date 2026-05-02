import React from 'react';
import { CATEGORIES } from './ReplacesGridData';

type Cell = 'yes' | 'no' | 'partial';

const COMPETITORS = ['WhatsApp', 'Splitwise', 'Google Drive', 'TripIt', 'Notion', 'Slack'] as const;

// Conservative, defensible matrix. Rows match CATEGORIES order (chat, calendar,
// concierge, media, payments, places, polls, tasks).
const MATRIX: Record<string, Record<(typeof COMPETITORS)[number], Cell>> = {
  chat: {
    WhatsApp: 'yes',
    Splitwise: 'no',
    'Google Drive': 'no',
    TripIt: 'no',
    Notion: 'no',
    Slack: 'yes',
  },
  calendar: {
    WhatsApp: 'no',
    Splitwise: 'no',
    'Google Drive': 'no',
    TripIt: 'yes',
    Notion: 'partial',
    Slack: 'no',
  },
  concierge: {
    WhatsApp: 'no',
    Splitwise: 'no',
    'Google Drive': 'no',
    TripIt: 'partial',
    Notion: 'partial',
    Slack: 'no',
  },
  media: {
    WhatsApp: 'partial',
    Splitwise: 'no',
    'Google Drive': 'yes',
    TripIt: 'no',
    Notion: 'partial',
    Slack: 'partial',
  },
  payments: {
    WhatsApp: 'no',
    Splitwise: 'yes',
    'Google Drive': 'no',
    TripIt: 'no',
    Notion: 'no',
    Slack: 'no',
  },
  places: {
    WhatsApp: 'no',
    Splitwise: 'no',
    'Google Drive': 'no',
    TripIt: 'yes',
    Notion: 'no',
    Slack: 'no',
  },
  polls: {
    WhatsApp: 'partial',
    Splitwise: 'no',
    'Google Drive': 'no',
    TripIt: 'no',
    Notion: 'partial',
    Slack: 'yes',
  },
  tasks: {
    WhatsApp: 'no',
    Splitwise: 'no',
    'Google Drive': 'no',
    TripIt: 'no',
    Notion: 'yes',
    Slack: 'yes',
  },
};

const CellGlyph: React.FC<{ value: Cell; emphasized?: boolean }> = ({ value, emphasized }) => {
  if (value === 'yes') {
    return (
      <span
        className={
          emphasized
            ? 'text-[#feeaa5] text-xl font-bold drop-shadow-[0_0_8px_rgba(196,151,70,0.5)]'
            : 'text-[#c49746] text-lg font-semibold'
        }
        aria-label="Yes"
      >
        ✓
      </span>
    );
  }
  if (value === 'partial') {
    return (
      <span className="text-white/40 text-lg" aria-label="Partial">
        •
      </span>
    );
  }
  return (
    <span className="text-white/20 text-lg" aria-label="No">
      ✗
    </span>
  );
};

export const CompetitiveComparison: React.FC = () => {
  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
      {/* Header */}
      <div className="text-center mb-10 sm:mb-14">
        <p className="text-[#c49746] text-xs sm:text-sm uppercase tracking-[0.2em] font-semibold mb-3">
          The only one
        </p>
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4 leading-tight">
          Eight tools. One trip.
          <br className="hidden sm:block" />
          <span className="text-[#feeaa5]"> Zero tab-switching.</span>
        </h2>
        <p className="text-white/70 text-base sm:text-lg max-w-2xl mx-auto">
          Every other app does one slice. Chravel does the whole trip.
        </p>
      </div>

      {/* Desktop / tablet table */}
      <div className="hidden md:block overflow-hidden rounded-2xl border border-[#533517]/40 bg-black/40 backdrop-blur-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#533517]/40">
              <th className="text-left p-4 text-white/60 font-medium w-1/4">Capability</th>
              <th className="p-4 bg-gradient-to-b from-[#533517]/30 to-[#c49746]/10 border-x border-[#c49746]/30">
                <div className="text-[#feeaa5] font-bold text-base">Chravel</div>
              </th>
              {COMPETITORS.map(name => (
                <th key={name} className="p-4 text-white/50 font-normal text-xs sm:text-sm">
                  {name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {CATEGORIES.map((cat, idx) => (
              <tr
                key={cat.key}
                className={
                  idx % 2 === 0
                    ? 'bg-white/[0.015] border-b border-white/5'
                    : 'border-b border-white/5'
                }
              >
                <td className="p-4 text-white font-medium">
                  <span className="mr-2">{cat.icon}</span>
                  {cat.title}
                </td>
                <td className="text-center p-4 bg-gradient-to-b from-[#c49746]/10 to-[#533517]/10 border-x border-[#c49746]/30">
                  <CellGlyph value="yes" emphasized />
                </td>
                {COMPETITORS.map(name => (
                  <td key={name} className="text-center p-4">
                    <CellGlyph value={MATRIX[cat.key]?.[name] ?? 'no'} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile collapse */}
      <div className="md:hidden">
        <div className="rounded-2xl border border-[#c49746]/40 bg-gradient-to-b from-[#533517]/20 to-black/40 p-5 mb-4">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[#feeaa5] font-bold text-lg">Chravel</span>
            <span className="text-[#c49746] text-xs uppercase tracking-wider">All 8 ✓</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {CATEGORIES.map(cat => (
              <div
                key={cat.key}
                className="flex items-center gap-2 text-white/90 text-sm py-1.5"
              >
                <span className="text-[#c49746]">✓</span>
                <span>
                  {cat.icon} {cat.title}
                </span>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-black/30 p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-white/60 font-medium">Everyone else</span>
            <span className="text-white/30 text-xs uppercase tracking-wider">1–2 of 8</span>
          </div>
          <p className="text-white/50 text-sm leading-relaxed">
            WhatsApp does chat. Splitwise does payments. TripIt does itineraries. Notion does
            tasks. None of them do the whole trip — so your group ends up juggling all of them.
          </p>
        </div>
      </div>

      {/* Footnote */}
      <p className="text-center text-white/40 text-xs mt-6">
        ✓ full feature · • partial · ✗ not offered. Based on publicly available product
        capabilities.
      </p>
    </div>
  );
};
