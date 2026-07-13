import React from 'react';
import { Languages } from 'lucide-react';
import {
  CONCIERGE_LANGUAGES,
  useConciergeLanguagePreference,
  type ConciergeLanguageId,
} from '@/features/concierge/hooks/useConciergeLanguagePreference';

export const ConciergeLanguagePicker: React.FC = () => {
  const { language, setLanguage } = useConciergeLanguagePreference();

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-4">
      <h3 className="text-white font-semibold mb-1 flex items-center gap-2">
        <Languages size={20} />
        Reply Language
      </h3>
      <p className="text-gray-400 text-sm mb-3">
        Choose the language Concierge replies in for both text and voice. Auto-detect matches
        whatever language you write or speak in.
      </p>
      <select
        aria-label="Concierge reply language"
        className="w-full min-h-[42px] bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white"
        value={language}
        onChange={e => setLanguage(e.target.value as ConciergeLanguageId)}
      >
        {CONCIERGE_LANGUAGES.map(l => (
          <option key={l.id} value={l.id} className="bg-black">
            {l.label}
          </option>
        ))}
      </select>
    </div>
  );
};
