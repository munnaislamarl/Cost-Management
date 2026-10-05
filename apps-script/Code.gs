/**
 * Cost Management — Google Apps Script backend
 * ============================================
 * Web App API that turns a Google Spreadsheet into a lightweight cost database
 * for the Cost Management dashboard.
 *
 * Deploy as a Web App ("Execute as: Me", "Who has access: Anyone") and point
 * the frontend at the deployment URL via VITE_API_URL.
 *
 * Spreadsheet tabs created by `setup()`:
 *   - Records   : cost entries  (Date, Costing Purpose, Cost Amount, ...)
 *   - Users     : application users + hashed passwords
 *   - Activity  : audit log of changes
 *
 * SECURITY
 *   - Passwords are salted SHA-256 hashes, never plaintext.
 *   - Optional shared API key stored in Script Properties (key: API_KEY).
 */

/* ------------------------------------------------------------------ */
/* Configuration                                                      */
/* ------------------------------------------------------------------ */

var SHEET_RECORDS = 'Records';
var SHEET_USERS = 'Users';
var SHEET_ACTIVITY = 'Activity';
var SHEET_REQUESTS = 'Requests';

var RECORD_HEADERS = [
  'ID',
  'DATE',
  'MONTH',
  'COSTING_PURPOSE',
  'COST_AMOUNT',
  'COST_DESCRIPTION',
  'TOTAL_COST',
  'REMARKS',
  'CREATED_BY',
  'CREATED_AT',
  'UPDATED_BY',
  'UPDATED_AT'
];

var USER_HEADERS = [
  'ID',
  'NAME',
  'EMAIL',
  'EMPLOYEE_ID',
  'ROLE',
  'DEPARTMENT',
  'ACTIVE',
  'PASSWORD_HASH',
  'PASSWORD_SALT',
  'CREATED_AT',
  'LAST_LOGIN'
];

var ACTIVITY_HEADERS = ['ID', 'ACTION', 'RECORD_ID', 'ACTOR', 'DETAIL', 'TIMESTAMP'];

var REQUEST_HEADERS = [
  'ID',
  'NAME',
  'EMAIL',
  'EMPLOYEE_ID',
  'DEPARTMENT',
  'MESSAGE',
  'STATUS',
  'PASSWORD_HASH',
  'PASSWORD_SALT',
  'REQUESTED_AT',
  'DECIDED_BY',
  'DECIDED_AT'
];

var CACHE_RECORDS = 'cm_records_v1';
var CACHE_USERS = 'cm_users_v1';
var CACHE_TTL_SECONDS = 25;

var COSTING_PURPOSES = [
  'Essential Expenses (N.Ganj)',
  'Office Expenses',
  'Bazar (Grocery / Market)',
  'TSM',
  'Mobile (Minutes / Internet)',
  'Home Expenses',
  'Home Union (Installment)',
  'Loan Return',
  'Mobile Recharge (Mohidul+Sompa)',
  'Personal',
  'Transport',
  'Home Going',
  "In-laws' House",
  'Travel (Outing/Visit)',
  'Emergency / Medical',
  'Food (Outside)',
  'Unexpected Expenses'
];

var FULL_MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December'
];
var SHORT_MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

/* ------------------------------------------------------------------ */
/* One-time setup helpers                                             */
/* ------------------------------------------------------------------ */

/** Run once to create all tabs, headers and a default administrator. */
function setup() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  ensureSheet(ss, SHEET_RECORDS, RECORD_HEADERS);
  ensureSheet(ss, SHEET_USERS, USER_HEADERS);
  ensureSheet(ss, SHEET_ACTIVITY, ACTIVITY_HEADERS);
  ensureSheet(ss, SHEET_REQUESTS, REQUEST_HEADERS);
  formatMonthColumn();

  var users = readSheet(SHEET_USERS);
  if (users.length === 0) {
    var salt = makeSalt();
    appendObject(SHEET_USERS, USER_HEADERS, {
      ID: 'USR-0001',
      NAME: 'System Administrator',
      EMAIL: 'admin@opexhub.com',
      EMPLOYEE_ID: 'EMP-0001',
      ROLE: 'admin',
      DEPARTMENT: 'Administration',
      ACTIVE: 'TRUE',
      PASSWORD_HASH: hashPassword('ChangeMe@123', salt),
      PASSWORD_SALT: salt,
      CREATED_AT: new Date().toISOString(),
      LAST_LOGIN: ''
    });
  }

  SpreadsheetApp.getActive().toast('Cost Management setup complete.');
}

/** Store the shared API key in Script Properties. Edit and run once. */
function setApiKey() {
  var key = 'replace-with-a-long-random-string';
  PropertiesService.getScriptProperties().setProperty('API_KEY', key);
  return 'API_KEY stored. Update your frontend VITE_API_KEY to match.';
}

/** Create a user with a hashed password. Run from the editor. */
function createUser(name, email, employeeId, role, department, plainPassword) {
  var salt = makeSalt();
  var id = 'USR-' + Utilities.formatString('%04d', readSheet(SHEET_USERS).length + 1);
  appendObject(SHEET_USERS, USER_HEADERS, {
    ID: id,
    NAME: name,
    EMAIL: email,
    EMPLOYEE_ID: employeeId,
    ROLE: role,
    DEPARTMENT: department,
    ACTIVE: 'TRUE',
    PASSWORD_HASH: hashPassword(plainPassword, salt),
    PASSWORD_SALT: salt,
    CREATED_AT: new Date().toISOString(),
    LAST_LOGIN: ''
  });
  return 'Created ' + id;
}

/**
 * Populate the Records sheet with sample cost data (safe to run once).
 * Runs entirely from the Apps Script editor — no redeploy needed.
 */
