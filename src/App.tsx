/**
 * Copyright (c) 2026 Custom Agile LLC. All rights reserved.
 */

import React, { useState, useEffect, useCallback } from 'react';
import '@customagile/widget-ai/styles/rally-app-tokens.css';
import '@customagile/widget-ai/styles/combobox.css';

import type { RallyContext } from '@customagile/widget-ai/types/rally-context';
import { IterationPicker } from '@customagile/widget-ai/components/IterationPicker';
import { AppHeader } from '@customagile/widget-ai/components/AppHeader';
import { EditModePanel } from '@customagile/widget-ai/components/EditModePanel';
import { useWidgetSettings, defineWidgetSettings } from '@customagile/widget-ai/components/settings';

import type { TestSetDataProvider, TestExecutionSummary, TestResult, RemainingTest, TestSetSettings, VerdictValue } from './types';
import { MOCK_ITERATION_OID } from './mock-data';

// ── Constants ──────────────────────────────────────────────────────────

const SETTINGS_DEFAULTS = defineWidgetSettings<TestSetSettings>({
  iterationOid: null,
});

// Verdict display order and labels for the summary section
const VERDICT_ORDER: VerdictValue[] = ['Pass', 'Fail', 'Error', 'Blocked', 'Inconclusive'];

// Colorblind-safe: use blue/red/orange — never adjacent yellow+green
const VERDICT_STYLE: Record<VerdictValue | 'NotRun', React.CSSProperties> = {
  Pass:         { color: 'var(--ca-status-green)',  fontWeight: 600 },
  Fail:         { color: 'var(--ca-status-red)',    fontWeight: 600 },
  Error:        { color: 'var(--ca-status-orange)', fontWeight: 600 },
  Blocked:      { color: 'var(--ca-status-red)',    fontWeight: 600 },
  Inconclusive: { color: 'var(--ca-text-secondary)' },
  NotRun:       { color: 'var(--ca-text-disabled)' },
};

// Symbol + label alongside any color (accessibility: Charles is colorblind)
const VERDICT_LABEL: Record<VerdictValue | 'NotRun', string> = {
  Pass:         '✓ Pass',
  Fail:         '✗ Fail',
  Error:        '⚠ Error',
  Blocked:      '⊘ Blocked',
  Inconclusive: '? Inconclusive',
  NotRun:       '— Not Run',
};

// ── Small presentational helpers ───────────────────────────────────────

function VerdictBadge({ verdict }: { verdict: VerdictValue | null }) {
  if (!verdict) return <span style={VERDICT_STYLE.NotRun}>{VERDICT_LABEL.NotRun}</span>;
  return <span style={VERDICT_STYLE[verdict]}>{VERDICT_LABEL[verdict]}</span>;
}

function formatDate(iso: string): string {
  if (!iso) return '—';
  try {
    return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(iso));
  } catch {
    return iso.slice(0, 10);
  }
}

// ── Section styles ─────────────────────────────────────────────────────

const sectionStyle: React.CSSProperties = {
  marginBottom: 'var(--ca-space-4)',
  border: '1px solid var(--ca-border-default)',
  borderRadius: 'var(--ca-radius-sm)',
  overflow: 'hidden',
};

const sectionHeaderStyle: React.CSSProperties = {
  padding: 'var(--ca-space-2) var(--ca-space-3)',
  backgroundColor: 'var(--ca-surface-raised)',
  borderBottom: '1px solid var(--ca-border-default)',
  fontWeight: 600,
  fontSize: 'var(--ca-font-size-sm)',
  color: 'var(--ca-text-primary)',
};

const tableStyle: React.CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  fontSize: 'var(--ca-font-size-sm)',
  color: 'var(--ca-text-primary)',
};

const thStyle: React.CSSProperties = {
  padding: 'var(--ca-space-2) var(--ca-space-3)',
  textAlign: 'left',
  fontWeight: 600,
  backgroundColor: 'var(--ca-surface-raised)',
  borderBottom: '2px solid var(--ca-border-default)',
  whiteSpace: 'nowrap',
  color: 'var(--ca-text-secondary)',
  fontSize: 'var(--ca-font-size-xs)',
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
};

