import test from 'node:test';
import assert from 'node:assert/strict';
import { buildLocalLocationAssessment, normalizeLocationDetectionResponse } from './detection';
import { buildNestedFieldErrorTree, mapServerErrorsToLocationForm } from './errors';
import {
  DEFAULT_ATTENDANCE_SETTINGS,
  DEFAULT_LOCATION_STEP,
  EMPTY_TRUSTED_NETWORK,
  buildCompanySiteFormValues,
  clearTrustedNetworkFormValue,
  mapDetectNetworkResponseToFormValue,
  mapFormToCreateCompanySiteRequest,
} from './mappers';
import { validateStep3 } from './validation';

function buildBaseValues() {
  return buildCompanySiteFormValues(
    {
      siteType: 'HQ',
      siteName: 'Tirana HQ',
      siteCode: 'HQ-TIR',
      country: 'AL',
      timezone: 'Europe/Tirane',
      notes: '',
    },
    {
      ...DEFAULT_LOCATION_STEP,
      addressLine1: 'Rruga e Durresit',
      city: 'Tirane',
      latitude: 41.3275,
      longitude: 19.8187,
      locationDetected: true,
    },
    DEFAULT_ATTENDANCE_SETTINGS,
    [clearTrustedNetworkFormValue()],
  );
}

test('location flow keeps low accuracy as warning without discarding coordinates', () => {
  const assessment = buildLocalLocationAssessment(
    {
      latitude: 41.3275,
      longitude: 19.8187,
      accuracyMeters: 120,
      browserTimestampMs: Date.now(),
    },
    50,
    Date.now(),
  );

  assert.equal(assessment.latitude, 41.3275);
  assert.equal(assessment.longitude, 19.8187);
  assert.equal(assessment.lowAccuracy, true);
  assert.equal(assessment.warnings[0]?.code, 'LOCATION_LOW_ACCURACY');
});

test('location normalization preserves browser coordinates when reverse geocode fails upstream', () => {
  const normalized = normalizeLocationDetectionResponse(
    {
      latitude: 41.3275,
      longitude: 19.8187,
      accuracyMeters: 25,
      browserTimestampMs: Date.now(),
    },
    {
      warnings: [{ code: 'REVERSE_GEOCODE_FAILED', message: 'lookup failed' }],
    },
  );

  assert.equal(normalized.latitude, 41.3275);
  assert.equal(normalized.longitude, 19.8187);
});

test('network flow maps detect-network suggestions into the editable form row', () => {
  const mapped = mapDetectNetworkResponseToFormValue(
    {
      detectedIp: '10.0.0.12',
      name: 'HQ Office Network',
      networkType: 'OFFICE_NETWORK',
      suggestedCidr: '10.0.0.0/24',
      ipVersion: 'IPV4',
      priorityOrder: 3,
    },
    EMPTY_TRUSTED_NETWORK,
  );

  assert.equal(mapped.name, 'HQ Office Network');
  assert.equal(mapped.cidrBlock, '10.0.0.0/24');
  assert.equal(mapped.priorityOrder, '3');
});

test('create payload omits trusted networks when a detected network was removed before submit', () => {
  const values = buildBaseValues();
  values.trustedNetworks = [clearTrustedNetworkFormValue()];

  const payload = mapFormToCreateCompanySiteRequest(values, null);

  assert.deepEqual(payload.attendancePolicy, {
    requireQr: true,
    requireLocation: true,
    checkInEnabled: true,
    checkOutEnabled: true,
    useNetworkAsWarning: true,
    rejectOutsideGeofence: true,
    rejectPoorAccuracy: true,
    allowManualCorrection: false,
    allowManagerManualEntry: false,
    missingCheckoutAutoCloseEnabled: false,
    autoCheckoutAfterMinutes: null,
    lateGraceMinutes: 0,
    earlyClockInWindowMinutes: 0,
  });
  assert.equal(payload.trustedNetworks, undefined);
});

test('create payload includes a manual network row when the user overrides detection', () => {
  const values = buildBaseValues();
  values.trustedNetworks = [
    {
      ...EMPTY_TRUSTED_NETWORK,
      name: 'Manual Office Network',
      cidrBlock: '10.0.0.0/24',
      networkType: 'DEDICATED_HOST',
      ipVersion: 'IPV4',
      priorityOrder: '5',
    },
  ];

  const payload = mapFormToCreateCompanySiteRequest(values, null);

  assert.equal(payload.trustedNetworks?.length, 1);
  assert.equal(payload.trustedNetworks?.[0]?.name, 'Manual Office Network');
  assert.equal(payload.trustedNetworks?.[0]?.cidrBlock, '10.0.0.0/24');
  assert.equal(payload.trustedNetworks?.[0]?.priorityOrder, 5);
});

test('step 3 validation allows a completely empty network section', () => {
  const values = buildBaseValues();
  values.trustedNetworks = [clearTrustedNetworkFormValue()];

  const errors = validateStep3(values);

  assert.deepEqual(errors, {});
});

test('server validation errors map duplicate site code and duplicate network rule back into the form', () => {
  const mapped = mapServerErrorsToLocationForm({
    response: {
      status: 422,
      data: {
        timestamp: new Date().toISOString(),
        status: 422,
        error: 'Validation Failed',
        message: 'Duplicate trusted network rule',
        path: '/api/v1/companies/company-1/sites',
        errorCode: 'DUPLICATE_SITE_CODE',
        errors: {
          code: 'Site code already exists',
          'trustedNetworks[0].cidrBlock': 'CIDR block already exists for this site',
        },
      },
    },
  });

  assert.equal(mapped.step1Errors.siteCode, 'Site code already exists');
  assert.equal(mapped.step3Errors.cidrBlock, 'CIDR block already exists for this site');
});

test('server validation errors map fieldErrors arrays into clear form messages', () => {
  const mapped = mapServerErrorsToLocationForm({
    response: {
      status: 400,
      data: {
        timestamp: new Date().toISOString(),
        message: 'Request validation failed',
        path: '/api/v1/companies/company-1/sites',
        code: 'VALIDATION_ERROR',
        fieldErrors: [
          {
            field: 'attendancePolicy',
            message: 'Attendance policy is required',
          },
        ],
      },
    },
  });

  assert.equal(mapped.formError, 'Request validation failed');
  assert.deepEqual(mapped.formDetails, ['Attendance policy is required']);
});

test('backend field error paths build nested errors for dotted and indexed fields', () => {
  const nested = buildNestedFieldErrorTree([
    {
      field: 'attendancePolicy.autoCheckoutAfterMinutes',
      message:
        'Auto check-out minutes is required when missing check-out auto-close is enabled.',
    },
    {
      field: 'trustedNetworks[0].cidrBlock',
      message: 'CIDR block already exists for this site',
    },
  ]);

  assert.deepEqual(nested, {
    attendanceRules: {
      autoCheckoutAfterMinutes:
        'Auto check-out minutes is required when missing check-out auto-close is enabled.',
    },
    trustedNetworks: [
      {
        cidrBlock: 'CIDR block already exists for this site',
      },
    ],
  });
});