function seedSampleData() {
  var sheet = getSheet(SHEET_RECORDS);
  var existing = readSheet(SHEET_RECORDS);
  if (existing.length > 0) {
    return 'Records sheet already has ' + existing.length + ' rows — seed skipped.';
  }

  var base = [
    ['2026-01-01', 'Home Expenses', 440, 'Home Extra'],
    ['2026-01-02', 'Home Expenses', 650, 'Mirzapur+Chips+Gari Vara'],
    ['2026-01-02', 'Mobile Recharge (Mohidul+Sompa)', 599, 'Mohidul+Sompa (Mobile Recharge)'],
    ['2026-01-02', 'Home Going', 830, 'Narayanganj Return'],
    ['2026-01-03', 'TSM', 76, ''],
    ['2026-01-03', 'Bazar (Grocery / Market)', 55, 'Dim+Lighter'],
    ['2026-01-04', 'TSM', 76, ''],
    ['2026-01-04', 'Loan Return', 7500, 'Rasel Sir (Loan-Return)'],
    ['2026-01-04', 'Loan Return', 350, 'Hasib Bhai (Loan-Return)']
  ];

  var descriptions = {
    'Essential Expenses (N.Ganj)': ['Monthly essentials', 'N.Ganj household essentials'],
    'Office Expenses': ['Office supplies', 'Client meeting', 'Printing & stationery'],
    'Bazar (Grocery / Market)': ['Weekly bazar', 'Vegetables & fish', 'Rice, oil, spices'],
    TSM: ['Daily TSM', 'TSM top-up'],
    'Mobile (Minutes / Internet)': ['Internet package', 'Talk-time recharge'],
    'Home Expenses': ['Home extra', 'House repair'],
    'Home Union (Installment)': ['Monthly installment', 'Home union deposit'],
    'Loan Return': ['Loan repayment', 'Borrowed money return'],
    'Mobile Recharge (Mohidul+Sompa)': ['Mohidul+Sompa recharge', 'Dual recharge'],
    Personal: ['Personal purchase', 'Salon'],
    Transport: ['CNG fare', 'Bus fare', 'Rickshaw / auto'],
    'Home Going': ['Home trip', 'Village travel'],
    "In-laws' House": ['In-laws visit', 'Gift for in-laws'],
    'Travel (Outing/Visit)': ['Family outing', 'Weekend trip'],
    'Emergency / Medical': ['Medicine', 'Doctor visit'],
    'Food (Outside)': ['Lunch outside', 'Dinner with family'],
    'Unexpected Expenses': ['Unexpected repair', 'Sudden expense']
  };

  var now = new Date();
  var rows = [];

  // Provided sample rows first
  base.forEach(function (item, index) {
    rows.push(makeSeedRow(item[0], item[1], item[2], item[3], index));
  });

  // Randomised rows across the last 6 months
  for (var i = 0; i < 100; i++) {
    var purpose = COSTING_PURPOSES[Math.floor(Math.random() * COSTING_PURPOSES.length)];
    var daysAgo = Math.floor(Math.random() * 180);
    var date = new Date(now.getFullYear(), now.getMonth(), now.getDate() - daysAgo, 10, 0, 0);
    var amount = randomAmountFor(purpose);
    var list = descriptions[purpose] || ['Cost entry'];
    var description = list[Math.floor(Math.random() * list.length)];
    rows.push(makeSeedRow(formatDateOnly(date), purpose, amount, description, i + 100));
  }

  rows.sort(function (a, b) {
    return new Date(a[1]).getTime() - new Date(b[1]).getTime();
  });

  rows.forEach(function (row) {
    appendObject(SHEET_RECORDS, RECORD_HEADERS, {
      ID: row[0],
      DATE: row[1],
      MONTH: row[2],
      COSTING_PURPOSE: row[3],
      COST_AMOUNT: row[4],
      COST_DESCRIPTION: row[5],
      TOTAL_COST: 0,
      REMARKS: '',
      CREATED_BY: 'System Administrator',
      CREATED_AT: new Date().toISOString(),
      UPDATED_BY: 'System Administrator',
      UPDATED_AT: new Date().toISOString()
    });
  });

  recomputeTotals();
  logActivity('create', '', 'System Administrator', 'Seeded ' + rows.length + ' sample cost entries');
  return 'Seeded ' + rows.length + ' sample cost entries.';
}

function makeSeedRow(dateStr, purpose, amount, description, index) {
  var d = new Date(dateStr);
  var stamp =
    String(d.getFullYear()).slice(2) +
    Utilities.formatString('%02d', d.getMonth() + 1) +
    Utilities.formatString('%02d', d.getDate());
  var id = 'CM-' + stamp + '-' + Utilities.formatString('%04d', index + 1);
  return [id, dateStr, monthLabel(d), purpose, amount, description];
}

function randomAmountFor(purpose) {
  var ranges = {
    'Loan Return': [350, 7500],
    'Home Union (Installment)': [2000, 6000],
    'Emergency / Medical': [300, 5000],
    'Travel (Outing/Visit)': [500, 4000],
    'Home Expenses': [300, 2500],
    'Home Going': [400, 1600],
    TSM: [76, 152],
    'Bazar (Grocery / Market)': [40, 900],
    'Food (Outside)': [120, 850],
    Transport: [60, 900],
    'Mobile (Minutes / Internet)': [100, 700],
    'Mobile Recharge (Mohidul+Sompa)': [200, 800]
  };
  var range = ranges[purpose] || [100, 2500];
  return Math.round((range[0] + Math.random() * (range[1] - range[0])) * 100) / 100;
}

function ensureSheet(ss, name, headers) {
  var sheet = ss.getSheetByName(name);
  if (!sheet) sheet = ss.insertSheet(name);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(headers);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
  }
  return sheet;
}

/** Forces the DATE and MONTH columns to the formats the dashboard expects. */
function lockFormats() {
  var sheet = getSheet(SHEET_RECORDS);
  var dateColumn = RECORD_HEADERS.indexOf('DATE') + 1;
  var monthColumn = RECORD_HEADERS.indexOf('MONTH') + 1;
  var rows = Math.max(sheet.getMaxRows() - 1, 1);
  if (dateColumn > 0) sheet.getRange(2, dateColumn, rows, 1).setNumberFormat('d-MMM-yyyy');
  if (monthColumn > 0) sheet.getRange(2, monthColumn, rows, 1).setNumberFormat('@');
}

// Kept for backwards compatibility with older scheduled triggers.
function formatMonthColumn() {
  lockFormats();
}

/**
 * Converts the DATE column to real date values and displays them as
 * "d-MMM-yyyy" (e.g. 5-Feb-2026), then locks the column formats.
 * Run once from the editor. No redeploy needed.
 */
function formatDates() {
  var sheet = getSheet(SHEET_RECORDS);
  var rows = readSheet(SHEET_RECORDS);
  var dateColumn = RECORD_HEADERS.indexOf('DATE') + 1;
  if (!rows.length) {
    lockFormats();
    return 'No dates to format.';
  }
  var values = rows.map(function (row) {
    var date = new Date(row.DATE);
    return [isNaN(date.getTime()) ? row.DATE : date];
  });
  sheet.getRange(2, dateColumn, values.length, 1).setValues(values);
  lockFormats();
  invalidateCache();
  return 'Formatted ' + values.length + ' dates.';
}

