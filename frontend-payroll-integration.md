# Payroll Frontend Integration Guide

This guide covers the web admin/business admin payroll screens and the employee/staff self-service payroll details screen for web and mobile clients.

## API Surfaces

All responses use the existing `ApiResponse<T>` wrapper:

```json
{
  "success": true,
  "message": "Payroll details loaded",
  "data": {}
}
```

### Admin / Business Admin

Base path: `/api/v1/admin/payroll`

| Use case | Method | Endpoint |
| --- | --- | --- |
| Add bonus | `POST` | `/employees/{employeeId}/adjustments/bonus` |
| Add deduction | `POST` | `/employees/{employeeId}/adjustments/deduction` |
| Preview employee details | `GET` | `/employees/{employeeId}/details?year=2026&month=5` |
| Preview employee calculation | `GET` | `/employees/{employeeId}/calculate?year=2026&month=5` |
| Persist employee calculation | `POST` | `/employees/{employeeId}/calculate` |
| Batch calculate employees | `POST` | `/calculate` |

### Employee / Staff Self-Service

Base path: `/api/v1/mobile/payroll`

| Use case | Method | Endpoint |
| --- | --- | --- |
| View my payroll details | `GET` | `/details?year=2026&month=5` |

The mobile/self-service endpoint resolves the employee from the authenticated session. Do not pass `employeeId` from the client for this screen.

## Request Payloads

### Add Bonus

```json
{
  "year": 2026,
  "month": 5,
  "amount": 300.00,
  "reason": "Performance bonus",
  "notes": "Exceeded quarterly target"
}
```

### Add Deduction

```json
{
  "year": 2026,
  "month": 5,
  "amount": 100.00,
  "reason": "Salary advance repayment",
  "notes": "Monthly installment"
}
```

### Persist One Employee Calculation

```json
{
  "year": 2026,
  "month": 5
}
```

### Batch Calculation

```json
{
  "year": 2026,
  "month": 5,
  "employeeIds": null
}
```

Use `employeeIds: null` or omit/empty it for all employees. Use a UUID array to calculate selected employees.

## Payroll Details Response

Admin and employee/staff details use the same `PayrollCalculationResponse` shape. The employee/staff endpoint only exposes the current authenticated employee's result.

Important fields:

| Field | UI usage |
| --- | --- |
| `employeeName` | Header/person identity. Hide on mobile if redundant with profile. |
| `year`, `month` | Period selector confirmation. |
| `currency` | Money formatting, currently `EUR`. |
| `paymentMethod` | Show hourly/monthly explanation. Current backend values are `FIXED_MONTHLY` and `HOURLY`. |
| `calculationStatus` | `SUCCESS` for successful details; failed calls return error wrapper. |
| `payrollStatus` | Lifecycle badge: `DRAFT`, `CALCULATED`, `APPROVED`, `FINALIZED`, `PAID`, `CANCELLED`. |
| `preview` | If `true`, display as preview/unfinalized. |
| `employmentPeriod` | Show payable period, useful for mid-month start/end. |
| `workPeriod` | Show working days/hours assumptions. |
| `basePayCalculation` | Main salary/hourly formula explanation. |
| `leaveCalculation` | Annual allowance, paid leave, unpaid excess, deduction. |
| `sickLeaveCalculation` | Placeholder policy status and sick leave days. |
| `adjustments` | Bonus and deduction line items. |
| `totals` | Base pay, gross earnings, deductions, net pay. |
| `warnings` | Render visibly; these explain TODO placeholders and assumptions. |

Example condensed response:

