import { z } from 'zod';
import { TIMEZONES } from '../constants/timezones';
import {
  CompanySiteFormValues,
  LocationFormErrors,
  LocationStep2Errors,
  LocationStep3Errors,
} from '../types';
import { hasTrustedNetworkInput } from './mappers';

const SITE_CODE_PATTERN = /^[A-Z0-9_-]+$/;
const TIMEZONE_VALUES = new Set(TIMEZONES.map((timezone) => timezone.value));

export type FlatLocationFormErrors = Record<string, string>;

const trustedNetworkSchema = z.object({
  id: z.string().nullable(),
  name: z.string(),
  networkType: z.string(),
  cidrBlock: z.string(),
  ipVersion: z.string(),
  detectedIp: z.string(),
  confidence: z.string(),
  torExitNode: z.boolean(),
  vpnDetected: z.boolean(),
  cgnatDetected: z.boolean(),
  setExpiry: z.boolean(),
  expiryDate: z.string(),
  notes: z.string(),
  priorityOrder: z.string(),
  version: z.number().nullable(),
});

function isValidTimeZone(value: string) {
  if (TIMEZONE_VALUES.has(value)) {
    return true;
  }

  try {
    new Intl.DateTimeFormat('en-US', { timeZone: value });
    return true;
  } catch {
    return false;
  }
}

function parsePriorityOrder(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const parsed = Number(trimmed);
  return Number.isInteger(parsed) ? parsed : Number.NaN;
}

function isFutureDate(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return true;
  }

  const parsed = Date.parse(trimmed);
  return Number.isFinite(parsed) && parsed > Date.now();
}