/**
 * Repairs the ID column: reassigns every row a unique, sequential ID
 * (ordered by date) and recomputes totals. Run once from the editor after
 * fixing duplicate IDs. No redeploy needed.
 */
function repairIds() {
  var sheet = getSheet(SHEET_RECORDS);
  var rows = readSheet(SHEET_RECORDS);
  if (!rows.length) return 'No records to repair.';

  var indexed = rows.map(function (row, index) {
    return { row: row, index: index };
  });
  indexed.sort(function (a, b) {
    var diff = new Date(a.row.DATE).getTime() - new Date(b.row.DATE).getTime();
    if (diff !== 0) return diff;
    return new Date(a.row.CREATED_AT).getTime() - new Date(b.row.CREATED_AT).getTime();
  });

  var idColumn = RECORD_HEADERS.indexOf('ID') + 1;
  var newIds = new Array(rows.length);
  indexed.forEach(function (item, sequence) {
    var date = new Date(item.row.DATE);
    var stamp =
      String(date.getFullYear()).slice(2) +
      Utilities.formatString('%02d', date.getMonth() + 1) +
      Utilities.formatString('%02d', date.getDate());
    newIds[item.index] = 'CM-' + stamp + '-' + Utilities.formatString('%04d', sequence + 1);
  });

  sheet
    .getRange(2, idColumn, newIds.length, 1)
    .setValues(
      newIds.map(function (id) {
        return [id];
      })
    );
  recomputeTotals();
  invalidateCache();
  return 'Reassigned ' + newIds.length + ' unique IDs.';
}

/**
 * Repairs the MONTH column: rewrites every row as text "Month-Year" derived
 * from DATE and locks the column format to plain text. Run once from the
 * editor (no redeploy needed).
 */
function repairMonths() {
  var sheet = getSheet(SHEET_RECORDS);
  var rows = readSheet(SHEET_RECORDS);
  var column = RECORD_HEADERS.indexOf('MONTH') + 1;
  if (column <= 0) return 'MONTH column not found.';
  sheet.getRange(1, column, sheet.getMaxRows(), 1).setNumberFormat('@');
  if (!rows.length) return 'No records to repair.';
  var values = rows.map(function (row) {
    return [monthLabel(new Date(row.DATE))];
  });
  sheet.getRange(2, column, values.length, 1).setValues(values);
  invalidateCache();
  return 'Repaired MONTH for ' + values.length + ' rows.';
}

/**
 * Sorts the Records sheet rows by DATE (then ID) so the sheet stays in
 * chronological / serial order. Run from the editor. No redeploy needed.
 */
function sortRecordsByDate() {
  var sheet = getSheet(SHEET_RECORDS);
  var lastRow = sheet.getLastRow();
  if (lastRow < 3) return 'Nothing to sort.';
  var dateColumn = RECORD_HEADERS.indexOf('DATE') + 1;
  var idColumn = RECORD_HEADERS.indexOf('ID') + 1;
  sheet
    .getRange(2, 1, lastRow - 1, RECORD_HEADERS.length)
    .sort([
      { column: dateColumn, ascending: true },
      { column: idColumn, ascending: true }
    ]);
  recomputeTotals();
  invalidateCache();
  return 'Sorted ' + (lastRow - 1) + ' rows by date.';
}

/**
 * One-shot maintenance: unique IDs, text MONTH column and date order.
 * Run this once from the editor after importing data.
 */
function repairAll() {
  var messages = [];
  messages.push(repairIds());
  messages.push(repairMonths());
  messages.push(sortRecordsByDate());
  messages.push(formatDates());
  return messages.join('  |  ');
}

/* ------------------------------------------------------------------ */
/* HTTP entry points                                                  */
/* ------------------------------------------------------------------ */

function doGet(e) {
  var params = (e && e.parameter) || {};
  var action = params.action || 'health';
  var payload = params.payload ? safeParse(params.payload) : {};
  return route(action, payload);
}

function doPost(e) {
  var body = {};
  try {
    body = e && e.postData && e.postData.contents ? JSON.parse(e.postData.contents) : {};
  } catch (error) {
    return jsonResponse(false, 'Invalid JSON request body.', null, 'BAD_REQUEST');
  }
  var action = body.action;
  if (!action) return jsonResponse(false, 'Missing "action" parameter.', null, 'BAD_REQUEST');
  return route(action, body);
}

function route(action, payload) {
  try {
    if (!checkApiKey(payload)) {
      return jsonResponse(false, 'Unauthorized: invalid API key.', null, 'UNAUTHORIZED');
    }

    switch (action) {
      case 'health':
        return jsonResponse(true, 'Cost Management API is running.', {
          timestamp: new Date().toISOString()
        });

      case 'authenticate':
        return authenticate(payload);

      case 'listRecords':
        return jsonResponse(true, 'Entries loaded.', listRecords());
      case 'getRecord':
        return getRecord(payload);
      case 'createRecord':
        return createRecord(payload);
      case 'createRecords':
        return createRecords(payload);
      case 'updateRecord':
        return updateRecord(payload);
      case 'deleteRecord':
        return deleteRecord(payload);

      case 'listUsers':
        return jsonResponse(true, 'Users loaded.', listUsers());
      case 'saveUser':
        return saveUser(payload);
      case 'deleteUser':
        return deleteUser(payload);

      case 'requestAccess':
        return requestAccess(payload);
      case 'listRequests':
        return jsonResponse(true, 'Requests loaded.', listRequests());
      case 'approveRequest':
        return approveRequest(payload);
      case 'rejectRequest':
        return rejectRequest(payload);

      case 'listActivity':
        return jsonResponse(true, 'Activity loaded.', listActivity());

      case 'getDashboard':
        return jsonResponse(true, 'Dashboard loaded.', dashboardPayload());
      case 'getDashboardStats':
        return jsonResponse(true, 'Dashboard statistics loaded.', dashboardStats());
      case 'getReportData':
        return jsonResponse(true, 'Report data loaded.', reportData());

      default:
        return jsonResponse(false, 'Unknown action: ' + action, null, 'UNKNOWN_ACTION');
    }
  } catch (error) {
    logError(error);
    return jsonResponse(false, error.message || 'Unexpected server error.', null, 'SERVER_ERROR');
  }
}

