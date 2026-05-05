/**
 * Copyright (c) 2026 Custom Agile LLC. All rights reserved.
 */

import { DEFAULT_RALLY_CONTEXT } from '@customagile/widget-ai/types/rally-context';
import type { RallyContext } from '@customagile/widget-ai/types/rally-context';
import type {
  TestSetDataProvider,
  TestExecutionSummary,
  TestResult,
  RemainingTest,
} from './types';

// ── Mock Test Results ──────────────────────────────────────────────────

const MOCK_RESULTS: TestResult[] = [
  {
    resultObjectID: 9001,
    testCaseObjectID: 5001,
    testCaseFormattedID: 'TC5001',
    testCaseName: 'Login with valid credentials',
    testSetName: 'Sprint 3 — Authentication',
    verdict: 'Pass',
    runDate: '2026-04-28T14:30:00.000Z',
    build: '2026.04.28.1',
    lastVerdict: 'Pass',
    testerName: 'Alice Smith',
  },
  {
    resultObjectID: 9002,
    testCaseObjectID: 5002,
    testCaseFormattedID: 'TC5002',
    testCaseName: 'Login with invalid password',
    testSetName: 'Sprint 3 — Authentication',
    verdict: 'Pass',
    runDate: '2026-04-28T14:35:00.000Z',
    build: '2026.04.28.1',
    lastVerdict: 'Pass',
    testerName: 'Alice Smith',
  },
  {
    resultObjectID: 9003,
    testCaseObjectID: 5003,
    testCaseFormattedID: 'TC5003',
    testCaseName: 'Session timeout after inactivity',
    testSetName: 'Sprint 3 — Authentication',
    verdict: 'Fail',
    runDate: '2026-04-28T15:10:00.000Z',
    build: '2026.04.28.1',
    lastVerdict: 'Fail',
    testerName: 'Bob Jones',
  },
  {
    resultObjectID: 9004,
    testCaseObjectID: 5004,
    testCaseFormattedID: 'TC5004',
    testCaseName: 'Password reset via email',
    testSetName: 'Sprint 3 — Authentication',
    verdict: 'Pass',
    runDate: '2026-04-29T09:00:00.000Z',
    build: '2026.04.29.1',
    lastVerdict: 'Pass',
    testerName: 'Alice Smith',
  },
  {
    resultObjectID: 9005,
    testCaseObjectID: 5005,
    testCaseFormattedID: 'TC5005',
    testCaseName: 'Export report as PDF',
    testSetName: 'Sprint 3 — Reporting',
    verdict: 'Error',
    runDate: '2026-04-28T11:20:00.000Z',
    build: '2026.04.28.1',
    lastVerdict: 'Error',
    testerName: 'Carol Lee',
  },
  {
    resultObjectID: 9006,
    testCaseObjectID: 5006,
    testCaseFormattedID: 'TC5006',
    testCaseName: 'Export report as CSV',
    testSetName: 'Sprint 3 — Reporting',
    verdict: 'Pass',
    runDate: '2026-04-28T11:45:00.000Z',
    build: '2026.04.28.1',
    lastVerdict: 'Pass',
    testerName: 'Carol Lee',
  },
  {
    resultObjectID: 9007,
    testCaseObjectID: 5007,
    testCaseFormattedID: 'TC5007',
    testCaseName: 'Dashboard loads within 3s',
    testSetName: 'Sprint 3 — Performance',
    verdict: 'Fail',
    runDate: '2026-04-29T10:00:00.000Z',
    build: '2026.04.29.1',
    lastVerdict: 'Fail',
    testerName: 'Bob Jones',
  },
  {
    resultObjectID: 9008,
    testCaseObjectID: 5008,
    testCaseFormattedID: 'TC5008',
    testCaseName: 'Concurrent user load test (100 users)',
    testSetName: 'Sprint 3 — Performance',
    verdict: 'Blocked',
    runDate: '2026-04-29T10:30:00.000Z',
    build: '2026.04.29.1',
    lastVerdict: 'Blocked',
    testerName: 'Bob Jones',
  },
  {
    resultObjectID: 9009,
    testCaseObjectID: 5009,
    testCaseFormattedID: 'TC5009',
    testCaseName: 'API rate limiting — 429 response',
    testSetName: 'Sprint 3 — API',
    verdict: 'Pass',
    runDate: '2026-04-29T13:15:00.000Z',
    build: '2026.04.29.1',
    lastVerdict: 'Pass',
    testerName: 'Alice Smith',
  },
  {
    resultObjectID: 9010,
    testCaseObjectID: 5010,
    testCaseFormattedID: 'TC5010',
    testCaseName: 'API auth token expiry handled',
    testSetName: 'Sprint 3 — API',
    verdict: 'Inconclusive',
    runDate: '2026-04-29T13:45:00.000Z',
    build: '2026.04.29.1',
    lastVerdict: 'Inconclusive',
    testerName: 'Carol Lee',
  },
  {
    resultObjectID: 9011,
    testCaseObjectID: 5011,
    testCaseFormattedID: 'TC5011',
    testCaseName: 'GDPR data deletion request',
    testSetName: 'Sprint 3 — Compliance',
    verdict: 'Pass',
    runDate: '2026-04-30T09:00:00.000Z',
    build: '2026.04.30.1',
    lastVerdict: 'Pass',
    testerName: 'Alice Smith',
  },
  {
    resultObjectID: 9012,
    testCaseObjectID: 5012,
    testCaseFormattedID: 'TC5012',
    testCaseName: 'Audit log captures all writes',
    testSetName: 'Sprint 3 — Compliance',
    verdict: 'Pass',
    runDate: '2026-04-30T09:30:00.000Z',
    build: '2026.04.30.1',
    lastVerdict: 'Pass',
    testerName: 'Bob Jones',
  },
  {
    resultObjectID: 9013,
    testCaseObjectID: 5013,
    testCaseFormattedID: 'TC5013',
    testCaseName: 'Two-factor auth flow',
    testSetName: 'Sprint 3 — Authentication',
    verdict: 'Fail',
    runDate: '2026-04-30T10:00:00.000Z',
    build: '2026.04.30.1',
    lastVerdict: 'Fail',
    testerName: 'Carol Lee',
  },
  {
    resultObjectID: 9014,
    testCaseObjectID: 5014,
    testCaseFormattedID: 'TC5014',
    testCaseName: 'Report filter by date range',
    testSetName: 'Sprint 3 — Reporting',
    verdict: 'Pass',
    runDate: '2026-04-30T11:00:00.000Z',
    build: '2026.04.30.1',
    lastVerdict: 'Pass',
    testerName: 'Alice Smith',
  },
  {
    resultObjectID: 9015,
    testCaseObjectID: 5015,
    testCaseFormattedID: 'TC5015',
    testCaseName: 'Multi-tenant data isolation',
    testSetName: 'Sprint 3 — Compliance',
    verdict: 'Pass',
    runDate: '2026-04-30T14:00:00.000Z',
    build: '2026.04.30.1',
    lastVerdict: 'Pass',
    testerName: 'Bob Jones',
  },
];

