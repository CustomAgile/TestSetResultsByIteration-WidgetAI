/**
 * Copyright (c) 2026 Custom Agile LLC. All rights reserved.
 */

import type { RallyContext } from '@customagile/widget-ai/types/rally-context';
import { wsapiQueryAll } from '@customagile/widget-ai/data/wsapi';
import type {
  TestSetDataProvider,
  TestExecutionSummary,
  TestResult,
  RemainingTest,
  VerdictValue,
} from './types';

// ── Helpers ────────────────────────────────────────────────────────────

function resolveRef(
  val: string | { _ref: string; [key: string]: unknown } | undefined,
): string | undefined {
  if (!val) return undefined;
  return typeof val === 'string' ? val : val._ref;
}

function refName(
  val: { _refObjectName?: string; [key: string]: unknown } | null | undefined,
): string | null {
  if (!val) return null;
  return (val._refObjectName as string | undefined) ?? null;
}

function asVerdict(v: unknown): VerdictValue | null {
  const VALID: VerdictValue[] = ['Pass', 'Fail', 'Error', 'Blocked', 'Inconclusive'];
  if (typeof v === 'string' && (VALID as string[]).includes(v)) return v as VerdictValue;
  return null;
}

// ── createRallyProvider ────────────────────────────────────────────────