/* ------------------------------------------------------------------ */
/* Authentication                                                     */
/* ------------------------------------------------------------------ */

function authenticate(payload) {
  var identifier = String(payload.identifier || '').trim().toLowerCase();
  var password = String(payload.password || '');
  if (!identifier || !password) {
    return jsonResponse(false, 'Email/employee ID and password are required.', null, 'VALIDATION');
  }

  var users = readSheet(SHEET_USERS);
  var user = null;
  for (var i = 0; i < users.length; i++) {
    if (
      String(users[i].EMAIL).toLowerCase() === identifier ||
      String(users[i].EMPLOYEE_ID).toLowerCase() === identifier
    ) {
      user = users[i];
      break;
    }
  }

  if (!user) return jsonResponse(false, 'Invalid credentials.', null, 'AUTH_FAILED');
  if (String(user.ACTIVE).toUpperCase() !== 'TRUE') {
    return jsonResponse(false, 'This account has been disabled.', null, 'ACCOUNT_DISABLED');
  }
  if (!constantTimeEquals(hashPassword(password, user.PASSWORD_SALT), user.PASSWORD_HASH)) {
    return jsonResponse(false, 'Invalid credentials.', null, 'AUTH_FAILED');
  }

  updateRowWhere(SHEET_USERS, USER_HEADERS, 'ID', user.ID, {
    LAST_LOGIN: new Date().toISOString()
  });
  invalidateCache();
  logActivity('login', '', user.NAME, 'User signed in');

  return jsonResponse(true, 'Signed in successfully.', {
    id: user.ID,
    name: user.NAME,
    email: user.EMAIL,
    employeeId: user.EMPLOYEE_ID,
    role: String(user.ROLE || 'viewer').toLowerCase(),
    department: user.DEPARTMENT
  });
}

/* ------------------------------------------------------------------ */
/* Cost records CRUD                                                  */
/* ------------------------------------------------------------------ */

function listRecords() {
  var cached = cacheGet(CACHE_RECORDS);
  if (cached) return cached;

  var rows = readSheet(SHEET_RECORDS);
  var records = rows.map(rowToRecord);
  records.sort(function (a, b) {
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });
  cachePut(CACHE_RECORDS, records);
  return records;
}

function cacheGet(key) {
  try {
    var value = CacheService.getScriptCache().get(key);
    return value ? JSON.parse(value) : null;
  } catch (error) {
    return null;
  }
}

function cachePut(key, value) {
  try {
    var json = JSON.stringify(value);
    if (json.length < 95000) {
      CacheService.getScriptCache().put(key, json, CACHE_TTL_SECONDS);
    }
  } catch (error) {
    // caching is best-effort only
  }
}

function invalidateCache() {
  try {
    var cache = CacheService.getScriptCache();
    cache.remove(CACHE_RECORDS);
    cache.remove(CACHE_USERS);
  } catch (error) {
    // ignore
  }
}

function getRecord(payload) {
  var id = String(payload.id || '');
  var rows = readSheet(SHEET_RECORDS);
  for (var i = 0; i < rows.length; i++) {
    if (String(rows[i].ID) === id) return jsonResponse(true, 'Entry loaded.', rowToRecord(rows[i]));
  }
  return jsonResponse(false, 'Entry not found: ' + id, null, 'NOT_FOUND');
}

function createRecord(payload) {
  var input = payload.record || {};
  var actor = String(payload.actor || 'Unknown user');
  var errors = validateRecordInput(input);
  if (errors.length) return jsonResponse(false, errors.join(' '), null, 'VALIDATION');

  var now = new Date().toISOString();
  var id = nextRecordId();
  appendObject(SHEET_RECORDS, RECORD_HEADERS, {
    ID: id,
    DATE: normalizeDate(input.date),
    MONTH: monthLabel(new Date(input.date)),
    COSTING_PURPOSE: input.costingPurpose,
    COST_AMOUNT: Number(input.costAmount) || 0,
    COST_DESCRIPTION: input.costDescription,
    TOTAL_COST: 0,
    REMARKS: input.remarks || '',
    CREATED_BY: actor,
    CREATED_AT: now,
    UPDATED_BY: actor,
    UPDATED_AT: now
  });

  recomputeTotals();
  logActivity('create', id, actor, 'Added ' + input.costingPurpose + ' cost of ' + input.costAmount);
  return jsonResponse(true, 'Cost entry saved successfully.', findRecordById(id));
}

/**
 * Bulk create: saves many cost entries (same date) in a single request, then
 * recomputes running totals once. Used by the multi-row data-entry form.
 */
function createRecords(payload) {
  var list = payload.records || [];
  var actor = String(payload.actor || 'Unknown user');
  if (!list.length) {
    return jsonResponse(false, 'No entries were provided.', null, 'VALIDATION');
  }

  for (var i = 0; i < list.length; i++) {
    var errors = validateRecordInput(list[i]);
    if (errors.length) {
      return jsonResponse(false, 'Row ' + (i + 1) + ': ' + errors.join(' '), null, 'VALIDATION');
    }
  }

  var base = nextSequence();
  var now = new Date().toISOString();
  var ids = [];

  list.forEach(function (input, index) {
    var id = makeRecordId(base + index);
    ids.push(id);
    appendObject(SHEET_RECORDS, RECORD_HEADERS, {
      ID: id,
      DATE: normalizeDate(input.date),
      MONTH: monthLabel(new Date(input.date)),
      COSTING_PURPOSE: input.costingPurpose,
      COST_AMOUNT: Number(input.costAmount) || 0,
      COST_DESCRIPTION: input.costDescription,
      TOTAL_COST: 0,
      REMARKS: input.remarks || '',
      CREATED_BY: actor,
      CREATED_AT: now,
      UPDATED_BY: actor,
      UPDATED_AT: now
    });
  });

  recomputeTotals();
  logActivity('create', '', actor, 'Added ' + list.length + ' cost entries');
  return jsonResponse(true, 'Cost entries saved successfully.', findRecordsByIds(ids));
}

function findRecordsByIds(ids) {
  var map = {};
  ids.forEach(function (id) {
    map[id] = true;
  });
  return readSheet(SHEET_RECORDS)
    .map(rowToRecord)
    .filter(function (record) {
      return map[record.id];
    });
}

