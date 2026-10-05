# Cost Management — Expense Tracking Dashboard

A modern, enterprise-style **cost management and expense tracking** dashboard
built with **React + Vite + TypeScript + Tailwind CSS**, powered by a **Google
Apps Script** API and **Google Sheets** as the database.

It tracks entries with the columns **Date, Costing Purpose, Cost Amount, Cost
Description, Total Cost (running) and Month**, groups them by the 17 costing
purposes, and visualises spending by month and purpose.

The UI ships with a fully-featured **demo data mode** so you can explore every
screen immediately, then switch to the live Google Sheets backend by setting a
single environment variable.

---

## ✨ Features

| Area | What you get |
| --- | --- |
| **Login** | Green/white professional sign-in, show/hide password, validation, loading, error and success states, request-access dialog |
| **Dashboard** | Stat cards (Total Cost, This Month, Total Entries, Average / Entry, Top Purpose), monthly spending area chart, purpose donut + bar chart, cumulative line chart, recent entries table, live activity log |
| **Data Entry** | Validated cost form (Date, Costing Purpose, Cost Amount, Cost Description, Remarks), auto-generated Entry ID, Save / Save & New / Reset, attachment placeholder |
| **Records** | Search, purpose/month/date filters, sortable columns, pagination, refresh, view / edit / delete, skeleton loaders, responsive table + mobile cards |
| **View Entry** | Clean detail card, print, back, activity history, edit |
| **Edit Entry** | Modal form, writes `UPDATED_BY` + `UPDATED_AT` back to Sheets |
| **Reports** | Totals, monthly trend, purpose breakdown (pie + bar), purpose/month tables, purpose/month/date filters, CSV export, print |
| **User Management** | Admin-only, add/edit users, roles, disable, search |
| **Settings** | Profile, change-password placeholder, theme (light/dark/system), notification preferences, system information |
| **Roles** | Admin, Manager, Data Entry, Viewer — enforced in the UI and reflected in the API |
| **UX** | Toasts, confirmation dialogs, duplicate-submission guards, empty states, skeletons, auto-refresh on tab focus, error boundary, full responsiveness and dark mode |

### Costing purposes

Essential Expenses (N.Ganj) · Office Expenses · Bazar (Grocery / Market) · TSM ·
Mobile (Minutes / Internet) · Home Expenses · Home Union (Installment) ·
Loan Return · Mobile Recharge (Mohidul+Sompa) · Personal · Transport ·
Home Going · In-laws' House · Travel (Outing/Visit) · Emergency / Medical ·
Food (Outside) · Unexpected Expenses

---

## 🧱 Tech stack

- **React 19** + **Vite** + **TypeScript**
- **Tailwind CSS** with a custom green design system (`#287A57`)
- **shadcn/ui-style** primitives on top of **Radix UI**
- **Lucide React** icons
- **Recharts** for charts
- **Sonner** for toast notifications
- **React Router** for routing
- **Google Apps Script** + **Google Sheets** backend

---

## 📁 Project structure

```
src/
  components/
    common/        # StatCard, DataTable, ConfirmDialog, PageHeader, EmptyState…
    records/       # RecordForm, RecordEditDialog
    ui/            # shadcn-style primitives (button, dialog, select, table…)
  config/          # env.ts, navigation.ts
  hooks/           # useAuth, useTheme, useRecords, useAsyncResource, useDebounce…
  layouts/         # DashboardLayout, Sidebar, Topbar, AuthLayout, guards
  lib/             # cn() class merge helper
  pages/           # Login, Dashboard, DataEntry, Records, RecordView, Reports, Users, Settings
  services/        # apiClient, authService, datasource, recordsService, mock/*
  types/           # shared TypeScript types
  utils/           # format, validation, csv, analytics, permissions, constants
apps-script/
  Code.gs          # complete Google Apps Script backend
  README.md        # backend setup guide
.env.example
```

---

## 🚀 Getting started (frontend)

Requirements: **Node 18+**.

```bash
npm install
npm run dev       # start dev server
npm run build     # type-check + production build
npm run lint      # oxlint
npm run preview   # preview the production build
```

Open the printed local URL. With no backend configured the app runs in
**demo mode** using in-memory data (see below).

### Demo accounts (only used in demo mode)

| Role | Email | Password |
| --- | --- | --- |
| Admin | `admin@opexhub.com` | `Admin@123` |
| Manager | `manager@opexhub.com` | `Manager@123` |
| Data Entry | `data@opexhub.com` | `Data@123` |
| Viewer | `viewer@opexhub.com` | `Viewer@123` |

