# Asset Status Tracker Dashboard

This is a static internal dashboard for the Asset Status Tracker. It reads live data from Google Sheets, lets you filter and analyze tracker rows, generates Slack-ready reports, and allows browser-local asset creation.

## Files

- `index.html` contains the login screen, sidebar layout, pages, tables, reports, and add-asset form.
- `styles.css` contains the Inter-only BetterInvest-style internal dashboard design.
- `script.js` handles login, Google Sheet fetching, local asset storage, filtering, summaries, charts, alerts, and reports.
- `README.md` explains setup and limitations.

## How To Run

Recommended:

```powershell
py -m http.server 5500
```

Then open:

```text
http://localhost:5500
```

You can also open `index.html` directly, but a local server is better for browser fetch behavior.

## Login

Allowed users:

- `aravind@betterinvest.club`
- `induma@betteriinvest.club`
- `meenakshi@betterinvest.club`
- `afreen@betterinvest.club`
- `manoj@betterinvest.club`
- Any email ending with `@betterinvest.club`

Password:

```text
BetterInvest@123
```

Security note: this is simple frontend-only protection using browser `sessionStorage`. It is suitable only for small internal demos, not enterprise-grade security. Real access control requires a backend/auth provider.

## Google Sheet Connection

The dashboard reads this sheet in `script.js`:

```js
const SHEET_CONFIG = {
  sheetId: "1Kmy06itzgOERHWwTNpdkbnrpQS5lL1Lon3mmk2uKfJw",
  gid: "1903103931",
  sheetLink: "https://docs.google.com/spreadsheets/d/1Kmy06itzgOERHWwTNpdkbnrpQS5lL1Lon3mmk2uKfJw/edit?gid=1903103931#gid=1903103931"
};
```

The Google Sheet should be shared as:

```text
Anyone with the link can view
```

No sample or mock data is used.

## Expected Columns

- Month
- Live Week
- Movie Name
- Asset Name
- Eligibility
- Eligibility in Crores
- PH Name
- Live Date

Supported Live Week values:

- Week 1
- Week 2
- Week 3
- Week 4
- Week 5

## Local Asset Creation

The `Create New Asset` form adds assets locally in the browser:

- New assets appear immediately in the table, summaries, filters, charts, alerts, Production Houses page, and Slack reports.
- New assets are stored in browser `localStorage`.
- New assets remain after refresh in the same browser.
- They are marked as `Local` in the asset table.

Important: local asset creation does not write to Google Sheets.

To permanently write new assets back into Google Sheet, a Google Apps Script Web App endpoint is required.

## Pages

- `Overview`: summary cards and charts.
- `Assets`: searchable/filterable asset tracker table and local add form.
- `Weekly Report`: weekly Slack-ready report.
- `Production Houses`: grouped PH rollup.
- `Alerts`: missing data, duplicates, and invalid live-week checks.
- `Slack Report`: professional tracker summary with copy button.
