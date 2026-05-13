"use client";

import Link from 'next/link';
import { useI18n } from '@/common/i18n';
import { QR_TERMINAL_PAGE_BACKGROUND } from '@/features/locations/constants/qr-terminal';

export default function QrTerminalLandingPage() {
  const { t } = useI18n();

  return (
    <div className={`min-h-screen ${QR_TERMINAL_PAGE_BACKGROUND} px-6 py-10 sm:px-8`}>
      <div className="mx-auto max-w-3xl rounded-[28px] border border-[#D7E3FF] bg-white/90 p-8 shadow-[0_28px_80px_-32px_rgba(21,93,252,0.35)] backdrop-blur">
        <div className="inline-flex rounded-full border border-[#D7E3FF] bg-[#EEF4FF] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#155DFC]">
          {t('locations.qrLanding.eyebrow')}
        </div>

        <h1 className="mt-4 text-[30px] font-bold tracking-tight text-[#101828]">
          {t('locations.qrLanding.title')}
        </h1>
        <p className="mt-3 max-w-2xl text-[15px] leading-7 text-[#475467]">
          {t('locations.qrLanding.description')}
        </p>

        <div className="mt-8 rounded-[20px] border border-[#E4E7EC] bg-[#F8FAFC] p-5">
          <p className="text-[15px] font-semibold text-[#101828]">{t('locations.qrLanding.howToOpen')}</p>
          <ol className="mt-3 list-decimal space-y-2 pl-5 text-[14px] leading-6 text-[#475467]">
            <li>{t('locations.qrLanding.step1')}</li>
            <li>{t('locations.qrLanding.step2')}</li>
            <li>{t('locations.qrLanding.step3')}</li>
          </ol>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/dashboard/locations"
            className="inline-flex items-center rounded-[14px] bg-[#155DFC] px-5 py-3 text-[14px] font-semibold text-white transition-colors hover:bg-[#124dc8]"
          >
            {t('locations.qrLanding.goToLocations')}
          </Link>
        </div>
      </div>
    </div>
  );
}
