import { z } from 'zod';
import {
  CompanySiteFormValues,
  LocationFormErrors,
  LocationStep2Errors,
  LocationStep3Errors,
} from '../types';
import { hasTrustedNetworkInput } from './mappers';

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

const companySiteSchema = z
  .object({
    basicInfo: z.object({
      siteType: z.string().trim().min(1, 'Site type is required'),
      siteName: z.string().trim().min(1, 'Site name is required'),
      siteCode: z.string().trim().min(1, 'Site code is required'),
      country: z.string().trim().min(1, 'Country is required'),
      timezone: z.string().trim().min(1, 'Timezone is required'),
      notes: z.string(),
    }),
    location: z.object({
      addressLine1: z.string(),
      addressLine2: z.string(),
      city: z.string(),
      stateRegion: z.string(),
      postalCode: z.string(),
      latitude: z.number().min(-90, 'Latitude must be between -90 and 90').max(90, 'Latitude must be between -90 and 90').nullable(),
      longitude: z
        .number()
        .min(-180, 'Longitude must be between -180 and 180')
        .max(180, 'Longitude must be between -180 and 180')
        .nullable(),
      geofenceShapeType: z.enum(['CIRCLE', 'POLYGON']),
      geofenceRadius: z.number().int().positive('Radius must be a positive integer'),
      geofencePolygonGeoJson: z.string(),
      detectedAccuracy: z.number().nullable(),
      browserTimestampMs: z.number().nullable(),
      locationDetected: z.boolean(),
      advancedSettings: z.object({
        entryBuffer: z.number().min(0, 'Entry buffer must be 0 or greater'),
        exitBuffer: z.number().min(0, 'Exit buffer must be 0 or greater'),
        maxAccuracy: z.number().min(0, 'Max accuracy must be 0 or greater'),
      }),
    }),
    attendanceRules: z.object({
      locationRequired: z.boolean(),
      qrEnabled: z.boolean(),
      checkInEnabled: z.boolean(),
      checkOutEnabled: z.boolean(),
    }),
    trustedNetworks: z.array(trustedNetworkSchema),
  })
  .superRefine((value, ctx) => {
    if (value.attendanceRules.locationRequired) {
      if (!value.location.addressLine1.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Address is required',
          path: ['location', 'addressLine1'],
        });
      }

      if (!value.location.city.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'City is required',
          path: ['location', 'city'],
        });
      }

      if (value.location.latitude == null || value.location.longitude == null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Coordinates are required when location is required.',
          path: ['location', 'latitude'],
        });
      }

      if (value.location.geofenceShapeType === 'POLYGON' && !value.location.geofencePolygonGeoJson.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Polygon GeoJSON is required for polygon geofences.',
          path: ['location', 'geofencePolygonGeoJson'],
        });
      }
    }

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
      }

      if (!network.cidrBlock.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'CIDR block is required',
          path: ['trustedNetworks', index, 'cidrBlock'],
        });
      }

      if (network.setExpiry && network.expiryDate && Number.isNaN(Date.parse(network.expiryDate))) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Expiry date must be a valid date',
          path: ['trustedNetworks', index, 'expiryDate'],
        });
      }
    });
  });

export function validateCompanySiteForm(values: CompanySiteFormValues) {
  return companySiteSchema.safeParse(values);
}

export function validateStep1(values: CompanySiteFormValues) {
  const parsed = validateCompanySiteForm(values);
  const errors: LocationFormErrors = {};

  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      if (issue.path[0] !== 'basicInfo') {
        continue;
      }

      const field = issue.path[1];
      if (field === 'siteType') errors.siteType = issue.message;
      if (field === 'siteName') errors.siteName = issue.message;
      if (field === 'siteCode') errors.siteCode = issue.message;
      if (field === 'country') errors.country = issue.message;
      if (field === 'timezone') errors.timezone = issue.message;
    }
  }

  return errors;
}

export function validateStep2(values: CompanySiteFormValues) {
  const parsed = validateCompanySiteForm(values);
  const errors: LocationStep2Errors = {};

  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      if (issue.path[0] !== 'location') {
        continue;
      }

      const field = issue.path[1];
      if (field === 'addressLine1') errors.addressLine1 = issue.message;
      if (field === 'city') errors.city = issue.message;
      if (field === 'stateRegion') errors.stateRegion = issue.message;
      if (field === 'postalCode') errors.postalCode = issue.message;
      if (field === 'latitude' || field === 'longitude') errors.coordinates = issue.message;
      if (field === 'geofenceRadius') errors.geofenceRadius = issue.message;
      if (field === 'geofencePolygonGeoJson') errors.geofencePolygonGeoJson = issue.message;
    }
  }

  return errors;
}

export function validateStep3(values: CompanySiteFormValues) {
  const parsed = validateCompanySiteForm(values);
  const errors: LocationStep3Errors = {};

  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      if (issue.path[0] !== 'trustedNetworks') {
        continue;
      }

      const field = issue.path[2];
      if (field === 'name') errors.networkName = issue.message;
      if (field === 'cidrBlock') errors.cidrBlock = issue.message;
      if (field === 'expiryDate') errors.expiryDate = issue.message;
    }
  }

  return errors;
}
