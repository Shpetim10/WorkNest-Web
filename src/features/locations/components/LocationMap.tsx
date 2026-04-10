"use client";

import React, { useEffect, useRef } from 'react';

interface LocationMapProps {
  /** Center the map here when provided (detected or dragged coords) */
  detectedLat?: number | null;
  detectedLng?: number | null;
  /** Country-level fallback centre [lat, lng, zoom] */
  countryCenter?: [number, number, number];
  /** Called when user drags the pin to a new position */
  onPinMoved?: (lat: number, lng: number) => void;
  className?: string;
}

/**
 * Interactive Leaflet / OpenStreetMap component.
 *
 * - No Google API key required – uses OSM tiles (free, open-source)
 * - Uses dynamic import to avoid SSR issues with Leaflet's window references
 * - Shows country-level view when no coordinates are detected yet
 * - Shows precise pin at detected coordinates, draggable for manual correction
 */
export function LocationMap({
  detectedLat,
  detectedLng,
  countryCenter,
  onPinMoved,
  className = '',
}: LocationMapProps) {
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const initializedRef = useRef(false);

  // Bootstrap Leaflet once the component mounts (client-only)
  useEffect(() => {
    if (initializedRef.current || !containerRef.current) return;
    initializedRef.current = true;

    let L: any;

    const init = async () => {
      L = (await import('leaflet')).default;
      await import('leaflet/dist/leaflet.css');

      // Fix default icon path broken by webpack
      // @ts-ignore
      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      const defaultCenter = countryCenter ?? [20, 0, 2];
      const map = L.map(containerRef.current!, {
        center: [defaultCenter[0], defaultCenter[1]],
        zoom: defaultCenter[2],
        zoomControl: true,
        attributionControl: true,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      mapRef.current = map;

      // If coordinates already exist (edit mode), drop pin immediately
      if (detectedLat != null && detectedLng != null) {
        dropPin(L, map, detectedLat, detectedLng);
      }
    };

    void init();

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markerRef.current = null;
        initializedRef.current = false;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // React to coordinate changes after mount (e.g. detection button pressed)
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (detectedLat != null && detectedLng != null) {
      import('leaflet').then(({ default: L }) => {
        dropPin(L, map, detectedLat!, detectedLng!);
        map.flyTo([detectedLat, detectedLng], 16, { animate: true, duration: 1.2 });
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [detectedLat, detectedLng]);

  // React to country changes (before detection)
  useEffect(() => {
    const map = mapRef.current;
    if (!map || detectedLat != null) return;
    if (!countryCenter) return;

    map.flyTo([countryCenter[0], countryCenter[1]], countryCenter[2], {
      animate: true,
      duration: 1.0,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countryCenter]);

  const dropPin = (L: any, map: any, lat: number, lng: number) => {
    if (markerRef.current) {
      markerRef.current.setLatLng([lat, lng]);
      return;
    }

    const customIcon = L.divIcon({
      className: '',
      html: `
        <div style="
          display:flex;align-items:center;justify-content:center;
          width:40px;height:40px;border-radius:50% 50% 50% 0;
          background:#155DFC;transform:rotate(-45deg);
          box-shadow:0 4px 16px -4px rgba(21,93,252,0.5);
          border:2px solid white;
        ">
          <div style="width:10px;height:10px;border-radius:50%;background:white;transform:rotate(45deg);"></div>
        </div>`,
      iconSize: [40, 40],
      iconAnchor: [20, 40],
      popupAnchor: [0, -42],
    });

    const marker = L.marker([lat, lng], {
      icon: customIcon,
      draggable: !!onPinMoved,
    }).addTo(map);

    if (onPinMoved) {
      marker.on('dragend', () => {
        const pos = marker.getLatLng();
        onPinMoved(pos.lat, pos.lng);
      });
    }

    markerRef.current = marker;
  };

  return (
    <div
      ref={containerRef}
      className={`w-full rounded-2xl overflow-hidden border border-[#EAECF0] ${className}`}
      style={{ minHeight: 220 }}
    />
  );
}
