// ============================================================
// Asset Status Tracker Dashboard
// Fetches the Google Sheet once, then powers every dashboard page
// from the same cleaned tracker rows.
// ============================================================

const SHEET_CONFIG = {
  sheetId: "1Kmy06itzgOERHWwTNpdkbnrpQS5lL1Lon3mmk2uKfJw",
  gid: "1903103931",
  sheetLink: "https://docs.google.com/spreadsheets/d/1Kmy06itzgOERHWwTNpdkbnrpQS5lL1Lon3mmk2uKfJw/edit?gid=1903103931#gid=1903103931"
};

const WEEKLY_REPORT_LINK = "https://docs.google.com/spreadsheets/d/1Kmy06itzgOERHWwTNpdkbnrpQS5lL1Lon3mmk2uKfJw/edit?usp=sharing";

const LOCAL_ASSETS_KEY = "betterinvest.assetTracker.localAssets";
const SESSION_KEY = "betterinvest.assetTracker.loggedIn";
const ALLOWED_USERS = new Set([
  "aravind@betterinvest.club",
  "induma@betteriinvest.club",
  "meenakshi@betterinvest.club",
  "afreen@betterinvest.club",
  "manoj@betterinvest.club"
]);
const LOGIN_PASSWORD = "BetterInvest@123";

const columns = [
  "Month",
  "Live Week",
  "Movie Name",
  "Asset Name",
  "Eligibility",
  "Eligibility in Crores",
  "PH Name",
  "Live Date"
];

const importantFields = [
  "Month",
  "Live Week",
  "Movie Name",
  "Asset Name",
  "Eligibility",
  "Eligibility in Crores",
  "PH Name",
  "Live Date"
];

const detailPriorityFields = [
  "PH Name",
  "Contract",
  "Tranch",
  "Tranche",
  "Total Asset Value",
  "Asset Name",
  "Asset Type",
  "Deal Type",
  "Returns in IRR percent",
  "Returns in IRR %",
  "TDS percent",
  "TDS %",
  "Total no of Reservation",
  "Tenure display data",
  "Minimum Investment",
  "Maximum Investment",
  "Status",
  "Asset Status",
  "Asset Position",
  "Funded Date",
  "Fullfillment Date",
  "Turnaround Time",
  "Live Date",
  "Month",
  "Live Week",
  "Eligibility",
  "Eligibility in Crores",
  "Movie Name"
];

let allRows = [];
let visibleRows = [];
let localRows = [];
let fetchFailed = false;
let currentPageName = "overview";
let previousPageName = "overview";

const elements = {
  loginScreen: document.querySelector("#loginScreen"),
  loginForm: document.querySelector("#loginForm"),
  loginEmail: document.querySelector("#loginEmail"),
  loginPassword: document.querySelector("#loginPassword"),
  loginError: document.querySelector("#loginError"),
  appShell: document.querySelector("#appShell"),
  logoutButton: document.querySelector("#logoutButton"),
  pageTitle: document.querySelector("#pageTitle"),
  navItems: document.querySelectorAll(".nav-item"),
  pages: document.querySelectorAll(".page"),
  errorBanner: document.querySelector("#errorBanner"),
  gtvLabel: document.querySelector("#gtvLabel"),
  gtvSubtitle: document.querySelector("#gtvSubtitle"),
  currentMonthGtv: document.querySelector("#currentMonthGtv"),
  totalFundedProjects: document.querySelector("#totalFundedProjects"),
  totalAssets: document.querySelector("#totalAssets"),
  totalPH: document.querySelector("#totalPH"),
  averageTurnaround: document.querySelector("#averageTurnaround"),
  missingData: document.querySelector("#missingData"),
  searchInput: document.querySelector("#searchInput"),
  monthFilter: document.querySelector("#monthFilter"),
  weekFilter: document.querySelector("#weekFilter"),
  phFilter: document.querySelector("#phFilter"),
  assetForm: document.querySelector("#assetForm"),
  weeklyMonthSelect: document.querySelector("#weeklyMonthSelect"),
  weeklyWeekSelect: document.querySelector("#weeklyWeekSelect"),
  upcomingPipeline: document.querySelector("#upcomingPipeline"),
  generateWeeklyReportButton: document.querySelector("#generateWeeklyReportButton"),
  assetTableBody: document.querySelector("#assetTableBody"),
  productionHouseTableBody: document.querySelector("#productionHouseTableBody"),
  phChart: document.querySelector("#phChart"),
  weekChart: document.querySelector("#weekChart"),
  trendChart: document.querySelector("#trendChart"),
  weeklyReport: document.querySelector("#weeklyReport"),
  copyWeeklyReportButton: document.querySelector("#copyWeeklyReportButton"),
  alertsList: document.querySelector("#alertsList"),
  assetDetailBackButton: document.querySelector("#assetDetailBackButton"),
  assetDetailGrid: document.querySelector("#assetDetailGrid")
};