```json
{
  "employeeId": "0b85f75b-a7b0-45c6-a3fb-69b69f48d6b1",
  "employeeName": "John Doe",
  "year": 2026,
  "month": 5,
  "currency": "EUR",
  "paymentMethod": "HOURLY",
  "calculationStatus": "SUCCESS",
  "payrollStatus": "DRAFT",
  "preview": true,
  "workPeriod": {
    "calendarDaysInMonth": 31,
    "workingDaysInMonth": 21,
    "payableWorkingDays": 21,
    "defaultDailyWorkingHours": 8,
    "payableHours": 168,
    "workHoursSource": "DEFAULT_WORKING_DAYS_PLACEHOLDER"
  },
  "basePayCalculation": {
    "formula": "hourlyRate * payableHours",
    "hourlyRate": 10.00,
    "payableHours": 168,
    "basePay": 1680.00
  },
  "leaveCalculation": {
    "annualPaidLeaveAllowanceDays": 20,
    "usedPaidLeaveBeforeThisMonth": 8,
    "leaveTakenThisMonth": 4,
    "paidLeaveDaysThisMonth": 4,
    "unpaidLeaveDaysThisMonth": 0,
    "unpaidLeaveDeduction": 0.00,
    "leaveRecordsIncluded": []
  },
  "sickLeaveCalculation": {
    "daysTakenThisMonth": 2,
    "companyPaidDays": null,
    "companyPaidPercentage": null,
    "companyPaidAmount": null,
    "insuranceCoveredDays": null,
    "insuranceCoveredAmount": null,
    "status": "TODO_SICK_LEAVE_POLICY_NOT_CONFIGURED"
  },
  "adjustments": {
    "bonuses": [],
    "deductions": [],
    "totalBonus": 0.00,
    "totalManualDeduction": 0.00
  },
  "totals": {
    "basePay": 1680.00,
    "grossEarnings": 1680.00,
    "totalDeductions": 0.00,
    "netPay": 1680.00,
    "negativeNetPay": false
  },
  "warnings": [
    "Worked hours are calculated using default working days and default daily hours. Timesheet integration is not implemented yet."
  ]
}
```

## Web Admin UX

Recommended route: `/admin/payroll`

Suggested views:

| View | Purpose |
| --- | --- |
| Payroll period selector | Month/year picker, employee filter, calculate all button. |
| Employee payroll table | Employee, payment method, status, gross, deductions, net, warnings count. |
| Employee payroll drawer/page | Full details response, adjustment forms, recalculate action. |
| Batch result summary | Success/failed/skipped counts and failed employee error messages. |

Admin interactions:

1. Select payroll month/year.
2. Load employees from the existing employee listing API.
3. Open an employee details drawer using `GET /api/v1/admin/payroll/employees/{employeeId}/details`.
4. Add bonus/deduction from the drawer.
5. Refresh details after adjustment creation.
6. Use `POST /employees/{employeeId}/calculate` to persist a calculated result.
7. Use `POST /calculate` for batch payroll. Show failures inline; one failed employee does not mean the whole batch failed.

Admin UI rules:

- Disable bonus/deduction forms when API returns `PAYROLL_PERIOD_LOCKED`.
- Show `preview: true` as "Preview" or "Not saved".
- Show `payrollStatus` as a lifecycle badge.
- Do not hide `warnings`; they are part of payroll audit transparency.
- If `totals.negativeNetPay = true`, use a clear danger state and require admin review before any future finalization action.

## Employee / Staff Web UX

Recommended route: `/app/payroll` or `/employee/payroll`

Use:

```http
GET /api/v1/mobile/payroll/details?year=2026&month=5
```

Suggested screen layout:

| Section | Content |
| --- | --- |
| Period selector | Month/year picker, default to current month. |
| Net pay summary | Net pay, gross earnings, total deductions, payroll status. |
| Base pay | Formula, rate/salary, payable days/hours. |
| Leave impact | Paid leave, unpaid leave, unpaid leave deduction. |
| Bonuses and deductions | Line items with reason and amount. |
| Warnings/assumptions | Timesheet placeholder, sick leave policy TODO, tax TODOs. |

Employee/staff restrictions:

- Do not expose adjustment creation actions.
- Do not expose calculate/persist actions.
- Do not allow selecting another employee.
- If `preview: true`, label the result as "Current payroll preview" or "Not finalized".

## Mobile UX

Recommended screen: `PayrollDetailsScreen`

Recommended behavior:

1. Default period to current month.
2. Fetch `GET /api/v1/mobile/payroll/details?year={year}&month={month}` on screen open and when period changes.
3. Show a compact summary at the top:
   - Net pay
   - Payroll status
   - Gross earnings
   - Total deductions
4. Use collapsible sections for:
   - Base pay
   - Work period
   - Leave
   - Sick leave
   - Bonuses
   - Deductions
   - Warnings

Mobile formatting:

- Use localized currency formatting from `currency`.
- Keep formulas as secondary/help text.
- Render warnings as visible info/warning banners, not debug text.
- For `TODO_SICK_LEAVE_POLICY_NOT_CONFIGURED`, show that sick leave is counted but company/insurance amounts are not configured yet.

## Error Handling

Common error codes:

| Code | Meaning | UI action |
| --- | --- | --- |
| `EMPLOYEE_PROFILE_NOT_FOUND` | Authenticated user has no employee profile | Show support/contact admin state. |
| `EMPLOYEE_NOT_FOUND` | Admin requested an employee outside scope or missing | Show not found. |
| `INVALID_PAYROLL_PERIOD` | Invalid year/month | Validate picker and show inline error. |
| `INVALID_PAYMENT_CONFIGURATION` | Missing/invalid salary or hourly rate | Admin: prompt to fix employee payment details. Employee: show contact admin message. |
| `NO_ACTIVE_CONTRACT_IN_PERIOD` | Employee has no payable contract days | Show no payroll for this period. |
| `PAYROLL_PERIOD_LOCKED` | Period cannot be modified | Disable adjustment/recalculate actions. |
| `INVALID_PAYROLL_ADJUSTMENT_AMOUNT` | Bonus/deduction amount is not positive | Inline amount validation. |

## Frontend Types

TypeScript sketch:

```ts
type PayrollStatus = "DRAFT" | "CALCULATED" | "APPROVED" | "FINALIZED" | "PAID" | "CANCELLED";
type PayrollCalculationStatus = "SUCCESS" | "FAILED" | "SKIPPED";
type PaymentMethod = "FIXED_MONTHLY" | "HOURLY";

type PayrollCalculationResponse = {
  employeeId: string;
  employeeName: string;
  year: number;
  month: number;
  currency: string;
  paymentMethod: PaymentMethod;
  calculationStatus: PayrollCalculationStatus;
  payrollStatus: PayrollStatus;
  preview: boolean;
  employmentPeriod: {
    employmentStartDate: string | null;
    employmentEndDate: string | null;
    payableFrom: string;
    payableTo: string;
  };
  workPeriod: {
    calendarDaysInMonth: number;
    workingDaysInMonth: number;
    payableWorkingDays: number;
    defaultDailyWorkingHours: number;
    payableHours: number;
    workHoursSource: string;
  };
  basePayCalculation: {
    formula: string;
    monthlySalary: number | null;
    hourlyRate: number | null;
    payableWorkingDays: number;
    workingDaysInMonth: number;
    payableHours: number | null;
    basePay: number;
    prorationMethod: string | null;
  };
  leaveCalculation: {
    annualPaidLeaveAllowanceDays: number;
    usedPaidLeaveBeforeThisMonth: number;
    leaveTakenThisMonth: number;
    paidLeaveDaysThisMonth: number;
    unpaidLeaveDaysThisMonth: number;
    unpaidLeaveDeduction: number;
    leaveRecordsIncluded: Array<{
      id: string;
      leaveType: string;
      startDate: string;
      endDate: string;
      daysCountedInPayroll: number;
      payrollTreatment: string;
    }>;
  };
  sickLeaveCalculation: {
    daysTakenThisMonth: number;
    companyPaidDays: number | null;
    companyPaidPercentage: number | null;
    companyPaidAmount: number | null;
    insuranceCoveredDays: number | null;
    insuranceCoveredAmount: number | null;
    status: string;
  };
  adjustments: {
    bonuses: Array<{ id: string; amount: number; reason: string; notes: string | null }>;
    deductions: Array<{ id: string; amount: number; reason: string; notes: string | null }>;
    totalBonus: number;
    totalManualDeduction: number;
  };
  totals: {
    basePay: number;
    grossEarnings: number;
    totalDeductions: number;
    netPay: number;
    negativeNetPay: boolean;
  };
  warnings: string[];
};
```

## Future UI Hooks

Leave space in the UI for:

- Payroll finalization/approval actions.
- Downloadable payslip PDF.
- Tax/social security/pension sections.
- Real attendance/timesheet hours.
- Public holiday adjustments.
- Sick leave company/state insurance split.
- Multi-currency and rounding settings.