function tdStyle(odd: boolean): React.CSSProperties {
  return {
    padding: 'var(--ca-space-1) var(--ca-space-3)',
    borderBottom: '1px solid var(--ca-border-subtle)',
    verticalAlign: 'middle',
    backgroundColor: odd ? 'var(--ca-surface-page)' : 'var(--ca-surface-raised)',
  };
}

// ── Section 1: Test Execution Summary ─────────────────────────────────

function ExecutionSummarySection({ summary }: { summary: TestExecutionSummary }) {
  return (
    <section style={sectionStyle}>
      <div style={sectionHeaderStyle}>Test Execution Summary</div>
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 'var(--ca-space-4)',
          padding: 'var(--ca-space-3) var(--ca-space-4)',
        }}
      >
        {VERDICT_ORDER.map((v) => (
          <div key={v} style={{ textAlign: 'center', minWidth: 72 }}>
            <div
              style={{
                fontSize: 'var(--ca-font-size-xl)',
                fontWeight: 700,
                ...VERDICT_STYLE[v],
              }}
            >
              {summary[v]}
            </div>
            <div
              style={{
                fontSize: 'var(--ca-font-size-xs)',
                color: 'var(--ca-text-secondary)',
                marginTop: 2,
              }}
            >
              {v}
            </div>
          </div>
        ))}
        <div style={{ textAlign: 'center', minWidth: 72 }}>
          <div
            style={{
              fontSize: 'var(--ca-font-size-xl)',
              fontWeight: 700,
              ...VERDICT_STYLE.NotRun,
            }}
          >
            {summary.NotRun}
          </div>
          <div
            style={{
              fontSize: 'var(--ca-font-size-xs)',
              color: 'var(--ca-text-secondary)',
              marginTop: 2,
            }}
          >
            Not Run
          </div>
        </div>
        <div
          style={{
            textAlign: 'center',
            minWidth: 72,
            borderLeft: '1px solid var(--ca-border-default)',
            paddingLeft: 'var(--ca-space-4)',
          }}
        >
          <div
            style={{
              fontSize: 'var(--ca-font-size-xl)',
              fontWeight: 700,
              color: 'var(--ca-text-primary)',
            }}
          >
            {summary.total}
          </div>
          <div
            style={{
              fontSize: 'var(--ca-font-size-xs)',
              color: 'var(--ca-text-secondary)',
              marginTop: 2,
            }}
          >
            Total
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Section 2: Test Results ────────────────────────────────────────────