Click an account on the login screen to autofill it. These credentials exist
**only** in the local demo data source — they are never sent anywhere and are
not a substitute for real authentication.

---

## 🔌 Connecting Google Sheets + Apps Script

### 1. Create the spreadsheet

1. Create a new Google Sheet (or open an existing one).
2. Keep the tab names that `setup()` creates: **Records**, **Users**, **Activity**.

### 2. Add the backend script

1. In the Sheet: **Extensions → Apps Script**.
2. Delete the default `Code.gs` content and paste everything from
   [`apps-script/Code.gs`](apps-script/Code.gs).
3. Save the project.

### 3. Run first-time setup

In the Apps Script editor, run these functions once (authorise when prompted):

- `setup()` — creates the three tabs, headers and a default admin
  (`admin@opexhub.com` / `ChangeMe@123`).
- `setApiKey()` — **optional but recommended**: stores a shared API key in
  Script Properties. Edit the value inside the function before running.
- `seedSampleData()` — optional: fills the Records sheet with ~110 sample cost
  entries so the dashboard and reports are populated immediately.
- `createUser(...)` — optional helper to add additional users with hashed
  passwords from the editor.

> Passwords are hashed with salted **SHA-256** (`hashPassword`). Plaintext
> passwords are never stored in the sheet.

### 4. Deploy as a Web App

1. **Deploy → New deployment → Web app**.
2. **Execute as:** *Me*.
3. **Who has access:** *Anyone* (the API key / role checks provide a first
   layer of control; see security notes).
4. Click **Deploy** and copy the **`/exec` URL**.

### 5. Point the frontend at it

Create `.env.local` from `.env.example`:

```env
VITE_API_URL=https://script.google.com/macros/s/XXXXXXXXXXXX/exec
VITE_API_KEY=the-same-value-you-stored-in-Script-Properties
```

Restart `npm run dev`. The app now reads and writes live Google Sheets data.

---

## 🗄️ Sheet schema

**Records**

```
ID  DATE  MONTH  COSTING_PURPOSE  COST_AMOUNT  COST_DESCRIPTION
TOTAL_COST  REMARKS  CREATED_BY  CREATED_AT  UPDATED_BY  UPDATED_AT
```

`TOTAL_COST` is a running cumulative total, recomputed after every change.

**Users**

```
ID  NAME  EMAIL  EMPLOYEE_ID  ROLE  DEPARTMENT  ACTIVE
PASSWORD_HASH  PASSWORD_SALT  CREATED_AT  LAST_LOGIN
```

**Activity**

```
ID  ACTION  RECORD_ID  ACTOR  DETAIL  TIMESTAMP
```

---

## 🔗 API actions

All requests are `POST` with a JSON body `{ action, ...payload }` and return
`{ success, message, data }`. If configured, include `apiKey`.

| Action | Purpose |
| --- | --- |
| `health` | Connectivity check |
| `authenticate` | `{ identifier, password }` → session user |
| `listRecords` / `getRecord` | Read entries |
| `createRecord` / `updateRecord` | `{ record, actor, id? }` |
| `deleteRecord` | `{ id, actor }` |
| `listUsers` / `saveUser` / `deleteUser` | User administration |
| `listActivity` | Audit log |
| `getDashboardStats` / `getReportData` | Aggregations |

Example response:

```json
{ "success": true, "message": "Cost entry saved successfully.", "data": { "id": "CM-261017-0007" } }
```

---

## 🔐 Security notes (important)

This project demonstrates a realistic architecture, but a browser-only shared
secret is **not** production-grade authentication:

- **Never** embed Google service-account credentials or sheet IDs in the
  frontend. Only the Apps Script Web App URL and an optional shared key live in
  the client env.
- Passwords are hashed in the sheet, but the demo session token is stored in
  `localStorage`. **For production, replace this with Google OAuth / Workspace
  SSO** or a real identity provider, and validate the Google-issued identity
  token server-side in Apps Script.
- Restrict the Web App deployment (e.g. "Anyone within your organisation") and
  put the API behind an authenticated proxy if possible.
- Rotate the API key regularly and keep `.env.local` out of version control.

---

## 🎨 Design system

| Token | Value |
| --- | --- |
| Primary green | `#287A57` |
| Background | `#F5F7F6` |
| Cards | White, `rounded-xl`, soft layered shadows |
| Font | Inter |
| Themes | Light / Dark / System |

---

## 📝 License

Provided as a starting point for your own internal tooling. Replace all
placeholder branding, company names and credentials before production use.
