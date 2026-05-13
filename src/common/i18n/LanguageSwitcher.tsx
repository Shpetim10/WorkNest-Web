"use client";

import React, { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { useI18n } from './I18nProvider';
import { LANGUAGE_OPTIONS } from './locales';

type LanguageSwitcherProps = {
  className?: string;
};

function FlagIcon({ src, label, size = 'sm' }: { src: string; label: string; size?: 'sm' | 'md' }) {
  const dimensionClass = size === 'md' ? 'h-6 w-6' : 'h-5 w-5';

  return (
    <span
      aria-hidden="true"
      title={label}
      className={`${dimensionClass} inline-flex shrink-0 overflow-hidden rounded-full border border-gray-200 bg-cover bg-center bg-no-repeat`}
      style={{ backgroundImage: `url(${src})` }}
    />
  );
}

export function LanguageSwitcher({ className = '' }: LanguageSwitcherProps) {
  const { locale, setLocale, t } = useI18n();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const currentOption = LANGUAGE_OPTIONS.find((option) => option.locale === locale) ?? LANGUAGE_OPTIONS[0];
  const currentLabel = t(currentOption.labelKey);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className={`relative inline-flex ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={t('language.select')}
        title={t('language.select')}
        className="flex h-9 items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 text-gray-600 shadow-sm transition-colors hover:border-gray-300 hover:text-gray-800"
      >
        <FlagIcon src={currentOption.flagSrc} label={currentLabel} size="md" />
        <span className="hidden text-[12px] font-semibold sm:inline">{currentLabel}</span>
        <span className="text-[12px] font-semibold uppercase sm:hidden">{locale}</span>
        <ChevronDown size={14} strokeWidth={2.2} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div
          role="listbox"
          aria-label={t('language.select')}
          className="absolute right-0 top-full z-[300] mt-2 w-44 overflow-hidden rounded-xl border border-gray-100 bg-white py-1 shadow-xl"
        >
          {LANGUAGE_OPTIONS.map((option) => {
            const label = t(option.labelKey);
            const selected = option.locale === locale;

            return (
              <button
                key={option.locale}
                type="button"
                role="option"
                aria-selected={selected}
                onClick={() => {
                  setLocale(option.locale);
                  setOpen(false);
                }}
                className={`flex w-full items-center gap-2.5 px-3 py-2 text-left text-[13px] font-semibold transition-colors ${
                  selected
                    ? 'bg-blue-50 text-[#155DFC]'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <FlagIcon src={option.flagSrc} label={label} />
                <span className="flex-1">{label}</span>
                {selected && <Check size={14} strokeWidth={2.4} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