document.addEventListener("DOMContentLoaded", initDashboard);

async function initDashboard() {
  elements.loginForm.addEventListener("submit", handleLogin);
  elements.logoutButton.addEventListener("click", handleLogout);

  elements.navItems.forEach((button) => {
    button.addEventListener("click", () => switchPage(button.dataset.page));
  });

  elements.searchInput.addEventListener("input", debounce(applyFilters, 180));
  elements.monthFilter.addEventListener("change", applyFilters);
  elements.weekFilter.addEventListener("change", applyFilters);
  elements.phFilter.addEventListener("change", applyFilters);
  elements.assetForm.addEventListener("submit", handleAddAsset);
  elements.generateWeeklyReportButton.addEventListener("click", renderWeeklyReport);
  elements.copyWeeklyReportButton.addEventListener("click", () => copyReport(elements.weeklyReport, elements.copyWeeklyReportButton, "Copy Weekly Report"));
  elements.assetDetailBackButton.addEventListener("click", closeAssetDetail);

  if (sessionStorage.getItem(SESSION_KEY) === "true") {
    await openDashboard();
  }
}

async function handleLogin(event) {
  event.preventDefault();

  const email = elements.loginEmail.value.trim().toLowerCase();
  const password = elements.loginPassword.value;
  const isAllowedEmail = ALLOWED_USERS.has(email) || email.endsWith("@betterinvest.club");
  const isAllowedPassword = password === LOGIN_PASSWORD;

  if (!isAllowedEmail || !isAllowedPassword) {
    elements.loginError.textContent = "Invalid email or password.";
    return;
  }

  elements.loginError.textContent = "";
  sessionStorage.setItem(SESSION_KEY, "true");
  await openDashboard();
}

function handleLogout() {
  sessionStorage.removeItem(SESSION_KEY);
  elements.appShell.classList.add("hidden");
  elements.loginScreen.classList.remove("hidden");
  elements.loginPassword.value = "";
}

async function openDashboard() {
  elements.loginScreen.classList.add("hidden");
  elements.appShell.classList.remove("hidden");
  await loadDashboardData();
}

async function loadDashboardData() {
  localRows = loadLocalAssets();

  try {
    const sheetRows = await loadSheetData();
    fetchFailed = false;
    elements.errorBanner.classList.add("hidden");
    allRows = [...sheetRows, ...localRows];
    populateFilters(allRows);
    applyFilters();
  } catch (error) {
    console.error(error);
    fetchFailed = true;
    allRows = [...localRows];
    populateFilters(allRows);
    applyFilters();
    showFetchError();
  }
}

function loadLocalAssets() {
  try {
    const savedRows = JSON.parse(localStorage.getItem(LOCAL_ASSETS_KEY) || "[]");
    if (!Array.isArray(savedRows)) {
      return [];
    }

    return savedRows.map((row) => ({
      ...sanitizeDashboardRow(row),
      _source: "local",
      _localId: row._localId || createLocalId()
    }));
  } catch (error) {
    console.error("Unable to read local assets.", error);
    return [];
  }
}

function saveLocalAssets() {
  const rowsToSave = localRows.map((row) => {
    const savedRow = {};
    getRenderableFieldNames(row).forEach((column) => {
      savedRow[column] = row[column] || "";
    });
    savedRow._localId = row._localId;
    return savedRow;
  });

  localStorage.setItem(LOCAL_ASSETS_KEY, JSON.stringify(rowsToSave));
}

function handleAddAsset(event) {
  event.preventDefault();

  const formData = new FormData(elements.assetForm);
  const newRow = {};
  columns.forEach((column) => {
    newRow[column] = formData.get(column) || "";
  });

  newRow["Live Date"] = formatFormDate(newRow["Live Date"]);

  const localRow = {
    ...sanitizeDashboardRow(newRow),
    _source: "local",
    _localId: createLocalId()
  };

  localRows.push(localRow);
  allRows.push(localRow);
  saveLocalAssets();
  populateFilters(allRows);
  elements.assetForm.reset();
  applyFilters();
}