// ── Mock Remaining Tests ───────────────────────────────────────────────

const MOCK_REMAINING: RemainingTest[] = [
  {
    objectID: 5016,
    formattedID: 'TC5016',
    name: 'MFA fallback via backup code',
    testSetName: 'Sprint 3 — Authentication',
    lastVerdict: 'Pass',
  },
  {
    objectID: 5017,
    formattedID: 'TC5017',
    name: 'Scheduled report email delivery',
    testSetName: 'Sprint 3 — Reporting',
    lastVerdict: null,
  },
  {
    objectID: 5018,
    formattedID: 'TC5018',
    name: 'API pagination — last page boundary',
    testSetName: 'Sprint 3 — API',
    lastVerdict: 'Fail',
  },
  {
    objectID: 5019,
    formattedID: 'TC5019',
    name: 'Database failover during write',
    testSetName: 'Sprint 3 — Performance',
    lastVerdict: null,
  },
  {
    objectID: 5020,
    formattedID: 'TC5020',
    name: 'WCAG 2.1 AA keyboard navigation',
    testSetName: 'Sprint 3 — Compliance',
    lastVerdict: null,
  },
];

// ── Mock Summary (derived from mock results + remaining) ───────────────

function buildMockSummary(): TestExecutionSummary {
  const counts = { Pass: 0, Fail: 0, Error: 0, Blocked: 0, Inconclusive: 0, NotRun: 0 };
  // Each MOCK_RESULT has a unique TC (per the data above)
  for (const r of MOCK_RESULTS) {
    counts[r.verdict]++;
  }
  counts.NotRun = MOCK_REMAINING.length;
  const total = MOCK_RESULTS.length + MOCK_REMAINING.length;
  return { ...counts, total };
}

const MOCK_SUMMARY = buildMockSummary();

// ── Mock provider ──────────────────────────────────────────────────────

export const mockProvider: TestSetDataProvider = {
  fetchSummary: async () => MOCK_SUMMARY,
  fetchResults: async () => MOCK_RESULTS,
  fetchRemaining: async () => MOCK_REMAINING,
};

// ── Mock context ───────────────────────────────────────────────────────

/** A realistic iteration OID for mock mode. */
export const MOCK_ITERATION_OID = 844853880000;

export const mockContext: RallyContext = {
  ...DEFAULT_RALLY_CONTEXT,
  User: {
    _ref: '/user/999',
    DisplayName: 'Mock User',
    EmailAddress: 'mock@example.com',
    UserName: 'mockuser',
    ObjectID: 999,
  },
  GlobalScope: {
    Project: '/project/844853813315',
    ProjectScopeDown: false,
    ProjectScopeUp: false,
    Workspace: '/workspace/844853787543',
  },
  WidgetName: 'Test Set Results by Iteration',
  WidgetUUID: 'mock-tsri-uuid',
  isEditMode: false,
  Settings: {},
};