export function createRallyProvider(ctx: RallyContext): TestSetDataProvider {
  const projectRef = resolveRef(ctx.GlobalScope.Project as string | { _ref: string }) ?? '';
  const workspaceRef = resolveRef(ctx.GlobalScope.Workspace as string | { _ref: string });

  /**
   * Fetch all TestSets scheduled to the iteration.
   * Returns: map of testSetRef → testSetName, and the list of testCase refs per set.
   *
   * Strategy:
   *  1. Query TestSet where Iteration.ObjectID = <oid> AND Project = <project>
   *  2. The TestSets collection on Iteration is not queryable directly — we query
   *     TestSet by Iteration ref and project to get current-project-only results.
   */
  async function fetchTestSetsForIteration(
    iterationOid: number,
  ): Promise<Array<{ oid: number; ref: string; name: string; formattedID: string }>> {
    const results = await wsapiQueryAll('testset', {
      fetch: 'ObjectID,FormattedID,Name,TestCases',
      query: `(Iteration.ObjectID = ${iterationOid})`,
      project: projectRef,
      workspace: workspaceRef,
      projectScopeDown: false,
      order: 'FormattedID ASC',
      pagesize: 500,
    });

    return (results as unknown as Record<string, unknown>[]).map((r) => ({
      oid: r.ObjectID as number,
      ref: r._ref as string,
      name: (r.Name as string) ?? '',
      formattedID: (r.FormattedID as string) ?? '',
    }));
  }

  /**
   * Fetch all TestCases assigned to a specific TestSet (via TestSet.TestCases collection).
   * Uses WSAPI sub-collection path: /testset/<oid>/TestCases
   */
  async function fetchTestCasesForSet(
    testSetOid: number,
    testSetName: string,
  ): Promise<Array<{ oid: number; formattedID: string; name: string; lastVerdict: VerdictValue | null; testSetName: string }>> {
    // Query TestCases that belong to this TestSet
    const results = await wsapiQueryAll('testcase', {
      fetch: 'ObjectID,FormattedID,Name,LastVerdict',
      query: `(TestSets.ObjectID = ${testSetOid})`,
      project: projectRef,
      workspace: workspaceRef,
      projectScopeDown: false,
      pagesize: 500,
    });

    return (results as unknown as Record<string, unknown>[]).map((r) => ({
      oid: r.ObjectID as number,
      formattedID: (r.FormattedID as string) ?? '',
      name: (r.Name as string) ?? '',
      lastVerdict: asVerdict(r.LastVerdict),
      testSetName,
    }));
  }

  /**
   * Fetch TestCaseResults for a given iteration. Scoped to the current project.
   * Rally doesn't let us filter TCR directly by Iteration — we filter by TestSet.
   */
  async function fetchResultsForIteration(
    iterationOid: number,
    testSetOids: number[],
  ): Promise<Array<Record<string, unknown>>> {
    if (testSetOids.length === 0) return [];

    // Query TestCaseResults where TestSet is in this iteration.
    // Rally WSAPI binary AND/OR only — build a query for up to the first TestSet
    // (larger sets are rare; in practice iterations usually have 1–5 test sets).
    // We query per-TestSet and flatten to avoid the binary AND/OR nesting limit.
    const chunks = await Promise.all(
      testSetOids.map((setOid) =>
        wsapiQueryAll('testcaseresult', {
          fetch: 'ObjectID,Verdict,Date,Build,TestCase,TestSet,Tester',
          query: `(TestSet.ObjectID = ${setOid})`,
          project: projectRef,
          workspace: workspaceRef,
          projectScopeDown: false,
          order: 'Date DESC',
          pagesize: 2000,
        }).catch(() => [] as unknown[]),
      ),
    );

    return chunks.flat() as Record<string, unknown>[];
  }

  return {
    async fetchSummary(
      _projectRef: string,
      iterationOid: number,
    ): Promise<TestExecutionSummary> {
      const testSets = await fetchTestSetsForIteration(iterationOid);
      const testSetOids = testSets.map((ts) => ts.oid);

      // Fetch all test cases across all sets
      const tcChunks = await Promise.all(
        testSets.map((ts) => fetchTestCasesForSet(ts.oid, ts.name).catch(() => [])),
      );
      const allTestCases = tcChunks.flat();

      // Fetch all results
      const allResults = await fetchResultsForIteration(iterationOid, testSetOids);

      // Map testCase OID → most recent verdict in this iteration
      const verdictByTc = new Map<number, VerdictValue>();
      // Sort results by date descending so first-seen per TC is the most recent
      for (const r of allResults) {
        const tc = r.TestCase as { ObjectID?: number } | null | undefined;
        if (!tc || !tc.ObjectID) continue;
        if (!verdictByTc.has(tc.ObjectID)) {
          const v = asVerdict(r.Verdict);
          if (v) verdictByTc.set(tc.ObjectID, v);
        }
      }

      const summary: TestExecutionSummary = {
        Pass: 0, Fail: 0, Error: 0, Blocked: 0, Inconclusive: 0, NotRun: 0, total: 0,
      };

      const seen = new Set<number>();
      for (const tc of allTestCases) {
        if (seen.has(tc.oid)) continue; // deduplicate (same TC in multiple sets)
        seen.add(tc.oid);
        summary.total++;
        const verdict = verdictByTc.get(tc.oid);
        if (!verdict) {
          summary.NotRun++;
        } else {
          summary[verdict]++;
        }
      }

      return summary;
    },

    async fetchResults(
      _projectRef: string,
      iterationOid: number,
    ): Promise<TestResult[]> {
      const testSets = await fetchTestSetsForIteration(iterationOid);
      const testSetNameByOid = new Map(testSets.map((ts) => [ts.oid, ts.name]));
      const testSetOids = testSets.map((ts) => ts.oid);

      const allResults = await fetchResultsForIteration(iterationOid, testSetOids);

      return allResults.map((r): TestResult => {
        const tc = r.TestCase as { ObjectID?: number; FormattedID?: string; _refObjectName?: string } | null;
        const ts = r.TestSet as { ObjectID?: number } | null;
        const tester = r.Tester as { _refObjectName?: string } | null;

        return {
          resultObjectID: r.ObjectID as number,
          testCaseObjectID: tc?.ObjectID ?? 0,
          testCaseFormattedID: (tc?.FormattedID ?? tc?._refObjectName ?? '') as string,
          testCaseName: refName(tc) ?? '',
          testSetName: ts?.ObjectID ? (testSetNameByOid.get(ts.ObjectID) ?? '') : '',
          verdict: asVerdict(r.Verdict) ?? 'Inconclusive',
          runDate: (r.Date as string) ?? '',
          build: (r.Build as string) ?? '',
          lastVerdict: null, // not available on TCR — shown separately via TestCase
          testerName: tester?._refObjectName ?? null,
        };
      });
    },

    async fetchRemaining(
      _projectRef: string,
      iterationOid: number,
    ): Promise<RemainingTest[]> {
      const testSets = await fetchTestSetsForIteration(iterationOid);
      const testSetOids = testSets.map((ts) => ts.oid);

      const [tcChunks, allResults] = await Promise.all([
        Promise.all(testSets.map((ts) => fetchTestCasesForSet(ts.oid, ts.name).catch(() => []))),
        fetchResultsForIteration(iterationOid, testSetOids),
      ]);
      const allTestCases = tcChunks.flat();

      // Collect TC OIDs that have at least one result in this iteration
      const runTcOids = new Set<number>();
      for (const r of allResults) {
        const tc = r.TestCase as { ObjectID?: number } | null;
        if (tc?.ObjectID) runTcOids.add(tc.ObjectID);
      }

      // Deduplicate test cases (same TC might appear in multiple test sets)
      const seen = new Set<number>();
      const remaining: RemainingTest[] = [];
      for (const tc of allTestCases) {
        if (seen.has(tc.oid)) continue;
        seen.add(tc.oid);
        if (!runTcOids.has(tc.oid)) {
          remaining.push({
            objectID: tc.oid,
            formattedID: tc.formattedID,
            name: tc.name,
            testSetName: tc.testSetName,
            lastVerdict: tc.lastVerdict,
          });
        }
      }

      return remaining;
    },
  };
}