function formatFormDate(value) {
  if (!value) {
    return "";
  }

  const [year, month, day] = value.split("-");
  if (!year || !month || !day) {
    return value;
  }

  return `${day}-${month}-${year}`;
}

function createLocalId() {
  if (window.crypto && typeof window.crypto.randomUUID === "function") {
    return window.crypto.randomUUID();
  }

  return `local-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function switchPage(pageName) {
  const isAssetDetailPage = pageName === "asset-details";

  elements.navItems.forEach((button) => {
    if (!isAssetDetailPage) {
      button.classList.toggle("active", button.dataset.page === pageName);
    }
  });

  elements.pages.forEach((page) => {
    const isActive = page.id === `${toCamelCase(pageName)}Page`;
    page.classList.toggle("active", isActive);
    if (isActive) {
      elements.pageTitle.textContent = page.dataset.title;
    }
  });

  currentPageName = pageName;
}

async function loadSheetData() {
  const csvUrl = `https://docs.google.com/spreadsheets/d/${SHEET_CONFIG.sheetId}/gviz/tq?tqx=out:csv&gid=${SHEET_CONFIG.gid}`;
  const response = await fetch(csvUrl);

  if (!response.ok) {
    throw new Error("Google Sheet was not reachable.");
  }

  const csvText = await response.text();
  if (!csvText.trim() || csvText.trim().startsWith("<")) {
    throw new Error("Google Sheet returned HTML instead of CSV. Check sheet sharing permissions.");
  }

  const parsedRows = parseCsv(csvText);
  const validRows = parsedRows.filter((row) => columns.some((column) => clean(row[column])));

  if (validRows.length === 0) {
    throw new Error("Google Sheet did not return usable rows.");
  }

  return validRows.map((row) => ({
    ...row,
    _source: "sheet"
  }));
}

function parseCsv(csvText) {
  const rows = [];
  let currentRow = [];
  let currentCell = "";
  let insideQuotes = false;

  for (let i = 0; i < csvText.length; i += 1) {
    const character = csvText[i];
    const nextCharacter = csvText[i + 1];

    if (character === '"' && nextCharacter === '"') {
      currentCell += '"';
      i += 1;
    } else if (character === '"') {
      insideQuotes = !insideQuotes;
    } else if (character === "," && !insideQuotes) {
      currentRow.push(currentCell);
      currentCell = "";
    } else if ((character === "\n" || character === "\r") && !insideQuotes) {
      if (character === "\r" && nextCharacter === "\n") {
        i += 1;
      }
      currentRow.push(currentCell);
      rows.push(currentRow);
      currentRow = [];
      currentCell = "";
    } else {
      currentCell += character;
    }
  }

  currentRow.push(currentCell);
  rows.push(currentRow);

  const headers = rows.shift().map((header) => header.trim());
  return rows.map((row) => {
    const object = {};
    headers.forEach((header, index) => {
      const dashboardColumn = findDashboardColumn(header) || sanitizeHeaderName(header);
      if (dashboardColumn) {
        object[dashboardColumn] = sanitizeCellValue(row[index]);
      }
    });
    return sanitizeDashboardRow(object);
  });
}

function sanitizeDashboardRow(row) {
  const rawLiveWeek = sanitizeCategory(row["Live Week"]);
  const liveWeek = sanitizeLiveWeek(rawLiveWeek);

  return {
    ...row,
    Month: sanitizeCategory(row.Month),
    "Live Week": liveWeek,
    "Movie Name": sanitizeCategory(row["Movie Name"]),
    "Asset Name": sanitizeCategory(row["Asset Name"]),
    Eligibility: sanitizeCategory(row.Eligibility),
    "Eligibility in Crores": sanitizeCategory(row["Eligibility in Crores"]),
    "PH Name": sanitizeCategory(row["PH Name"]),
    "Live Date": sanitizeCategory(row["Live Date"]),
    _rawLiveWeek: rawLiveWeek,
    _invalidLiveWeek: Boolean(rawLiveWeek && !liveWeek)
  };
}