function TestResultsSection({ results }: { results: TestResult[] }) {
  return (
    <section style={sectionStyle}>
      <div style={sectionHeaderStyle}>
        Test Results ({results.length})
      </div>
      {results.length === 0 ? (
        <div
          style={{
            padding: 'var(--ca-space-4)',
            color: 'var(--ca-text-secondary)',
            fontStyle: 'italic',
            fontSize: 'var(--ca-font-size-sm)',
          }}
        >
          No test results found for this iteration.
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>ID</th>
                <th style={thStyle}>Test Case</th>
                <th style={thStyle}>Test Set</th>
                <th style={thStyle}>Verdict</th>
                <th style={thStyle}>Run Date</th>
                <th style={thStyle}>Build</th>
                <th style={thStyle}>Tester</th>
              </tr>
            </thead>
            <tbody>
              {results.map((r, i) => (
                <tr key={r.resultObjectID}>
                  <td style={tdStyle(i % 2 === 0)}>
                    <span style={{ fontFamily: 'monospace', fontSize: 'var(--ca-font-size-xs)' }}>
                      {r.testCaseFormattedID}
                    </span>
                  </td>
                  <td style={tdStyle(i % 2 === 0)}>{r.testCaseName}</td>
                  <td style={{ ...tdStyle(i % 2 === 0), color: 'var(--ca-text-secondary)' }}>
                    {r.testSetName}
                  </td>
                  <td style={tdStyle(i % 2 === 0)}>
                    <VerdictBadge verdict={r.verdict} />
                  </td>
                  <td style={{ ...tdStyle(i % 2 === 0), whiteSpace: 'nowrap' }}>
                    {formatDate(r.runDate)}
                  </td>
                  <td style={{ ...tdStyle(i % 2 === 0), fontFamily: 'monospace', fontSize: 'var(--ca-font-size-xs)' }}>
                    {r.build || '—'}
                  </td>
                  <td style={{ ...tdStyle(i % 2 === 0), color: 'var(--ca-text-secondary)' }}>
                    {r.testerName ?? '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

// ── Section 3: Tests Remaining to Run ─────────────────────────────────

function RemainingTestsSection({ remaining }: { remaining: RemainingTest[] }) {
  return (
    <section style={sectionStyle}>
      <div style={sectionHeaderStyle}>
        Tests Remaining to Run ({remaining.length})
      </div>
      {remaining.length === 0 ? (
        <div
          style={{
            padding: 'var(--ca-space-4)',
            color: 'var(--ca-status-green)',
            fontWeight: 600,
            fontSize: 'var(--ca-font-size-sm)',
          }}
        >
          ✓ All tests have been executed for this iteration.
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>ID</th>
                <th style={thStyle}>Test Case</th>
                <th style={thStyle}>Test Set</th>
                <th style={thStyle}>Last Verdict</th>
              </tr>
            </thead>
            <tbody>
              {remaining.map((tc, i) => (
                <tr key={tc.objectID}>
                  <td style={tdStyle(i % 2 === 0)}>
                    <span style={{ fontFamily: 'monospace', fontSize: 'var(--ca-font-size-xs)' }}>
                      {tc.formattedID}
                    </span>
                  </td>
                  <td style={tdStyle(i % 2 === 0)}>{tc.name}</td>
                  <td style={{ ...tdStyle(i % 2 === 0), color: 'var(--ca-text-secondary)' }}>
                    {tc.testSetName}
                  </td>
                  <td style={tdStyle(i % 2 === 0)}>
                    <VerdictBadge verdict={tc.lastVerdict} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

// ── App component ──────────────────────────────────────────────────────

interface AppProps {
  rallyContext: RallyContext;
  data: TestSetDataProvider;
  /** @internal injected by main.tsx in mock mode to detect if running without Rally */
  isMock?: boolean;
}

interface AppData {
  summary: TestExecutionSummary | null;
  results: TestResult[];
  remaining: RemainingTest[];
}

export default function App({ rallyContext, data, isMock }: AppProps) {
  // ── Settings ───────────────────────────────────────────────────────
  const { settings, updateSetting, updateSettings } = useWidgetSettings<TestSetSettings>(
    rallyContext,
    SETTINGS_DEFAULTS,
  );

  // ── Iteration selection ────────────────────────────────────────────
  // If mock mode and no iteration is selected yet, seed the MOCK_ITERATION_OID
  const [iterationOid, setIterationOid] = useState<number | null>(
    settings.iterationOid ?? (isMock ? MOCK_ITERATION_OID : null),
  );

  // ── Data state ─────────────────────────────────────────────────────
  const [appData, setAppData] = useState<AppData>({ summary: null, results: [], remaining: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const projectRef: string = (() => {
    const p = rallyContext.GlobalScope.Project;
    return typeof p === 'string' ? p : p._ref;
  })();

  const load = useCallback(
    async (oid: number) => {
      setLoading(true);
      setError(null);
      try {
        const [summary, results, remaining] = await Promise.all([
          data.fetchSummary(projectRef, oid),
          data.fetchResults(projectRef, oid),
          data.fetchRemaining(projectRef, oid),
        ]);
        setAppData({ summary, results, remaining });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load test data');
      } finally {
        setLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data, projectRef],
  );

  // Load when iteration is selected
  useEffect(() => {
    if (iterationOid !== null) {
      load(iterationOid);
    }
  }, [iterationOid, load]);

  const handleIterationChange = useCallback(
    (oid: number | null) => {
      setIterationOid(oid);
    },
    [],
  );

  // ── EditMode render ────────────────────────────────────────────────
  if (rallyContext.isEditMode) {
    return (
      <EditModePanel
        appName="Test Set Results by Iteration"
        version="0.1.0"
        appSlug="test-set-results-by-iteration"
        settings={settings as unknown as Record<string, unknown>}
        onSave={(dirty: Partial<TestSetSettings>) => updateSettings(dirty)}
        onClose={() => { /* Rally controls EditMode exit */ }}
      >
        {/* No configurable settings for this widget beyond iteration selection,
            which is controlled inline via the IterationPicker. */}
        <p
          style={{
            fontSize: 'var(--ca-font-size-sm)',
            color: 'var(--ca-text-secondary)',
            margin: 0,
            padding: 'var(--ca-space-3)',
          }}
        >
          This widget has no additional settings. Select an iteration using the picker
          in the widget header when viewing.
        </p>
      </EditModePanel>
    );
  }

  // ── View mode ──────────────────────────────────────────────────────

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        fontFamily: 'var(--ca-font-family)',
        backgroundColor: 'var(--ca-surface-page)',
        color: 'var(--ca-text-primary)',
        overflow: 'hidden',
      }}
    >
      <AppHeader
        title="Test Set Results by Iteration"
        help={{
          content: (
            <>
              <p>
                This widget shows test execution results for the selected iteration,
                scoped to the current project. Test Sets not scheduled to the selected
                iteration are excluded.
              </p>
              <p>
                <strong>Test Execution Summary</strong> — counts by verdict (Pass / Fail /
                Error / Blocked / Inconclusive / Not Run).
              </p>
              <p>
                <strong>Test Results</strong> — all test case results recorded in the
                iteration's test sets, most recent first.
              </p>
              <p>
                <strong>Tests Remaining to Run</strong> — test cases that are assigned
                to a test set in this iteration but have not yet been executed.
              </p>
            </>
          ),
        }}
      >
        {!isMock && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--ca-space-2)' }}>
            <label
              style={{
                fontSize: 'var(--ca-font-size-sm)',
                color: 'var(--ca-text-secondary)',
                whiteSpace: 'nowrap',
              }}
            >
              Iteration:
            </label>
            <IterationPicker
              value={iterationOid}
              onChange={handleIterationChange}
              defaultToCurrent
              showUnscheduled={false}
              placeholder="Select an iteration"
              stateId="tsri-iteration"
            />
          </div>
        )}
        {isMock && (
          <span
            style={{
              fontSize: 'var(--ca-font-size-sm)',
              color: 'var(--ca-text-secondary)',
              fontStyle: 'italic',
            }}
          >
            Sprint 3 (mock)
          </span>
        )}
      </AppHeader>

      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: 'var(--ca-space-3)',
        }}
      >
        {/* No iteration selected */}
        {iterationOid === null && !loading && (
          <div
            style={{
              padding: 'var(--ca-space-8)',
              textAlign: 'center',
              color: 'var(--ca-text-secondary)',
              fontSize: 'var(--ca-font-size-sm)',
            }}
          >
            Select an iteration to view test results.
          </div>
        )}

        {/* Error banner */}
        {error && (
          <div
            role="alert"
            style={{
              marginBottom: 'var(--ca-space-3)',
              padding: 'var(--ca-space-2) var(--ca-space-3)',
              backgroundColor: 'var(--ca-status-red-bg)',
              color: 'var(--ca-status-red)',
              borderRadius: 'var(--ca-radius-sm)',
              fontSize: 'var(--ca-font-size-sm)',
            }}
          >
            ⚠ Error loading test data: {error}
          </div>
        )}

        {/* Loading skeleton */}
        {loading && (
          <div
            aria-live="polite"
            aria-busy="true"
            style={{
              padding: 'var(--ca-space-4)',
              textAlign: 'center',
              color: 'var(--ca-text-secondary)',
              fontSize: 'var(--ca-font-size-sm)',
            }}
          >
            Loading test results…
          </div>
        )}

        {/* Data sections */}
        {!loading && iterationOid !== null && appData.summary !== null && (
          <>
            <ExecutionSummarySection summary={appData.summary} />
            <TestResultsSection results={appData.results} />
            <RemainingTestsSection remaining={appData.remaining} />
          </>
        )}
      </div>
    </div>
  );
}