function updateRecord(payload) {
  var id = String(payload.id || '');
  var input = payload.record || {};
  var actor = String(payload.actor || 'Unknown user');
  if (!id) return jsonResponse(false, 'Entry id is required.', null, 'VALIDATION');

  var errors = validateRecordInput(input);
  if (errors.length) return jsonResponse(false, errors.join(' '), null, 'VALIDATION');

  var updated = updateRowWhere(SHEET_RECORDS, RECORD_HEADERS, 'ID', id, {
    DATE: normalizeDate(input.date),
    MONTH: monthLabel(new Date(input.date)),
    COSTING_PURPOSE: input.costingPurpose,
    COST_AMOUNT: Number(input.costAmount) || 0,
    COST_DESCRIPTION: input.costDescription,
    REMARKS: input.remarks || '',
    UPDATED_BY: actor,
    UPDATED_AT: new Date().toISOString()
  });
  if (!updated) return jsonResponse(false, 'Entry not found: ' + id, null, 'NOT_FOUND');

  recomputeTotals();
  logActivity('update', id, actor, 'Updated entry ' + id);
  return jsonResponse(true, 'Cost entry updated successfully.', findRecordById(id));
}

function deleteRecord(payload) {
  var id = String(payload.id || '');
  var actor = String(payload.actor || 'Unknown user');
  var sheet = getSheet(SHEET_RECORDS);
  var rows = readSheet(SHEET_RECORDS);
  for (var i = 0; i < rows.length; i++) {
    if (String(rows[i].ID) === id) {
      sheet.deleteRow(i + 2);
      recomputeTotals();
      logActivity('delete', id, actor, 'Deleted entry ' + id);
      return jsonResponse(true, 'Cost entry deleted successfully.', { id: id });
    }
  }
  return jsonResponse(false, 'Entry not found: ' + id, null, 'NOT_FOUND');
}

function findRecordById(id) {
  var rows = readSheet(SHEET_RECORDS);
  for (var i = 0; i < rows.length; i++) {
    if (String(rows[i].ID) === id) return rowToRecord(rows[i]);
  }
  return null;
}

/** Recomputes the running TOTAL_COST column, ordered by date then id. */
function recomputeTotals() {
  invalidateCache();
  var sheet = getSheet(SHEET_RECORDS);
  var rows = readSheet(SHEET_RECORDS);
  if (!rows.length) return;

  var ordered = rows.slice().sort(function (a, b) {
    var diff = new Date(a.DATE).getTime() - new Date(b.DATE).getTime();
    if (diff !== 0) return diff;
    return String(a.ID).localeCompare(String(b.ID));
  });

  var totalsById = {};
  var running = 0;
  ordered.forEach(function (row) {
    running = round2(running + (Number(row.COST_AMOUNT) || 0));
    totalsById[row.ID] = running;
  });

  var column = RECORD_HEADERS.indexOf('TOTAL_COST') + 1;
  var values = rows.map(function (row) {
    return [totalsById[row.ID] || 0];
  });
  sheet.getRange(2, column, values.length, 1).setValues(values);
  lockFormats();
}

/* ------------------------------------------------------------------ */
/* Users                                                              */
/* ------------------------------------------------------------------ */

function listUsers() {
  var cached = cacheGet(CACHE_USERS);
  if (cached) return cached;

  var users = readSheet(SHEET_USERS).map(function (row) {
    return {
      id: row.ID,
      name: row.NAME,
      email: row.EMAIL,
      employeeId: row.EMPLOYEE_ID,
      role: String(row.ROLE || 'viewer').toLowerCase(),
      department: row.DEPARTMENT,
      active: String(row.ACTIVE).toUpperCase() === 'TRUE',
      createdAt: row.CREATED_AT,
      lastLogin: row.LAST_LOGIN || undefined
    };
  });
  cachePut(CACHE_USERS, users);
  return users;
}

function saveUser(payload) {
  var user = payload.user || {};
  if (!user.name || !user.email || !user.employeeId) {
    return jsonResponse(false, 'Name, email and employee ID are required.', null, 'VALIDATION');
  }

  var rows = readSheet(SHEET_USERS);
  var existing = null;
  for (var i = 0; i < rows.length; i++) {
    if (String(rows[i].ID) === String(user.id)) {
      existing = rows[i];
      break;
    }
  }

  var fields = {
    NAME: user.name,
    EMAIL: user.email,
    EMPLOYEE_ID: user.employeeId,
    ROLE: user.role || 'viewer',
    DEPARTMENT: user.department || '',
    ACTIVE: user.active ? 'TRUE' : 'FALSE'
  };
  if (user.password) {
    var salt = makeSalt();
    fields.PASSWORD_SALT = salt;
    fields.PASSWORD_HASH = hashPassword(user.password, salt);
  }

  if (existing) {
    updateRowWhere(SHEET_USERS, USER_HEADERS, 'ID', existing.ID, fields);
    user.id = existing.ID;
  } else {
    user.id = user.id || 'USR-' + Utilities.formatString('%04d', rows.length + 1);
    fields.ID = user.id;
    fields.CREATED_AT = user.createdAt || new Date().toISOString();
    fields.LAST_LOGIN = '';
    if (!fields.PASSWORD_SALT) {
      var defaultSalt = makeSalt();
      fields.PASSWORD_SALT = defaultSalt;
      fields.PASSWORD_HASH = hashPassword('ChangeMe@123', defaultSalt);
    }
    appendObject(SHEET_USERS, USER_HEADERS, fields);
  }

  invalidateCache();
  return jsonResponse(
    true,
    existing ? 'User updated successfully.' : 'User created successfully.',
    user
  );
}

function deleteUser(payload) {
  var id = String(payload.id || '');
  var sheet = getSheet(SHEET_USERS);
  var rows = readSheet(SHEET_USERS);
  for (var i = 0; i < rows.length; i++) {
    if (String(rows[i].ID) === id) {
      sheet.deleteRow(i + 2);
      invalidateCache();
      return jsonResponse(true, 'User removed successfully.', { id: id });
    }
  }
  return jsonResponse(false, 'User not found: ' + id, null, 'NOT_FOUND');
}

/* ------------------------------------------------------------------ */
/* Access requests (login page -> admin approval)                     */
/* ------------------------------------------------------------------ */

