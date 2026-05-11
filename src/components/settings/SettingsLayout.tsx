/**
 * Shared layout for settings screens (Consumer, Enterprise, Events).
 * Provides responsive sidebar (desktop) / dropdown (mobile) + content area.
 */

import React from 'react';
import { ChevronDown } from 'lucide-react';
import { useIsMobile } from '../../hooks/use-mobile';

export interface SettingsSection {
  id: string;
  label: string;
  icon: React.ComponentType<{ size?: number | string }>;
}

interface SettingsLayoutProps {
  title: string;
  /** Optional subtitle for desktop sidebar */
  subtitle?: string;
  sections: SettingsSection[];
  activeSection: string;
  onSectionChange: (sectionId: string) => void;
  children: React.ReactNode;
}

export const SettingsLayout: React.FC<SettingsLayoutProps> = ({
  title,
  subtitle,
  sections,
  activeSection,
  onSectionChange,
  children,
}) => {
  const isMobile = useIsMobile();
  const [showMobileMenu, setShowMobileMenu] = React.useState(false);
  const currentSection = sections.find(s => s.id === activeSection);

  const sectionButtonClass = (isActive: boolean) =>
    isActive
      ? 'bg-black/70 text-gold-primary border border-gold-primary/60 shadow-ring-glow'
      : 'text-gray-300 hover:text-white hover:bg-white/10 border border-transparent';

  if (isMobile) {
    return (
      <div className="flex flex-col h-full w-full min-w-0">
        <div className="flex-shrink-0 p-3 md:p-4 border-b border-white/20">
          <button
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            className="w-full flex items-center justify-between p-3 bg-black/50 border border-white/15 rounded-xl text-white min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-primary/70"
          >
            <div className="flex items-center gap-3">
              {currentSection && <currentSection.icon size={20} />}
              <span className="text-sm">{currentSection?.label}</span>
            </div>
            <ChevronDown
              size={20}
              className={`transform transition-transform duration-200 ${showMobileMenu ? 'rotate-180' : ''}`}
            />
          </button>

          {showMobileMenu && (
            <div
              className="mt-2 bg-white/10 rounded-xl overflow-hidden animate-fade-in"
              role="tablist"
              aria-label="Settings sections"
            >
              {sections.map(section => {
                const Icon = section.icon;
                const isActive = activeSection === section.id;
                return (
                  <button
                    key={section.id}
                    onClick={() => {
                      onSectionChange(section.id);
                      setShowMobileMenu(false);
                    }}
                    role="tab"
                    aria-selected={isActive}
                    className={`w-full flex items-center gap-3 px-3 md:px-4 py-2.5 md:py-3 text-left text-sm font-medium rounded-xl transition-colors min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-primary/70 ${sectionButtonClass(
                      isActive,
                    )}`}
                  >
                    <Icon size={20} />
                    <span className="flex-1 text-sm">{section.label}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex-1 min-h-0 min-w-0 overflow-y-auto overflow-x-hidden">
          <div className="p-3 md:p-4 min-w-0 pb-[max(1.25rem,calc(env(safe-area-inset-bottom,0px)+1rem))]">
            {children}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full min-w-0">
      <aside className="w-72 flex-shrink-0 bg-black/35 backdrop-blur-md border-r border-white/10 p-5 overflow-y-auto">
        <h2 className="text-xl font-semibold tracking-tight text-white mb-3">{title}</h2>
        {subtitle && <p className="text-xs text-gray-400 mb-4">{subtitle}</p>}
        <nav className="space-y-1.5" role="tablist" aria-label="Settings sections">
          {sections.map(section => {
            const Icon = section.icon;
            const isActive = activeSection === section.id;
            return (
              <button
                key={section.id}
                onClick={() => onSectionChange(section.id)}
                role="tab"
                aria-selected={isActive}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-primary/70 ${sectionButtonClass(
                  isActive,
                )}`}
              >
                <Icon size={20} />
                <span className="flex-1 text-left text-sm">{section.label}</span>
              </button>
            );
          })}
        </nav>
      </aside>

      <main className="flex-1 min-h-0 min-w-0 overflow-y-auto overflow-x-hidden">
        <div className="p-5 lg:p-6 pb-16 min-w-0">{children}</div>
      </main>
    </div>
  );
};
