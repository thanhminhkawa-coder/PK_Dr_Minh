const CLINIC_STORAGE_KEY = "pk_clinic_info_v3";
const ICD_STORAGE_KEY = "pk_icd_list_v1";
const PATIENT_ROW_HEIGHT = 94;
const DEFAULT_VISIBLE_ROWS = 3;
const MAX_VISIBLE_ROWS = 10;
const DOSE_OPTIONS = ["0", "0.5", "1", "2", "3", "4", "5", "6"];
const QUANTITY_OPTIONS = Array.from({ length: 94 }, (_, index) => String(index + 7));
const SERVICE_FEE_OPTIONS = Array.from({ length: 199 }, (_, index) => (index + 2) * 10000);
const PRIORITY_SERVICE_FEES = new Set([100000, 150000, 200000, 250000, 300000, 350000, 400000, 450000, 500000, 550000, 600000, 700000]);
const DEFAULT_ADVICE_NOTE = [
  "Uống thuốc đúng giờ mỗi ngày",
  "Không tự ý ngưng thuốc dù thấy đỡ",
  "Tái khám đúng hẹn",
  "Nếu quên liều: uống ngay khi nhớ, không uống gấp đôi"
].join("\n");

const DEFAULT_CLINIC_INFO = {
  name: "Phòng khám chuyên khoa tâm thần",
  doctor: "Bác sĩ phụ trách",
  address: "Chưa cập nhật địa chỉ",
  hours: "Chưa cập nhật giờ làm việc",
  phone: "Chưa cập nhật số điện thoại"
};

const DEFAULT_ICD_LIST = [
  { code: "F20.0", name: "Tâm thần phân liệt thể hoang tưởng" },
  { code: "F20.1", name: "Tâm thần phân liệt thể thanh xuân" },
  { code: "F31.2", name: "Rối loạn cảm xúc lưỡng cực, giai đoạn hưng cảm có loạn thần" },
  { code: "F32.2", name: "Giai đoạn trầm cảm nặng không có triệu chứng loạn thần" },
  { code: "F32.3", name: "Giai đoạn trầm cảm nặng có triệu chứng loạn thần" },
  { code: "F41.1", name: "Rối loạn lo âu lan tỏa" },
  { code: "F43.1", name: "Rối loạn stress sau sang chấn" },
  { code: "F51.0", name: "Mất ngủ không thực tổn" },
  { code: "F60.3", name: "Rối loạn nhân cách cảm xúc không ổn định" },
  { code: "F99", name: "Rối loạn tâm thần không xác định" }
];

const THERAPY_PROFILES = [
  {
    symptomKeys: ["mat ngu", "kho ngu", "ngu kem", "ngu it", "thuc dem"],
    diagnosisKeys: ["f51.0", "mat ngu", "roi loan giac ngu"],
    diagnosisCode: "F51.0",
    diagnosisNameHint: "Mất ngủ không thực tổn",
    usage: ["ngu", "an than", "stress", "lo au"],
    quantity: 30,
    morning: "",
    night: "1",
    regimen: {
      main: [
        { tokens: ["zopiclon 7.5mg"], quantity: 7, morning: "", night: "1" },
        { tokens: ["diazepam 5mg"], quantity: 10, morning: "", night: "1" }
      ],
      adjunct: [
        { tokens: ["diazepam 5mg"], quantity: 10, morning: "", night: "0.5" }
      ],
      support: [
        { tokens: ["vitamin b6 + magnesium lactate"], quantity: 30, morning: "1", night: "" }
      ]
    }
  },
  {
    symptomKeys: ["lo au", "hoi hop", "cang thang", "hoang so", "stress"],
    diagnosisKeys: ["f41.1", "lo au", "roi loan lo au", "lo au lan toa"],
    diagnosisCode: "F41.1",
    diagnosisNameHint: "Rối loạn lo âu lan tỏa",
    usage: ["lo au", "an than", "stress"],
    quantity: 30,
    morning: "0.5",
    night: "0.5",
    regimen: {
      main: [
        { tokens: ["sertraline 50mg"], quantity: 30, morning: "1", night: "" }
      ],
      adjunct: [
        { tokens: ["diazepam 5mg"], quantity: 10, morning: "", night: "0.5" }
      ],
      support: [
        { tokens: ["vitamin b6 + magnesium lactate"], quantity: 30, morning: "1", night: "" }
      ]
    }
  },
  {
    symptomKeys: ["tram cam", "chan nan", "buon ba", "mat dong luc", "khoc", "met moi"],
    diagnosisKeys: ["f32", "tram cam", "giai doan tram cam"],
    diagnosisCode: "F32.2",
    diagnosisNameHint: "Giai đoạn trầm cảm nặng không có triệu chứng loạn thần",
    usage: ["tram cam", "cam xuc"],
    quantity: 30,
    morning: "1",
    night: "",
    regimen: {
      main: [
        { tokens: ["sertraline 50mg"], quantity: 30, morning: "1", night: "" },
        { tokens: ["sertraline 100mg"], quantity: 30, morning: "1", night: "" }
      ],
      adjunct: [
        { tokens: ["diazepam 5mg"], quantity: 10, morning: "", night: "0.5" }
      ],
      support: [
        { tokens: ["vitamin b1 + b6 + b12"], quantity: 30, morning: "1", night: "" }
      ]
    }
  },
  {
    symptomKeys: ["hung cam", "noi nhieu", "kich dong", "tang dong", "boc dong"],
    diagnosisKeys: ["f31", "hung cam", "luong cuc"],
    diagnosisCode: "F31.2",
    diagnosisNameHint: "Rối loạn cảm xúc lưỡng cực, giai đoạn hưng cảm có loạn thần",
    usage: ["hung cam", "kich dong", "loan than"],
    quantity: 30,
    morning: "1",
    night: "1",
    regimen: {
      main: [
        { tokens: ["olanzapine 5mg"], quantity: 30, morning: "", night: "1" },
        { tokens: ["quetiapine 50mg"], quantity: 30, morning: "", night: "1" }
      ],
      adjunct: [
        { tokens: ["valproat natri 200 mg"], quantity: 30, morning: "1", night: "1" }
      ],
      support: [
        { tokens: ["vitamin b1 + b6 + b12"], quantity: 30, morning: "1", night: "" }
      ]
    }
  },
  {
    symptomKeys: [],
    diagnosisKeys: ["f23.2", "loan than cap giong phan liet", "roi loan loan than cap giong phan liet"],
    diagnosisCode: "F23.2",
    diagnosisNameHint: "Rối loạn loạn thần cấp giống phân liệt",
    usage: ["loan than", "ao giac", "hoang tuong", "kich dong"],
    quantity: 30,
    morning: "1",
    night: "1",
    regimen: {
      main: [
        { tokens: ["risperidone 2mg"], quantity: 30, morning: "", night: "1" },
        { tokens: ["quetiapine 50mg"], quantity: 30, morning: "", night: "1" }
      ],
      adjunct: [
        { tokens: ["valproat natri 200 mg"], quantity: 30, morning: "1", night: "1" }
      ],
      support: [
        { tokens: ["vitamin b1 + b6 + b12"], quantity: 30, morning: "1", night: "" }
      ]
    }
  },
  {
    symptomKeys: ["loan than", "ao giac", "hoang tuong", "nghi ngo", "noi mot minh"],
    diagnosisKeys: ["f20", "tam than phan liet", "loan than", "ao giac", "hoang tuong"],
    diagnosisCode: "F20.0",
    diagnosisNameHint: "Tâm thần phân liệt thể hoang tưởng",
    usage: ["loan than", "hoang tuong", "ao giac", "kich dong"],
    quantity: 30,
    morning: "1",
    night: "1",
    regimen: {
      main: [
        { tokens: ["risperidone 2mg"], quantity: 30, morning: "", night: "1" },
        { tokens: ["quetiapine 50mg"], quantity: 30, morning: "", night: "1" },
        { tokens: ["olanzapine 5mg"], quantity: 30, morning: "", night: "1" }
      ],
      adjunct: [
        { tokens: ["valproat natri 200 mg"], quantity: 30, morning: "1", night: "1" }
      ],
      support: [
        { tokens: ["vitamin b1 + b6 + b12"], quantity: 30, morning: "1", night: "" }
      ]
    }
  },
  {
    symptomKeys: ["co giat", "dong kinh", "run", "giat minh"],
    diagnosisKeys: ["co giat", "dong kinh", "run", "giat minh"],
    diagnosisCode: "",
    diagnosisNameHint: "F99 - Rối loạn tâm thần không xác định",
    usage: ["co giat", "dong kinh", "on dinh khi sac"],
    quantity: 30,
    morning: "1",
    night: "1",
    regimen: {
      main: [
        { tokens: ["valproat natri 200 mg"], quantity: 30, morning: "1", night: "1" },
        { tokens: ["depakine chrono 500 mg"], quantity: 30, morning: "", night: "1" }
      ],
      adjunct: [
        { tokens: ["diazepam 5mg"], quantity: 10, morning: "", night: "0.5" }
      ],
      support: [
        { tokens: ["vitamin b1 + b6 + b12"], quantity: 30, morning: "1", night: "" }
      ]
    }
  }
];

const PROVINCES = [
  "An Giang", "Bà Rịa - Vũng Tàu", "Bắc Giang", "Bắc Kạn", "Bạc Liêu", "Bắc Ninh", "Bến Tre", "Bình Định",
  "Bình Dương", "Bình Phước", "Bình Thuận", "Cà Mau", "Cần Thơ", "Cao Bằng", "Đà Nẵng", "Đắk Lắk", "Đắk Nông",
  "Điện Biên", "Đồng Nai", "Đồng Tháp", "Gia Lai", "Hà Giang", "Hà Nam", "Hà Nội", "Hà Tĩnh", "Hải Dương",
  "Hải Phòng", "Hậu Giang", "Hòa Bình", "Hưng Yên", "Khánh Hòa", "Kiên Giang", "Kon Tum", "Lai Châu", "Lâm Đồng",
  "Lạng Sơn", "Lào Cai", "Long An", "Nam Định", "Nghệ An", "Ninh Bình", "Ninh Thuận", "Phú Thọ", "Phú Yên",
  "Quảng Bình", "Quảng Nam", "Quảng Ngãi", "Quảng Ninh", "Quảng Trị", "Sóc Trăng", "Sơn La", "Tây Ninh", "Thái Bình",
  "Thái Nguyên", "Thanh Hóa", "Thừa Thiên Huế", "Tiền Giang", "TP Hồ Chí Minh", "Trà Vinh", "Tuyên Quang", "Vĩnh Long",
  "Vĩnh Phúc", "Yên Bái"
];

const BIRTH_YEARS = Array.from({ length: 2020 - 1936 + 1 }, (_, index) => String(2020 - index));

const state = {
  dashboard: null,
  quickStats: null,
  patients: [],
  filteredPatients: [],
  drugs: [],
  doctors: [],
  search: "",
  showAllPatients: false,
  selectedPatientId: "",
  selectedPatientDetail: null,
  selectedVisitId: "",
  draftRows: [],
  selectedDrugId: "",
  autoSuggestedRowKeys: [],
  stockDraftRows: [],
  icdList: getDefaultIcdList(),
  selectedIcdCode: "",
  clinicInfo: { ...DEFAULT_CLINIC_INFO },
  clinicProfiles: [],
  activeClinicProfileId: "",
  toastTimer: null,
  patientScrollTop: 0,
  moneyOverrides: { drug: null, service: null, total: null }
};

const refs = {};

window.addEventListener("DOMContentLoaded", () => {
  cacheRefs();
  bindEvents();
  renderClinicInfo();
  seedForm();
  initializeApp();
});

function cacheRefs() {
  [
    "pageClinicTitle", "refreshBtn", "exportBtn", "connectionState", "patientCountText", "searchInput", "searchBtn", "clearSearchBtn",
    "showAllPatientsBtn", "patientListViewport", "patientListBody", "searchSuggestBox", "saveBtn", "saveBottomBtn", "newBtn",
    "newPrescriptionBtn", "visitDate", "patientName", "birthYear", "yearSuggestBox", "age", "gender", "addressWard",
    "province", "provinceSuggestBox", "phone", "visitDoctor", "symptom", "symptomSuggestBox", "icdInput", "icdSuggestBox", "addCodeBtn", "toggleCodeDataBtn",
    "codeDataBox", "previewPrintBtn", "addDrugBtn", "toggleStockBtn", "drugRows", "stockDataBox", "warningBox",
    "followDate", "serviceFee", "adviceNote", "drugMoney", "serviceMoney", "totalMoney", "reloadHistoryBtn",
    "historyRows", "summaryPatients", "summaryDrugs",
    "summaryVisitToday", "summaryRevenueMonth", "recentVisitsList", "toast", "rxModal", "rxBody", "rxPrintBtn", "rxShareBtn",
    "rxCloseBtn", "clinicDisplayName", "clinicDisplayDoctor", "clinicDisplayAddress", "clinicDisplayHours",
    "clinicDisplayPhone", "clinicForm", "clinicProfileSelect", "addClinicBtn", "deleteClinicBtn",
    "toggleClinicBtn", "saveClinicBtn", "clinicNameInput", "clinicDoctorInput",
    "clinicAddressInput", "clinicHoursInput", "clinicPhoneInput", "statWeekCount", "statWeekTrend", "statMonthCount",
    "statMonthTrend", "statProfit", "statProfitTrend", "statRevisitRate", "statRevisitTrend", "statOnTimeCount",
    "statOnTimeTrend", "statLateMissedCount", "statLateMissedTrend", "activeIngredientList", "doseList",
    "doctorList", "serviceFeeList", "serviceFeeSuggestBox", "drugSectionTitle",
    "summaryPatientsMini", "summaryDrugsMini", "summaryVisitTodayMini", "summaryRevenueMonthMini",
    "statWeekMini", "statMonthMini", "statProfitMini", "statRevisitMini", "statOnTimeMini", "statLateMissedMini"
  ].forEach((id) => {
    refs[id] = document.getElementById(id);
  });
}