function requestAccess(payload) {
  var input = payload.request || {};
  if (!input.name || !input.email || !input.employeeId || !input.password) {
    return jsonResponse(
      false,
      'Name, email, employee ID and password are required.',
      null,
      'VALIDATION'
    );
  }

  var rows = readSheet(SHEET_REQUESTS);
  var email = String(input.email).toLowerCase();
  for (var i = 0; i < rows.length; i++) {
    if (
      String(rows[i].EMAIL).toLowerCase() === email &&
      String(rows[i].STATUS).toLowerCase() === 'pending'
    ) {
      return jsonResponse(false, 'A request for this email is already pending.', null, 'DUPLICATE');
    }
  }

  var id = nextIdByPrefix(SHEET_REQUESTS, 'REQ');
  var salt = makeSalt();
  appendObject(SHEET_REQUESTS, REQUEST_HEADERS, {
    ID: id,
    NAME: input.name,
    EMAIL: input.email,
    EMPLOYEE_ID: input.employeeId,
    DEPARTMENT: input.department || '',
    MESSAGE: input.message || '',
    STATUS: 'pending',
    PASSWORD_HASH: hashPassword(input.password, salt),
    PASSWORD_SALT: salt,
    REQUESTED_AT: new Date().toISOString(),
    DECIDED_BY: '',
    DECIDED_AT: ''
  });
  invalidateCache();
  logActivity('create', '', input.name, 'Access requested by ' + input.email);
  return jsonResponse(true, 'Access request submitted.', findRequestById(id));
}

function listRequests() {
  return readSheet(SHEET_REQUESTS)
    .map(mapRequest)
    .sort(function (a, b) {
      return new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime();
    });
}

function approveRequest(payload) {
  var id = String(payload.id || '');
  var role = String(payload.role || 'data_entry');
  var department = String(payload.department || '');
  var actor = String(payload.actor || 'Administrator');

  var rows = readSheet(SHEET_REQUESTS);
  var raw = null;
  for (var i = 0; i < rows.length; i++) {
    if (String(rows[i].ID) === id) {
      raw = rows[i];
      break;
    }
  }
  if (!raw) return jsonResponse(false, 'Request not found: ' + id, null, 'NOT_FOUND');

  var now = new Date().toISOString();
  var users = readSheet(SHEET_USERS);
  var existing = null;
  for (var u = 0; u < users.length; u++) {
    if (String(users[u].EMAIL).toLowerCase() === String(raw.EMAIL).toLowerCase()) {
      existing = users[u];
      break;
    }
  }

  if (!existing) {
    appendObject(SHEET_USERS, USER_HEADERS, {
      ID: nextIdByPrefix(SHEET_USERS, 'USR'),
      NAME: raw.NAME,
      EMAIL: raw.EMAIL,
      EMPLOYEE_ID: raw.EMPLOYEE_ID,
      ROLE: role,
      DEPARTMENT: department || raw.DEPARTMENT || '',
      ACTIVE: 'TRUE',
      PASSWORD_HASH: raw.PASSWORD_HASH,
      PASSWORD_SALT: raw.PASSWORD_SALT,
      CREATED_AT: now,
      LAST_LOGIN: ''
    });
  }

  updateRowWhere(SHEET_REQUESTS, REQUEST_HEADERS, 'ID', id, {
    STATUS: 'approved',
    DECIDED_BY: actor,
    DECIDED_AT: now
  });
  invalidateCache();
  logActivity('create', '', actor, 'Approved access for ' + raw.EMAIL);

  var created = findUserByEmail(raw.EMAIL);
  return jsonResponse(
    true,
    existing
      ? 'A user with this email already exists; request marked approved.'
      : 'Access approved. The user can now sign in.',
    created
  );
}

function rejectRequest(payload) {
  var id = String(payload.id || '');
  var actor = String(payload.actor || 'Administrator');
  var updated = updateRowWhere(SHEET_REQUESTS, REQUEST_HEADERS, 'ID', id, {
    STATUS: 'rejected',
    DECIDED_BY: actor,
    DECIDED_AT: new Date().toISOString()
  });
  if (!updated) return jsonResponse(false, 'Request not found: ' + id, null, 'NOT_FOUND');
  invalidateCache();
  return jsonResponse(true, 'Request rejected.', { id: id });
}

function mapRequest(row) {
  return {
    id: row.ID,
    name: row.NAME,
    email: row.EMAIL,
    employeeId: row.EMPLOYEE_ID,
    department: row.DEPARTMENT,
    message: row.MESSAGE,
    status: String(row.STATUS || 'pending').toLowerCase(),
    requestedAt: toIso(row.REQUESTED_AT),
    decidedBy: row.DECIDED_BY || undefined,
    decidedAt: row.DECIDED_AT ? toIso(row.DECIDED_AT) : undefined
  };
}

function findRequestById(id) {
  var rows = readSheet(SHEET_REQUESTS);
  for (var i = 0; i < rows.length; i++) {
    if (String(rows[i].ID) === id) return mapRequest(rows[i]);
  }
  return null;
}

function findUserByEmail(email) {
  var target = String(email).toLowerCase();
  var rows = readSheet(SHEET_USERS);
  for (var i = 0; i < rows.length; i++) {
    if (String(rows[i].EMAIL).toLowerCase() === target) {
      return {
        id: rows[i].ID,
        name: rows[i].NAME,
        email: rows[i].EMAIL,
        employeeId: rows[i].EMPLOYEE_ID,
        role: String(rows[i].ROLE || 'viewer').toLowerCase(),
        department: rows[i].DEPARTMENT,
        active: String(rows[i].ACTIVE).toUpperCase() === 'TRUE',
        createdAt: rows[i].CREATED_AT,
        lastLogin: rows[i].LAST_LOGIN || undefined
      };
    }
  }
  return null;
}

/** Next "PREFIX-000n" id based on the highest existing numeric suffix + 1. */
function nextIdByPrefix(sheetName, prefix) {
  var rows = readSheet(sheetName);
  var max = 0;
  rows.forEach(function (row) {
    var match = String(row.ID || '').match(/(\d+)\s*$/);
    if (match) {
      var value = parseInt(match[1], 10);
      if (!isNaN(value) && value > max) max = value;
    }
  });
  return prefix + '-' + Utilities.formatString('%04d', max + 1);
}

/* ------------------------------------------------------------------ */
/* Activity, statistics and reports                                   */
/* ------------------------------------------------------------------ */

