import Link from 'next/link';
import { QR_TERMINAL_PAGE_BACKGROUND } from '@/features/locations/constants/qr-terminal';

export default function QrTerminalLandingPage() {
  return (
    <div className={`min-h-screen ${QR_TERMINAL_PAGE_BACKGROUND} px-6 py-10 sm:px-8`}>
      <div className="mx-auto max-w-3xl rounded-[28px] border border-[#D7E3FF] bg-white/90 p-8 shadow-[0_28px_80px_-32px_rgba(21,93,252,0.35)] backdrop-blur">
        <div className="inline-flex rounded-full border border-[#D7E3FF] bg-[#EEF4FF] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#155DFC]">
          Locations
        </div>

        <h1 className="mt-4 text-[30px] font-bold tracking-tight text-[#101828]">
          QR Terminal Display
        </h1>
        <p className="mt-3 max-w-2xl text-[15px] leading-7 text-[#475467]">
          QR terminal displays are opened per site terminal. Choose a location first, then open a
          linked QR terminal from its details view.
        </p>

        <div className="mt-8 rounded-[20px] border border-[#E4E7EC] bg-[#F8FAFC] p-5">
          <p className="text-[15px] font-semibold text-[#101828]">How to open a display</p>
          <ol className="mt-3 list-decimal space-y-2 pl-5 text-[14px] leading-6 text-[#475467]">
            <li>Open the locations list.</li>
            <li>Select a site and open its details.</li>
            <li>In the linked QR terminals section, open the display terminal you want.</li>
          </ol>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/dashboard/locations"
            className="inline-flex items-center rounded-[14px] bg-[#155DFC] px-5 py-3 text-[14px] font-semibold text-white transition-colors hover:bg-[#124dc8]"
          >
            Go to Locations
          </Link>
        </div>
      </div>
    </div>
  );
}
