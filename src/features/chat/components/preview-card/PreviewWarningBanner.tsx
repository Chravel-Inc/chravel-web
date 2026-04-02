import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface PreviewWarningBannerProps {
  message: string;
}

export const PreviewWarningBanner: React.FC<PreviewWarningBannerProps> = ({ message }) => (
  <div className="flex items-center gap-2 px-4 py-2 bg-amber-500/10 border-b border-white/5">
    <AlertTriangle size={14} className="text-amber-400 shrink-0" />
    <span className="text-xs text-amber-300">{message}</span>
  </div>
);