const companySiteSchema = z
  .object({
    basicInfo: z.object({
      siteType: z.string().trim().min(1, 'Site type is required'),
      siteName: z.string().trim().min(1, 'Site name is required').max(255, 'Site name must be 255 characters or fewer'),
      siteCode: z
        .string()
        .trim()
        .min(1, 'Site code is required')
        .max(50, 'Site code must be 50 characters or fewer')
        .regex(SITE_CODE_PATTERN, 'Site code may only contain uppercase letters, numbers, underscores, and hyphens'),
      country: z.string().trim().length(2, 'Country code must be exactly 2 characters'),
      timezone: z
        .string()
        .trim()
        .min(1, 'Timezone is required')
        .max(100, 'Timezone must be 100 characters or fewer')
        .refine(isValidTimeZone, 'Enter a valid IANA timezone'),
      notes: z.string(),
    }),
    location: z.object({
      addressLine1: z.string().max(255, 'Address line 1 must be 255 characters or fewer'),
      addressLine2: z.string().max(255, 'Address line 2 must be 255 characters or fewer'),
      city: z.string().max(100, 'City must be 100 characters or fewer'),
      stateRegion: z.string().max(100, 'State or region must be 100 characters or fewer'),
      postalCode: z.string().max(30, 'Postal code must be 30 characters or fewer'),
      latitude: z.number().min(-90, 'Latitude must be between -90 and 90').max(90, 'Latitude must be between -90 and 90').nullable(),
      longitude: z
        .number()
        .min(-180, 'Longitude must be between -180 and 180')
        .max(180, 'Longitude must be between -180 and 180')
        .nullable(),
      geofenceShapeType: z.enum(['CIRCLE', 'POLYGON']),
      geofenceRadius: z.number(),
      geofencePolygonGeoJson: z.string(),
      detectedAccuracy: z.number().nullable(),
      browserTimestampMs: z.number().nullable(),
      locationDetected: z.boolean(),
      advancedSettings: z.object({
        entryBuffer: z.number().min(0, 'Entry buffer must be 0 or greater'),
        exitBuffer: z.number().min(0, 'Exit buffer must be 0 or greater'),
        maxAccuracy: z.number().min(1, 'Max accuracy must be at least 1 meter'),
      }),
    }),
    attendanceRules: z.object({
      requireQr: z.boolean(),
      requireLocation: z.boolean(),
      checkInEnabled: z.boolean(),
      checkOutEnabled: z.boolean(),
      useNetworkAsWarning: z.boolean(),
      rejectOutsideGeofence: z.boolean(),
      rejectPoorAccuracy: z.boolean(),
      allowManualCorrection: z.boolean(),
      allowManagerManualEntry: z.boolean(),
      missingCheckoutAutoCloseEnabled: z.boolean(),
      autoCheckoutAfterMinutes: z.number().nullable(),
      lateGraceMinutes: z.number(),
      earlyClockInWindowMinutes: z.number(),
    }),
    trustedNetworks: z.array(trustedNetworkSchema),
  })
  .superRefine((value, ctx) => {
    if (value.location.latitude == null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Latitude is required',
        path: ['location', 'latitude'],
      });
    }

    if (value.location.longitude == null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Longitude is required',
        path: ['location', 'longitude'],
      });
    }

    if (value.location.geofenceShapeType === 'CIRCLE') {
      if (!Number.isFinite(value.location.geofenceRadius) || value.location.geofenceRadius < 10) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Geofence radius must be at least 10 meters',
          path: ['location', 'geofenceRadius'],
        });
      }
    }

    if (value.location.geofenceShapeType === 'POLYGON') {
      const polygon = value.location.geofencePolygonGeoJson.trim();
      if (!polygon) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Polygon GeoJSON is required for polygon geofences',
          path: ['location', 'geofencePolygonGeoJson'],
        });
      } else {
        if (!polygon.startsWith('{')) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Polygon GeoJSON must start with {',
            path: ['location', 'geofencePolygonGeoJson'],
          });
        }
        if (polygon.length > 65535) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Polygon GeoJSON must be 65535 characters or fewer',
            path: ['location', 'geofencePolygonGeoJson'],
          });
        }
      }
    }

    if (!Number.isInteger(value.attendanceRules.lateGraceMinutes) || value.attendanceRules.lateGraceMinutes < 0 || value.attendanceRules.lateGraceMinutes > 300) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Late grace minutes must be an integer between 0 and 300',
        path: ['attendanceRules', 'lateGraceMinutes'],
      });
    }

    if (!Number.isInteger(value.attendanceRules.earlyClockInWindowMinutes) || value.attendanceRules.earlyClockInWindowMinutes < 0 || value.attendanceRules.earlyClockInWindowMinutes > 300) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Early clock-in window must be an integer between 0 and 300',
        path: ['attendanceRules', 'earlyClockInWindowMinutes'],
      });
    }

    if (value.attendanceRules.missingCheckoutAutoCloseEnabled) {
      if (
        value.attendanceRules.autoCheckoutAfterMinutes == null ||
        !Number.isInteger(value.attendanceRules.autoCheckoutAfterMinutes) ||
        value.attendanceRules.autoCheckoutAfterMinutes < 1 ||
        value.attendanceRules.autoCheckoutAfterMinutes > 1440
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Auto check-out minutes must be an integer between 1 and 1440',
          path: ['attendanceRules', 'autoCheckoutAfterMinutes'],
        });
      }
    }

    const seenNetworkKeys = new Map<string, number>();
    value.trustedNetworks.forEach((network, index) => {
      if (!hasTrustedNetworkInput(network)) {
        return;
      }

      if (!network.name.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Network name is required',
          path: ['trustedNetworks', index, 'name'],
        });
      } else if (network.name.trim().length > 100) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Network name must be 100 characters or fewer',
          path: ['trustedNetworks', index, 'name'],
        });
      }

      if (!network.networkType.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Network type is required',
          path: ['trustedNetworks', index, 'networkType'],
        });
      }

      if (!network.cidrBlock.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'CIDR block is required',
          path: ['trustedNetworks', index, 'cidrBlock'],
        });
      } else if (network.cidrBlock.trim().length > 100) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'CIDR block must be 100 characters or fewer',
          path: ['trustedNetworks', index, 'cidrBlock'],
        });
      }

      if (!network.ipVersion.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'IP version is required',
          path: ['trustedNetworks', index, 'ipVersion'],
        });
      }

      const priorityOrder = parsePriorityOrder(network.priorityOrder);
      if (priorityOrder == null || Number.isNaN(priorityOrder) || priorityOrder < 1 || priorityOrder > 999) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Priority order must be an integer between 1 and 999',
          path: ['trustedNetworks', index, 'priorityOrder'],
        });
      }

      if (network.expiryDate.trim() && !isFutureDate(network.expiryDate)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Expiry date must be in the future',
          path: ['trustedNetworks', index, 'expiryDate'],
        });
      }

      const duplicateKey = `${network.cidrBlock.trim().toLowerCase()}::${network.networkType.trim().toLowerCase()}`;
      if (!network.cidrBlock.trim() || !network.networkType.trim()) {
        return;
      }

      const firstIndex = seenNetworkKeys.get(duplicateKey);
      if (firstIndex == null) {
        seenNetworkKeys.set(duplicateKey, index);
        return;
      }

      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Duplicate network type and CIDR block combinations are not allowed',
        path: ['trustedNetworks', firstIndex, 'cidrBlock'],
      });
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Duplicate network type and CIDR block combinations are not allowed',
        path: ['trustedNetworks', index, 'cidrBlock'],
      });
    });
  });

function pathToString(path: Array<string | number | symbol>) {
  let result = '';

  path.forEach((segment) => {
    if (typeof segment === 'symbol') {
      return;
    }

    if (typeof segment === 'number') {
      result = `${result}[${segment}]`;
      return;
    }

    result = result ? `${result}.${segment}` : segment;
  });

  return result;
}

function pickFirst(flatErrors: FlatLocationFormErrors, path: string) {
  return flatErrors[path];
}

function toFlatErrors(values: CompanySiteFormValues) {
  const parsed = companySiteSchema.safeParse(values);
  if (parsed.success) {
    return {};
  }

  const flatErrors: FlatLocationFormErrors = {};
  parsed.error.issues.forEach((issue) => {
    const path = pathToString(issue.path);
    if (!path || flatErrors[path]) {
      return;
    }

    flatErrors[path] = issue.message;
  });

  return flatErrors;
}

