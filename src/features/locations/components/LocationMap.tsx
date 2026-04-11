"use client";

import React, { useCallback, useEffect, useRef } from 'react';
import type {
  Circle as LeafletCircleInstance,
  DivIcon,
  Map as LeafletMapInstance,
  Marker as LeafletMarkerInstance,
} from 'leaflet';

interface LocationMapProps {
  detectedLat?: number | null;
  detectedLng?: number | null;
  geofenceRadiusMeters?: number;
  countryCenter?: [number, number, number];
  onPinMoved?: (lat: number, lng: number) => void;
  className?: string;
}

type LeafletModule = typeof import('leaflet');

export function LocationMap({
  detectedLat,
  detectedLng,
  geofenceRadiusMeters = 100,
  countryCenter,
  onPinMoved,
  className = '',
}: LocationMapProps) {
  const mapRef = useRef<LeafletMapInstance | null>(null);
  const markerRef = useRef<LeafletMarkerInstance | null>(null);
  const circleRef = useRef<LeafletCircleInstance | null>(null);
  const geofenceRadiusRef = useRef(geofenceRadiusMeters);
  const containerRef = useRef<HTMLDivElement>(null);
  const initializedRef = useRef(false);

  useEffect(() => {
    geofenceRadiusRef.current = geofenceRadiusMeters;
  }, [geofenceRadiusMeters]);

  const syncGeofenceCircle = useCallback(
    (leafletModule: LeafletModule, map: LeafletMapInstance, lat: number, lng: number, radius: number) => {
      if (circleRef.current) {
        circleRef.current.setLatLng([lat, lng]);
        circleRef.current.setRadius(radius);
        return;
      }

      circleRef.current = leafletModule
        .circle([lat, lng], {
          radius,
          color: '#155DFC',
          weight: 2,
          opacity: 0.95,
          fillColor: '#155DFC',
          fillOpacity: 0.16,
        })
        .addTo(map);
    },
    [],
  );

  const dropPin = useCallback(
    (leafletModule: LeafletModule, map: LeafletMapInstance, lat: number, lng: number, radius: number) => {
      syncGeofenceCircle(leafletModule, map, lat, lng, radius);

      if (markerRef.current) {
        markerRef.current.setLatLng([lat, lng]);
        return;
      }

      const customIcon: DivIcon = leafletModule.divIcon({
        className: '',
        html: `
          <div style="
            display:flex;align-items:center;justify-content:center;
            width:40px;height:40px;border-radius:50% 50% 50% 0;
            background:#155DFC;transform:rotate(-45deg);
            box-shadow:0 10px 24px -8px rgba(21,93,252,0.58);
            border:2px solid white;
          ">
            <div style="width:10px;height:10px;border-radius:50%;background:white;transform:rotate(45deg);"></div>
          </div>`,
        iconSize: [40, 40],
        iconAnchor: [20, 40],
        popupAnchor: [0, -42],
      });

      const marker = leafletModule
        .marker([lat, lng], {
          icon: customIcon,
          draggable: Boolean(onPinMoved),
        })
        .addTo(map);

      if (onPinMoved) {
        marker.on('dragend', () => {
          const position = marker.getLatLng();
          syncGeofenceCircle(leafletModule, map, position.lat, position.lng, geofenceRadiusRef.current);
          onPinMoved(position.lat, position.lng);
        });
      }

      markerRef.current = marker;
    },
    [onPinMoved, syncGeofenceCircle],
  );

  useEffect(() => {
    if (initializedRef.current || !containerRef.current) return;
    initializedRef.current = true;

    let leafletModule: LeafletModule | null = null;

    const init = async () => {
      leafletModule = await import('leaflet');
      await import('leaflet/dist/leaflet.css');

      const L = leafletModule;

      // @ts-expect-error Leaflet's runtime icon helper is intentionally removed to supply explicit asset URLs.
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
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      mapRef.current = map;

      if (detectedLat != null && detectedLng != null) {
        dropPin(L, map, detectedLat, detectedLng, geofenceRadiusMeters);
      }
    };

    void init();

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markerRef.current = null;
        circleRef.current = null;
        initializedRef.current = false;
      }
      leafletModule = null;
    };
  }, [countryCenter, detectedLat, detectedLng, dropPin, geofenceRadiusMeters]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (detectedLat != null && detectedLng != null) {
      import('leaflet').then((leafletModule) => {
        dropPin(leafletModule, map, detectedLat, detectedLng, geofenceRadiusMeters);
        syncGeofenceCircle(leafletModule, map, detectedLat, detectedLng, geofenceRadiusMeters);
        map.flyTo([detectedLat, detectedLng], 16, { animate: true, duration: 1.2 });
      });
    }
  }, [detectedLat, detectedLng, dropPin, geofenceRadiusMeters, syncGeofenceCircle]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || detectedLat == null || detectedLng == null) return;

    import('leaflet').then((leafletModule) => {
      syncGeofenceCircle(leafletModule, map, detectedLat, detectedLng, geofenceRadiusMeters);
    });
  }, [detectedLat, detectedLng, geofenceRadiusMeters, syncGeofenceCircle]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || detectedLat != null) return;
    if (!countryCenter) return;

    map.flyTo([countryCenter[0], countryCenter[1]], countryCenter[2], {
      animate: true,
      duration: 1.0,
    });
  }, [countryCenter, detectedLat]);

  return (
    <div
      ref={containerRef}
      className={`w-full overflow-hidden rounded-2xl border border-[#D8E2F0] shadow-[0_24px_48px_-32px_rgba(15,23,42,0.35)] ${className}`}
      style={{ minHeight: 220 }}
    />
  );
}
