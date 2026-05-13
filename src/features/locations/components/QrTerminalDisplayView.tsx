"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { AlertCircle, Expand, Loader2, RefreshCw, Shrink } from 'lucide-react';
import { Button } from '@/common/ui';
import { useI18n } from '@/common/i18n';
import { fetchCurrentQrToken, refreshCurrentQrToken } from '../api';
import { QR_TERMINAL_PAGE_BACKGROUND } from '../constants/qr-terminal';
import { CurrentQrToken } from '../types';
import { formatAttendanceFriendlyError } from '../utils/errors';

interface QrTerminalDisplayViewProps {
  terminalId: string;
  terminalName?: string | null;
  siteName?: string | null;
}

const POLL_INTERVAL_MS = 25000;
const LOW_REMAINING_THRESHOLD_MS = 10000;
const REFRESH_AHEAD_MS = 5000;

function formatCountdown(ms: number) {
  const seconds = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

async function toQrDataUrl(token: string) {
  return QRCode.toDataURL(token, {
    errorCorrectionLevel: 'M',
    margin: 2,
    width: 520,
    color: {
      dark: '#111827',
      light: '#FFFFFF',
    },
  });
}

export function QrTerminalDisplayView({
  terminalId,
  terminalName,
  siteName,
}: QrTerminalDisplayViewProps) {
  const { t } = useI18n();
  const [qrData, setQrData] = useState<CurrentQrToken | null>(null);
  const [qrImage, setQrImage] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [bannerMessage, setBannerMessage] = useState('');
  const [now, setNow] = useState(() => Date.now());
  const [isFullscreen, setIsFullscreen] = useState(false);

  const mountedRef = useRef(true);
  const requestInFlightRef = useRef(false);
  const qrDataRef = useRef<CurrentQrToken | null>(null);
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const expiryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearExpiryTimeout = useCallback(() => {
    if (expiryTimeoutRef.current) {
      clearTimeout(expiryTimeoutRef.current);
      expiryTimeoutRef.current = null;
    }
  }, []);

  const clearPolling = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
    clearExpiryTimeout();
  }, [clearExpiryTimeout]);

  const applyToken = useCallback(async (tokenData: CurrentQrToken) => {
    const image = await toQrDataUrl(tokenData.token);
    if (!mountedRef.current) return;

    qrDataRef.current = tokenData;
    setQrData(tokenData);
    setQrImage(image);
    setErrorMessage('');
  }, []);

  const loadToken = useCallback(
    async (mode: 'initial' | 'poll' | 'manual' = 'poll') => {
      if (requestInFlightRef.current) {
        return;
      }

      requestInFlightRef.current = true;
      if (mode === 'initial') {
        setLoading(true);
      }
      if (mode === 'manual') {
        setRefreshing(true);
      }

      try {
        const tokenData =
          mode === 'manual'
            ? await refreshCurrentQrToken(terminalId)
            : await fetchCurrentQrToken(terminalId);
        await applyToken(tokenData);
        setBannerMessage(mode === 'manual' ? t('locations.qrDisplay.refreshed') : '');
      } catch (error) {
        if (!mountedRef.current) return;

        setQrData((prev) => {
          if (!prev) return null;
          const next = new Date(prev.expiresAt).getTime() <= Date.now() ? null : prev;
          qrDataRef.current = next;
          return next;
        });
        setQrImage((prev) => {
          const currentQrData = qrDataRef.current;
          if (!currentQrData) return '';
          return new Date(currentQrData.expiresAt).getTime() <= Date.now() ? '' : prev;
        });
        setErrorMessage(
          mode === 'manual'
            ? t('locations.qrDisplay.refreshFailed')
            : formatAttendanceFriendlyError(error, t('locations.qrDisplay.loadFailed')),
        );
      } finally {
        requestInFlightRef.current = false;
        if (!mountedRef.current) return;
        setLoading(false);
        setRefreshing(false);
      }
    },
    [applyToken, terminalId, t],
  );

  useEffect(() => {
    mountedRef.current = true;
    void loadToken('initial');
    pollIntervalRef.current = setInterval(() => {
      void loadToken('poll');
    }, POLL_INTERVAL_MS);

    return () => {
      mountedRef.current = false;
      clearPolling();
    };
  }, [clearPolling, loadToken]);

  useEffect(() => {
    const tick = setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => clearInterval(tick);
  }, []);

  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };

    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', onFullscreenChange);
    };
  }, []);

  useEffect(() => {
    clearExpiryTimeout();
    if (!qrData) return;

    const remainingMs = new Date(qrData.expiresAt).getTime() - now;
    if (remainingMs <= 0) {
      setQrImage('');
      void loadToken('poll');
      return;
    }

    if (remainingMs <= LOW_REMAINING_THRESHOLD_MS) {
      const timeoutMs = Math.max(1000, remainingMs - 1000);
      expiryTimeoutRef.current = setTimeout(() => {
        void loadToken('poll');
      }, timeoutMs);
      return;
    }

    expiryTimeoutRef.current = setTimeout(() => {
      void loadToken('poll');
    }, Math.max(1000, remainingMs - REFRESH_AHEAD_MS));
  }, [clearExpiryTimeout, loadToken, now, qrData]);

  const remainingMs = qrData ? new Date(qrData.expiresAt).getTime() - now : 0;
  const isExpired = !qrData || remainingMs <= 0;

  const terminalLabel = terminalName || t('locations.qrDisplay.terminalFallback');
  const siteLabel = siteName || (qrData?.siteId ? t('locations.qrDisplay.siteId', { id: qrData.siteId }) : t('locations.qrDisplay.siteFallback'));

  const statusText = useMemo(() => {
    if (loading) return t('locations.qrDisplay.loadingCurrent');
    if (errorMessage) return errorMessage;
    if (isExpired) return t('locations.qrDisplay.unavailableRequesting');
    return t('locations.qrDisplay.readyForScans');
  }, [errorMessage, isExpired, loading, t]);

  const toggleFullscreen = async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await document.documentElement.requestFullscreen();
      }
    } catch {
      setBannerMessage(t('locations.qrDisplay.fullscreenUnavailable'));
    }
  };

  return (
    <div className={`min-h-screen ${QR_TERMINAL_PAGE_BACKGROUND} px-4 py-6 text-[#101828] sm:px-8`}>
      <div className="mx-auto flex w-full max-w-[1080px] flex-col gap-6">
        <div className="flex flex-col justify-between gap-4 rounded-[28px] border border-white/70 bg-white/85 px-6 py-5 shadow-[0_20px_60px_-25px_rgba(21,93,252,0.35)] backdrop-blur sm:flex-row sm:items-center">
          <div>
            <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-[#155DFC]">{t('locations.qrDisplay.title')}</p>
            <h1 className="mt-1 text-[28px] font-bold tracking-tight text-[#101828]">{terminalLabel}</h1>
            <p className="mt-1 text-[14px] font-medium text-[#4A5565]">{siteLabel}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button
              variant="secondary"
              onClick={() => void loadToken('manual')}
              isLoading={refreshing}
              className="bg-white text-[#155DFC] hover:bg-[#EFF6FF]"
              icon={<RefreshCw size={16} />}
              iconPosition="left"
            >
              {t('locations.qrDisplay.refreshNow')}
            </Button>
            <Button
              variant="secondary"
              onClick={() => void toggleFullscreen()}
              className="bg-white text-[#155DFC] hover:bg-[#EFF6FF]"
              icon={isFullscreen ? <Shrink size={16} /> : <Expand size={16} />}
              iconPosition="left"
            >
              {isFullscreen ? t('locations.qrDisplay.exitFullscreen') : t('locations.qrDisplay.fullscreen')}
            </Button>
          </div>
        </div>

        {bannerMessage && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-[13px] font-medium text-emerald-700">
            {bannerMessage}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="rounded-[32px] border border-white/70 bg-white p-6 shadow-[0_30px_80px_-30px_rgba(16,24,40,0.35)]">
            <div className="flex min-h-[520px] flex-col items-center justify-center rounded-[28px] border border-dashed border-[#D0D5DD] bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] p-6 text-center">
              {loading ? (
                <div className="flex flex-col items-center gap-4">
                  <Loader2 className="h-10 w-10 animate-spin text-[#155DFC]" />
                  <p className="text-[16px] font-semibold text-[#364153]">{t('locations.qrDisplay.loadingCurrent')}</p>
                </div>
              ) : !isExpired && qrImage ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={qrImage}
                    alt={t('locations.qrDisplay.qrAlt')}
                    className="h-auto w-full max-w-[420px] rounded-[24px] border border-[#E5E7EB] bg-white p-5 shadow-sm"
                    style={{ imageRendering: 'pixelated' }}
                  />
                  <div className="mt-6 rounded-full bg-[#ECFDF3] px-4 py-2 text-[13px] font-semibold text-[#027A48]">
                    {t('locations.qrDisplay.validFor', { time: formatCountdown(remainingMs) })}
                  </div>
                </>
              ) : (
                <div className="flex max-w-[420px] flex-col items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-rose-50 text-rose-600">
                    <AlertCircle size={28} />
                  </div>
                  <h2 className="text-[22px] font-bold text-[#101828]">{t('locations.qrDisplay.unavailableTitle')}</h2>
                  <p className="text-[15px] font-medium leading-6 text-[#4A5565]">{statusText}</p>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-[28px] border border-white/70 bg-white p-5 shadow-[0_20px_60px_-30px_rgba(16,24,40,0.3)]">
              <p className="text-[12px] font-semibold uppercase tracking-[0.1em] text-[#155DFC]">{t('locations.qrDisplay.status')}</p>
              <p className="mt-3 text-[20px] font-bold text-[#101828]">{isExpired ? t('locations.qrDisplay.refreshingQr') : t('locations.qrDisplay.liveQrActive')}</p>
              <p className="mt-2 text-[14px] font-medium leading-6 text-[#4A5565]">{statusText}</p>
            </div>

            <div className="rounded-[28px] border border-white/70 bg-white p-5 shadow-[0_20px_60px_-30px_rgba(16,24,40,0.3)]">
              <p className="text-[12px] font-semibold uppercase tracking-[0.1em] text-[#155DFC]">{t('locations.qrDisplay.rotation')}</p>
              <div className="mt-4 space-y-3 text-[14px] font-medium text-[#364153]">
                <div className="flex items-center justify-between">
                  <span>{t('locations.qrDisplay.rotationSeconds')}</span>
                  <span className="font-bold text-[#101828]">{qrData?.rotationSeconds ?? '--'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>{t('locations.qrDisplay.expiresIn')}</span>
                  <span className="font-bold text-[#101828]">{isExpired ? t('locations.qrDisplay.expired') : formatCountdown(remainingMs)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>{t('locations.qrDisplay.issuedAt')}</span>
                  <span className="font-bold text-[#101828]">
                    {qrData ? new Date(qrData.issuedAt).toLocaleTimeString() : '--'}
                  </span>
                </div>
              </div>
            </div>

            <div className="rounded-[28px] border border-[#D6E4FF] bg-[#F8FBFF] p-5 text-[13px] font-medium leading-6 text-[#4A5565] shadow-[0_20px_60px_-30px_rgba(21,93,252,0.25)]">
              {t('locations.qrDisplay.tokenPrivacyNote')}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