function bindEvents() {
  refs.refreshBtn.addEventListener("click", initializeApp);
  refs.exportBtn.addEventListener("click", exportData);
  refs.searchBtn.addEventListener("click", () => applySearch(refs.searchInput.value));
  refs.clearSearchBtn.addEventListener("click", clearSearch);
  refs.showAllPatientsBtn.addEventListener("click", toggleShowAllPatients);
  refs.searchInput.addEventListener("input", handleSearchInput);
  refs.searchInput.addEventListener("focus", () => renderSearchSuggestions(refs.searchInput.value));
  refs.searchInput.addEventListener("keydown", handleSearchKeydown);
  refs.patientListViewport.addEventListener("scroll", handlePatientViewportScroll);
  refs.patientListBody.addEventListener("click", handlePatientListClick);
  refs.historyRows.addEventListener("click", handleHistoryClick);
  refs.birthYear.addEventListener("input", handleBirthYearInput);
  refs.birthYear.addEventListener("focus", () => showYearSuggestions(refs.birthYear.value));
  refs.province.addEventListener("input", handleProvinceInput);
  refs.province.addEventListener("focus", () => showProvinceSuggestions(refs.province.value));
  refs.symptom.addEventListener("input", handleSymptomInput);
  refs.symptom.addEventListener("focus", () => renderSymptomSuggestions(refs.symptom.value));
  refs.addCodeBtn.addEventListener("click", addCustomCode);
  refs.toggleCodeDataBtn.addEventListener("click", () => refs.codeDataBox.classList.toggle("hidden"));
  refs.icdInput.addEventListener("input", renderIcdSuggest);
  refs.icdInput.addEventListener("input", handleDiagnosisInput);
  refs.icdInput.addEventListener("input", () => autoGrowField(refs.icdInput));
  refs.icdInput.addEventListener("focus", renderIcdSuggest);
  refs.icdInput.addEventListener("click", renderIcdSuggest);
  refs.icdInput.addEventListener("change", handleDiagnosisInput);
  refs.codeDataBox.addEventListener("click", handleCodeDataClick);
  refs.toggleStockBtn.addEventListener("click", () => {
    refs.stockDataBox.classList.toggle("hidden");
    if (!refs.stockDataBox.classList.contains("hidden")) renderStockData();
  });
  refs.addDrugBtn.addEventListener("click", () => {
    state.draftRows.push(createDraftRow());
    renderDrugRows();
    updateTotals();
  });
  refs.drugRows.addEventListener("input", handleDrugRowChange);
  refs.drugRows.addEventListener("change", handleDrugRowChange);
  refs.drugRows.addEventListener("focusin", handleDrugRowChange);
  refs.drugRows.addEventListener("click", handleDrugRowClick);
  refs.stockDataBox.addEventListener("click", handleStockDataClick);
  refs.stockDataBox.addEventListener("input", handleStockDataInput);
  refs.serviceMoney.addEventListener("input", syncServiceFeeFromMoney);
  refs.serviceMoney.addEventListener("input", renderServiceFeeSuggest);
  refs.serviceMoney.addEventListener("focus", renderServiceFeeSuggest);
  refs.serviceMoney.addEventListener("click", renderServiceFeeSuggest);
  refs.serviceMoney.addEventListener("focus", () => formatMoneyField(refs.serviceMoney, false));
  refs.serviceMoney.addEventListener("blur", () => formatMoneyField(refs.serviceMoney, true));
  ["drugMoney", "serviceMoney", "totalMoney"].forEach((id) => {
    refs[id].addEventListener("input", handleMoneyOverrideInput);
    refs[id].addEventListener("focus", () => formatMoneyField(refs[id], false));
    refs[id].addEventListener("blur", () => formatMoneyField(refs[id], true));
  });
  refs.previewPrintBtn.addEventListener("click", showPrescriptionPreview);
  refs.rxCloseBtn.addEventListener("click", () => refs.rxModal.classList.add("hidden"));
  refs.rxPrintBtn.addEventListener("click", printPrescription);
  refs.rxShareBtn.addEventListener("click", sharePrescriptionToZalo);
  refs.reloadHistoryBtn.addEventListener("click", renderHistory);
  refs.newBtn.addEventListener("click", createNewPatient);
  refs.newPrescriptionBtn.addEventListener("click", createNewPrescription);
  refs.saveBtn.addEventListener("click", saveEncounter);
  refs.saveBottomBtn.addEventListener("click", saveEncounter);
  refs.toggleClinicBtn.addEventListener("click", () => refs.clinicForm.classList.toggle("hidden"));
  refs.clinicProfileSelect.addEventListener("change", handleClinicProfileChange);
  refs.addClinicBtn.addEventListener("click", addClinicProfile);
  refs.deleteClinicBtn.addEventListener("click", deleteClinicProfile);
  refs.saveClinicBtn.addEventListener("click", saveClinicInfo);

  document.addEventListener("click", (event) => {
    if (!event.target.closest(".search-zone")) refs.searchSuggestBox.classList.add("hidden");
    if (!event.target.closest(".picker-wrap") && !event.target.closest(".money-picker")) {
      refs.yearSuggestBox.classList.add("hidden");
      refs.provinceSuggestBox.classList.add("hidden");
      refs.serviceFeeSuggestBox.classList.add("hidden");
    }
    if (!event.target.closest("#symptom") && !event.target.closest("#symptomSuggestBox")) refs.symptomSuggestBox.classList.add("hidden");
    if (!event.target.closest("#icdInput") && !event.target.closest("#icdSuggestBox")) refs.icdSuggestBox.classList.add("hidden");
    if (!event.target.closest(".drug-field--dose")) closeDoseQuickPickers();
    if (!event.target.closest(".drug-field--quantity")) closeQuantityQuickPickers();
  });
}

async function initializeApp() {
  try {
    setConnectionState("Đang tải dữ liệu...", false);
    await Promise.all([loadHealth(), loadDashboard(), loadQuickStats(), loadDrugs(), loadPatients(), loadSettings()]);
    renderClinicInfo();
    renderCodeData();
    renderDrugPickers();
  } catch (error) {
    handleError(error);
  }
}

async function loadSettings() {
  const serverSettings = await fetchJson("/api/settings");
  const localClinicInfo = getLegacyClinicInfo();
  const localIcdList = getLegacyIcdList();
  const clinicProfiles = normalizeClinicProfiles(serverSettings?.clinicProfiles);
  const activeClinicProfileId = resolveActiveClinicProfileId(serverSettings?.activeClinicProfileId, clinicProfiles);
  const activeClinicProfile = clinicProfiles.find((profile) => profile.id === activeClinicProfileId);
  const clinicInfo = activeClinicProfile
    ? normalizeClinicInfo(activeClinicProfile)
    : (serverSettings?.clinicInfo && hasMeaningfulClinicInfo(serverSettings.clinicInfo)
      ? normalizeClinicInfo(serverSettings.clinicInfo)
      : localClinicInfo);
  const icdList = Array.isArray(serverSettings?.icdList) && serverSettings.icdList.length
    ? normalizeIcdList(serverSettings.icdList)
    : localIcdList;

  state.clinicInfo = clinicInfo;
  state.clinicProfiles = clinicProfiles.length ? clinicProfiles : createInitialClinicProfiles(clinicInfo);
  state.activeClinicProfileId = resolveActiveClinicProfileId(activeClinicProfileId, state.clinicProfiles);
  state.clinicInfo = getActiveClinicProfile();
  state.icdList = icdList;

  const shouldMigrateClinic = localStorage.getItem(CLINIC_STORAGE_KEY)
    && (!Array.isArray(serverSettings?.clinicProfiles) || !serverSettings.clinicProfiles.length);
  const shouldMigrateIcd = localStorage.getItem(ICD_STORAGE_KEY) && (!Array.isArray(serverSettings?.icdList) || !serverSettings.icdList.length);

  if (shouldMigrateClinic || shouldMigrateIcd) {
    await persistSettings();
  }
}

async function loadHealth() {
  const health = await fetchJson("/api/health");
  setConnectionState(health.mongoState === "connected" ? "Đã kết nối MongoDB" : "Mất kết nối MongoDB", health.mongoState === "connected");
}

async function loadDashboard() {
  state.dashboard = await fetchJson("/api/dashboard");
  refs.summaryPatients.textContent = formatNumber(state.dashboard.summary.patientCount);
  refs.summaryDrugs.textContent = formatNumber(state.dashboard.summary.drugCount);
  refs.summaryVisitToday.textContent = formatNumber(state.dashboard.summary.visitTodayCount);
  refs.summaryRevenueMonth.textContent = formatMoney(state.dashboard.summary.monthRevenue);
  refs.recentVisitsList.innerHTML = (state.dashboard.recentVisits || []).map((visit) => `
    <div class="recent-item">
      <strong>${escapeHtml(visit.patientName || "Không rõ bệnh nhân")}</strong>
      <div class="muted">${formatDate(visit.visitDate)} - ${escapeHtml(visit.patientPhone || "")}</div>
      <div class="muted">${escapeHtml(visit.diagnosis || "Chưa nhập chẩn đoán")} - ${formatMoney(visit.totalMoney)}${visit.doctor ? ` - BS ${escapeHtml(visit.doctor)}` : ""}</div>
    </div>
  `).join("") || '<div class="recent-item">Chưa có lượt khám gần đây.</div>';
}

async function loadQuickStats() {
  state.quickStats = await fetchJson("/api/quick-stats");
  const stats = state.quickStats;
  refs.statWeekCount.textContent = formatNumber(stats.weekCount);
  refs.statMonthCount.textContent = formatNumber(stats.monthCount);
  refs.statProfit.textContent = formatMoney(stats.monthProfit);
  refs.statRevisitRate.textContent = `${stats.revisit.rate}%`;
  refs.statRevisitTrend.textContent = `${stats.revisit.returned}/${stats.revisit.scheduled} ca quay lại`;
  refs.statRevisitTrend.className = `trend ${stats.revisit.rate >= 50 ? "up" : "down"}`;
  refs.statOnTimeCount.textContent = formatNumber(stats.revisit.onTime);
  refs.statOnTimeTrend.textContent = `${stats.revisit.onTime} ca đúng hẹn`;
  refs.statOnTimeTrend.className = `trend ${stats.revisit.onTime > 0 ? "up" : "down"}`;
  refs.statLateMissedCount.textContent = formatNumber(stats.revisit.late + stats.revisit.missed);
  refs.statLateMissedTrend.textContent = `${stats.revisit.late} trễ, ${stats.revisit.missed} không quay lại`;
  refs.statLateMissedTrend.className = "trend down";
  setTrend(refs.statWeekTrend, stats.weekCount, stats.previousWeekCount, "tuần trước");
  setTrend(refs.statMonthTrend, stats.monthCount, stats.previousMonthCount, "tháng trước");
  setTrend(refs.statProfitTrend, stats.monthProfit, stats.previousMonthProfit, "tháng trước");
  renderStatsCharts(stats);
}

function renderStatsCharts(stats) {
  const summaryMax = Math.max(
    Number(state.dashboard?.summary?.patientCount || 0),
    Number(state.dashboard?.summary?.drugCount || 0),
    Number(state.dashboard?.summary?.visitTodayCount || 0),
    1
  );
  const profitMax = Math.max(Number(stats.monthProfit || 0), Number(stats.previousMonthProfit || 0), Number(state.dashboard?.summary?.monthRevenue || 0), 1);
  const revisit = stats.revisit || {};
  const onTime = Number(revisit.onTime || 0);
  const late = Number(revisit.late || 0);
  const missed = Number(revisit.missed || 0);
  const total = Math.max(onTime + late + missed, 1);

  refs.summaryPatientsMini.innerHTML = buildMiniMeter(Number(state.dashboard?.summary?.patientCount || 0), summaryMax, "#0f8b8d");
  refs.summaryDrugsMini.innerHTML = buildMiniMeter(Number(state.dashboard?.summary?.drugCount || 0), summaryMax, "#1f5f8b");
  refs.summaryVisitTodayMini.innerHTML = buildMiniMeter(Number(state.dashboard?.summary?.visitTodayCount || 0), summaryMax, "#2aa198");
  refs.summaryRevenueMonthMini.innerHTML = buildMiniMeter(Number(state.dashboard?.summary?.monthRevenue || 0), profitMax, "#1a7f49");
  refs.statWeekMini.innerHTML = buildMiniCompare(Number(stats.weekCount || 0), Number(stats.previousWeekCount || 0), ["Tuần này", "Tuần trước"]);
  refs.statMonthMini.innerHTML = buildMiniCompare(Number(stats.monthCount || 0), Number(stats.previousMonthCount || 0), ["Tháng này", "Tháng trước"]);
  refs.statProfitMini.innerHTML = buildMiniCompare(Number(stats.monthProfit || 0), Number(stats.previousMonthProfit || 0), ["Hiện tại", "Trước đó"], true);
  refs.statRevisitMini.innerHTML = buildMiniDonut(onTime, late, missed, `${revisit.rate || 0}%`);
  refs.statOnTimeMini.innerHTML = buildMiniMeter(onTime, total, "#1a7f49");
  refs.statLateMissedMini.innerHTML = buildMiniStack(late, missed, total);
}

function buildMiniMeter(value, max, color) {
  const width = Math.max((value / Math.max(max, 1)) * 100, value ? 12 : 0);
  return `<div class="stat-mini__track"><div class="stat-mini__fill" style="width:${width}%;background:${color}"></div></div>`;
}

function buildMiniCompare(current, previous, labels, money = false) {
  const max = Math.max(current, previous, 1);
  const currentWidth = Math.max((current / max) * 100, current ? 12 : 0);
  const previousWidth = Math.max((previous / max) * 100, previous ? 12 : 0);
  const hint = `${labels[0]}: ${money ? formatMoney(current) : current} | ${labels[1]}: ${money ? formatMoney(previous) : previous}`;
  return `
    <div class="stat-mini-compare" title="${escapeHtml(hint)}" aria-label="${escapeHtml(hint)}">
      <div class="stat-mini-compare__item">
        <div class="stat-mini-compare__bar is-current" style="width:${currentWidth}%"></div>
      </div>
      <div class="stat-mini-compare__item">
        <div class="stat-mini-compare__bar is-previous" style="width:${previousWidth}%"></div>
      </div>
    </div>
  `;
}

function buildMiniDonut(onTime, late, missed, centerText) {
  const total = Math.max(onTime + late + missed, 1);
  const onTimeAngle = (onTime / total) * 360;
  const lateAngle = (late / total) * 360;
  return `
    <div class="stat-mini-donut" style="background:conic-gradient(#1a7f49 0deg ${onTimeAngle}deg, #f0b24f ${onTimeAngle}deg ${onTimeAngle + lateAngle}deg, #dc4c4c ${onTimeAngle + lateAngle}deg 360deg)">
      <div class="stat-mini-donut__center">${escapeHtml(centerText)}</div>
    </div>
  `;
}

function buildMiniStack(late, missed, total) {
  const lateWidth = Math.max((late / Math.max(total, 1)) * 100, late ? 10 : 0);
  const missedWidth = Math.max((missed / Math.max(total, 1)) * 100, missed ? 10 : 0);
  return `
    <div class="stat-mini__track stat-mini__track--stack">
      <div class="stat-mini__fill" style="width:${lateWidth}%;background:#f0b24f"></div>
      <div class="stat-mini__fill" style="width:${missedWidth}%;background:#dc4c4c"></div>
    </div>
  `;
}

async function loadPatients() {
  state.patients = await fetchJson("/api/patients");
  refreshKnownDoctors();
  renderDoctorControls();
  applySearch(state.search || "");
  if (state.selectedPatientId) {
    const stillExists = state.patients.some((item) => item._id === state.selectedPatientId);
    if (stillExists) {
      await selectPatient(state.selectedPatientId, true);
      return;
    }
  }
  createNewPatient();
}