function sanitizeCellValue(value) {
  return String(value || "")
    .replace(/\u0000/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function sanitizeCategory(value) {
  const cleanedValue = sanitizeCellValue(value).replace(/^["']+|["']+$/g, "").trim();
  return /[a-z0-9]/i.test(cleanedValue) ? cleanedValue : "";
}

function sanitizeLiveWeek(value) {
  const cleanedValue = sanitizeCategory(value);
  const match = cleanedValue.match(/^week\s*([1-5])$/i);
  return match ? `Week ${match[1]}` : "";
}

function findDashboardColumn(header) {
  const normalizedHeader = normalizeHeader(header);
  return columns.find((column) => normalizeHeader(column) === normalizedHeader);
}

function sanitizeHeaderName(header) {
  return sanitizeCellValue(header).replace(/^["']+|["']+$/g, "").trim();
}

function normalizeHeader(value) {
  return String(value || "")
    .replace(/^\uFEFF/, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function populateFilters(rows) {
  fillSelect(elements.monthFilter, uniqueValues(rows, "Month"), "All months");
  fillSelect(elements.weekFilter, uniqueValues(rows, "Live Week"), "All weeks");
  fillSelect(elements.phFilter, uniqueValues(rows, "PH Name"), "All production houses");
  fillSelect(elements.weeklyMonthSelect, uniqueValues(rows, "Month"), "Select month");
}

function fillSelect(selectElement, values, defaultLabel) {
  selectElement.innerHTML = `<option value="">${defaultLabel}</option>`;
  values.forEach((value) => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = value;
    selectElement.appendChild(option);
  });
}

function uniqueValues(rows, columnName) {
  return [...new Set(rows.map((row) => sanitizeValueForColumn(columnName, row[columnName])).filter(Boolean))].sort();
}

function applyFilters() {
  const searchText = elements.searchInput.value.toLowerCase().trim();
  const selectedMonth = elements.monthFilter.value;
  const selectedWeek = elements.weekFilter.value;
  const selectedPH = elements.phFilter.value;

  visibleRows = allRows.filter((row) => {
    const searchableText = columns.map((column) => clean(row[column])).join(" ").toLowerCase();
    const matchesSearch = !searchText || searchableText.includes(searchText);
    const matchesMonth = !selectedMonth || clean(row.Month) === selectedMonth;
    const matchesWeek = !selectedWeek || clean(row["Live Week"]) === selectedWeek;
    const matchesPH = !selectedPH || clean(row["PH Name"]) === selectedPH;

    return matchesSearch && matchesMonth && matchesWeek && matchesPH;
  });

  renderDashboard();
}

function renderDashboard() {
  renderSummaryCards();
  renderAssetTable();
  renderCharts();
  renderProductionHouses();
  renderAlerts();
  if (!elements.weeklyReport.value) {
    renderWeeklyReport();
  }
}

function renderSummaryCards() {
  const totalCroresNumber = sumBy(visibleRows, "Eligibility in Crores");
  const productionHouses = uniqueValues(visibleRows, "PH Name");
  const missingFields = countMissingFields(visibleRows);
  const averageTurnaround = calculateAverageTurnaround(visibleRows);
  const selectedMonth = elements.monthFilter.value;
  const selectedWeek = elements.weekFilter.value;
  const selectedPH = elements.phFilter.value;
  const searchTerm = elements.searchInput.value.trim();
  const activeFilterCount = [selectedMonth, selectedWeek, selectedPH, searchTerm].filter(Boolean).length;

  if (activeFilterCount === 0) {
    elements.gtvLabel.textContent = "Total GTV (Cr)";
    elements.gtvSubtitle.textContent = "Total eligibility value across all assets";
  } else if (activeFilterCount === 1 && selectedMonth) {
    elements.gtvLabel.textContent = `${selectedMonth} GTV (Cr)`;
    elements.gtvSubtitle.textContent = "Eligibility value for selected month";
  } else {
    elements.gtvLabel.textContent = "Filtered GTV (Cr)";
    elements.gtvSubtitle.textContent = "Eligibility value for selected filters";
  }

  elements.currentMonthGtv.textContent = formatCroresCurrency(totalCroresNumber);
  elements.totalFundedProjects.textContent = countFundedProjects(visibleRows).toLocaleString("en-IN");
  elements.totalAssets.textContent = visibleRows.length.toLocaleString("en-IN");
  elements.totalPH.textContent = productionHouses.length.toLocaleString("en-IN");
  elements.averageTurnaround.textContent = averageTurnaround === null ? "Turnaround data unavailable" : `${formatNumber(averageTurnaround)} days`;
  elements.missingData.textContent = missingFields.toLocaleString("en-IN");
}

function renderAssetTable() {
  elements.assetTableBody.innerHTML = "";

  if (visibleRows.length === 0) {
    elements.assetTableBody.innerHTML = `<tr><td colspan="9" class="empty-state">No matching asset tracker rows found.</td></tr>`;
    return;
  }

  visibleRows.forEach((row) => {
    const tableRow = document.createElement("tr");
    const hasMissing = hasMissingRequiredData(row);
    tableRow.addEventListener("click", () => openAssetDetail(row));

    columns.forEach((column) => {
      const cell = document.createElement("td");
      const value = clean(row[column]);
      cell.textContent = value || "Missing";
      if (!value) {
        cell.classList.add("missing-value");
      }
      tableRow.appendChild(cell);
    });

    const statusCell = document.createElement("td");
    const statusClass = hasMissing ? "status-review" : row._source === "local" ? "status-local" : "status-good";
    const statusLabel = hasMissing ? "Review" : row._source === "local" ? "Local" : "Ready";
    statusCell.innerHTML = `<span class="status-pill ${statusClass}">${statusLabel}</span>`;
    tableRow.appendChild(statusCell);
    elements.assetTableBody.appendChild(tableRow);
  });
}

function renderCharts() {
  renderBarChart(elements.phChart, groupAndSum(visibleRows, "PH Name", "Eligibility in Crores"), "Cr");
  renderBarChart(elements.weekChart, groupAndCount(visibleRows, "Live Week"), "assets");
  renderTrendChart(groupAndSum(visibleRows, "Live Week", "Eligibility in Crores"));
}

function renderBarChart(container, data, suffix) {
  container.innerHTML = "";
  const entries = Object.entries(data).sort((a, b) => b[1] - a[1]).slice(0, 12);
  const maxValue = Math.max(...entries.map((entry) => entry[1]), 1);

  if (entries.length === 0) {
    container.innerHTML = `<div class="alert-item"><span>No chart data available.</span></div>`;
    return;
  }

  entries.forEach(([label, value]) => {
    const row = document.createElement("div");
    row.className = "chart-row";
    row.innerHTML = `
      <strong>${escapeHtml(label)}</strong>
      <div class="bar-track"><div class="bar-fill" style="width: ${(value / maxValue) * 100}%"></div></div>
      <span class="chart-value">${formatNumber(value)} ${suffix}</span>
    `;
    container.appendChild(row);
  });
}

function renderTrendChart(data) {
  elements.trendChart.innerHTML = "";
  const entries = Object.entries(data).sort(([a], [b]) => a.localeCompare(b));
  const maxValue = Math.max(...entries.map((entry) => entry[1]), 1);

  if (entries.length === 0) {
    elements.trendChart.innerHTML = `<div class="alert-item"><span>No trend data available.</span></div>`;
    return;
  }

  entries.forEach(([label, value]) => {
    const column = document.createElement("div");
    column.className = "trend-column";
    column.innerHTML = `
      <strong>${formatNumber(value)} Cr</strong>
      <div class="trend-bar" style="height: ${Math.max((value / maxValue) * 160, 8)}px"></div>
      <span class="trend-label">${escapeHtml(label)}</span>
    `;
    elements.trendChart.appendChild(column);
  });
}

function renderProductionHouses() {
  const groupedRows = buildProductionHouseRows(visibleRows);
  elements.productionHouseTableBody.innerHTML = "";

  if (groupedRows.length === 0) {
    elements.productionHouseTableBody.innerHTML = `<tr><td colspan="5" class="empty-state">No production house data available.</td></tr>`;
    return;
  }

  groupedRows.forEach((row) => {
    const tableRow = document.createElement("tr");
    tableRow.innerHTML = `
      <td>${escapeHtml(row.phName)}</td>
      <td>${row.assetCount.toLocaleString("en-IN")}</td>
      <td>${formatCurrencyCrores(row.totalEligibility)}</td>
      <td>${formatCroresCurrency(row.totalCrores)}</td>
      <td>${escapeHtml(row.latestLiveDate || "Missing")}</td>
    `;
    elements.productionHouseTableBody.appendChild(tableRow);
  });
}

function buildProductionHouseRows(rows) {
  const groups = {};

  rows.forEach((row) => {
    const phName = sanitizeCategory(row["PH Name"]);
    if (!phName) {
      return;
    }

    if (!groups[phName]) {
      groups[phName] = {
        phName,
        assetCount: 0,
        totalEligibility: 0,
        totalCrores: 0,
        latestLiveDate: "",
        latestLiveDateObject: null
      };
    }

    const group = groups[phName];
    const liveDate = parseDate(row["Live Date"]);
    group.assetCount += 1;
    group.totalEligibility += toNumber(row.Eligibility);
    group.totalCrores += toNumber(row["Eligibility in Crores"]);

    if (liveDate && (!group.latestLiveDateObject || liveDate > group.latestLiveDateObject)) {
      group.latestLiveDateObject = liveDate;
      group.latestLiveDate = row["Live Date"];
    }
  });

  return Object.values(groups).sort((a, b) => b.assetCount - a.assetCount);
}

function renderAlerts() {
  const alertData = getAlertData(visibleRows);
  const alerts = [
    {
      title: "Missing eligibility",
      count: alertData.missingEligibility.length,
      type: "alert-warning",
      detail: "Assets with blank eligibility values."
    },
    {
      title: "Missing eligibility in crores",
      count: alertData.missingCrores.length,
      type: "alert-warning",
      detail: "Assets with blank crore values."
    },
    {
      title: "Missing PH name",
      count: alertData.missingPH.length,
      type: "alert-warning",
      detail: "Production house owner is missing."
    },
    {
      title: "Missing live date",
      count: alertData.missingLiveDate.length,
      type: "alert-danger",
      detail: "Live schedule needs completion."
    },
    {
      title: "Duplicate asset names",
      count: alertData.duplicateAssets.length,
      type: "alert-warning",
      detail: alertData.duplicateAssets.length ? alertData.duplicateAssets.join(", ") : "No duplicate asset names found."
    },
    {
      title: "Invalid live week values",
      count: alertData.invalidLiveWeek.length,
      type: "alert-info",
      detail: "Only Week 1, Week 2, Week 3, Week 4, and Week 5 are allowed."
    }
  ];

  elements.alertsList.innerHTML = alerts.map((alert) => `
    <div class="alert-item ${alert.type}">
      <strong>${alert.title}: ${alert.count}</strong>
      <span>${escapeHtml(alert.detail)}</span>
    </div>
  `).join("");
}

function getAlertData(rows) {
  return {
    missingEligibility: rows.filter((row) => !clean(row.Eligibility)),
    missingCrores: rows.filter((row) => !clean(row["Eligibility in Crores"])),
    missingPH: rows.filter((row) => !clean(row["PH Name"])),
    missingLiveDate: rows.filter((row) => !clean(row["Live Date"])),
    duplicateAssets: getDuplicateAssets(rows),
    invalidLiveWeek: rows.filter((row) => row._invalidLiveWeek)
  };
}

function renderWeeklyReport() {
  const selectedMonth = elements.weeklyMonthSelect.value;
  const selectedWeek = elements.weeklyWeekSelect.value;
  const pipelineText = clean(elements.upcomingPipeline.value) || "- No upcoming pipeline entered.";
  const reportRows = allRows.filter((row) => {
    const matchesMonth = selectedMonth ? row.Month === selectedMonth : true;
    const matchesWeek = selectedWeek ? row["Live Week"] === selectedWeek : true;
    return matchesMonth && matchesWeek;
  });

  const monthLabel = selectedMonth || "All Months";
  const weekLabel = selectedWeek || "All Weeks";
  const totalCrores = sumBy(reportRows, "Eligibility in Crores");
  const uniquePHCount = uniqueValues(reportRows, "PH Name").length;
  const uniqueProjectCount = uniqueValues(reportRows, "Movie Name").length;
  const projectLines = reportRows.length
    ? reportRows.map((row) => {
      const assetName = clean(row["Asset Name"]) || "-";
      const movieName = clean(row["Movie Name"]) || "-";
      const phName = clean(row["PH Name"]) || "-";
      const crores = formatPlainCrores(toNumber(row["Eligibility in Crores"]));
      return `${assetName} / ${movieName} / ${phName} — ₹${crores} Cr`;
    }).join("\n")
    : "No live assets found for the selected month and week.";

  elements.weeklyReport.value = [
    "📊 Weekly Asset Live Report",
    `${monthLabel} – ${weekLabel}`,
    "",
    "The following projects have gone live this week:",
    "",
    projectLines,
    "",
    "📌 Summary",
    `✅ Total Projects Live: ${uniqueProjectCount}`,
    `🎬 Total Assets Live: ${reportRows.length}`,
    `💰 Total Discounted Value: ₹${formatPlainCrores(totalCrores)} Cr`,
    `🏢 Production Houses with Live Projects: ${uniquePHCount}`,
    "",
    "🚀 Upcoming Pipeline for the Week",
    pipelineText,
    "",
    "🔗 Detailed Weekly Report:",
    WEEKLY_REPORT_LINK,
    "",
    "Regards,",
    "Asset Operations"
  ].join("\n");
}

async function copyReport(textarea, button, defaultLabel) {
  await navigator.clipboard.writeText(textarea.value);
  button.textContent = "Copied";
  setTimeout(() => {
    button.textContent = defaultLabel;
  }, 1800);
}

function openAssetDetail(row) {
  const turnaround = calculateTurnaroundDays(row);
  const fields = buildAssetDetailFields(row, turnaround);
  previousPageName = currentPageName === "asset-details" ? previousPageName : currentPageName;
  elements.assetDetailGrid.innerHTML = fields.map(({ label, value }) => `
    <div class="detail-field">
      <span>${escapeHtml(formatFieldLabel(label))}</span>
      <strong>${escapeHtml(value || "-")}</strong>
    </div>
  `).join("");
  switchPage("asset-details");
}

function closeAssetDetail() {
  switchPage(previousPageName || "assets");
}

function buildAssetDetailFields(row, turnaround) {
  const fieldNames = getRenderableFieldNames(row);
  const orderedNames = [
    ...detailPriorityFields.filter((field) => field === "Turnaround Time" || fieldNames.includes(field)),
    ...fieldNames.filter((field) => !detailPriorityFields.includes(field)).sort()
  ];

  return orderedNames.map((field) => {
    if (field === "Turnaround Time") {
      return {
        label: field,
        value: turnaround === null ? "Turnaround data unavailable" : `${formatNumber(turnaround)} days`
      };
    }

    return {
      label: field,
      value: clean(row[field]) || "-"
    };
  });
}

function getRenderableFieldNames(row) {
  return Object.keys(row).filter((key) => !key.startsWith("_") && sanitizeHeaderName(key));
}

function countFundedProjects(rows) {
  const rowsWithStatus = rows.filter((row) => clean(row.Status));
  if (rowsWithStatus.length === 0) {
    return rows.length;
  }

  return rowsWithStatus.filter((row) => /funded|live/i.test(row.Status)).length;
}

function calculateAverageTurnaround(rows) {
  const values = rows
    .map(calculateTurnaroundDays)
    .filter((value) => Number.isFinite(value));

  if (values.length === 0) {
    return null;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function calculateTurnaroundDays(row) {
  const fulfilmentValue = clean(row["Fullfillment Date"]);
  const numericFulfilment = Number(fulfilmentValue.replace(/[^0-9.-]/g, ""));

  if (fulfilmentValue && Number.isFinite(numericFulfilment) && /^-?\d+(\.\d+)?$/.test(fulfilmentValue.replace(/,/g, ""))) {
    return numericFulfilment;
  }

  const fundedDate = parseDate(row["Funded Date"]);
  const fulfilmentDate = parseDate(fulfilmentValue);
  const liveDate = parseDate(row["Live Date"]);

  if (fundedDate && fulfilmentDate) {
    return daysBetween(fundedDate, fulfilmentDate);
  }

  if (fundedDate && liveDate) {
    return daysBetween(fundedDate, liveDate);
  }

  return null;
}

function daysBetween(startDate, endDate) {
  const millisecondsPerDay = 24 * 60 * 60 * 1000;
  return Math.round((endDate - startDate) / millisecondsPerDay);
}

function getUpcomingRows(rows) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const nextWeek = new Date(today);
  nextWeek.setDate(today.getDate() + 7);

  return rows.filter((row) => {
    const liveDate = parseDate(clean(row["Live Date"]));
    return liveDate && liveDate >= today && liveDate <= nextWeek;
  });
}

function getDuplicateAssets(rows) {
  const counts = {};
  rows.forEach((row) => {
    const assetName = clean(row["Asset Name"]).toLowerCase();
    if (assetName) {
      counts[assetName] = (counts[assetName] || 0) + 1;
    }
  });

  return Object.entries(counts)
    .filter((entry) => entry[1] > 1)
    .map((entry) => entry[0]);
}

function groupAndSum(rows, labelColumn, valueColumn) {
  return rows.reduce((groups, row) => {
    const label = sanitizeValueForColumn(labelColumn, row[labelColumn]);
    if (!label) {
      return groups;
    }
    groups[label] = (groups[label] || 0) + toNumber(row[valueColumn]);
    return groups;
  }, {});
}

function groupAndCount(rows, labelColumn) {
  return rows.reduce((groups, row) => {
    const label = sanitizeValueForColumn(labelColumn, row[labelColumn]);
    if (!label) {
      return groups;
    }
    groups[label] = (groups[label] || 0) + 1;
    return groups;
  }, {});
}

function sanitizeValueForColumn(columnName, value) {
  if (columnName === "Live Week") {
    return sanitizeLiveWeek(value);
  }

  return sanitizeCategory(value);
}

function countMissingFields(rows) {
  return rows.reduce((count, row) => {
    return count + columns.filter((column) => !clean(row[column])).length;
  }, 0);
}

function hasMissingRequiredData(row) {
  return !clean(row.Eligibility) || !clean(row["Eligibility in Crores"]) || !clean(row["PH Name"]) || !clean(row["Live Date"]) || row._invalidLiveWeek;
}

function sumBy(rows, columnName) {
  return rows.reduce((sum, row) => sum + toNumber(row[columnName]), 0);
}

function toNumber(value) {
  const number = Number(String(value || "").replace(/[^0-9.-]/g, ""));
  return Number.isFinite(number) ? number : 0;
}

function showFetchError() {
  elements.errorBanner.textContent = "Unable to fetch Google Sheet data. Showing locally added assets only.";
  elements.errorBanner.classList.remove("hidden");

  if (allRows.length === 0) {
    elements.assetTableBody.innerHTML = `<tr><td colspan="9" class="empty-state">Unable to fetch Google Sheet data</td></tr>`;
    elements.productionHouseTableBody.innerHTML = `<tr><td colspan="5" class="empty-state">Unable to fetch Google Sheet data</td></tr>`;
    elements.phChart.innerHTML = `<div class="alert-item alert-danger"><strong>Unable to fetch Google Sheet data</strong><span>Check sharing permissions and the sheet tab gid.</span></div>`;
    elements.weekChart.innerHTML = `<div class="alert-item alert-danger"><strong>Unable to fetch Google Sheet data</strong><span>No live rows are available.</span></div>`;
    elements.trendChart.innerHTML = `<div class="alert-item alert-danger"><strong>Unable to fetch Google Sheet data</strong><span>No trend can be generated.</span></div>`;
    elements.alertsList.innerHTML = `<div class="alert-item alert-danger"><strong>Unable to fetch Google Sheet data</strong><span>The dashboard can only show saved local browser assets until the sheet reconnects.</span></div>`;
    elements.weeklyReport.value = "Unable to fetch Google Sheet data";
  }
}

function clean(value) {
  return String(value || "").trim();
}

function formatNumber(value) {
  return Number(value).toLocaleString("en-IN", {
    maximumFractionDigits: 2
  });
}

function formatPlainCrores(value) {
  return Number(value || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2
  });
}

function formatCurrencyCrores(value) {
  const crores = Number(value) / 10000000;

  if (!Number.isFinite(crores)) {
    return "\u20B90 Cr";
  }

  return formatCroresCurrency(crores);
}

function formatCroresCurrency(value) {
  const crores = Number(value);

  if (!Number.isFinite(crores)) {
    return "\u20B90 Cr";
  }

  return `\u20B9${crores.toLocaleString("en-IN", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2
  })} Cr`;
}

function parseDate(value) {
  if (!value) {
    return null;
  }

  const indianDateMatch = value.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
  if (indianDateMatch) {
    const [, day, month, year] = indianDateMatch;
    const parsedIndianDate = new Date(Number(year), Number(month) - 1, Number(day));
    parsedIndianDate.setHours(0, 0, 0, 0);
    return parsedIndianDate;
  }

  const slashDateMatch = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (slashDateMatch) {
    const [, day, month, year] = slashDateMatch;
    const parsedSlashDate = new Date(Number(year), Number(month) - 1, Number(day));
    parsedSlashDate.setHours(0, 0, 0, 0);
    return parsedSlashDate;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  parsed.setHours(0, 0, 0, 0);
  return parsed;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatFieldLabel(label) {
  const labels = {
    "PH Name": "Production House",
    "Deal Type": "Primary Sale / Secondary Sale",
    "Fullfillment Date": "Fullfillment Date"
  };

  return labels[label] || label;
}

function toCamelCase(value) {
  return value.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
}

function debounce(callback, delay) {
  let timeoutId;

  return (...args) => {
    window.clearTimeout(timeoutId);
    timeoutId = window.setTimeout(() => callback(...args), delay);
  };
}
