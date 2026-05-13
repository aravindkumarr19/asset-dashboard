# Asset Intelligence Dashboard

This is a static internal Asset Intelligence Dashboard powered by the Asset Status Tracker Google Sheet. It reads live tracker data, calculates management-level metrics, shows a searchable asset table, opens asset detail views, groups production houses, generates weekly Slack reports, and supports browser-local asset creation.

No sample or mock data is used.

## Files

- `index.html` contains the login screen, dark sidebar, dashboard pages, weekly report controls, asset table, and full-page asset detail view.
- `styles.css` contains the Inter-only BetterInvest-style internal dashboard design.
- `script.js` handles login, Google Sheet fetching, local asset storage, filtering, summary metrics, charts, alerts, asset details, and weekly reports.
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

## Overview Metrics

- `Total GTV (Cr)` sums `Eligibility in Crores` across all assets when no filters are active.
- `[Selected Month] GTV (Cr)` shows the same calculation for one selected month.
- `Filtered GTV (Cr)` shows the same calculation when multiple filters or non-month filters are active.
- `Total Funded Projects` counts rows with `Status` containing funded/live. If no status data exists, it falls back to total filtered rows.
- `Total Assets` counts filtered tracker rows.
- `Production Houses` counts unique `PH Name` values.
- `Average Turnaround Time` uses `Fullfillment Date` when numeric, otherwise calculates date difference from `Funded Date` to `Fullfillment Date`, or from `Funded Date` to `Live Date` when fulfilment date is unavailable.
- `Missing Data` counts missing important tracker fields.

## Weekly Report

The Weekly Report page includes:

- Month selector
- Week selector with Week 1 to Week 5
- Manual `Upcoming Pipeline for the Week` input
- Generate Weekly Report button
- Copy Report button

The generated report uses the selected Month and Week only.

## Asset Detail View

Click any asset row in the Assets table to open a read-only full-page Asset Details view. The page preserves and displays all useful available Google Sheet fields, including `Deal Type`, `Fullfillment Date`, `Funded Date`, `Status`, `Live Date`, `Eligibility`, `Eligibility in Crores`, and any extra tracker columns present in the sheet. Empty values show `-`.

## Local Asset Creation

The `Create New Asset` form adds assets locally in the browser:

- New assets appear immediately in the table, summaries, filters, charts, alerts, Production Houses page, and weekly reports.
- New assets are stored in browser `localStorage`.
- New assets remain after refresh in the same browser.
- They are marked as `Local` in the asset table.

Important: local asset creation does not write to Google Sheets.

To permanently write new assets back into Google Sheet, a Google Apps Script Web App endpoint is required.
