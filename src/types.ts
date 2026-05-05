/**
 * Copyright (c) 2026 Custom Agile LLC. All rights reserved.
 */

import type { WidgetSettings } from '@customagile/widget-ai/components/settings';

// ── Verdict values ─────────────────────────────────────────────────────
// Matches Rally's TestCaseResult.Verdict and TestCase.LastVerdict enums.

export type VerdictValue = 'Pass' | 'Fail' | 'Error' | 'Blocked' | 'Inconclusive';

// ── Section 1: Test Execution Summary ─────────────────────────────────

/** Counts of test cases grouped by their last verdict for the selected iteration. */
export interface TestExecutionSummary {
  Pass: number;
  Fail: number;
  Error: number;
  Blocked: number;
  Inconclusive: number;
  /** Tests that have no results in this iteration (not yet run). */
  NotRun: number;
  total: number;
}

// ── Section 2: Test Results ────────────────────────────────────────────

/** One row in the Test Results table — a test case result for the iteration. */
export interface TestResult {
  /** ObjectID of the TestCaseResult record. */
  resultObjectID: number;
  /** ObjectID of the TestCase. */
  testCaseObjectID: number;
  /** Formatted ID of the TestCase, e.g. "TC1234". */
  testCaseFormattedID: string;
  /** Name of the TestCase. */
  testCaseName: string;
  /** Name of the TestSet this result belongs to. */
  testSetName: string;
  /** Verdict recorded for this run. */
  verdict: VerdictValue;
  /** Date of the test run (ISO string). */
  runDate: string;
  /** Build identifier recorded with the run. */
  build: string;
  /** Last verdict on the TestCase itself (may differ from this run's verdict). */
  lastVerdict: VerdictValue | null;
  /** Tester display name. */
  testerName: string | null;
}

// ── Section 3: Tests Remaining to Run ─────────────────────────────────

/** A test case that is scheduled to the iteration but has no result yet. */
export interface RemainingTest {
  /** ObjectID of the TestCase. */
  objectID: number;
  /** Formatted ID, e.g. "TC5678". */
  formattedID: string;
  /** Name of the TestCase. */
  name: string;
  /** Name of the TestSet this test case belongs to. */
  testSetName: string;
  /** Last verdict across all time (may be from a prior iteration). */
  lastVerdict: VerdictValue | null;
}

// ── App settings ───────────────────────────────────────────────────────

export interface TestSetSettings extends WidgetSettings {
  /** ObjectID of the selected iteration (null = use view filter / current). */
  iterationOid: number | null;
}

// ── DataProvider interface ─────────────────────────────────────────────

export interface TestSetDataProvider {
  /**
   * Fetch test execution data for the given project + iteration.
   * @param projectRef  WSAPI project ref (e.g. "/project/12345")
   * @param iterationOid  ObjectID of the selected iteration
   */
  fetchSummary(
    projectRef: string,
    iterationOid: number,
  ): Promise<TestExecutionSummary>;

  /**
   * Fetch test case results (Test Results section) for the iteration.
   * @param projectRef  WSAPI project ref
   * @param iterationOid  ObjectID of the selected iteration
   */
  fetchResults(
    projectRef: string,
    iterationOid: number,
  ): Promise<TestResult[]>;

  /**
   * Fetch test cases that are in the iteration's test sets but have no results yet.
   * @param projectRef  WSAPI project ref
   * @param iterationOid  ObjectID of the selected iteration
   */
  fetchRemaining(
    projectRef: string,
    iterationOid: number,
  ): Promise<RemainingTest[]>;
}
