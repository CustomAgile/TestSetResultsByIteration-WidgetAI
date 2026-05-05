# Setup Guide — Test Set Results by Iteration

End-to-end setup for the Test Set Results by Iteration widget: auth, dev harness,
iteration picker, and deployment.

## Prerequisites

- Node 18+ and npm
- A Rally workspace with at least one project, iteration, and test sets
- A Rally API key (instructions below)

## 1. Generate a Rally API key

1. Sign in to Rally.
2. Open the API key page: **<https://rally1.rallydev.com/#/api_key>** (or click your avatar → API Keys).
3. Click **Create**, give the key a name (e.g. `widget-dev`), pick the workspaces it can access, and copy the full key. It starts with `_` and is ~43 chars long.
4. Treat it like a password — do not commit it.

## 2. Configure auth

The Vite dev server proxies `/slm/*` (WSAPI) requests to Rally. It needs a
server URL and an API key. Options are read in this order, first non-empty wins:

### Option A — `auth.json` (per-widget, gitignored)

Create `auth.json` in the widget folder:

```json
{
  "server": "https://rally1.rallydev.com",
  "apiKey": "_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
}
```

`auth.json` is in `.gitignore` and never committed. The deploy CLI also reads
this file.

### Option B — environment variables

```bash
export RALLY_SERVER=https://rally1.rallydev.com
export RALLY_API_KEY=_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

Or drop a `.env.local` file in the widget folder (Vite picks it up):

```dotenv
RALLY_SERVER=https://rally1.rallydev.com
RALLY_API_KEY=_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

Restart `npm run dev` after changing auth credentials.

## 3. Run the dev server

```bash
npm install
npm run dev
```

Open http://localhost:5173 in your browser. The widget runs in **mock mode**
by default — no Rally connection needed. Mock data shows Sprint 3 with:

- 15 test results across 5 test sets (Authentication, Reporting, Performance, API, Compliance)
- 5 remaining tests not yet run
- Summary: 9 Pass, 3 Fail, 1 Error, 1 Blocked, 1 Inconclusive, 5 Not Run

To use live Rally data, add `?live=true` to the URL:

```
http://localhost:5173?live=true
```

### Iteration selection

In live mode, use the **Iteration** picker in the widget header to select an
iteration. The picker auto-selects the current (active) iteration on load.

In mock mode, the picker is replaced with a label showing `Sprint 3 (mock)`.

### Rally API queries this widget makes

The widget issues these WSAPI queries when an iteration is selected:

1. **TestSet** — all test sets scheduled to the iteration in the current project
2. **TestCase** (per test set) — all test cases assigned to each test set
3. **TestCaseResult** (per test set) — all test case results for each test set

These queries run in parallel for each test set. For iterations with many
test sets, the first load may take several seconds.

## 4. Deploy to Rally

```bash
npx widget-ai deploy
```

This builds and deploys the widget as a Rally Custom View. The first run
creates the view; subsequent runs update it in place. The Custom View URL
is printed at the end.

After deploying, navigate to the Custom View in Rally. You must be viewing
a page with an **Iteration** view filter active (or select an iteration
directly in the widget header) for the widget to show data.

### Common deploy issues

- **`No auth.json found`** — create one as shown in Option A above.
- **`401 Unauthorized`** — API key is revoked or missing workspace access.
- **`dist/app.js not found`** — build failed; re-run `npm run build` first.

## 5. Data requirements in Rally

For this widget to show data in live mode, your project needs:

- At least one **Iteration** with a start and end date
- At least one **TestSet** scheduled to that iteration (`TestSet.Iteration`)
- **TestCases** associated with the TestSet via `TestCase.TestSets` collection
- **TestCaseResults** linked to those TestCases and TestSets

The widget shows any TestCase in the iteration's TestSets that has no result
in the "Tests Remaining to Run" section — they don't need a verdict to appear.

---

## Reference

- [README](../README.md) — widget overview and features
- [Broadcom spec](https://github.com/Broadcom/rally-widgets/tree/main/endorsed-widgets/test-set-results-by-iteration) — original functional spec
- [Rally WSAPI docs](https://techdocs.broadcom.com/us/en/ca-enterprise-software/valueops/rally/rally-help/reference/rally-web-services-api.html)