function listActivity() {
  return readSheet(SHEET_ACTIVITY)
    .map(function (row) {
      return {
        id: row.ID,
        action: row.ACTION,
        recordId: row.RECORD_ID,
        actor: row.ACTOR,
        detail: row.DETAIL,
        timestamp: row.TIMESTAMP
      };
    })
    .sort(function (a, b) {
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    })
    .slice(0, 100);
}

function logActivity(action, recordId, actor, detail) {
  try {
    appendObject(SHEET_ACTIVITY, ACTIVITY_HEADERS, {
      ID: 'LOG-' + new Date().getTime() + '-' + Math.floor(Math.random() * 1000),
      ACTION: action,
      RECORD_ID: recordId || '',
      ACTOR: actor || 'system',
      DETAIL: detail || '',
      TIMESTAMP: new Date().toISOString()
    });
  } catch (error) {
    console.error('Activity log failed: ' + error.message);
  }
}

function dashboardStats() {
  return statsFromRecords(listRecords(), listUsers());
}

/** Returns stats + report + recent entries + activity in a single call. */
function dashboardPayload() {
  var records = listRecords();
  var users = listUsers();
  var recent = records
    .slice()
    .sort(function (a, b) {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    })
    .slice(0, 6);

  return {
    stats: statsFromRecords(records, users),
    report: reportFromRecords(records, users),
    recentRecords: recent,
    activity: listActivity().slice(0, 8),
    records: records
  };
}

function statsFromRecords(records, users) {
  var currentMonth = monthLabel(new Date());
  var total = round2(
    records.reduce(function (sum, record) {
      return sum + (Number(record.costAmount) || 0);
    }, 0)
  );
  var monthCost = round2(
    records
      .filter(function (record) {
        return record.month === currentMonth;
      })
      .reduce(function (sum, record) {
        return sum + (Number(record.costAmount) || 0);
      }, 0)
  );
  var largest = records.reduce(function (max, record) {
    return Math.max(max, Number(record.costAmount) || 0);
  }, 0);
  var purposes = purposeSummary(records);
  var top = purposes[0];

  return {
    totalCost: total,
    monthCost: monthCost,
    totalEntries: records.length,
    averageCost: records.length ? round2(total / records.length) : 0,
    largestEntry: round2(largest),
    topPurpose: top ? top.purpose : '—',
    topPurposeCost: top ? top.cost : 0,
    activeUsers: users.filter(function (user) {
      return user.active;
    }).length
  };
}

function purposeSummary(records) {
  var map = {};
  var total = 0;
  records.forEach(function (record) {
    var purpose = record.costingPurpose || 'Uncategorised';
    if (!map[purpose]) map[purpose] = { purpose: purpose, entries: 0, cost: 0, share: 0 };
    map[purpose].entries += 1;
    map[purpose].cost = round2(map[purpose].cost + (Number(record.costAmount) || 0));
    total += Number(record.costAmount) || 0;
  });
  return Object.keys(map)
    .map(function (key) {
      map[key].share = total > 0 ? Math.round((map[key].cost / total) * 1000) / 10 : 0;
      return map[key];
    })
    .sort(function (a, b) {
      return b.cost - a.cost;
    });
}

function reportData() {
  return reportFromRecords(listRecords(), listUsers());
}

function reportFromRecords(records, users) {
  var monthly = [];
  var now = new Date();

  for (var i = 11; i >= 0; i--) {
    var date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    monthly.push({
      month: SHORT_MONTHS[date.getMonth()] + ' ' + String(date.getFullYear()).slice(2),
      monthKey: date.getFullYear() + '-' + ('0' + (date.getMonth() + 1)).slice(-2),
      entries: 0,
      cost: 0,
      cumulative: 0
    });
  }

  var byKey = {};
  monthly.forEach(function (entry) {
    byKey[entry.monthKey] = entry;
  });

  records.forEach(function (record) {
    var d = new Date(record.date);
    var key = d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2);
    var entry = byKey[key];
    if (entry) {
      entry.entries += 1;
      entry.cost = round2(entry.cost + (Number(record.costAmount) || 0));
    }
  });

  var running = 0;
  monthly.forEach(function (entry) {
    running = round2(running + entry.cost);
    entry.cumulative = running;
  });

  var monthsMap = {};
  records.forEach(function (record) {
    if (!record.month) return;
    if (!monthsMap[record.month]) monthsMap[record.month] = { month: record.month, entries: 0, cost: 0, key: monthKey(new Date(record.date)) };
    monthsMap[record.month].entries += 1;
    monthsMap[record.month].cost = round2(monthsMap[record.month].cost + (Number(record.costAmount) || 0));
  });
  var months = Object.keys(monthsMap)
    .map(function (key) {
      var value = monthsMap[key];
      delete value.key;
      return value;
    })
    .sort(function (a, b) {
      return new Date('1 ' + b.month).getTime() - new Date('1 ' + a.month).getTime();
    });

  return {
    summary: statsFromRecords(records, users),
    monthly: monthly,
    purposes: purposeSummary(records),
    months: months,
    byMonth: monthBreakdown(records)
  };
}

/** Purpose breakdown for each month, sorted January → December. */
function monthBreakdown(records) {
  var map = {};

  records.forEach(function (record) {
    var key = monthKey(new Date(record.date));
    if (!key) return;
    if (!map[key]) {
      map[key] = { month: monthLabel(new Date(record.date)), monthKey: key, totalCost: 0, purposes: {} };
    }
    var monthEntry = map[key];
    var purpose = record.costingPurpose || 'Uncategorised';
    var amount = Number(record.costAmount) || 0;
    if (!monthEntry.purposes[purpose]) {
      monthEntry.purposes[purpose] = { purpose: purpose, entries: 0, cost: 0, share: 0 };
    }
    monthEntry.purposes[purpose].entries += 1;
    monthEntry.purposes[purpose].cost = round2(monthEntry.purposes[purpose].cost + amount);
    monthEntry.totalCost = round2(monthEntry.totalCost + amount);
  });

  return Object.keys(map)
    .sort()
    .map(function (key) {
      var entry = map[key];
      var purposes = Object.keys(entry.purposes)
        .map(function (name) {
          var p = entry.purposes[name];
          p.share = entry.totalCost > 0 ? Math.round((p.cost / entry.totalCost) * 1000) / 10 : 0;
          return p;
        })
        .sort(function (a, b) {
          return b.cost - a.cost;
        });
      return {
        month: entry.month,
        monthKey: entry.monthKey,
        totalCost: entry.totalCost,
        purposes: purposes
      };
    });
}

