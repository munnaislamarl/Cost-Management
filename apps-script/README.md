# Cost Management — Google Apps Script backend

This folder contains the complete server side of the Cost Management dashboard.
It exposes a JSON API backed by a Google Spreadsheet and is deployed as a Google
Apps Script Web App.

## Files

- `Code.gs` — the full API (routing, cost CRUD, running totals, users, activity,
  stats, reports, auth, validation, hashing, sample data seeding).

## Quick start

1. Open your Google Sheet → **Extensions → Apps Script**.
2. Replace `Code.gs` with this project's `apps-script/Code.gs`.
3. Run `setup()` once and authorise. It creates:
   - `Records`, `Users`, `Activity`, `Categories` tabs with headers
   - a default admin: `admin@opexhub.com` / `ChangeMe@123`
   - seeds the `Categories` tab with the 17 default cost categories and
     renames the Records category column to `COST_CATEGORY` if it was still
     the old `COSTING_PURPOSE` header
4. (Recommended) Edit `setApiKey()`, then run it to store a shared API key.
5. (Optional) Run `seedSampleData()` to fill the sheet with sample cost data.
6. **Deploy → New deployment → Web app**
   - Execute as: **Me**
   - Who has access: **Anyone** (or restrict to your organisation)
7. Copy the `/exec` URL into the frontend `.env.local` as `VITE_API_URL`.

## Records sheet columns

```
ID  DATE  MONTH  COST_CATEGORY  COST_AMOUNT  COST_DESCRIPTION
TOTAL_COST  REMARKS  CREATED_BY  CREATED_AT  UPDATED_BY  UPDATED_AT
```

`TOTAL_COST` is a **running cumulative total**, recomputed automatically after
every create / update / delete, ordered by date.

## Cost categories

Categories are stored in their own `Categories` tab and managed from the
frontend **Settings → Cost Categories** tab (admin only).

- `setup()` seeds the tab with the 17 default categories when empty.
- `listCategories` returns the active names.
- `createCategory` rejects duplicates.
- `deleteCategory` refuses to remove a category still used by cost entries.
- Existing records still read correctly while the column header is renamed
  from `COSTING_PURPOSE` to `COST_CATEGORY` (`rowToRecord` falls back to
  either header). Re-run `setup()` or `renamePurposeHeader()` once to finish
  the header rename.

The 17 default categories:

```
Essential Expenses (N.Ganj), Office Expenses, Bazar (Grocery / Market), TSM,
Mobile (Minutes / Internet), Home Expenses, Home Union (Installment),
Loan Return, Mobile Recharge (Mohidul+Sompa), Personal, Transport,
Home Going, In-laws' House, Travel (Outing/Visit), Emergency / Medical,
Food (Outside), Unexpected Expenses
```

## Managing users

```js
createUser('Jane Doe', 'jane@company.com', 'EMP-0042', 'manager', 'Operations', 'A-Strong-Password')
```

Roles: `admin`, `manager`, `data_entry`, `viewer`.

## API contract

Every request is a `POST` with a JSON body. `doGet` also works for browser tests
using `?action=health` or `?action=listRecords`.

```
{ "action": "createRecord", "record": { ... }, "actor": "Jane Doe", "apiKey": "…" }
```

### Supported actions

| Action | Payload |
| --- | --- |
| `health` | — |
| `authenticate` | `identifier`, `password` |
| `listRecords` | — |
| `getRecord` | `id` |
| `createRecord` | `record`, `actor` |
| `updateRecord` | `id`, `record`, `actor` |
| `deleteRecord` | `id`, `actor` |
| `listUsers` | — |
| `saveUser` | `user` |
| `deleteUser` | `id` |
| `listActivity` | — |
| `listCategories` | — |
| `createCategory` | `name`, `actor` |
| `deleteCategory` | `name`, `actor` |
| `getDashboardStats` | — |
| `getReportData` | — |

## CORS note

Apps Script Web Apps do not answer CORS pre-flight (`OPTIONS`) requests, so the
frontend sends `POST` bodies with `Content-Type: text/plain;charset=utf-8`.
`doPost` parses the raw body, avoiding the pre-flight entirely.

## Security

- Passwords: salted SHA-256 hashes, compared in constant time.
- API key: optional shared secret stored in **Script Properties** (`API_KEY`).
- Audit log: every create/update/delete/login is appended to `Activity`.
- For production, add Google OAuth identity verification in `route()`.