export function validateCompanySiteForm(values: CompanySiteFormValues) {
  return companySiteSchema.safeParse(values);
}

export function getCompanySiteFormErrors(values: CompanySiteFormValues) {
  return toFlatErrors(values);
}

export function validateStep1(values: CompanySiteFormValues) {
  const flatErrors = toFlatErrors(values);
  const errors: LocationFormErrors = {};

  errors.siteType = pickFirst(flatErrors, 'basicInfo.siteType');
  errors.siteName = pickFirst(flatErrors, 'basicInfo.siteName');
  errors.siteCode = pickFirst(flatErrors, 'basicInfo.siteCode');
  errors.country = pickFirst(flatErrors, 'basicInfo.country');
  errors.timezone = pickFirst(flatErrors, 'basicInfo.timezone');
  errors.requireQr = pickFirst(flatErrors, 'attendanceRules.requireQr');
  errors.requireLocation = pickFirst(flatErrors, 'attendanceRules.requireLocation');
  errors.checkInEnabled = pickFirst(flatErrors, 'attendanceRules.checkInEnabled');
  errors.checkOutEnabled = pickFirst(flatErrors, 'attendanceRules.checkOutEnabled');
  errors.useNetworkAsWarning = pickFirst(flatErrors, 'attendanceRules.useNetworkAsWarning');
  errors.rejectOutsideGeofence = pickFirst(flatErrors, 'attendanceRules.rejectOutsideGeofence');
  errors.rejectPoorAccuracy = pickFirst(flatErrors, 'attendanceRules.rejectPoorAccuracy');
  errors.allowManualCorrection = pickFirst(flatErrors, 'attendanceRules.allowManualCorrection');
  errors.allowManagerManualEntry = pickFirst(flatErrors, 'attendanceRules.allowManagerManualEntry');
  errors.missingCheckoutAutoCloseEnabled = pickFirst(flatErrors, 'attendanceRules.missingCheckoutAutoCloseEnabled');
  errors.autoCheckoutAfterMinutes = pickFirst(flatErrors, 'attendanceRules.autoCheckoutAfterMinutes');
  errors.lateGraceMinutes = pickFirst(flatErrors, 'attendanceRules.lateGraceMinutes');
  errors.earlyClockInWindowMinutes = pickFirst(flatErrors, 'attendanceRules.earlyClockInWindowMinutes');

  return Object.fromEntries(
    Object.entries(errors).filter(([, message]) => Boolean(message)),
  ) as LocationFormErrors;
}

export function validateStep2(values: CompanySiteFormValues) {
  const flatErrors = toFlatErrors(values);
  const errors: LocationStep2Errors = {};

  errors.addressLine1 = pickFirst(flatErrors, 'location.addressLine1');
  errors.addressLine2 = pickFirst(flatErrors, 'location.addressLine2');
  errors.city = pickFirst(flatErrors, 'location.city');
  errors.stateRegion = pickFirst(flatErrors, 'location.stateRegion');
  errors.postalCode = pickFirst(flatErrors, 'location.postalCode');
  errors.latitude = pickFirst(flatErrors, 'location.latitude');
  errors.longitude = pickFirst(flatErrors, 'location.longitude');
  errors.geofenceShapeType = pickFirst(flatErrors, 'location.geofenceShapeType');
  errors.geofenceRadius = pickFirst(flatErrors, 'location.geofenceRadius');
  errors.geofencePolygonGeoJson = pickFirst(flatErrors, 'location.geofencePolygonGeoJson');
  errors.entryBuffer = pickFirst(flatErrors, 'location.advancedSettings.entryBuffer');
  errors.exitBuffer = pickFirst(flatErrors, 'location.advancedSettings.exitBuffer');
  errors.maxAccuracy = pickFirst(flatErrors, 'location.advancedSettings.maxAccuracy');
  errors.coordinates = errors.latitude ?? errors.longitude;

  return Object.fromEntries(
    Object.entries(errors).filter(([, message]) => Boolean(message)),
  ) as LocationStep2Errors;
}

export function validateStep3(values: CompanySiteFormValues) {
  const flatErrors = toFlatErrors(values);
  const errors: LocationStep3Errors = {};

  errors.networkName = pickFirst(flatErrors, 'trustedNetworks[0].name');
  errors.networkType = pickFirst(flatErrors, 'trustedNetworks[0].networkType');
  errors.cidrBlock = pickFirst(flatErrors, 'trustedNetworks[0].cidrBlock');
  errors.ipVersion = pickFirst(flatErrors, 'trustedNetworks[0].ipVersion');
  errors.priorityOrder = pickFirst(flatErrors, 'trustedNetworks[0].priorityOrder');
  errors.expiryDate = pickFirst(flatErrors, 'trustedNetworks[0].expiryDate');

  return Object.fromEntries(
    Object.entries(errors).filter(([, message]) => Boolean(message)),
  ) as LocationStep3Errors;
}