/* ------------------------------------------------------------------ */
/* Low-level sheet helpers                                            */
/* ------------------------------------------------------------------ */

function getSheet(name) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(name);
  if (!sheet) throw new Error('Missing sheet: ' + name + '. Run setup() first.');
  return sheet;
}

function readSheet(name) {
  var sheet = getSheet(name);
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var values = sheet.getRange(2, 1, lastRow - 1, headers.length).getValues();
  return values
    .filter(function (row) {
      return row.join('') !== '';
    })
    .map(function (row) {
      var object = {};
      headers.forEach(function (header, index) {
        object[header] = row[index];
      });
      return object;
    });
}

function appendObject(sheetName, headers, object) {
  var sheet = getSheet(sheetName);
  var row = headers.map(function (header) {
    return object[header] === undefined ? '' : object[header];
  });
  sheet.appendRow(row);
}

function updateRowWhere(sheetName, headers, keyHeader, keyValue, fields) {
  var sheet = getSheet(sheetName);
  var rows = readSheet(sheetName);
  for (var i = 0; i < rows.length; i++) {
    if (String(rows[i][keyHeader]) === String(keyValue)) {
      var rowNumber = i + 2;
      headers.forEach(function (header, columnIndex) {
        if (Object.prototype.hasOwnProperty.call(fields, header)) {
          sheet.getRange(rowNumber, columnIndex + 1).setValue(fields[header]);
          rows[i][header] = fields[header];
        }
      });
      return rows[i];
    }
  }
  return null;
}

function nextRecordId() {
  return makeRecordId(nextSequence());
}

/**
 * Next safe sequence number = highest existing numeric ID suffix + 1.
 * (Using the row count breaks after deletions, which caused duplicate IDs.)
 */
function nextSequence() {
  var rows = readSheet(SHEET_RECORDS);
  var max = 0;
  rows.forEach(function (row) {
    var match = String(row.ID || '').match(/(\d+)\s*$/);
    if (match) {
      var value = parseInt(match[1], 10);
      if (!isNaN(value) && value > max) max = value;
    }
  });
  return max + 1;
}

function makeRecordId(sequence) {
  var now = new Date();
  var stamp =
    String(now.getFullYear()).slice(2) +
    Utilities.formatString('%02d', now.getMonth() + 1) +
    Utilities.formatString('%02d', now.getDate());
  return 'CM-' + stamp + '-' + Utilities.formatString('%04d', Math.max(1, sequence));
}

/* ------------------------------------------------------------------ */
/* Validation & serialization                                         */
/* ------------------------------------------------------------------ */

function validateRecordInput(input) {
  var errors = [];
  if (!input.date) errors.push('Date is required.');
  if (!input.costingPurpose) errors.push('Costing purpose is required.');
  if (input.costAmount === '' || input.costAmount === null || input.costAmount === undefined) {
    errors.push('Cost amount is required.');
  } else if (!(Number(input.costAmount) >= 0)) {
    errors.push('Cost amount cannot be negative.');
  }
  if (!input.costDescription) errors.push('Cost description is required.');
  return errors;
}

function rowToRecord(row) {
  return {
    id: String(row.ID || ''),
    date: toIso(row.DATE),
    month: monthLabel(new Date(row.DATE)),
    costingPurpose: row.COSTING_PURPOSE || '',
    costAmount: Number(row.COST_AMOUNT) || 0,
    costDescription: row.COST_DESCRIPTION || '',
    totalCost: Number(row.TOTAL_COST) || 0,
    remarks: row.REMARKS || '',
    createdBy: row.CREATED_BY || '',
    createdAt: toIso(row.CREATED_AT),
    updatedBy: row.UPDATED_BY || '',
    updatedAt: toIso(row.UPDATED_AT)
  };
}

function monthLabel(date) {
  var d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return '';
  return FULL_MONTHS[d.getMonth()] + '-' + d.getFullYear();
}

function formatDateOnly(date) {
  return (
    date.getFullYear() +
    '-' +
    Utilities.formatString('%02d', date.getMonth() + 1) +
    '-' +
    Utilities.formatString('%02d', date.getDate())
  );
}

function normalizeDate(value) {
  if (!value) return '';
  var date = value instanceof Date ? value : new Date(value);
  return isNaN(date.getTime()) ? String(value) : date;
}

function monthKey(date) {
  var d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return '';
  return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2);
}

function toIso(value) {
  if (!value) return '';
  if (Object.prototype.toString.call(value) === '[object Date]') return value.toISOString();
  var parsed = new Date(value);
  return isNaN(parsed.getTime()) ? String(value) : parsed.toISOString();
}

/* ------------------------------------------------------------------ */
/* Security helpers                                                   */
/* ------------------------------------------------------------------ */

function checkApiKey(payload) {
  var expected = PropertiesService.getScriptProperties().getProperty('API_KEY');
  if (!expected) return true;
  return constantTimeEquals(String(payload.apiKey || ''), String(expected));
}

function hashPassword(password, salt) {
  var digest = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    String(salt) + '::' + String(password),
    Utilities.Charset.UTF_8
  );
  return digest
    .map(function (byte) {
      var value = (byte < 0 ? byte + 256 : byte).toString(16);
      return value.length === 1 ? '0' + value : value;
    })
    .join('');
}

function makeSalt() {
  return Utilities.getUuid() + Utilities.getUuid();
}

function constantTimeEquals(a, b) {
  if (a.length !== b.length) return false;
  var result = 0;
  for (var i = 0; i < a.length; i++) result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return result === 0;
}

/* ------------------------------------------------------------------ */
/* Utilities                                                          */
/* ------------------------------------------------------------------ */

function jsonResponse(success, message, data, error) {
  var payload = { success: success, message: message };
  if (data !== undefined && data !== null) payload.data = data;
  if (error) payload.error = error;
  return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(
    ContentService.MimeType.JSON
  );
}

function safeParse(text) {
  try {
    return JSON.parse(text);
  } catch (error) {
    return {};
  }
}

function round2(value) {
  return Math.round((Number(value) || 0) * 100) / 100;
}

function logError(error) {
  console.error('Cost Management API error: ' + (error && error.stack ? error.stack : String(error)));
}