async function loadDrugs() {
  state.drugs = await fetchJson("/api/drugs");
  syncStockDraftRows();
  renderDrugPickers();
  if (!state.draftRows.length) {
    state.draftRows = [createDraftRow()];
  }
  renderDrugRows();
  if (!refs.stockDataBox.classList.contains("hidden")) renderStockData();
}

function refreshKnownDoctors() {
  const doctors = new Set();
  extractDoctorNames(state.clinicInfo?.doctor).forEach((doctor) => doctors.add(doctor));
  (state.clinicProfiles || []).forEach((profile) => {
    extractDoctorNames(profile?.doctor).forEach((doctor) => doctors.add(doctor));
  });
  state.patients.forEach((patient) => {
    extractDoctorNames(patient.lastDoctor).forEach((doctor) => doctors.add(doctor));
  });
  if (state.selectedPatientDetail?.visits?.length) {
    state.selectedPatientDetail.visits.forEach((visit) => {
      extractDoctorNames(visit.doctor).forEach((doctor) => doctors.add(doctor));
    });
  }
  state.doctors = [...doctors];
}

function extractDoctorNames(value) {
  return String(value || "")
    .split(/[,\n;]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function renderDoctorControls() {
  if (refs.doctorList) {
    refs.doctorList.innerHTML = state.doctors.map((doctor) => `<option value="${escapeAttribute(doctor)}"></option>`).join("");
  }
  if (refs.visitDoctor && !refs.visitDoctor.value.trim()) {
    refs.visitDoctor.value = state.clinicInfo?.doctor || state.doctors[0] || "";
  }
}

function handleSearchInput(event) {
  applySearch(event.target.value);
  renderSearchSuggestions(event.target.value);
}

function handleSearchKeydown(event) {
  if (event.key === "Enter") {
    event.preventDefault();
    const first = state.filteredPatients[0];
    if (first) {
      selectPatient(first._id);
      refs.searchSuggestBox.classList.add("hidden");
    }
  }
}

function applySearch(rawValue) {
  state.search = String(rawValue || "").trim();
  const keyword = normalizeText(state.search);
  state.filteredPatients = keyword
    ? state.patients.filter((patient) => normalizeText(buildPatientHaystack(patient)).includes(keyword))
    : state.patients.slice();
  refs.patientCountText.textContent = `${formatNumber(state.filteredPatients.length)} hồ sơ`;
  state.patientScrollTop = 0;
  refs.patientListViewport.scrollTop = 0;
  renderPatientList();
}

function clearSearch() {
  refs.searchInput.value = "";
  refs.searchSuggestBox.classList.add("hidden");
  applySearch("");
}

function renderSearchSuggestions(value) {
  const keyword = normalizeText(value.trim());
  if (!keyword) {
    refs.searchSuggestBox.classList.add("hidden");
    return;
  }
  const suggestions = state.patients
    .map((patient) => ({ patient, score: scorePatientMatch(patient, keyword) }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 8);

  if (!suggestions.length) {
    refs.searchSuggestBox.classList.add("hidden");
    return;
  }

  refs.searchSuggestBox.innerHTML = suggestions.map(({ patient }) => `
    <div class="suggest-item" data-search-patient-id="${patient._id}">
      <strong>${escapeHtml(patient.fullName)}</strong><br>
      <span class="muted">${escapeHtml(patient.phone)} - ${escapeHtml(patient.address || "")} - ${escapeHtml(patient.province || "")}${patient.lastDoctor ? ` - BS ${escapeHtml(patient.lastDoctor)}` : ""}</span>
    </div>
  `).join("");
  refs.searchSuggestBox.classList.remove("hidden");
  refs.searchSuggestBox.querySelectorAll("[data-search-patient-id]").forEach((item) => {
    item.addEventListener("click", async () => {
      const patient = state.patients.find((entry) => entry._id === item.dataset.searchPatientId);
      if (!patient) return;
      refs.searchInput.value = patient.fullName;
      refs.searchSuggestBox.classList.add("hidden");
      applySearch(patient.fullName);
      await selectPatient(patient._id);
    });
  });
}

function toggleShowAllPatients() {
  state.showAllPatients = !state.showAllPatients;
  state.patientScrollTop = 0;
  refs.patientListViewport.scrollTop = 0;
  renderPatientList();
}

function handlePatientViewportScroll() {
  if (isMobileLayout()) return;
  state.patientScrollTop = refs.patientListViewport.scrollTop;
  if (state.showAllPatients && state.filteredPatients.length > MAX_VISIBLE_ROWS) {
    renderPatientRowsVirtualized();
  }
}

function handlePatientListClick(event) {
  const deleteBtn = event.target.closest(".del-patient");
  if (deleteBtn) {
    deletePatient(deleteBtn.dataset.id);
    return;
  }
  const row = event.target.closest(".patient-row[data-id]");
  if (row) {
    selectPatient(row.dataset.id);
  }
}

function renderPatientList() {
  refs.showAllPatientsBtn.textContent = state.showAllPatients ? "Thu gọn" : "Xem tất cả";
  if (!state.filteredPatients.length) {
    refs.patientListViewport.style.height = `${PATIENT_ROW_HEIGHT}px`;
    refs.patientListBody.innerHTML = `<div class="patient-row" style="position:relative;min-height:${PATIENT_ROW_HEIGHT}px"><div></div><div>Không có bệnh nhân phù hợp.</div><div></div><div></div><div></div><div></div><div></div></div>`;
    return;
  }

  if (isMobileLayout()) {
    const rows = state.showAllPatients ? state.filteredPatients.slice(0, MAX_VISIBLE_ROWS) : state.filteredPatients.slice(0, DEFAULT_VISIBLE_ROWS);
    refs.patientListViewport.style.height = "auto";
    refs.patientListBody.style.height = "auto";
    refs.patientListBody.innerHTML = rows.map((patient) => buildPatientRow(patient, 0)).join("");
    return;
  }

  if (state.showAllPatients && state.filteredPatients.length > MAX_VISIBLE_ROWS) {
    refs.patientListViewport.style.height = `${PATIENT_ROW_HEIGHT * MAX_VISIBLE_ROWS}px`;
    renderPatientRowsVirtualized();
    return;
  }

  const rows = state.showAllPatients ? state.filteredPatients.slice(0, MAX_VISIBLE_ROWS) : state.filteredPatients.slice(0, DEFAULT_VISIBLE_ROWS);
  refs.patientListViewport.style.height = `${rows.length * PATIENT_ROW_HEIGHT}px`;
  refs.patientListBody.innerHTML = rows.map((patient, index) => buildPatientRow(patient, index * PATIENT_ROW_HEIGHT)).join("");
}

function renderPatientRowsVirtualized() {
  const total = state.filteredPatients.length;
  const startIndex = Math.max(0, Math.floor(state.patientScrollTop / PATIENT_ROW_HEIGHT) - 1);
  const endIndex = Math.min(total, startIndex + MAX_VISIBLE_ROWS + 3);
  const visible = state.filteredPatients.slice(startIndex, endIndex);
  refs.patientListBody.style.position = "relative";
  refs.patientListBody.style.height = `${total * PATIENT_ROW_HEIGHT}px`;
  refs.patientListBody.innerHTML = visible.map((patient, index) => buildPatientRow(patient, (startIndex + index) * PATIENT_ROW_HEIGHT)).join("");
}

function buildPatientRow(patient, top) {
  const age = patient.birthYear ? new Date().getFullYear() - Number(patient.birthYear) : "";
  const follow = getFollowStatus(patient.lastFollowUpDate);
  const visitTags = buildVisitTags(patient.visitCount);
  const metaSuffix = patient.gender || "Chưa rõ";
  const doctorBadge = patient.lastDoctor ? ` • BS ${escapeHtml(patient.lastDoctor)}` : "";
  const metaLine = `${escapeHtml(patient.phone)} - ${escapeHtml(patient.address || "")}, ${escapeHtml(patient.province || "")} - ${escapeHtml(metaSuffix)}${visitTags ? ` ${visitTags}` : ""}${doctorBadge}`;
  return `
    <div class="patient-row ${patient._id === state.selectedPatientId ? "active" : ""}" data-id="${patient._id}" style="top:${top}px">
      <div>${formatDate(patient.lastVisitAt)}</div>
      <div class="patient-meta">
        <strong>${escapeHtml(patient.fullName)}</strong>
        <div class="patient-meta__sub"><small>${metaLine}</small></div>
      </div>
      <div>${escapeHtml(String(age || ""))}</div>
      <div>${formatMoney(patient.totalRevenue)}</div>
      <div>${escapeHtml(patient.lastDiagnosis || "")}</div>
      <div><span class="follow-badge ${follow.cls}">${escapeHtml(follow.label)}</span></div>
      <div><button class="btn small danger del-patient" data-id="${patient._id}" type="button">Xóa</button></div>
    </div>
  `;
}

function buildVisitTags(count) {
  const total = Number(count || 0);
  return Array.from({ length: Math.max(1, total) }, (_, index) => `<span class="visit-tag">L${index + 1}</span>`).join("");
}

async function selectPatient(patientId, quiet = false) {
  state.selectedPatientId = patientId;
  state.selectedPatientDetail = await fetchJson(`/api/patients/${patientId}`);
  refreshKnownDoctors();
  renderDoctorControls();
  const visits = state.selectedPatientDetail?.visits || [];
  state.selectedVisitId = visits[0]?._id || "";
  fillFormFromRecord(state.selectedPatientDetail.patient, visits[0] || null);
  renderPatientList();
  renderHistory();
  renderPrescriptionVisitTabs();
  updateTotals();
  updateWarning();
  if (!quiet) showToast("Đã mở hồ sơ bệnh nhân.", "success");
}

function handleHistoryClick(event) {
  const row = event.target.closest(".history-row[data-id]");
  if (!row) return;
  const visit = (state.selectedPatientDetail?.visits || []).find((item) => item._id === row.dataset.id);
  if (!visit) return;
  state.selectedVisitId = visit._id;
  fillFormFromRecord(state.selectedPatientDetail.patient, visit);
  renderPrescriptionVisitTabs();
  updateTotals();
  updateWarning();
  showToast("Đã nạp dữ liệu lần khám vào form.", "success");
}

function handlePrescriptionVisitTabClick(event) {
  const button = event.target.closest("[data-action='open-visit-tab']");
  if (!button) return;
  const visit = (state.selectedPatientDetail?.visits || []).find((item) => item._id === button.dataset.id);
  if (!visit || !state.selectedPatientDetail?.patient) return;
  state.selectedVisitId = visit._id;
  fillFormFromRecord(state.selectedPatientDetail.patient, visit);
  renderPrescriptionVisitTabs();
  updateTotals();
  updateWarning();
  showToast(`Đã mở toa lần ${visit.visitNo || 1}.`, "success");
}

function renderHistory() {
  const visits = state.selectedPatientDetail?.visits || [];
  refs.historyRows.innerHTML = visits.map((visit) => `
    <div class="history-row" data-id="${visit._id}">
      <div>${formatDate(visit.visitDate)}<span class="history-visit-tag">L${String(visit.visitNo || 0)}</span></div>
      <div class="history-visit-no">L${String(visit.visitNo || 0)}<span class="history-total-inline">${formatMoney(visit.totalMoney)}</span></div>
      <div>${escapeHtml(visit.diagnosis || "")}${visit.doctor ? `<div class="muted">BS ${escapeHtml(visit.doctor)}</div>` : ""}${buildHistoryDrugSummary(visit)}</div>
      <div>${formatMoney(visit.totalMoney)}</div>
      <div><button class="btn small" type="button">Mở</button></div>
    </div>
  `).join("") || '<div class="history-row"><div></div><div></div><div>Chưa có lịch sử khám.</div><div></div><div></div></div>';
}

function buildHistoryDrugSummary(visit) {
  const names = [...new Set((visit?.drugs || [])
    .map((drug) => String(drug?.activeIngredient || "").trim())
    .filter(Boolean))];
  if (!names.length) return "";
  return `<div class="history-drugs muted">${escapeHtml(names.join("; "))}</div>`;
}

function renderPrescriptionVisitTabs() {
  const visits = state.selectedPatientDetail?.visits || [];
  const currentVisit = visits.find((visit) => visit._id === state.selectedVisitId) || visits[0];
  refs.drugSectionTitle.textContent = currentVisit
    ? `Chỉ định thuốc L${currentVisit.visitNo || 1}`
    : "Chỉ định thuốc";
}

function fillFormFromRecord(patient, visit) {
  refs.patientName.value = patient?.fullName || "";
  refs.birthYear.value = patient?.birthYear || "";
  refs.gender.value = patient?.gender || "Nam";
  refs.addressWard.value = patient?.address || "";
  refs.province.value = patient?.province || "";
  refs.phone.value = patient?.phone || "";
  refs.visitDoctor.value = visit?.doctor || state.clinicInfo?.doctor || state.doctors[0] || "";
  refs.visitDate.value = visit?.visitDate ? toDateInput(visit.visitDate) : toDateInput(new Date());
  refs.symptom.value = visit?.symptom || "";
  refs.symptomSuggestBox.classList.add("hidden");
  refs.icdInput.value = visit?.diagnosis || "";
  refs.icdInput.placeholder = "Gõ mã hoặc vài chữ";
  autoGrowField(refs.icdInput);
  refs.followDate.value = visit?.followUpDate ? toDateInput(visit.followUpDate) : "";
  refs.serviceFee.value = String(visit?.serviceFee || 0);
  refs.serviceMoney.value = formatMoney(visit?.serviceFee || 0);
  refs.adviceNote.value = visit?.note || DEFAULT_ADVICE_NOTE;
  resetMoneyOverrides();
  state.autoSuggestedRowKeys = [];
  calcAge();
  const drugs = visit?.drugs || [];
  state.draftRows = drugs.length ? drugs.map((drug) => ({
    key: createKey(),
    drugId: drug.drugId || findDrugId(drug),
    activeIngredient: drug.activeIngredient || "",
    brandName: composeBrandName(drug.brandName || "", drug.activeIngredient || ""),
    unit: drug.unit || "Vien",
    quantity: Number(drug.quantity || 0),
    morning: String(drug.morning || ""),
    night: String(drug.night || ""),
    usage: String(drug.instruction || drug.usage || ""),
    price: Number(drug.unitPrice || 0)
  })) : [createDraftRow()];
  renderDrugRows();
  renderPrescriptionVisitTabs();
}

function seedForm() {
  refs.visitDate.value = toDateInput(new Date());
  refs.visitDoctor.value = state.clinicInfo?.doctor || "";
  refs.serviceFee.value = "0";
  refs.serviceMoney.value = "0";
  refs.adviceNote.value = DEFAULT_ADVICE_NOTE;
  resetMoneyOverrides();
  state.autoSuggestedRowKeys = [];
  state.draftRows = [createDraftRow()];
  renderDrugRows();
  renderCodeData();
  renderDrugPickers();
  autoGrowField(refs.icdInput);
}

function createNewPatient() {
  state.selectedPatientId = "";
  state.selectedPatientDetail = null;
  state.selectedDrugId = "";
  state.selectedVisitId = "";
  refs.visitDate.value = toDateInput(new Date());
  refs.patientName.value = "";
  refs.birthYear.value = "";
  refs.age.value = "";
  refs.age.className = "field age-input";
  refs.gender.value = "Nam";
  refs.addressWard.value = "";
  refs.province.value = "";
  refs.phone.value = "";
  refs.visitDoctor.value = state.clinicInfo?.doctor || state.doctors[0] || "";
  refs.symptom.value = "";
  refs.symptomSuggestBox.classList.add("hidden");
  refs.icdInput.value = "";
  refs.icdInput.placeholder = "Gõ mã hoặc vài chữ";
  autoGrowField(refs.icdInput);
  refs.followDate.value = "";
  refs.serviceFee.value = "0";
  refs.serviceMoney.value = "0";
  refs.adviceNote.value = DEFAULT_ADVICE_NOTE;
  resetMoneyOverrides();
  state.autoSuggestedRowKeys = [];
  state.draftRows = [createDraftRow()];
  renderDrugRows();
  renderStockData();
  renderHistory();
  renderPrescriptionVisitTabs();
  renderPatientList();
  updateTotals();
  updateWarning();
}

function createNewPrescription() {
  state.selectedVisitId = "";
  refs.visitDoctor.value = refs.visitDoctor.value.trim() || (state.selectedPatientDetail?.visits || [])[0]?.doctor || state.clinicInfo?.doctor || state.doctors[0] || "";
  refs.symptom.value = "";
  refs.symptomSuggestBox.classList.add("hidden");
  refs.icdInput.value = "";
  refs.icdInput.placeholder = "Gõ mã hoặc vài chữ";
  autoGrowField(refs.icdInput);
  refs.followDate.value = "";
  refs.serviceFee.value = "0";
  refs.serviceMoney.value = "0";
  refs.adviceNote.value = DEFAULT_ADVICE_NOTE;
  resetMoneyOverrides();
  state.autoSuggestedRowKeys = [];
  state.draftRows = [createDraftRow()];
  renderDrugRows();
  renderPrescriptionVisitTabs();
  updateTotals();
  updateWarning();
}

function handleBirthYearInput() {
  calcAge();
  showYearSuggestions(refs.birthYear.value);
}

function showYearSuggestions(value) {
  const keyword = normalizeText(value.trim());
  const rows = BIRTH_YEARS.filter((year) => !keyword || normalizeText(year).includes(keyword)).slice(0, 50);
  renderSimpleSuggestions(refs.yearSuggestBox, rows, (year) => {
    refs.birthYear.value = year;
    refs.yearSuggestBox.classList.add("hidden");
    calcAge();
  });
}

function handleProvinceInput() {
  showProvinceSuggestions(refs.province.value);
}

function showProvinceSuggestions(value) {
  const keyword = normalizeText(value.trim());
  const rows = PROVINCES.filter((item) => !keyword || normalizeText(item).includes(keyword));
  renderSimpleSuggestions(refs.provinceSuggestBox, rows, (province) => {
    refs.province.value = province;
    refs.provinceSuggestBox.classList.add("hidden");
  });
}

function handleSymptomInput() {
  updateDiagnosisPlaceholderFromSymptom(refs.symptom.value);
  refreshAutoSuggestions();
}

function renderSymptomSuggestions(value) {
  refs.symptomSuggestBox.classList.add("hidden");
  refs.symptomSuggestBox.innerHTML = "";
}

function handleDiagnosisInput() {
  if (!refs.icdInput.value.trim()) {
    updateDiagnosisPlaceholderFromSymptom(refs.symptom.value);
  }
  refreshAutoSuggestions();
}

function refreshAutoSuggestions() {
  const diagnosisText = refs.icdInput.value.trim();
  if (diagnosisText) {
    applyDiagnosisSuggestionsToDraft(diagnosisText);
    return;
  }
  applySymptomSuggestionsToDraft(refs.symptom.value);
}

function updateDiagnosisPlaceholderFromSymptom(symptomText) {
  const suggestion = inferDiagnosisSuggestion(symptomText);
  refs.icdInput.placeholder = suggestion || "Gõ mã hoặc vài chữ";
}

function inferDiagnosisSuggestion(symptomText) {
  const profile = findTherapyProfileBySymptom(symptomText);
  if (!profile) return "";
  return resolveProfileDiagnosis(profile);
}

function findTherapyProfileBySymptom(text) {
  const keyword = normalizeText(text).trim();
  if (!keyword || keyword.length < 2) return null;
  return THERAPY_PROFILES.find((profile) =>
    profile.symptomKeys.some((item) => keyword === item || keyword.includes(item) || item.includes(keyword))
  ) || null;
}

function findTherapyProfilesByDiagnosis(text) {
  const keyword = normalizeText(text).trim();
  if (!keyword || keyword.length < 2) return [];
  return THERAPY_PROFILES.filter((profile) =>
    profile.diagnosisKeys.some((item) => keyword.includes(item) || item.includes(keyword))
  );
}

function resolveProfileDiagnosis(profile) {
  const matched = state.icdList.find((item) => {
    const code = normalizeText(item.code);
    const name = normalizeText(item.name);
    return code === normalizeText(profile.diagnosisCode) || profile.diagnosisKeys.some((key) => code.includes(key) || name.includes(key));
  });
  if (matched) return `${matched.code} - ${matched.name}`;
  return profile.diagnosisCode ? `${profile.diagnosisCode} - ${profile.diagnosisNameHint}` : profile.diagnosisNameHint;
}

function renderSimpleSuggestions(container, rows, onPick) {
  if (!rows.length) {
    container.classList.add("hidden");
    return;
  }
  container.innerHTML = rows.map((value) => `<div class="suggest-item" data-value="${escapeAttribute(value)}">${escapeHtml(value)}</div>`).join("");
  container.classList.remove("hidden");
  container.querySelectorAll("[data-value]").forEach((item) => {
    item.addEventListener("click", () => onPick(item.dataset.value));
  });
}

function calcAge() {
  const year = Number(refs.birthYear.value || 0);
  if (!year) {
    refs.age.value = "";
    refs.age.className = "field age-input";
    return;
  }
  const age = Math.max(0, new Date().getFullYear() - year);
  refs.age.value = String(age);
  refs.age.className = "field age-input";
  if (age >= 1 && age < 40) refs.age.classList.add("age-green");
  else if (age >= 40 && age < 60) refs.age.classList.add("age-yellow");
  else if (age >= 60 && age <= 90) refs.age.classList.add("age-red");
}

function renderIcdSuggest() {
  const keyword = normalizeText(refs.icdInput.value.trim());
  const rows = state.icdList.filter((item) => !keyword || normalizeText(`${item.code} ${item.name}`).includes(keyword)).slice(0, 30);
  refs.icdSuggestBox.innerHTML = rows.map((item) => `<div class="suggest-item" data-code="${escapeAttribute(item.code)}" data-name="${escapeAttribute(item.name)}">${escapeHtml(item.code)} - ${escapeHtml(item.name)}</div>`).join("");
  refs.icdSuggestBox.classList.toggle("hidden", !rows.length);
  refs.icdSuggestBox.querySelectorAll("[data-code]").forEach((item) => {
    item.addEventListener("click", () => {
      refs.icdInput.value = `${item.dataset.code} - ${item.dataset.name}`;
      autoGrowField(refs.icdInput);
      refs.icdSuggestBox.classList.add("hidden");
      handleDiagnosisInput();
    });
  });
}

function renderCodeData() {
  const selected = state.icdList.find((item) => item.code === state.selectedIcdCode) || { code: "", name: "" };
  const rows = state.icdList
    .slice()
    .sort((a, b) => String(a.code).localeCompare(String(b.code), "vi"))
    .map((item) => `
      <div class="code-row ${item.code === state.selectedIcdCode ? "active" : ""}" data-action="select-icd" data-code="${escapeAttribute(item.code)}">
        <div class="code-row__code">${escapeHtml(item.code)}</div>
        <div class="code-row__name">${escapeHtml(item.name)}</div>
        <div class="code-row__actions">
          <button class="btn small" type="button" data-action="use-icd" data-code="${escapeAttribute(item.code)}">Dung</button>
        </div>
      </div>
    `)
    .join("");

  refs.codeDataBox.innerHTML = `
    <div class="code-manager">
      <div class="code-manager__form">
        <div>
          <label class="label">Ma ICD</label>
          <input class="field" id="codeDataCodeInput" value="${escapeAttribute(selected.code)}" />
        </div>
        <div>
          <label class="label">Ten chan doan</label>
          <input class="field" id="codeDataNameInput" value="${escapeAttribute(selected.name)}" />
        </div>
        <button class="btn small primary" type="button" data-action="create-icd">Them</button>
        <button class="btn small" type="button" data-action="update-icd">Sua</button>
        <button class="btn small danger" type="button" data-action="delete-icd">Xóa</button>
      </div>
      <div class="code-manager__list">
        ${rows || '<div class="code-empty">Chưa có mã ICD.</div>'}
      </div>
    </div>
  `;
}

function addCustomCode() {
  if (!refs.icdInput.value.trim()) {
    showToast("Nhap ma hoac chan doan truoc.", "error");
    return;
  }
  showToast("Đã giữ chẩn đoán hiện tại trên form.", "success");
  handleDiagnosisInput();
}

async function handleCodeDataClick(event) {
  const action = event.target.dataset.action;
  if (!action) return;

  try {
    if (action === "select-icd") {
      state.selectedIcdCode = event.target.closest("[data-code]")?.dataset.code || "";
      renderCodeData();
      return;
    }

    if (action === "use-icd") {
      const code = event.target.dataset.code;
      const item = state.icdList.find((entry) => entry.code === code);
      if (!item) return;
      state.selectedIcdCode = item.code;
      refs.icdInput.value = `${item.code} - ${item.name}`;
      autoGrowField(refs.icdInput);
      renderCodeData();
      handleDiagnosisInput();
      return;
    }

    const codeInput = document.getElementById("codeDataCodeInput");
    const nameInput = document.getElementById("codeDataNameInput");
    const code = String(codeInput?.value || "").trim();
    const name = String(nameInput?.value || "").trim();

    if (action === "create-icd") {
      if (!code || !name) {
        showToast("Nhap ma ICD va ten chan doan.", "error");
        return;
      }
      if (state.icdList.some((item) => item.code === code)) {
        showToast("Ma ICD da ton tai.", "error");
        return;
      }
      state.icdList.push({ code, name });
      state.selectedIcdCode = code;
      await persistSettings();
      renderCodeData();
      renderIcdSuggest();
      showToast("Da them ma ICD.");
      return;
    }

    if (action === "update-icd") {
      if (!state.selectedIcdCode) {
        showToast("Hay chon ma ICD can sua.", "error");
        return;
      }
      if (!code || !name) {
        showToast("Nhap day du ma ICD va ten chan doan.", "error");
        return;
      }
      if (state.icdList.some((item) => item.code === code && item.code !== state.selectedIcdCode)) {
        showToast("Mã ICD mới bị trùng.", "error");
        return;
      }
      state.icdList = state.icdList.map((item) => item.code === state.selectedIcdCode ? { code, name } : item);
      state.selectedIcdCode = code;
      await persistSettings();
      renderCodeData();
      renderIcdSuggest();
      showToast("Da sua ma ICD.");
      return;
    }

    if (action === "delete-icd") {
      if (!state.selectedIcdCode) {
        showToast("Hãy chọn mã ICD cần xóa.", "error");
        return;
      }
      state.icdList = state.icdList.filter((item) => item.code !== state.selectedIcdCode);
      state.selectedIcdCode = "";
      await persistSettings();
      renderCodeData();
      renderIcdSuggest();
      showToast("Đã xóa mã ICD.");
    }
  } catch (error) {
    handleError(error);
  }
}

function createDraftRow() {
  return {
    key: createKey(),
    drugId: "",
    activeIngredient: "",
    brandName: "",
    unit: "Viên",
    quantity: 30,
    morning: "",
    night: "",
    usage: "",
    price: 0
  };
}

function isPristineDraftRow(row) {
  return (
    !String(row.drugId || "").trim() &&
    !String(row.activeIngredient || "").trim() &&
    !String(row.brandName || "").trim() &&
    normalizeText(row.unit || "") === normalizeText("Viên") &&
    toNumber(row.quantity) === 30 &&
    !String(row.morning || "").trim() &&
    !String(row.night || "").trim() &&
    !String(row.usage || "").trim() &&
    toNumber(row.price) === 0
  );
}

function renderDrugRows() {
  refs.drugRows.innerHTML = state.draftRows.map((row, index) => `
    <div class="drug-row" data-key="${row.key}">
      <div class="drug-row__index">${index + 1}</div>
      <div class="drug-row__main">
        <div class="drug-row__top">
          <div class="drug-field drug-field--ingredient">
            <div class="drug-field__label-row">
              <label class="label"><span class="drug-inline-index">${index + 1}</span>Hoạt chất</label>
              <button class="btn small danger drug-remove-top" data-action="remove" type="button">X</button>
            </div>
            <input class="mini ${isDrugDoseExceeded(row) ? "is-overdose" : ""}" data-field="activeIngredient" list="activeIngredientList" value="${escapeAttribute(row.activeIngredient)}" />
          </div>
          <div class="drug-field drug-field--brand">
            <label class="label">Tên thương mại</label>
            <input class="mini" data-field="brandName" value="${escapeAttribute(getDrugBrandDisplay(row))}" />
          </div>
          <div class="drug-field drug-field--dose">
            <label class="label">Sáng</label>
            <input class="mini" data-field="morning" list="doseList" value="${escapeAttribute(row.morning || "")}" />
            <div class="dose-quick hidden">
              ${DOSE_OPTIONS.map((option) => `<button class="dose-quick__btn" type="button" data-action="set-dose" data-dose-field="morning" data-dose-value="${escapeAttribute(option)}">${escapeHtml(option)}</button>`).join("")}
            </div>
          </div>
          <div class="drug-field drug-field--dose drug-field--dose-right">
            <label class="label">Tối</label>
            <input class="mini" data-field="night" list="doseList" value="${escapeAttribute(row.night || "")}" />
            <div class="dose-quick hidden">
              ${DOSE_OPTIONS.map((option) => `<button class="dose-quick__btn" type="button" data-action="set-dose" data-dose-field="night" data-dose-value="${escapeAttribute(option)}">${escapeHtml(option)}</button>`).join("")}
            </div>
          </div>
        </div>
        <div class="drug-row__bottom">
          <div class="drug-field drug-field--usage">
            <label class="label">Công dụng / HDSD</label>
            <textarea class="mini" data-field="usage" rows="2">${escapeHtml(row.usage)}</textarea>
          </div>
          <div class="drug-field drug-field--unit">
            <label class="label">Đơn vị</label>
            <input class="mini" data-field="unit" value="${escapeAttribute(row.unit)}" />
          </div>
          <div class="drug-field drug-field--quantity">
            <label class="label">Số lượng</label>
            <input class="mini" data-field="quantity" inputmode="numeric" value="${escapeAttribute(toNumber(row.quantity) || 30)}" />
            <div class="quantity-quick hidden">
              ${QUANTITY_OPTIONS.map((option) => `<button class="quantity-quick__btn ${["30","60","90"].includes(option) ? "is-common" : ""}" type="button" data-action="set-quantity" data-quantity-value="${escapeAttribute(option)}">${escapeHtml(option)}</button>`).join("")}
            </div>
          </div>
          <div class="drug-field drug-field--price">
            <label class="label">Giá</label>
            <input class="mini" data-field="price" inputmode="numeric" value="${escapeAttribute(formatMoney(row.price))}" />
          </div>
        </div>
      </div>
    </div>
  `).join("");
  refs.drugRows.querySelectorAll(".drug-field--usage textarea").forEach((element) => autoGrowField(element));
  refs.drugRows.querySelectorAll(".drug-row").forEach((rowElement) => {
    const row = state.draftRows.find((item) => item.key === rowElement.dataset.key);
    if (row) applyDoseAlertStateToRowElement(rowElement, row);
  });
}

function getDrugBrandDisplay(row) {
  const brand = composeBrandName(row.brandName, row.activeIngredient);
  if (window.innerWidth > 720) return brand;
  return simplifyDrugBrandForMobile(brand);
}

function simplifyDrugBrandForMobile(value) {
  return String(value || "")
    .replace(/\b\d+([.,]\d+)?\s*(mg|mcg|g|ml|ui|iu)\b/gi, "")
    .replace(/\b\d+([.,]\d+)?\s*%\b/gi, "")
    .replace(/\/\s*\d+([.,]\d+)?\s*(mg|mcg|g|ml|ui|iu)\b/gi, "")
    .replace(/\b(viên|vien|ống|ong|chai|goi|gói|tab|tabs|tablet|cap|capsule|sr|xr|retard|long|forte|plus)\b/gi, "")
    .replace(/\s*[-(].*$/g, "")
    .replace(/\s{2,}/g, " ")
    .replace(/\s+\/\s+$/g, "")
    .trim() || String(value || "");
}

function handleDrugRowClick(event) {
  const doseInput = event.target.closest("input[data-field='morning'], input[data-field='night']");
  if (doseInput) {
    if (window.innerWidth <= 720) {
      toggleDoseQuickPicker(doseInput.closest(".drug-field--dose"));
    } else if (typeof doseInput.showPicker === "function") {
      try { doseInput.showPicker(); } catch {}
    }
  }
  const quantityInput = event.target.closest("input[data-field='quantity']");
  if (quantityInput && window.innerWidth <= 720) {
    toggleQuantityQuickPicker(quantityInput.closest(".drug-field--quantity"));
  }
  const doseButton = event.target.closest("[data-action='set-dose']");
  if (doseButton) {
    const rowElement = doseButton.closest(".drug-row");
    const row = state.draftRows.find((item) => item.key === rowElement?.dataset.key);
    const field = doseButton.dataset.doseField;
    if (row && field) {
      row[field] = doseButton.dataset.doseValue || "";
      const input = rowElement.querySelector(`input[data-field='${field}']`);
      if (input) input.value = row[field];
      closeDoseQuickPickers();
      updateTotals();
      updateWarning();
    }
    return;
  }
  const quantityButton = event.target.closest("[data-action='set-quantity']");
  if (quantityButton) {
    const rowElement = quantityButton.closest(".drug-row");
    const row = state.draftRows.find((item) => item.key === rowElement?.dataset.key);
    if (row) {
      row.quantity = toNumber(quantityButton.dataset.quantityValue || "");
      const input = rowElement.querySelector("input[data-field='quantity']");
      if (input) input.value = row.quantity;
      closeQuantityQuickPickers();
      updateTotals();
      updateWarning();
    }
    return;
  }
  const button = event.target.closest("[data-action='remove']");
  if (!button) return;
  const row = button.closest(".drug-row");
  state.draftRows = state.draftRows.filter((item) => item.key !== row.dataset.key);
  if (!state.draftRows.length) state.draftRows = [createDraftRow()];
  renderDrugRows();
  updateTotals();
  updateWarning();
}

function closeDoseQuickPickers() {
  refs.drugRows.querySelectorAll(".dose-quick").forEach((element) => element.classList.add("hidden"));
}

function toggleDoseQuickPicker(fieldElement) {
  if (!fieldElement) return;
  const target = fieldElement.querySelector(".dose-quick");
  if (!target) return;
  const shouldOpen = target.classList.contains("hidden");
  closeDoseQuickPickers();
  if (shouldOpen) target.classList.remove("hidden");
}

function closeQuantityQuickPickers() {
  refs.drugRows.querySelectorAll(".quantity-quick").forEach((element) => element.classList.add("hidden"));
}

function toggleQuantityQuickPicker(fieldElement) {
  if (!fieldElement) return;
  const target = fieldElement.querySelector(".quantity-quick");
  if (!target) return;
  const shouldOpen = target.classList.contains("hidden");
  closeQuantityQuickPickers();
  if (shouldOpen) target.classList.remove("hidden");
}

function handleDrugRowChange(event) {
  if ((event.type === "focusin" || event.type === "focus") && ["morning", "night"].includes(event.target?.dataset?.field) && typeof event.target.showPicker === "function") {
    try { event.target.showPicker(); } catch {}
  }
  const rowElement = event.target.closest(".drug-row");
  if (!rowElement) return;
  const row = state.draftRows.find((item) => item.key === rowElement.dataset.key);
  const field = event.target.dataset.field;
  if (!row || !field) return;

  if (field === "activeIngredient") {
    row.activeIngredient = event.target.value;
    if (event.type === "change") {
      const drug = findMatchingDrugByIngredient(row.activeIngredient, row.brandName);
      if (drug) {
        applyCatalogDrugToRow(row, drug);
      } else {
        row.drugId = "";
        row.brandName = composeBrandName(row.brandName, row.activeIngredient);
      }
      renderDrugRows();
    }
  } else if (field === "quantity") {
    row.quantity = toNumber(event.target.value) || 30;
    event.target.value = row.quantity;
  } else if (field === "price") {
    row.price = toNumber(event.target.value);
  } else if (field === "brandName") {
    row.brandName = event.target.value;
    if (event.type === "change") {
      row.brandName = composeBrandName(row.brandName, row.activeIngredient);
      renderDrugRows();
    }
  } else {
    row[field] = event.target.value;
    if (field === "usage") autoGrowField(event.target);
  }
  applyDoseAlertStateToRowElement(rowElement, row);
  updateTotals();
  updateWarning();
}

function updateTotals() {
  const drugTotal = state.draftRows.reduce((sum, row) => sum + (toNumber(row.quantity) * toNumber(row.price)), 0);
  const service = state.moneyOverrides.service ?? (toNumber(refs.serviceMoney.value) || 0);
  refs.serviceFee.value = String(service);
  applyMoneyField(refs.drugMoney, "drug", drugTotal);
  applyMoneyField(refs.serviceMoney, "service", service);
  const currentDrug = state.moneyOverrides.drug ?? drugTotal;
  const currentService = state.moneyOverrides.service ?? service;
  applyMoneyField(refs.totalMoney, "total", currentDrug + currentService);
}

function updateWarning() {
  const names = state.draftRows.map((item) => normalizeText(`${item.activeIngredient} ${item.brandName}`));
  const warnings = [];
  if (names.some((item) => item.includes("olanzapine")) && names.some((item) => item.includes("quetiapine"))) warnings.push("Olanzapine + Quetiapine co the lam tang an than va ganh nang chuyen hoa.");
  if (names.some((item) => item.includes("diazepam")) && names.some((item) => item.includes("quetiapine"))) warnings.push("Diazepam + Quetiapine co the lam tang buon ngu, lu lan va te nga.");
  if (names.some((item) => item.includes("clozapine")) && names.some((item) => item.includes("carbamazepine"))) warnings.push("Clozapine + Carbamazepine lam tang nguy co suy tuy, nen tranh phoi hop.");
  refs.warningBox.innerHTML = warnings.length ? warnings.map((item) => `- ${escapeHtml(item)}`).join("<br>") : "";
}

function inferDrugSuggestions(symptomText) {
  const profile = findTherapyProfileBySymptom(symptomText);
  if (!profile) return [];
  return buildRegimenSuggestions(profile);
}

function inferDrugSuggestionsFromDiagnosis(diagnosisText) {
  const profiles = findTherapyProfilesByDiagnosis(diagnosisText);
  if (!profiles.length) return [];
  const profile = chooseBestTherapyProfile(diagnosisText, profiles, "diagnosisKeys");
  return profile ? buildRegimenSuggestions(profile) : [];
}

function inferDrugSuggestionsFromProfiles(matchingProfiles) {
  if (!matchingProfiles.length) return [];
  const profile = chooseBestTherapyProfile(refs.icdInput.value || refs.symptom.value || "", matchingProfiles, "diagnosisKeys") || matchingProfiles[0];
  return buildRegimenSuggestions(profile);
}

function chooseBestTherapyProfile(sourceText, profiles, keyField) {
  const keyword = normalizeText(sourceText).trim();
  if (!profiles.length) return null;
  return profiles
    .map((profile) => {
      const score = (profile[keyField] || []).reduce((max, item) => {
        const token = normalizeText(item);
        if (!token) return max;
        if (keyword === token) return Math.max(max, token.length + 100);
        if (keyword.includes(token) || token.includes(keyword)) return Math.max(max, token.length);
        return max;
      }, 0);
      return { profile, score };
    })
    .sort((a, b) => b.score - a.score)[0]?.profile || profiles[0];
}

function buildRegimenSuggestions(profile) {
  if (!profile) return [];
  const regimen = profile.regimen || {};
  const selected = [];
  ["main", "adjunct", "support"].forEach((role) => {
    const picked = pickRegimenSuggestion(regimen[role] || [], selected, role, profile);
    if (picked) selected.push(picked);
  });

  if (selected.length) return selected;
  return [];
}

function pickRegimenSuggestion(options, selected, role, profile) {
  for (const option of options) {
    const candidates = state.drugs
      .filter((drug) => Number(drug.quantity || 0) > 0)
      .filter((drug) => isAutoSuggestionDrugAllowed(drug, role))
      .filter((drug) => option.tokens.some((token) => drugMatchesToken(drug, token)))
      .filter((drug) => isRegimenCandidateCompatible(drug, selected, role))
      .sort((a, b) => compareRegimenCandidate(drugRegimenRank(a, option, profile), drugRegimenRank(b, option, profile), a, b));

    const drug = candidates[0];
    if (!drug) continue;
    return {
      drug,
      quantity: option.quantity || profile.quantity || 30,
      morning: option.morning ?? profile.morning ?? "",
      night: option.night ?? profile.night ?? ""
    };
  }
  return null;
}

function compareRegimenCandidate(rankA, rankB, drugA, drugB) {
  if (rankA !== rankB) return rankB - rankA;
  return Number(drugA.price || 0) - Number(drugB.price || 0);
}

function drugRegimenRank(drug, option, profile) {
  let rank = 0;
  const usageText = normalizeText(drug.usage || "");
  const activeText = normalizeText(drug.activeIngredient || "");
  (option.tokens || []).forEach((token) => {
    const normalizedToken = normalizeText(token);
    if (activeText.includes(normalizedToken)) rank += 8;
    if (usageText.includes(normalizedToken)) rank += 3;
  });
  (profile.usage || []).forEach((token) => {
    if (usageText.includes(normalizeText(token))) rank += 2;
  });
  return rank;
}

function drugMatchesToken(drug, token) {
  const haystack = normalizeText(`${drug.activeIngredient} ${drug.brandName} ${drug.usage}`);
  return haystack.includes(normalizeText(token));
}

function isRegimenCandidateCompatible(drug, selected, role) {
  const candidateCategory = classifyDrugCategory(drug);
  const selectedCategories = selected.map((item) => classifyDrugCategory(item.drug));

  if (role !== "support") {
    if (["antipsychotic", "antidepressant", "sedative", "mood-stabilizer"].includes(candidateCategory) && selectedCategories.includes(candidateCategory)) {
      return false;
    }
  }

  return selected.every((item) => !drugConflictsWith(drug, item.drug) && !drugConflictsWith(item.drug, drug));
}

function classifyDrugCategory(drug) {
  const text = normalizeText(`${drug.activeIngredient} ${drug.brandName} ${drug.usage}`);
  if (text.includes("chong ngoai thap") || text.includes("ngoai thap")) return "eps-protection";
  if (text.includes("tram cam")) return "antidepressant";
  if (text.includes("on dinh khi sac")) return "mood-stabilizer";
  if (text.includes("loan than") || text.includes("chong loan than") || text.includes("khang tri")) return "antipsychotic";
  if (text.includes("an than") || text.includes("ngu")) return "sedative";
  if (text.includes("vitamin") || text.includes("gan")) return "support";
  return "other";
}

function isAutoSuggestionDrugAllowed(drug, role) {
  const text = normalizeText(`${drug.activeIngredient} ${drug.brandName} ${drug.usage}`);
  const unit = normalizeText(drug.unit || "");
  if (unit.includes("ong") || text.includes("/2ml") || text.includes("/ml")) return false;
  if (text.includes("clozapin") || text.includes("clomedin") || text.includes("lepigin")) return false;
  if (text.includes("chlorpromazine") || text.includes("aminazin")) return false;
  if (text.includes("haloperidol 5mg/ml")) return false;
  if (text.includes("xr 200") || text.includes("xr 300")) return false;
  if (role === "support" && !["support", "eps-protection"].includes(classifyDrugCategory(drug))) return false;
  return true;
}

function drugConflictsWith(sourceDrug, targetDrug) {
  const avoids = parseUsageSection(sourceDrug.usage, "tranh");
  if (!avoids.length) return false;
  return avoids.some((token) => drugMatchesConstraintToken(targetDrug, token));
}

function parseUsageSection(usageText, sectionLabel) {
  const normalized = normalizeText(usageText || "");
  const match = normalized.match(new RegExp(`${sectionLabel}\\s*:\\s*([^|]+)`));
  if (!match) return [];
  return match[1]
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .filter((item) => !["none", "na", "safe", "general", "clinical", "support", "fluid"].includes(item));
}

function drugMatchesConstraintToken(drug, token) {
  const normalizedToken = normalizeText(token);
  const haystack = normalizeText(`${drug.activeIngredient} ${drug.brandName} ${drug.usage}`);
  const category = classifyDrugCategory(drug);
  if (haystack.includes(normalizedToken)) return true;
  if (normalizedToken.includes("sedative") || normalizedToken.includes("cns depressant")) return category === "sedative";
  if (normalizedToken.includes("antipsychotic")) return category === "antipsychotic";
  return false;
}

function buildSuggestedRow(suggestion) {
  return {
    key: createKey(),
    drugId: suggestion.drug._id || "",
    activeIngredient: suggestion.drug.activeIngredient || "",
    brandName: composeBrandName(suggestion.drug.brandName || "", suggestion.drug.activeIngredient || ""),
    unit: suggestion.drug.unit || "Vien",
    quantity: suggestion.quantity,
    morning: suggestion.morning,
    night: suggestion.night,
    usage: suggestion.drug.usage || "",
    price: Number(suggestion.drug.price || 0)
  };
}

function applySymptomSuggestionsToDraft(symptomText) {
  const suggestions = inferDrugSuggestions(symptomText).slice(0, 3);
  applySuggestedRowsToDraft(suggestions);
}

function applyDiagnosisSuggestionsToDraft(diagnosisText) {
  const suggestions = inferDrugSuggestionsFromDiagnosis(diagnosisText).slice(0, 4);
  applySuggestedRowsToDraft(suggestions);
}

function applySuggestedRowsToDraft(suggestions) {
  const manualRows = state.draftRows.filter((row) => !state.autoSuggestedRowKeys.includes(row.key));
  state.autoSuggestedRowKeys = [];

  if (!suggestions.length) {
    state.draftRows = manualRows.length ? manualRows : [createDraftRow()];
    renderDrugRows();
    updateTotals();
    updateWarning();
    return;
  }

  const suggestedRows = suggestions.map((item) => buildSuggestedRow(item));
  state.autoSuggestedRowKeys = suggestedRows.map((row) => row.key);

  const hasMeaningfulManualRows = manualRows.some((row) =>
    !isPristineDraftRow(row) && (row.drugId || row.activeIngredient || row.brandName || toNumber(row.quantity) > 0 || toNumber(row.price) > 0)
  );

  state.draftRows = hasMeaningfulManualRows ? [...manualRows, ...suggestedRows] : suggestedRows;
  renderDrugRows();
  updateTotals();
  updateWarning();
}

function renderDrugPickers() {
  const uniqueIngredients = [...new Map(state.drugs.map((drug) => [normalizeText(drug.activeIngredient), drug.activeIngredient])).values()];
  refs.activeIngredientList.innerHTML = uniqueIngredients.map((value) => `<option value="${escapeAttribute(value)}"></option>`).join("");
  refs.doseList.innerHTML = DOSE_OPTIONS.map((value) => `<option value="${escapeAttribute(value)}"></option>`).join("");
  refs.serviceFeeList.innerHTML = SERVICE_FEE_OPTIONS.map((value) => `<option value="${value}"></option>`).join("");
}

function renderServiceFeeSuggest() {
  const keyword = String(refs.serviceMoney.value || "").replace(/\D/g, "");
  const rows = SERVICE_FEE_OPTIONS
    .filter((value) => !keyword || String(value).includes(keyword))
    .slice(0, 199);

  refs.serviceFeeSuggestBox.innerHTML = rows.map((value) => `
    <button class="service-fee-item ${PRIORITY_SERVICE_FEES.has(value) ? "is-priority" : ""}" type="button" data-action="set-service-fee" data-value="${value}">
      ${formatMoney(value)}
    </button>
  `).join("") || '<div class="suggest-item">Không có mức phí phù hợp.</div>';

  refs.serviceFeeSuggestBox.classList.toggle("hidden", !rows.length);
  refs.serviceFeeSuggestBox.querySelectorAll("[data-action='set-service-fee']").forEach((item) => {
    item.addEventListener("click", () => {
      refs.serviceMoney.value = String(item.dataset.value || "0");
      syncServiceFeeFromMoney();
      formatMoneyField(refs.serviceMoney, true);
      refs.serviceFeeSuggestBox.classList.add("hidden");
      updateTotals();
    });
  });
}

function syncServiceFeeFromMoney() {
  refs.serviceFee.value = String(toNumber(refs.serviceMoney.value) || 0);
}

function syncStockDraftRows() {
  state.stockDraftRows = state.drugs.map((drug) => ({
    key: createKey(),
    id: drug._id || "",
    activeIngredient: drug.activeIngredient || "",
    brandName: composeBrandName(drug.brandName || "", drug.activeIngredient || ""),
    unit: drug.unit || "Viên",
    quantity: Number(drug.quantity || 999),
    price: Number(drug.price || 0),
    usage: drug.usage || "",
    notes: drug.notes || ""
  }));
}

function renderStockData() {
  refs.stockDataBox.innerHTML = `
    <div class="stock-manager">
      <div class="stock-toolbar">
        <div class="stock-toolbar__actions">
          <button class="btn small primary" data-action="add-stock-row" type="button">Thêm dòng</button>
          <button class="btn small" data-action="save-all-stock" type="button">Lưu tất cả</button>
          <button class="btn small" data-action="reload-stock" type="button">Tải lại</button>
        </div>
        <div>
          <label class="label">Dán dữ liệu từ Excel</label>
          <textarea class="field stock-paste" id="stockPasteInput" rows="4" placeholder="Copy nhiều dòng từ Excel rồi dán vào đây. Thứ tự cột: Hoạt chất, Tên thương mại, Đơn vị, Tồn kho, Giá, Công dụng"></textarea>
        </div>
        <div class="stock-toolbar__actions">
          <button class="btn small primary" data-action="apply-stock-paste" type="button">Dán vào bảng</button>
        </div>
      </div>
      <div class="stock-manager__table-wrap">
        <div class="stock-table">
          <div class="stock-table__head">
            <div>Hoạt chất</div>
            <div>Tên thương mại</div>
            <div>Đơn vị</div>
            <div>Tồn kho</div>
            <div>Giá</div>
            <div>Công dụng</div>
            <div>Xóa</div>
          </div>
          <div class="stock-table__body">
            ${state.stockDraftRows.map((row) => `
              <div class="stock-table__row" data-key="${row.key}">
                <div><input class="mini" data-field="activeIngredient" value="${escapeAttribute(row.activeIngredient)}" /></div>
                <div><input class="mini" data-field="brandName" value="${escapeAttribute(row.brandName)}" /></div>
                <div><input class="mini" data-field="unit" value="${escapeAttribute(row.unit)}" /></div>
                <div><input class="mini" data-field="quantity" inputmode="numeric" value="${escapeAttribute(String(row.quantity))}" /></div>
                <div><input class="mini" data-field="price" inputmode="numeric" value="${escapeAttribute(String(row.price))}" /></div>
                <div><textarea class="mini" data-field="usage" rows="2">${escapeHtml(row.usage)}</textarea></div>
                <div><button class="btn small danger" data-action="delete-stock-row" data-key="${row.key}" type="button">X</button></div>
              </div>
            `).join("") || '<div class="code-empty">Chưa có thuốc trong kho.</div>'}
          </div>
        </div>
      </div>
    </div>
  `;
}

async function handleStockDataClick(event) {
  const actionElement = event.target.closest("[data-action]");
  if (!actionElement) return;
  const action = actionElement.dataset.action;

  try {
    if (action === "add-stock-row") {
      state.stockDraftRows.unshift(createStockDraftRow());
      renderStockData();
      return;
    }

    if (action === "reload-stock") {
      syncStockDraftRows();
      renderStockData();
      return;
    }

    if (action === "apply-stock-paste") {
      const text = document.getElementById("stockPasteInput")?.value || "";
      const rows = parseStockPaste(text);
      if (!rows.length) throw new Error("Chưa có dữ liệu Excel hợp lệ để dán.");
      state.stockDraftRows = [...rows, ...state.stockDraftRows];
      renderStockData();
      showToast(`Đã dán ${rows.length} dòng vào bảng kho thuốc.`, "success");
      return;
    }

    if (action === "delete-stock-row") {
      const row = state.stockDraftRows.find((item) => item.key === actionElement.dataset.key);
      if (!row) return;
      if (row.id) {
        if (!window.confirm("Xóa thuốc này khỏi kho?")) return;
        await fetchJson(`/api/drugs/${row.id}`, { method: "DELETE" });
        await loadDrugs();
        showToast("Đã xóa thuốc khỏi kho.", "success");
      } else {
        state.stockDraftRows = state.stockDraftRows.filter((item) => item.key !== row.key);
        renderStockData();
      }
      return;
    }

    if (action === "save-all-stock") {
      const rows = state.stockDraftRows.filter(hasMeaningfulStockRow);
      for (const row of rows) {
        const payload = buildStockPayload(row);
        if (row.id) {
          await fetchJson(`/api/drugs/${row.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
          });
        } else {
          await fetchJson("/api/drugs", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
          });
        }
      }
      await loadDrugs();
      showToast("Đã lưu toàn bộ bảng kho thuốc.", "success");
      return;
    }
  } catch (error) {
    handleError(error);
  }
}

function handleStockDataInput(event) {
  const rowElement = event.target.closest(".stock-table__row");
  if (!rowElement) return;
  const row = state.stockDraftRows.find((item) => item.key === rowElement.dataset.key);
  const field = event.target.dataset.field;
  if (!row || !field) return;
  if (field === "quantity" || field === "price") {
    row[field] = toNumber(event.target.value);
    return;
  }
  row[field] = event.target.value;
}

function createStockDraftRow() {
  return {
    key: createKey(),
    id: "",
    activeIngredient: "",
    brandName: "",
    unit: "Viên",
    quantity: 999,
    price: 0,
    usage: "",
    notes: ""
  };
}

function hasMeaningfulStockRow(row) {
  return Boolean(String(row.activeIngredient || "").trim() || String(row.brandName || "").trim() || String(row.usage || "").trim());
}

function buildStockPayload(row) {
  const activeIngredient = String(row.activeIngredient || "").trim();
  const brandName = composeBrandName(String(row.brandName || "").trim(), activeIngredient);
  if (!activeIngredient) throw new Error("Có dòng kho thuốc chưa nhập hoạt chất.");
  if (!brandName) throw new Error("Có dòng kho thuốc chưa nhập tên thương mại.");
  return {
    activeIngredient,
    brandName,
    unit: String(row.unit || "Viên").trim() || "Viên",
    quantity: toNumber(row.quantity || 999) || 999,
    price: toNumber(row.price || 0),
    usage: String(row.usage || "").trim(),
    notes: String(row.notes || "").trim()
  };
}

function parseStockPaste(text) {
  const lines = String(text || "").split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  if (!lines.length) return [];
  const rows = [];
  lines.forEach((line) => {
    const cells = line.split("\t");
    const firstCell = normalizeText(cells[0] || "");
    if (firstCell.includes("hoat chat")) return;
    const row = createStockDraftRow();
    row.activeIngredient = String(cells[0] || "").trim();
    row.brandName = String(cells[1] || "").trim();
    row.unit = String(cells[2] || "Viên").trim() || "Viên";
    const cell4 = String(cells[3] || "").trim();
    const cell5 = String(cells[4] || "").trim();
    const cell6Plus = String(cells.slice(5).join(" ").trim() || "");

    if (cell4 && /^\d+([.,]\d+)?$/.test(cell4)) {
      row.quantity = toNumber(cell4) || 999;
      row.price = toNumber(cell5 || 0);
      row.usage = cell6Plus;
    } else {
      row.quantity = 999;
      row.usage = cell4;
      row.price = toNumber(cell5 || 0);
    }
    if (hasMeaningfulStockRow(row)) rows.push(row);
  });
  return rows;
}

function applyCatalogDrugToRow(row, drug) {
  row.drugId = drug?._id || "";
  row.activeIngredient = drug?.activeIngredient || row.activeIngredient;
  row.brandName = composeBrandName(drug?.brandName || row.brandName, row.activeIngredient);
  row.unit = drug?.unit || row.unit || "Viên";
  row.quantity = toNumber(row.quantity) || 30;
  row.usage = drug?.usage || row.usage || "";
  row.price = Number(drug?.price || row.price || 0);
}

function applyDoseAlertStateToRowElement(rowElement, row) {
  const input = rowElement?.querySelector('[data-field="activeIngredient"]');
  if (!input) return;
  const exceeded = isDrugDoseExceeded(row);
  input.classList.toggle("is-overdose", exceeded);
  const doseInfo = getDrugDoseLimitInfo(row);
  input.title = exceeded && doseInfo
    ? `Vượt liều tối đa/ngày: ${formatDoseValue(doseInfo.dailyDose)} > ${formatDoseValue(doseInfo.maxDose)} ${doseInfo.unit}`
    : "";
}

function isDrugDoseExceeded(row) {
  const info = getDrugDoseLimitInfo(row);
  return Boolean(info && info.dailyDose > info.maxDose);
}

function getDrugDoseLimitInfo(row) {
  const strength = parseStrengthInfo(`${row.activeIngredient || ""} ${row.brandName || ""}`);
  const maxDose = parseMaxDoseInfo(row.usage || "");
  if (!strength || !maxDose) return null;
  if (normalizeText(strength.unit) !== normalizeText(maxDose.unit)) return null;
  const morning = toNumber(row.morning);
  const night = toNumber(row.night);
  const dailyDose = (morning + night) * strength.amount;
  return {
    dailyDose,
    maxDose: maxDose.amount,
    unit: maxDose.unit
  };
}

function parseStrengthInfo(text) {
  const match = String(text || "").match(/(\d+(?:[.,]\d+)?)\s*(mg|g|mcg|µg|ml|iu|ui)\b/i);
  if (!match) return null;
  return {
    amount: normalizeDoseAmount(match[1], match[2]),
    unit: normalizeDoseUnit(match[2])
  };
}

function parseMaxDoseInfo(text) {
  const match = String(text || "").match(/max\s*:?\s*(\d+(?:[.,]\d+)?)\s*(mg|g|mcg|µg|ml|iu|ui)\b/i);
  if (!match) return null;
  return {
    amount: normalizeDoseAmount(match[1], match[2]),
    unit: normalizeDoseUnit(match[2])
  };
}

function normalizeDoseAmount(rawValue, rawUnit) {
  const amount = Number(String(rawValue || "").replace(",", ".")) || 0;
  const unit = normalizeDoseUnit(rawUnit);
  if (unit === "g") return amount * 1000;
  if (unit === "mcg") return amount / 1000;
  return amount;
}

function normalizeDoseUnit(unit) {
  const normalized = normalizeText(unit).replace("µ", "u");
  if (normalized === "g") return "mg";
  if (normalized === "mcg" || normalized === "ug") return "mg";
  if (normalized === "ui") return "iu";
  return normalized;
}

function formatDoseValue(value) {
  return new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 2 }).format(Number(value || 0));
}

function findMatchingDrugByIngredient(activeIngredient, brandName = "") {
  const normalizedIngredient = normalizeText(activeIngredient);
  const normalizedBrand = normalizeText(brandName);
  return state.drugs.find((drug) => {
    const sameIngredient = normalizeText(drug.activeIngredient) === normalizedIngredient;
    if (!sameIngredient) return false;
    return !normalizedBrand || normalizeText(composeBrandName(drug.brandName, drug.activeIngredient)).includes(normalizedBrand);
  }) || state.drugs.find((drug) => normalizeText(drug.activeIngredient).includes(normalizedIngredient));
}

function composeBrandName(brandName, activeIngredient) {
  const cleanBrand = String(brandName || "").trim();
  const cleanIngredient = String(activeIngredient || "").trim();
  const strength = extractStrength(cleanBrand) || extractStrength(cleanIngredient);
  if (!cleanBrand) return strength && cleanIngredient ? `${cleanIngredient}` : cleanIngredient;
  if (extractStrength(cleanBrand) || !strength) return cleanBrand;
  return `${cleanBrand} ${strength}`.trim();
}

function extractStrength(text) {
  const match = String(text || "").match(/\b\d+(?:[.,]\d+)?\s*(?:mg|g|mcg|µg|ml|iu|ui|%)\b/i);
  return match ? match[0].replace(/\s+/g, " ").trim() : "";
}

function applyMoneyField(input, key, computedValue) {
  input.dataset.computed = String(computedValue);
  const manualValue = state.moneyOverrides[key];
  input.value = formatMoney(manualValue ?? computedValue);
}

function handleMoneyOverrideInput(event) {
  const key = event.target.id === "drugMoney" ? "drug" : event.target.id === "serviceMoney" ? "service" : "total";
  const raw = event.target.value.trim();
  state.moneyOverrides[key] = raw ? toNumber(raw) : null;
  if (key === "service") syncServiceFeeFromMoney();
  if (key !== "total" && state.moneyOverrides.total == null) {
    const drugValue = state.moneyOverrides.drug ?? toNumber(refs.drugMoney.dataset.computed);
    const serviceValue = state.moneyOverrides.service ?? toNumber(refs.serviceFee.value);
    refs.totalMoney.value = formatMoney(drugValue + serviceValue);
  }
}

function resetMoneyOverrides() {
  state.moneyOverrides = { drug: null, service: null, total: null };
}

function formatMoneyField(input, useFormatted) {
  if (!input) return;
  if (useFormatted) {
    const value = toNumber(input.value);
    input.value = formatMoney(value);
    return;
  }
  input.value = String(toNumber(input.value) || "");
}

async function saveEncounter() {
  try {
    const patientPayload = {
      fullName: refs.patientName.value.trim(),
      phone: refs.phone.value.trim(),
      birthYear: refs.birthYear.value.trim(),
      gender: refs.gender.value,
      address: refs.addressWard.value.trim(),
      province: refs.province.value.trim(),
      notes: ""
    };
    if (!patientPayload.fullName) throw new Error("Nhap ho ten benh nhan.");
    if (!patientPayload.phone) throw new Error("Nhap so dien thoai.");

    let patientId = state.selectedPatientId;
    if (patientId) {
      await fetchJson(`/api/patients/${patientId}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(patientPayload) });
    } else {
      const created = await fetchJson("/api/patients", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(patientPayload) });
      patientId = created._id;
      state.selectedPatientId = patientId;
    }

    const drugs = state.draftRows.filter((row) => row.drugId && toNumber(row.quantity) > 0).map((row) => ({
      drugId: row.drugId,
      quantity: toNumber(row.quantity),
      morning: String(row.morning || "").trim(),
      noon: "",
      night: String(row.night || "").trim(),
      instruction: String(row.usage || "").trim()
    }));

    const visitPayload = {
      visitType: state.selectedPatientDetail?.visits?.length ? "revisit" : "initial",
      visitDate: refs.visitDate.value ? `${refs.visitDate.value}T09:00:00` : new Date().toISOString(),
      doctor: refs.visitDoctor.value.trim() || state.clinicInfo.doctor,
      followUpDate: refs.followDate.value || "",
      symptom: refs.symptom.value.trim(),
      diagnosis: refs.icdInput.value.trim(),
      note: refs.adviceNote.value.trim(),
      serviceFee: toNumber(refs.serviceFee.value),
      drugs
    };

    await fetchJson(`/api/patients/${patientId}/visits`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(visitPayload) });
    showToast("Đã lưu lượt khám và toa thuốc.", "success");
    await Promise.all([loadDashboard(), loadQuickStats(), loadDrugs(), loadPatients()]);
    await selectPatient(patientId, true);
  } catch (error) {
    handleError(error);
  }
}

async function deletePatient(patientId) {
  if (!window.confirm("Xóa bệnh nhân này và toàn bộ lịch sử khám?")) return;
  await fetchJson(`/api/patients/${patientId}`, { method: "DELETE" });
  if (state.selectedPatientId === patientId) createNewPatient();
  showToast("Đã xóa hồ sơ bệnh nhân.", "success");
  await Promise.all([loadDashboard(), loadQuickStats(), loadPatients()]);
}

function showPrescriptionPreview() {
  refs.rxBody.innerHTML = buildPrescriptionHtml();
  refs.rxModal.classList.remove("hidden");
}

function autoGrowField(element) {
  if (!element) return;
  element.style.height = "auto";
  element.style.height = `${Math.max(element.scrollHeight, 50)}px`;
}

function buildPrescriptionShareRows() {
  return state.draftRows
    .filter((row) => row.brandName || row.activeIngredient)
    .map((row, index) => `
      <tr>
        <td>${index + 1}</td>
        <td>${escapeHtml([row.activeIngredient, composeBrandName(row.brandName, row.activeIngredient)].filter(Boolean).join(" / "))}</td>
        <td>${escapeHtml(row.unit || "Viên")}</td>
        <td>${escapeHtml(String(row.quantity || ""))}</td>
        <td>Sáng ${escapeHtml(row.morning || "-")} - Tối ${escapeHtml(row.night || "-")}</td>
      </tr>
    `)
    .join("");
}

function buildPrescriptionShareSvg() {
  const today = new Date();
  const rows = buildPrescriptionShareRows();
  const advice = escapeHtml(refs.adviceNote.value || "Không có").replace(/\n/g, "<br/>");
  const followDate = escapeHtml(refs.followDate.value ? formatDate(refs.followDate.value) : "Chưa hẹn");
  const currentDoctor = escapeHtml(refs.visitDoctor.value.trim() || state.clinicInfo.doctor);
  const clinicAddress = escapeHtml(state.clinicInfo.address || "Chưa cập nhật địa chỉ");
  const clinicPhone = escapeHtml(state.clinicInfo.phone || "Chưa cập nhật số điện thoại");
  const svgMarkup = `
    <svg xmlns="http://www.w3.org/2000/svg" width="1240" height="1754" viewBox="0 0 1240 1754">
      <foreignObject x="0" y="0" width="1240" height="1754">
        <div xmlns="http://www.w3.org/1999/xhtml" style="width:1240px;height:1754px;background:#fff;color:#111;font-family:'Segoe UI','Noto Sans',Arial,Helvetica,sans-serif;padding:64px;box-sizing:border-box;">
          <div style="width:100%;height:100%;border:2px solid #0f172a;padding:42px;box-sizing:border-box;">
            <h1 style="margin:0 0 20px;text-align:center;font-size:42px;line-height:1.2;">${escapeHtml(state.clinicInfo.name)}</h1>
            <div style="font-size:24px;line-height:1.6;margin-bottom:24px;">
              <div><strong>Bác sĩ:</strong> ${currentDoctor}</div>
              <div><strong>Địa chỉ phòng khám:</strong> ${clinicAddress}</div>
              <div><strong>Điện thoại:</strong> ${clinicPhone}</div>
              <div><strong>Bệnh nhân:</strong> ${escapeHtml(refs.patientName.value)} - ${escapeHtml(refs.gender.value)} - ${escapeHtml(refs.age.value)} tuổi</div>
              <div><strong>Địa chỉ:</strong> ${escapeHtml(refs.addressWard.value)}, ${escapeHtml(refs.province.value)}</div>
              <div><strong>Số điện thoại:</strong> ${escapeHtml(refs.phone.value)}</div>
              <div><strong>Ngày khám:</strong> ${escapeHtml(formatDate(refs.visitDate.value))}</div>
              <div><strong>Chẩn đoán:</strong> ${escapeHtml(refs.icdInput.value)}</div>
            </div>
            <table style="width:100%;border-collapse:collapse;table-layout:fixed;font-size:22px;">
              <thead>
                <tr>
                  <th style="border:1px solid #111;padding:10px;background:#f5f5f5;width:8%;">#</th>
                  <th style="border:1px solid #111;padding:10px;background:#f5f5f5;width:42%;">Tên thuốc</th>
                  <th style="border:1px solid #111;padding:10px;background:#f5f5f5;width:12%;">Đơn vị</th>
                  <th style="border:1px solid #111;padding:10px;background:#f5f5f5;width:10%;">SL</th>
                  <th style="border:1px solid #111;padding:10px;background:#f5f5f5;width:28%;">Cách dùng</th>
                </tr>
              </thead>
              <tbody>${rows || "<tr><td colspan='5' style='border:1px solid #111;padding:10px;'>Chưa có thuốc.</td></tr>"}</tbody>
            </table>
            <div style="margin-top:28px;display:flex;justify-content:space-between;gap:28px;align-items:flex-start;">
              <div style="white-space:pre-line;max-width:64%;font-size:24px;line-height:1.6;">
                <strong>Tái khám:</strong> ${followDate}<br/>
                <strong>Lời dặn:</strong><br/>${advice}
              </div>
              <div style="min-width:280px;text-align:center;font-size:24px;line-height:1.6;">
                <div>Ngày ${today.getDate()} tháng ${today.getMonth() + 1} năm ${today.getFullYear()}</div>
                <div style="margin-top:12px;font-weight:700;">Bác sĩ điều trị</div>
                <div style="margin-top:80px;font-weight:700;">${currentDoctor}</div>
              </div>
            </div>
          </div>
        </div>
      </foreignObject>
    </svg>
  `;
  return svgMarkup.trim();
}

function svgToJpgBlob(svgMarkup) {
  return new Promise((resolve, reject) => {
    const svgBlob = new Blob([svgMarkup], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);
    const image = new Image();
    image.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = 1240;
        canvas.height = 1754;
        const context = canvas.getContext("2d");
        context.fillStyle = "#ffffff";
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.drawImage(image, 0, 0);
        URL.revokeObjectURL(url);
        canvas.toBlob((blob) => {
          if (!blob) {
            reject(new Error("Không tạo được ảnh toa thuốc."));
            return;
          }
          resolve(blob);
        }, "image/jpeg", 0.96);
      } catch (error) {
        URL.revokeObjectURL(url);
        reject(error);
      }
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Không dựng được ảnh toa thuốc."));
    };
    image.src = url;
  });
}

async function sharePrescriptionToZalo() {
  try {
    const jpgBlob = await svgToJpgBlob(buildPrescriptionShareSvg());
    const fileName = `toa-thuoc-${slugify(refs.patientName.value || "benh-nhan")}.jpg`;
    const shareFile = new File([jpgBlob], fileName, { type: "image/jpeg" });
    if (navigator.canShare && navigator.canShare({ files: [shareFile] }) && navigator.share) {
      await navigator.share({
        files: [shareFile],
        title: "Toa thuốc",
        text: `Ảnh toa thuốc của ${refs.patientName.value || "bệnh nhân"}`
      });
      showToast("Đã mở bảng chia sẻ. Hãy chọn Zalo.", "success");
      return;
    }
    const url = URL.createObjectURL(jpgBlob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = fileName;
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
    showToast("Máy này chưa hỗ trợ chia sẻ ảnh trực tiếp. Tôi đã tải ảnh toa về máy để bạn gửi qua Zalo.", "error");
  } catch (error) {
    handleError(error);
  }
}

function buildPrescriptionHtml() {
  const today = new Date();
  const currentDoctor = refs.visitDoctor.value.trim() || state.clinicInfo.doctor;
  const clinicAddress = escapeHtml(state.clinicInfo.address || "Chưa cập nhật địa chỉ");
  const clinicPhone = escapeHtml(state.clinicInfo.phone || "Chưa cập nhật số điện thoại");
  const rows = state.draftRows.filter((row) => row.brandName || row.activeIngredient).map((row, index) => `
    <tr>
      <td>${index + 1}</td>
      <td>${escapeHtml([row.activeIngredient, composeBrandName(row.brandName, row.activeIngredient)].filter(Boolean).join(" / "))}</td>
      <td>${escapeHtml(row.unit || "Viên")}</td>
      <td>${escapeHtml(String(row.quantity || ""))}</td>
      <td>Sáng ${escapeHtml(row.morning || "-")} - Tối ${escapeHtml(row.night || "-")}</td>
    </tr>
  `).join("");
  return `<!DOCTYPE html><html lang="vi"><head><meta charset="utf-8"><title>Toa thuốc</title><style>@page{size:A5 portrait;margin:8mm}html,body{width:148mm;min-height:210mm;margin:0;padding:0;background:#fff}body{font-family:"Segoe UI","Noto Sans",Arial,Helvetica,sans-serif;color:#111;font-size:13px;line-height:1.45}.sheet{width:132mm;min-height:194mm;margin:0 auto;padding:0}h1{font-size:22px;margin:0 0 8px;text-align:center}.meta{margin-bottom:12px;line-height:1.55}.meta div{margin-bottom:3px}table{width:100%;border-collapse:collapse;table-layout:fixed}th,td{border:1px solid #111;padding:6px;vertical-align:top;text-align:left;word-wrap:break-word}th{background:#f5f5f5}.footer{margin-top:14px;display:flex;justify-content:space-between;gap:16px;align-items:flex-start}.footer-note{white-space:pre-line;max-width:62%}.sign{min-width:200px;text-align:center}.sign-name{margin-top:42px;font-weight:700}@media screen and (max-width:720px){html,body{width:auto;min-height:auto}body{font-size:12px}.sheet{width:100%;min-height:auto}.meta{line-height:1.45}table{font-size:11px}th,td{padding:4px}.footer{flex-direction:column;gap:12px}.footer-note{max-width:none}.sign{min-width:0;width:100%}.sign-name{margin-top:20px}}@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}</style></head><body><div class="sheet"><h1>${escapeHtml(state.clinicInfo.name)}</h1><div class="meta"><div><strong>Bác sĩ:</strong> ${escapeHtml(currentDoctor)}</div><div><strong>Địa chỉ phòng khám:</strong> ${clinicAddress}</div><div><strong>Điện thoại:</strong> ${clinicPhone}</div><div><strong>Bệnh nhân:</strong> ${escapeHtml(refs.patientName.value)} - ${escapeHtml(refs.gender.value)} - ${escapeHtml(refs.age.value)} tuổi</div><div><strong>Địa chỉ:</strong> ${escapeHtml(refs.addressWard.value)}, ${escapeHtml(refs.province.value)}</div><div><strong>Số điện thoại:</strong> ${escapeHtml(refs.phone.value)}</div><div><strong>Ngày khám:</strong> ${escapeHtml(formatDate(refs.visitDate.value))}</div><div><strong>Chẩn đoán:</strong> ${escapeHtml(refs.icdInput.value)}</div></div><table><thead><tr><th style="width:8%">#</th><th style="width:42%">Tên thuốc</th><th style="width:12%">Đơn vị</th><th style="width:10%">SL</th><th style="width:28%">Cách dùng</th></tr></thead><tbody>${rows || "<tr><td colspan='5'>Chưa có thuốc.</td></tr>"}</tbody></table><div class="footer"><div class="footer-note"><strong>Tái khám:</strong> ${escapeHtml(refs.followDate.value ? formatDate(refs.followDate.value) : "Chưa hẹn")}<br><strong>Lời dặn:</strong><br>${escapeHtml(refs.adviceNote.value || "Không có")}</div><div class="sign"><div>Ngày ${today.getDate()} tháng ${today.getMonth() + 1} năm ${today.getFullYear()}</div><div style="margin-top:8px;font-weight:700">Bác sĩ điều trị</div><div class="sign-name">${escapeHtml(currentDoctor)}</div></div></div></div></body></html>`;
}

async function printPrescription() {
  if (state.selectedVisitId) {
    try { await fetchJson(`/api/visits/${state.selectedVisitId}/print`, { method: "POST" }); } catch {}
  }
  const printWindow = window.open("", "_blank", "width=900,height=700");
  if (!printWindow) throw new Error("Trinh duyet dang chan cua so in.");
  printWindow.document.open();
  printWindow.document.write(buildPrescriptionHtml());
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => printWindow.print(), 300);
}

function exportData() {
  const blob = new Blob([JSON.stringify({ exportedAt: new Date().toISOString(), patients: state.patients }, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `pk-dr-minh-${toDateInput(new Date())}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}

async function saveClinicInfo() {
  try {
    const updatedClinicInfo = {
      name: refs.clinicNameInput.value.trim() || DEFAULT_CLINIC_INFO.name,
      doctor: refs.clinicDoctorInput.value.trim() || DEFAULT_CLINIC_INFO.doctor,
      address: refs.clinicAddressInput.value.trim() || DEFAULT_CLINIC_INFO.address,
      hours: refs.clinicHoursInput.value.trim() || DEFAULT_CLINIC_INFO.hours,
      phone: refs.clinicPhoneInput.value.trim() || DEFAULT_CLINIC_INFO.phone
    };
    upsertActiveClinicProfile(updatedClinicInfo);
    await persistSettings();
    renderClinicInfo();
    refs.clinicForm.classList.add("hidden");
    showToast("Đã lưu thông tin phòng khám vào hệ thống.", "success");
  } catch (error) {
    handleError(error);
  }
}

function renderClinicInfo() {
  state.clinicInfo = getActiveClinicProfile();
  refs.pageClinicTitle.textContent = state.clinicInfo.name;
  document.title = `${state.clinicInfo.name} | Hồ sơ khám và kê toa`;
  refs.clinicDisplayName.textContent = state.clinicInfo.name;
  refs.clinicDisplayDoctor.textContent = state.clinicInfo.doctor;
  refs.clinicDisplayAddress.textContent = state.clinicInfo.address;
  refs.clinicDisplayHours.textContent = state.clinicInfo.hours;
  refs.clinicDisplayPhone.textContent = state.clinicInfo.phone;
  refs.clinicNameInput.value = state.clinicInfo.name;
  refs.clinicDoctorInput.value = state.clinicInfo.doctor;
  refs.clinicAddressInput.value = state.clinicInfo.address;
  refs.clinicHoursInput.value = state.clinicInfo.hours;
  refs.clinicPhoneInput.value = state.clinicInfo.phone;
  renderClinicProfileControls();
  renderDoctorControls();
}

function getLegacyClinicInfo() {
  try {
    return { ...DEFAULT_CLINIC_INFO, ...(JSON.parse(localStorage.getItem(CLINIC_STORAGE_KEY) || "{}")) };
  } catch {
    return { ...DEFAULT_CLINIC_INFO };
  }
}

function getLegacyIcdList() {
  try {
    const saved = JSON.parse(localStorage.getItem(ICD_STORAGE_KEY) || "null");
    if (Array.isArray(saved) && saved.length) {
      return normalizeIcdList(saved);
    }
  } catch {}

  return getDefaultIcdList();
}

function getDefaultIcdList() {
  if (Array.isArray(window.ICD_IMPORT) && window.ICD_IMPORT.length) {
    return normalizeIcdList(window.ICD_IMPORT);
  }

  return DEFAULT_ICD_LIST.slice();
}

async function persistSettings() {
  state.clinicProfiles = normalizeClinicProfiles(state.clinicProfiles);
  state.activeClinicProfileId = resolveActiveClinicProfileId(state.activeClinicProfileId, state.clinicProfiles);
  state.clinicInfo = getActiveClinicProfile();
  state.icdList = normalizeIcdList(state.icdList);
  await fetchJson("/api/settings", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      clinicInfo: state.clinicInfo,
      clinicProfiles: state.clinicProfiles,
      activeClinicProfileId: state.activeClinicProfileId,
      icdList: state.icdList
    })
  });
}

function normalizeClinicInfo(input = {}) {
  return {
    name: String(input.name || DEFAULT_CLINIC_INFO.name).trim() || DEFAULT_CLINIC_INFO.name,
    doctor: String(input.doctor || DEFAULT_CLINIC_INFO.doctor).trim() || DEFAULT_CLINIC_INFO.doctor,
    address: String(input.address || DEFAULT_CLINIC_INFO.address).trim() || DEFAULT_CLINIC_INFO.address,
    hours: String(input.hours || DEFAULT_CLINIC_INFO.hours).trim() || DEFAULT_CLINIC_INFO.hours,
    phone: String(input.phone || DEFAULT_CLINIC_INFO.phone).trim() || DEFAULT_CLINIC_INFO.phone
  };
}

function normalizeClinicProfiles(profiles = []) {
  const list = Array.isArray(profiles) ? profiles : [];
  const normalized = list
    .map((profile, index) => {
      const clinicInfo = normalizeClinicInfo(profile);
      const id = String(profile?.id || profile?._id || `clinic-${index + 1}`).trim() || `clinic-${index + 1}`;
      const label = String(profile?.label || profile?.name || "").trim() || buildClinicProfileLabel(clinicInfo, index + 1);
      return { id, label, ...clinicInfo };
    })
    .filter((profile, index, self) => self.findIndex((item) => item.id === profile.id) === index);
  return normalized.length ? normalized : createInitialClinicProfiles(DEFAULT_CLINIC_INFO);
}

function createInitialClinicProfiles(clinicInfo = DEFAULT_CLINIC_INFO) {
  const normalized = normalizeClinicInfo(clinicInfo);
  return [{
    id: createClinicProfileId(),
    label: buildClinicProfileLabel(normalized, 1),
    ...normalized
  }];
}

function createClinicProfileId() {
  return `clinic-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function buildClinicProfileLabel(clinicInfo, order = 1) {
  return String(clinicInfo?.doctor || clinicInfo?.name || `Thông tin ${order}`).trim() || `Thông tin ${order}`;
}

function resolveActiveClinicProfileId(activeId, profiles = state.clinicProfiles) {
  if (profiles.some((profile) => profile.id === activeId)) {
    return activeId;
  }
  return profiles[0]?.id || "";
}

function getActiveClinicProfile() {
  const active = state.clinicProfiles.find((profile) => profile.id === state.activeClinicProfileId);
  return normalizeClinicInfo(active || state.clinicInfo || DEFAULT_CLINIC_INFO);
}

function renderClinicProfileControls() {
  if (!refs.clinicProfileSelect) return;
  const currentId = resolveActiveClinicProfileId(state.activeClinicProfileId, state.clinicProfiles);
  refs.clinicProfileSelect.innerHTML = state.clinicProfiles.map((profile, index) => `
    <option value="${escapeAttribute(profile.id)}">${escapeHtml(profile.label || buildClinicProfileLabel(profile, index + 1))}</option>
  `).join("");
  refs.clinicProfileSelect.value = currentId;
  refs.deleteClinicBtn.disabled = state.clinicProfiles.length <= 1;
}

function upsertActiveClinicProfile(clinicInfo) {
  const normalized = normalizeClinicInfo(clinicInfo);
  const activeId = resolveActiveClinicProfileId(state.activeClinicProfileId, state.clinicProfiles);
  const label = buildClinicProfileLabel(normalized, state.clinicProfiles.findIndex((profile) => profile.id === activeId) + 1 || 1);
  const updatedProfile = { id: activeId || createClinicProfileId(), label, ...normalized };
  const existingIndex = state.clinicProfiles.findIndex((profile) => profile.id === updatedProfile.id);
  if (existingIndex >= 0) {
    state.clinicProfiles[existingIndex] = updatedProfile;
  } else {
    state.clinicProfiles.push(updatedProfile);
  }
  state.activeClinicProfileId = updatedProfile.id;
  state.clinicInfo = normalized;
}

async function handleClinicProfileChange(event) {
  state.activeClinicProfileId = event.target.value;
  state.clinicInfo = getActiveClinicProfile();
  renderClinicInfo();
}

function addClinicProfile() {
  const newProfile = {
    id: createClinicProfileId(),
    label: `Thông tin ${state.clinicProfiles.length + 1}`,
    ...DEFAULT_CLINIC_INFO
  };
  state.clinicProfiles.push(newProfile);
  state.activeClinicProfileId = newProfile.id;
  state.clinicInfo = normalizeClinicInfo(newProfile);
  refs.clinicForm.classList.remove("hidden");
  renderClinicInfo();
  refs.clinicNameInput.focus();
  refs.clinicNameInput.select();
}

async function deleteClinicProfile() {
  if (state.clinicProfiles.length <= 1) {
    showToast("Cần giữ lại ít nhất một bộ thông tin phòng khám.", "error");
    return;
  }
  const activeProfile = state.clinicProfiles.find((profile) => profile.id === state.activeClinicProfileId);
  const profileName = activeProfile?.label || activeProfile?.doctor || activeProfile?.name || "bộ thông tin này";
  if (!window.confirm(`Xóa ${profileName}?`)) return;
  state.clinicProfiles = state.clinicProfiles.filter((profile) => profile.id !== state.activeClinicProfileId);
  state.activeClinicProfileId = resolveActiveClinicProfileId("", state.clinicProfiles);
  state.clinicInfo = getActiveClinicProfile();
  await persistSettings();
  renderClinicInfo();
  showToast("Đã xóa bộ thông tin phòng khám.", "success");
}

function hasMeaningfulClinicInfo(input = {}) {
  const normalized = normalizeClinicInfo(input);
  return Object.keys(DEFAULT_CLINIC_INFO).some((key) => normalized[key] !== DEFAULT_CLINIC_INFO[key]);
}

function normalizeIcdList(list = []) {
  const unique = new Map();
  (Array.isArray(list) ? list : []).forEach((item) => {
    const code = String(item?.code || "").trim();
    const name = String(item?.name || "").trim();
    if (code && name) {
      unique.set(code, { code, name });
    }
  });
  return unique.size ? [...unique.values()] : DEFAULT_ICD_LIST.slice();
}

function setConnectionState(text, connected) {
  refs.connectionState.textContent = text;
  refs.connectionState.style.color = connected ? "#18794e" : "#b42318";
}

function buildPatientHaystack(patient) {
  return [patient.fullName, patient.phone, patient.address, patient.province, patient.birthYear, patient.gender, patient.lastDiagnosis, patient.lastDoctor].join(" ");
}

function scorePatientMatch(patient, keyword) {
  const fields = [
    normalizeText(patient.fullName),
    normalizeText(patient.phone),
    normalizeText(patient.address),
    normalizeText(patient.province),
    normalizeText(String(patient.birthYear || "")),
    normalizeText(patient.lastDiagnosis),
    normalizeText(patient.lastDoctor)
  ];
  let score = 0;
  fields.forEach((field) => {
    if (!field) return;
    if (field.startsWith(keyword)) score += 5;
    if (field.includes(keyword)) score += 2;
  });
  return score;
}

function getFollowStatus(dateValue) {
  if (!dateValue) return { label: "Chưa hẹn", cls: "neutral" };
  const today = startOfDay(new Date());
  const target = startOfDay(new Date(dateValue));
  if (Number.isNaN(target.getTime())) return { label: "Không hợp lệ", cls: "neutral" };
  const diff = Math.round((target - today) / 86400000);
  if (diff > 0) return { label: `Còn ${diff} ngày`, cls: "up" };
  if (diff === 0) return { label: "Tái khám hôm nay", cls: "down" };
  return { label: `Quá ${Math.abs(diff)} ngày`, cls: "down" };
}

function setTrend(element, current, previous, label) {
  const percent = previous === 0 ? (current > 0 ? 100 : 0) : Math.round(((current - previous) / previous) * 100);
  const up = percent >= 0;
  element.className = `trend ${up ? "up" : "down"}`;
  element.textContent = `${up ? "+" : "-"} ${Math.abs(percent)}% so với ${label}`;
}

async function fetchJson(url, options = {}) {
  const response = await fetch(resolveApiUrl(url), options);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || `Yeu cau that bai: ${response.status}`);
  return data;
}

function resolveApiUrl(url) {
  const input = String(url || "");
  if (!input) return input;
  if (/^https?:\/\//i.test(input)) return input;
  const base = String(window.APP_CONFIG?.API_BASE || "").trim().replace(/\/+$/, "");
  if (!base) return input;
  return `${base}${input.startsWith("/") ? input : `/${input}`}`;
}

function formatMoney(value) { return new Intl.NumberFormat("vi-VN").format(toNumber(value)); }
function formatNumber(value) { return new Intl.NumberFormat("vi-VN").format(Number(value || 0)); }
function formatDate(value) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleDateString("vi-VN");
}
function toDateInput(value) {
  const date = new Date(value);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
function toNumber(value) {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  return Number(String(value || "").replace(/\./g, "").replace(/,/g, ".").replace(/[^0-9.]/g, "")) || 0;
}
function startOfDay(date) {
  const clone = new Date(date);
  clone.setHours(0, 0, 0, 0);
  return clone;
}
function normalizeText(value = "") {
  return String(value || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\u0111/g, "d").replace(/\u0110/g, "d");
}

function createKey() {
  return `row_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}
function isMobileLayout() {
  return window.innerWidth <= 720;
}
function findDrugId(drug) {
  const found = state.drugs.find((item) => normalizeText(item.activeIngredient) === normalizeText(drug.activeIngredient || "") && normalizeText(item.brandName) === normalizeText(drug.brandName || ""));
  return found?._id || "";
}
function escapeHtml(value) {
  return String(value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

function slugify(value) {
  return String(value ?? "benh-nhan")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase() || "benh-nhan";
}

function escapeAttribute(value) {
  return escapeHtml(value).replace(/\n/g, " &#10; ");
}
function showToast(message, type = "success") {
  clearTimeout(state.toastTimer);
  refs.toast.textContent = message;
  refs.toast.className = `toast ${type}`;
  state.toastTimer = setTimeout(() => { refs.toast.className = "toast hidden"; }, 2600);
}
function handleError(error) {
  console.error(error);
  showToast(error.message || "Da xay ra loi.", "error");
}
