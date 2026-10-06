const CLINIC_STORAGE_KEY = "pk_clinic_info_v3";
const ICD_STORAGE_KEY = "pk_icd_list_v1";
const CLINIC_NAME_CACHE_KEY = "pk_clinic_name";
const NOTICE_KEY = "pk_notice";
// ponytail: phân trang client, chuyển sang server-side khi > ~5000 hồ sơ
const PAGE_SIZE = 20;
const TABS = ["home", "stats", "clinic"];
const WHEEL_ITEM_HEIGHT = 44;
const WHEEL_MIN_YEAR = 1920;
const WHEEL_DEFAULT_YEAR = 1980;
const DOSE_FIELDS = ["morning", "noon", "night"];
const DOSE_LABELS = { morning: "Sáng", noon: "Trưa", night: "Tối" };
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
  page: 1,
  drugs: [],
  doctors: [],
  search: "",
  selectedPatientId: "",
  selectedPatientDetail: null,
  selectedVisitId: "",
  editingVisitId: "",
  saving: false,
  draftRows: [],
  selectedDrugId: "",
  autoSuggestedRowKeys: [],
  pendingStockRows: [],
  editingDrugId: "",
  icdList: getDefaultIcdList(),
  selectedIcdCode: "",
  clinicInfo: { ...DEFAULT_CLINIC_INFO },
  clinicProfiles: [],
  activeClinicProfileId: "",
  toastTimer: null,
  moneyOverrides: { drug: null, service: null },
  user: null,
  importData: null,
  importBackup: null,
  wheel: null
};

const refs = {};

const phoneLayoutQuery = window.matchMedia("(max-width: 767px)");
// điện thoại / màn cảm ứng: năm sinh chỉ chọn bằng bánh xe, không bật bàn phím
const wheelOnlyQuery = window.matchMedia("(pointer: coarse), (max-width: 767px)");

window.addEventListener("DOMContentLoaded", () => {
  cacheRefs();
  bindEvents();
  renderClinicInfo();
  seedForm();
  syncBirthYearMode();
  updateSaveButtons();
  bootAuth();
});

function cacheRefs() {
  [
    "splash", "authScreen", "appRoot", "authClinicName", "loginForm", "loginEmail", "loginPassword", "loginPasswordToggle",
    "loginMsg", "loginSubmit", "showForgotBtn", "forgotForm", "forgotEmail", "forgotMsg", "forgotSubmit", "resetForm",
    "resetPassword", "resetPassword2", "resetMsg", "resetSubmit", "accountEmail", "saveFab", "importFile",
    "connectionState", "patientCountText", "searchInput", "searchBtn", "clearSearchBtn",
    "patientListBody", "patientPager", "searchSuggestBox", "saveBtn", "newBtn", "editBanner", "editBannerText", "cancelEditBtn",
    "newPrescriptionBtn", "visitDate", "patientName", "birthYear", "birthYearBtn", "birthYearWrap", "yearSuggestBox", "age", "gender", "addressWard",
    "province", "provinceSuggestBox", "phone", "visitDoctor", "symptom", "symptomSuggestBox", "icdInput", "icdSuggestBox", "addCodeBtn", "toggleCodeDataBtn",
    "codeDataBox", "previewPrintBtn", "addDrugBtn", "toggleStockBtn", "drugRows", "stockDataBox", "warningBox",
    "followDate", "serviceFee", "adviceNote", "drugMoney", "serviceMoney", "totalMoney", "reloadHistoryBtn",
    "historyRows", "summaryPatients", "summaryDrugs",
    "summaryVisitToday", "summaryRevenueMonth", "toast", "rxModal", "rxFrame", "rxPrintBtn", "rxShareBtn",
    "rxCloseBtn", "clinicDisplayName", "clinicDisplayDoctor", "clinicDisplayAddress", "clinicDisplayHours",
    "clinicDisplayPhone", "clinicForm", "clinicProfileSelect", "addClinicBtn", "deleteClinicBtn",
    "toggleClinicBtn", "saveClinicBtn", "clinicNameInput", "clinicDoctorInput",
    "clinicAddressInput", "clinicHoursInput", "clinicPhoneInput", "statWeekCount", "statWeekTrend", "statMonthCount",
    "statMonthTrend", "statProfit", "statProfitTrend", "statRevisitRate", "statRevisitTrend", "statOnTimeCount",
    "statOnTimeTrend", "statLateMissedCount", "statLateMissedTrend", "activeIngredientList", "doseList",
    "doctorList", "serviceFeeList", "serviceFeeSuggestBox", "drugSectionTitle",
    "summaryPatientsMini", "summaryDrugsMini", "summaryVisitTodayMini", "summaryRevenueMonthMini",
    "statWeekMini", "statMonthMini", "statProfitMini", "statRevisitMini", "statOnTimeMini", "statLateMissedMini",
    "drugModal", "drugForm", "dmActive", "dmBrand", "dmUnit", "dmQuantity", "dmPrice", "dmUsage", "dmNotes", "dmDeleteBtn",
    "dmSaveBtn", "drugModalTitle", "drugModalMsg",
    "importModal", "importMeta", "importTable", "importConfirm", "importConfirmBtn", "importMsg",
    "yearWheelLayer", "yearWheelPanel", "yearWheel"
  ].forEach((id) => {
    refs[id] = document.getElementById(id);
  });
}

function bindEvents() {
  document.addEventListener("click", handleAppAction);
  window.addEventListener("hashchange", () => {
    if (!refs.appRoot.classList.contains("hidden")) applyTabFromHash();
  });
  phoneLayoutQuery.addEventListener("change", () => {
    updateSaveButtons();
    renderPatientList();
    renderDrugRows();
  });
  wheelOnlyQuery.addEventListener("change", () => {
    syncBirthYearMode();
    closeYearWheel();
  });

  refs.loginForm.addEventListener("submit", handleLoginSubmit);
  refs.forgotForm.addEventListener("submit", handleForgotSubmit);
  refs.resetForm.addEventListener("submit", handleResetSubmit);
  refs.showForgotBtn.addEventListener("click", () => {
    refs.forgotEmail.value = refs.loginEmail.value;
    showAuthView("forgot");
  });
  refs.loginPasswordToggle.addEventListener("click", toggleLoginPassword);

  refs.searchBtn.addEventListener("click", () => applySearch(refs.searchInput.value));
  refs.clearSearchBtn.addEventListener("click", clearSearch);
  refs.searchInput.addEventListener("input", handleSearchInput);
  refs.searchInput.addEventListener("focus", () => renderSearchSuggestions(refs.searchInput.value));
  refs.searchInput.addEventListener("keydown", handleSearchKeydown);
  refs.patientListBody.addEventListener("click", handlePatientListClick);
  refs.patientListBody.addEventListener("keydown", handlePatientListKeydown);
  refs.patientPager.addEventListener("click", handlePagerClick);
  refs.historyRows.addEventListener("click", handleHistoryClick);
  refs.cancelEditBtn.addEventListener("click", cancelEditMode);
  refs.birthYear.addEventListener("input", handleBirthYearInput);
  refs.birthYear.addEventListener("focus", () => {
    if (!wheelOnlyQuery.matches) showYearSuggestions(refs.birthYear.value);
  });
  refs.birthYear.addEventListener("click", () => {
    if (wheelOnlyQuery.matches) openYearWheel();
  });
  refs.birthYearBtn.addEventListener("click", () => openYearWheel());
  refs.yearWheelLayer.addEventListener("click", handleYearWheelClick);
  refs.yearWheelLayer.addEventListener("keydown", handleYearWheelKeydown);
  refs.yearWheel.addEventListener("scroll", scheduleYearWheelUpdate, { passive: true });
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
  refs.adviceNote.addEventListener("input", () => autoGrowField(refs.adviceNote));
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
  refs.drugRows.addEventListener("focusout", handleDrugRowChange);
  refs.drugRows.addEventListener("click", handleDrugRowClick);
  refs.drugRows.addEventListener("pointerdown", (event) => {
    // bấm nút chọn nhanh không làm ô nhập mất focus (và đóng bảng chọn trước khi click kịp xảy ra)
    if (event.target.closest(".dose-quick, .quantity-quick")) event.preventDefault();
  });
  refs.stockDataBox.addEventListener("click", handleStockDataClick);
  refs.drugForm.addEventListener("submit", handleDrugFormSubmit);
  refs.dmDeleteBtn.addEventListener("click", deleteDrugFromModal);
  refs.serviceMoney.addEventListener("input", syncServiceFeeFromMoney);
  refs.serviceMoney.addEventListener("input", renderServiceFeeSuggest);
  refs.serviceMoney.addEventListener("focus", renderServiceFeeSuggest);
  refs.serviceMoney.addEventListener("click", renderServiceFeeSuggest);
  refs.serviceMoney.addEventListener("focus", () => formatMoneyField(refs.serviceMoney, false));
  refs.serviceMoney.addEventListener("blur", () => formatMoneyField(refs.serviceMoney, true));
  ["drugMoney", "serviceMoney"].forEach((id) => {
    refs[id].addEventListener("input", handleMoneyOverrideInput);
    refs[id].addEventListener("focus", () => formatMoneyField(refs[id], false));
    refs[id].addEventListener("blur", () => formatMoneyField(refs[id], true));
  });
  refs.previewPrintBtn.addEventListener("click", showPrescriptionPreview);
  refs.rxCloseBtn.addEventListener("click", () => refs.rxModal.close());
  refs.rxPrintBtn.addEventListener("click", () => printPrescription().catch(handleError));
  refs.rxShareBtn.addEventListener("click", sharePrescriptionToZalo);
  refs.reloadHistoryBtn.addEventListener("click", renderHistory);
  refs.newBtn.addEventListener("click", createNewPatient);
  refs.newPrescriptionBtn.addEventListener("click", createNewPrescription);
  refs.saveBtn.addEventListener("click", saveEncounter);
  refs.saveFab.addEventListener("click", saveEncounter);
  refs.importFile.addEventListener("change", handleImportFileChosen);
  refs.importConfirm.addEventListener("input", () => {
    refs.importConfirmBtn.disabled = refs.importConfirm.value !== "NAP";
  });
  refs.importConfirmBtn.addEventListener("click", confirmImport);
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

// ---- Nút dùng chung: làm mới / xuất / nạp / đăng xuất / đóng dialog / quay lại đăng nhập ----

function handleAppAction(event) {
  const actionButton = event.target.closest("[data-app-action]");
  if (actionButton) {
    const action = actionButton.dataset.appAction;
    if (action === "refresh") initializeApp();
    if (action === "export") exportData().catch(handleError);
    if (action === "import") refs.importFile.click();
    if (action === "logout") logout();
    return;
  }
  const closeButton = event.target.closest("[data-close-dialog]");
  if (closeButton) {
    closeButton.closest("dialog")?.close();
    return;
  }
  const viewButton = event.target.closest("[data-auth-view]");
  if (viewButton) showAuthView(viewButton.dataset.authView);
}

// ---- Đăng nhập: access token chỉ giữ trong bộ nhớ, refresh token nằm trong cookie HttpOnly ----

class AuthExpiredError extends Error {}

let accessToken = "";
let refreshPromise = null;

async function bootAuth() {
  try {
    const cachedName = localStorage.getItem(CLINIC_NAME_CACHE_KEY);
    if (cachedName) refs.authClinicName.textContent = cachedName;
  } catch {}

  if (new URLSearchParams(location.search).get("reset")) {
    showAuthView("reset");
    refs.splash.classList.add("hidden");
    return;
  }

  try {
    const data = await refreshAccessToken();
    enterApp(data.user);
  } catch {
    showAuthView("login");
    const notice = takeNotice();
    if (notice) showToast(notice, "error");
  }
  refs.splash.classList.add("hidden");
}

function takeNotice() {
  try {
    const notice = sessionStorage.getItem(NOTICE_KEY);
    sessionStorage.removeItem(NOTICE_KEY);
    return notice;
  } catch {
    return "";
  }
}

// chỉ một request refresh chạy cùng lúc; các request khác chờ chung promise này
function refreshAccessToken() {
  refreshPromise ||= (async () => {
    const response = await fetch(resolveApiUrl("/api/auth/refresh"), { method: "POST", credentials: "same-origin" });
    if (response.status === 401) throw new AuthExpiredError("Phiên đăng nhập đã hết hạn.");
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.accessToken) throw new Error(data.error || "Không làm mới được phiên đăng nhập.");
    accessToken = data.accessToken;
    return data;
  })().finally(() => {
    refreshPromise = null;
  });
  return refreshPromise;
}

async function authRequest(path, body) {
  const response = await fetch(resolveApiUrl(path), {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body || {})
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || `Yêu cầu thất bại: ${response.status}`);
  return data;
}

function showAuthView(view) {
  refs.appRoot.classList.add("hidden");
  refs.authScreen.classList.remove("hidden");
  refs.loginForm.classList.toggle("hidden", view !== "login");
  refs.forgotForm.classList.toggle("hidden", view !== "forgot");
  refs.resetForm.classList.toggle("hidden", view !== "reset");
  const first = { login: refs.loginEmail, forgot: refs.forgotEmail, reset: refs.resetPassword }[view];
  if (first && !phoneLayoutQuery.matches) first.focus();
}

function setAuthMessage(element, message, ok = false) {
  element.textContent = message;
  element.classList.toggle("is-ok", ok);
}

function setBusy(button, busy) {
  button.disabled = busy;
  button.classList.toggle("is-busy", busy);
}

function toggleLoginPassword() {
  const show = refs.loginPassword.type === "password";
  refs.loginPassword.type = show ? "text" : "password";
  refs.loginPasswordToggle.setAttribute("aria-pressed", String(show));
  refs.loginPasswordToggle.setAttribute("aria-label", show ? "Ẩn mật khẩu" : "Hiện mật khẩu");
  refs.loginPasswordToggle.title = show ? "Ẩn mật khẩu" : "Hiện mật khẩu";
  refs.loginPasswordToggle.querySelector("use").setAttribute("href", show ? "#i-eye-off" : "#i-eye");
}

async function handleLoginSubmit(event) {
  event.preventDefault();
  const email = refs.loginEmail.value.trim();
  const password = refs.loginPassword.value;
  if (!email || !password) {
    setAuthMessage(refs.loginMsg, "Nhập email và mật khẩu.");
    return;
  }
  setAuthMessage(refs.loginMsg, "");
  setBusy(refs.loginSubmit, true);
  try {
    const data = await authRequest("/api/auth/login", { email, password });
    accessToken = data.accessToken;
    refs.loginPassword.value = "";
    enterApp(data.user);
  } catch (error) {
    setAuthMessage(refs.loginMsg, error.message);
  } finally {
    setBusy(refs.loginSubmit, false);
  }
}

async function handleForgotSubmit(event) {
  event.preventDefault();
  const email = refs.forgotEmail.value.trim();
  if (!email) {
    setAuthMessage(refs.forgotMsg, "Nhập email.");
    return;
  }
  setBusy(refs.forgotSubmit, true);
  try {
    const data = await authRequest("/api/auth/forgot-password", { email });
    setAuthMessage(refs.forgotMsg, data.message, true);
  } catch (error) {
    setAuthMessage(refs.forgotMsg, error.message);
  } finally {
    setBusy(refs.forgotSubmit, false);
  }
}

async function handleResetSubmit(event) {
  event.preventDefault();
  const password = refs.resetPassword.value;
  if (password.length < 8) {
    setAuthMessage(refs.resetMsg, "Mật khẩu tối thiểu 8 ký tự.");
    return;
  }
  if (password !== refs.resetPassword2.value) {
    setAuthMessage(refs.resetMsg, "Hai mật khẩu không khớp.");
    return;
  }
  setBusy(refs.resetSubmit, true);
  try {
    const token = new URLSearchParams(location.search).get("reset") || "";
    await authRequest("/api/auth/reset-password", { token, password });
    history.replaceState(null, "", `${location.pathname}${location.hash}`);
    refs.resetPassword.value = "";
    refs.resetPassword2.value = "";
    showAuthView("login");
    setAuthMessage(refs.loginMsg, "Đã đặt lại mật khẩu. Vui lòng đăng nhập.", true);
  } catch (error) {
    setAuthMessage(refs.resetMsg, error.message);
  } finally {
    setBusy(refs.resetSubmit, false);
  }
}

function enterApp(user) {
  state.user = user;
  refs.accountEmail.textContent = user?.email || "";
  refs.authScreen.classList.add("hidden");
  refs.appRoot.classList.remove("hidden");
  applyTabFromHash();
  initializeApp();
}

async function logout() {
  try {
    await authRequest("/api/auth/logout");
  } catch {}
  accessToken = "";
  // tải lại để xóa sạch dữ liệu bệnh nhân khỏi bộ nhớ trang
  location.reload();
}

function endSession() {
  accessToken = "";
  try {
    sessionStorage.setItem(NOTICE_KEY, "Phiên đăng nhập đã hết hạn");
  } catch {}
  location.reload();
}

// ---- Tab: #home / #stats / #clinic ----

function applyTabFromHash() {
  const hash = location.hash.replace("#", "");
  const tab = TABS.includes(hash) ? hash : "home";
  if (hash !== tab) history.replaceState(null, "", `#${tab}`);
  showTab(tab);
}

function showTab(tab) {
  document.querySelectorAll("[data-panel]").forEach((panel) => panel.classList.toggle("hidden", panel.dataset.panel !== tab));
  document.querySelectorAll("a.tab").forEach((link) => {
    const active = link.dataset.tab === tab;
    link.classList.toggle("is-active", active);
    if (active) link.setAttribute("aria-current", "page");
    else link.removeAttribute("aria-current");
  });
  refs.saveFab.classList.toggle("hidden", tab !== "home");
  window.scrollTo(0, 0);
  if (tab === "home") {
    autoGrowField(refs.icdInput);
    autoGrowField(refs.adviceNote);
    refs.drugRows.querySelectorAll(".drug-field--usage textarea").forEach((element) => autoGrowField(element));
  }
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
  applySearch(state.search || "", { keepPage: true });
  if (state.selectedPatientId) {
    const stillExists = state.patients.some((item) => item._id === state.selectedPatientId);
    if (stillExists) {
      await selectPatient(state.selectedPatientId, true, { editVisitId: state.editingVisitId });
      return;
    }
  }
  createNewPatient();
}

async function loadDrugs() {
  state.drugs = await fetchJson("/api/drugs");
  renderDrugPickers();
  if (!state.draftRows.length) {
    state.draftRows = [createDraftRow()];
  }
  renderDrugRows();
  updateWarning();
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

function applySearch(rawValue, { keepPage = false } = {}) {
  state.search = String(rawValue || "").trim();
  const keyword = normalizeText(state.search);
  state.filteredPatients = keyword
    ? state.patients.filter((patient) => normalizeText(buildPatientHaystack(patient)).includes(keyword))
    : state.patients.slice();
  refs.patientCountText.textContent = `${formatNumber(state.filteredPatients.length)} hồ sơ`;
  if (!keepPage) state.page = 1;
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

function handlePatientListClick(event) {
  const deleteBtn = event.target.closest(".del-patient");
  if (deleteBtn) {
    deletePatient(deleteBtn.dataset.id).catch(handleError);
    return;
  }
  const row = event.target.closest(".patient-row[data-id]");
  if (row) {
    selectPatient(row.dataset.id).catch(handleError);
  }
}

function handlePatientListKeydown(event) {
  if (event.key !== "Enter" || event.target !== event.target.closest(".patient-row[data-id]")) return;
  event.preventDefault();
  selectPatient(event.target.dataset.id).catch(handleError);
}

function renderPatientList() {
  const total = state.filteredPatients.length;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  state.page = Math.min(Math.max(1, state.page), pages);
  const start = (state.page - 1) * PAGE_SIZE;
  const rows = state.filteredPatients.slice(start, start + PAGE_SIZE);
  refs.patientListBody.innerHTML = rows.map(buildPatientRow).join("")
    || '<div class="patient-row patient-row--empty">Không có bệnh nhân phù hợp.</div>';
  renderPager(total, pages, start, rows.length);
}

function renderPager(total, pages, start, count) {
  if (!total) {
    refs.patientPager.innerHTML = "";
    return;
  }
  const current = state.page;
  const siblings = phoneLayoutQuery.matches ? 0 : 1;
  const wanted = new Set([1, pages, ...Array.from({ length: siblings * 2 + 1 }, (_, i) => current - siblings + i)]);
  const shown = [...wanted].filter((page) => page >= 1 && page <= pages).sort((a, b) => a - b);
  const items = [];
  shown.forEach((page, index) => {
    const prev = shown[index - 1];
    if (prev && page - prev === 2) items.push(prev + 1);
    else if (prev && page - prev > 2) items.push("…");
    items.push(page);
  });

  const pageButton = (page) => page === "…"
    ? '<span class="pager__gap" aria-hidden="true">…</span>'
    : `<button class="pager__btn ${page === current ? "is-current" : ""}" type="button" data-page="${page}" aria-label="Trang ${page}" ${page === current ? 'aria-current="page"' : ""}>${page}</button>`;
  refs.patientPager.innerHTML = `
    <div class="pager__range">Hiển thị ${formatNumber(start + 1)}–${formatNumber(start + count)} / ${formatNumber(total)} hồ sơ</div>
    ${pages > 1 ? `
      <div class="pager__list">
        <button class="pager__btn" type="button" data-page="prev" aria-label="Trang trước" ${current === 1 ? "disabled" : ""}>${iconHtml("chevron-left")}<span class="pager__txt">Trước</span></button>
        ${items.map(pageButton).join("")}
        <button class="pager__btn" type="button" data-page="next" aria-label="Trang sau" ${current === pages ? "disabled" : ""}><span class="pager__txt">Sau</span>${iconHtml("chevron-right")}</button>
      </div>` : ""}
  `;
}

function handlePagerClick(event) {
  const button = event.target.closest("[data-page]");
  if (!button || button.disabled) return;
  const target = button.dataset.page;
  state.page = target === "prev" ? state.page - 1 : target === "next" ? state.page + 1 : Number(target);
  renderPatientList();
  refs.patientListBody.closest(".patient-top").scrollIntoView({ block: "start" });
}

function iconHtml(name) {
  return `<svg class="icon" aria-hidden="true"><use href="#i-${name}"/></svg>`;
}

function buildPatientRow(patient) {
  const age = patient.birthYear ? new Date().getFullYear() - Number(patient.birthYear) : "";
  const follow = getFollowStatus(patient.lastFollowUpDate);
  const visitTags = buildVisitTags(patient.visitCount);
  const metaSuffix = patient.gender || "Chưa rõ";
  const doctorBadge = patient.lastDoctor ? ` • BS ${escapeHtml(patient.lastDoctor)}` : "";
  const metaLine = `${escapeHtml(patient.phone)} - ${escapeHtml(patient.address || "")}, ${escapeHtml(patient.province || "")} - ${escapeHtml(metaSuffix)}${visitTags ? ` ${visitTags}` : ""}${doctorBadge}`;
  const deleteLabel = `Xóa bệnh nhân ${patient.fullName}`;
  return `
    <div class="patient-row ${patient._id === state.selectedPatientId ? "active" : ""}" data-id="${patient._id}" role="button" tabindex="0">
      <div class="pr-table">
        <div>${formatDate(patient.lastVisitAt)}</div>
        <div class="patient-meta">
          <strong>${escapeHtml(patient.fullName)}</strong>
          <div class="patient-meta__sub"><small>${metaLine}</small></div>
        </div>
        <div>${escapeHtml(String(age || ""))}</div>
        <div>${formatMoney(patient.totalRevenue)}</div>
        <div>${escapeHtml(patient.lastDiagnosis || "")}</div>
        <div><span class="follow-badge ${follow.cls}">${escapeHtml(follow.label)}</span></div>
        <div><button class="btn small danger del-patient" data-id="${patient._id}" type="button" aria-label="${escapeAttribute(deleteLabel)}" title="Xóa">${iconHtml("trash-2")}<span>Xóa</span></button></div>
      </div>
      <div class="pr-card">
        <div class="pc__l1">
          <strong class="pc__name">${escapeHtml(patient.fullName)}</strong>
          ${age !== "" ? `<span class="pc__age">${escapeHtml(String(age))} tuổi</span>` : ""}
          <button class="icon-btn danger del-patient" data-id="${patient._id}" type="button" aria-label="${escapeAttribute(deleteLabel)}" title="Xóa">${iconHtml("trash-2")}</button>
        </div>
        <div class="pc__l2">
          <span>${escapeHtml(patient.phone)}</span>
          <span>Khám: ${escapeHtml(formatDate(patient.lastVisitAt) || "chưa có")}</span>
          <span>${formatNumber(patient.visitCount)} lần khám</span>
        </div>
        <div class="pc__l3">
          <span class="pc__icd">${escapeHtml(patient.lastDiagnosis || "Chưa có chẩn đoán")}</span>
          <span class="follow-badge ${follow.cls}">${escapeHtml(follow.label)}</span>
          <span class="pc__money">${formatMoney(patient.totalRevenue)}</span>
        </div>
      </div>
    </div>
  `;
}

function buildVisitTags(count) {
  const total = Number(count || 0);
  return Array.from({ length: Math.max(1, total) }, (_, index) => `<span class="visit-tag">L${index + 1}</span>`).join("");
}

async function selectPatient(patientId, quiet = false, { editVisitId = "" } = {}) {
  state.selectedPatientId = patientId;
  state.selectedPatientDetail = await fetchJson(`/api/patients/${patientId}`);
  refreshKnownDoctors();
  renderDoctorControls();
  const visits = state.selectedPatientDetail?.visits || [];
  // mặc định nạp toa gần nhất làm mẫu (lưu sẽ tạo lượt khám mới); chỉ vào chế độ sửa khi được yêu cầu
  const editing = visits.find((item) => item._id === editVisitId) || null;
  const visit = editing || visits[0] || null;
  state.selectedVisitId = visit?._id || "";
  state.editingVisitId = editing?._id || "";
  fillFormFromRecord(state.selectedPatientDetail.patient, visit);
  renderPatientList();
  renderHistory();
  renderPrescriptionVisitTabs();
  renderEditBanner();
  updateSaveButtons();
  updateTotals();
  updateWarning();
  if (!quiet) showToast("Đã mở hồ sơ bệnh nhân.", "success");
}

function findHistoryVisit(visitId) {
  return (state.selectedPatientDetail?.visits || []).find((item) => item._id === visitId) || null;
}

function handleHistoryClick(event) {
  const button = event.target.closest("button[data-action]");
  const row = event.target.closest(".history-row[data-id]");
  if (!row) return;
  const visit = findHistoryVisit(row.dataset.id);
  if (!visit || !button) return;
  state.selectedVisitId = visit._id;
  fillFormFromRecord(state.selectedPatientDetail.patient, visit);

  if (button.dataset.action === "edit-visit") {
    state.editingVisitId = visit._id;
    showToast(`Đang sửa toa lần ${visit.visitNo || 1}.`, "success");
    refs.editBanner.scrollIntoView({ block: "center" });
  } else {
    state.editingVisitId = "";
    showToast("Đã nạp dữ liệu lần khám vào form.", "success");
  }
  renderHistory();
  renderEditBanner();
  updateSaveButtons();
  updateTotals();
  updateWarning();
}

function renderHistory() {
  const visits = state.selectedPatientDetail?.visits || [];
  refs.historyRows.innerHTML = visits.map((visit) => `
    <div class="history-row ${visit._id === state.editingVisitId ? "is-editing" : ""}" data-id="${visit._id}">
      <div>${formatDate(visit.visitDate)}<span class="history-visit-tag">L${String(visit.visitNo || 0)}</span></div>
      <div class="history-visit-no">L${String(visit.visitNo || 0)}<span class="history-total-inline">${formatMoney(visit.totalMoney)}</span></div>
      <div>${escapeHtml(visit.diagnosis || "")}${visit.doctor ? `<div class="muted">BS ${escapeHtml(visit.doctor)}</div>` : ""}${buildHistoryDrugSummary(visit)}<div class="history-total-inline">${formatMoney(visit.totalMoney)}</div></div>
      <div>${formatMoney(visit.totalMoney)}</div>
      <div class="history-row__actions">
        <button class="btn small" type="button" data-action="open-visit" aria-label="Mở toa lần ${escapeAttribute(visit.visitNo || 0)}">${iconHtml("eye")}<span>Mở</span></button>
        <button class="btn small soft" type="button" data-action="edit-visit" aria-label="Sửa toa lần ${escapeAttribute(visit.visitNo || 0)}" title="Sửa toa">${iconHtml("pencil")}<span>Sửa</span></button>
      </div>
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

// ---- Chế độ sửa toa ----

function renderEditBanner() {
  const visit = state.editingVisitId ? findHistoryVisit(state.editingVisitId) : null;
  refs.editBanner.classList.toggle("hidden", !visit);
  if (visit) refs.editBannerText.textContent = `Đang sửa toa lần ${visit.visitNo || 1} – ${formatDate(visit.visitDate)}`;
}

function exitEditMode() {
  state.editingVisitId = "";
  renderEditBanner();
  updateSaveButtons();
  renderHistory();
}

// hủy sửa: trở về trạng thái mở bệnh nhân (toa gần nhất làm mẫu)
function cancelEditMode() {
  const visits = state.selectedPatientDetail?.visits || [];
  state.selectedVisitId = visits[0]?._id || "";
  fillFormFromRecord(state.selectedPatientDetail?.patient, visits[0] || null);
  exitEditMode();
  updateTotals();
  updateWarning();
}

function updateSaveButtons() {
  const editing = Boolean(state.editingVisitId);
  const label = editing ? "Lưu thay đổi" : phoneLayoutQuery.matches ? "Lưu" : "Lưu / Hoàn tất khám";
  [refs.saveBtn, refs.saveFab].forEach((button) => {
    button.querySelector(".save-label").textContent = label;
    button.disabled = state.saving;
    button.classList.toggle("is-busy", state.saving);
    button.setAttribute("aria-busy", String(state.saving));
  });
}

function setAdviceNote(value) {
  refs.adviceNote.value = value;
  autoGrowField(refs.adviceNote);
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
  setAdviceNote(visit?.note || DEFAULT_ADVICE_NOTE);
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
    noon: String(drug.noon || ""),
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
  setAdviceNote(DEFAULT_ADVICE_NOTE);
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
  state.editingVisitId = "";
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
  setAdviceNote(DEFAULT_ADVICE_NOTE);
  resetMoneyOverrides();
  state.autoSuggestedRowKeys = [];
  state.draftRows = [createDraftRow()];
  renderDrugRows();
  renderStockData();
  renderHistory();
  renderPrescriptionVisitTabs();
  renderPatientList();
  renderEditBanner();
  updateSaveButtons();
  updateTotals();
  updateWarning();
}

function createNewPrescription() {
  state.selectedVisitId = "";
  state.editingVisitId = "";
  refs.visitDoctor.value = refs.visitDoctor.value.trim() || (state.selectedPatientDetail?.visits || [])[0]?.doctor || state.clinicInfo?.doctor || state.doctors[0] || "";
  refs.symptom.value = "";
  refs.symptomSuggestBox.classList.add("hidden");
  refs.icdInput.value = "";
  refs.icdInput.placeholder = "Gõ mã hoặc vài chữ";
  autoGrowField(refs.icdInput);
  refs.followDate.value = "";
  refs.serviceFee.value = "0";
  refs.serviceMoney.value = "0";
  setAdviceNote(DEFAULT_ADVICE_NOTE);
  resetMoneyOverrides();
  state.autoSuggestedRowKeys = [];
  state.draftRows = [createDraftRow()];
  renderDrugRows();
  renderPrescriptionVisitTabs();
  renderEditBanner();
  renderHistory();
  updateSaveButtons();
  updateTotals();
  updateWarning();
}

function handleBirthYearInput() {
  calcAge();
  if (!wheelOnlyQuery.matches) showYearSuggestions(refs.birthYear.value);
}

function syncBirthYearMode() {
  const wheelOnly = wheelOnlyQuery.matches;
  refs.birthYear.readOnly = wheelOnly;
  refs.birthYear.setAttribute("inputmode", wheelOnly ? "none" : "numeric");
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

// ---- Bánh xe chọn năm sinh: bottom sheet (điện thoại) hoặc popover (desktop) ----

function openYearWheel() {
  const wheelOnly = wheelOnlyQuery.matches;
  const lastYear = new Date().getFullYear();
  const years = Array.from({ length: lastYear - WHEEL_MIN_YEAR + 1 }, (_, index) => WHEEL_MIN_YEAR + index);
  const current = Number(refs.birthYear.value);
  const startYear = years.includes(current) ? current : WHEEL_DEFAULT_YEAR;

  refs.yearWheel.innerHTML = years
    .map((year) => `<div class="wheel__item" role="option" aria-selected="false" id="wheel-year-${year}" data-year="${year}">${year}</div>`)
    .join("");
  state.wheel = { years, index: years.indexOf(startYear), range: [0, -1], frame: 0, opener: document.activeElement };

  refs.yearWheelLayer.classList.remove("hidden");
  refs.yearWheelLayer.classList.toggle("is-sheet", wheelOnly);
  refs.yearWheelLayer.classList.toggle("is-pop", !wheelOnly);
  if (wheelOnly) document.body.style.overflow = "hidden";
  else positionYearWheelPopover();

  refs.yearWheel.scrollTop = state.wheel.index * WHEEL_ITEM_HEIGHT;
  updateYearWheel();
  refs.yearWheel.focus({ preventScroll: true });
}

function positionYearWheelPopover() {
  const anchor = refs.birthYearWrap.getBoundingClientRect();
  const panel = refs.yearWheelPanel;
  panel.style.left = `${Math.max(8, Math.min(anchor.left, window.innerWidth - panel.offsetWidth - 8))}px`;
  const below = anchor.bottom + 6;
  const fitsBelow = below + panel.offsetHeight <= window.innerHeight - 8;
  panel.style.top = `${fitsBelow ? below : Math.max(8, anchor.top - panel.offsetHeight - 6)}px`;
}

function closeYearWheel() {
  if (refs.yearWheelLayer.classList.contains("hidden")) return;
  refs.yearWheelLayer.classList.add("hidden");
  document.body.style.overflow = "";
  const opener = state.wheel?.opener;
  state.wheel = null;
  if (opener && opener !== document.body && !wheelOnlyQuery.matches) opener.focus?.({ preventScroll: true });
}

function scheduleYearWheelUpdate() {
  if (!state.wheel || state.wheel.frame) return;
  state.wheel.frame = requestAnimationFrame(() => {
    if (state.wheel) state.wheel.frame = 0;
    updateYearWheel();
  });
}

// cập nhật năm đang chọn (aria-selected) và độ mờ dần theo khoảng cách tới tâm
function updateYearWheel() {
  const wheel = state.wheel;
  if (!wheel) return;
  const position = refs.yearWheel.scrollTop / WHEEL_ITEM_HEIGHT;
  const index = Math.min(wheel.years.length - 1, Math.max(0, Math.round(position)));
  const items = refs.yearWheel.children;
  const from = Math.max(0, Math.floor(position) - 4);
  const to = Math.min(items.length - 1, Math.ceil(position) + 4);
  for (let i = wheel.range[0]; i <= wheel.range[1]; i += 1) {
    if (items[i] && (i < from || i > to)) items[i].style.opacity = "";
  }
  for (let i = from; i <= to; i += 1) {
    items[i].style.opacity = String(Math.max(0.18, 1 - 0.3 * Math.abs(i - position)));
  }
  wheel.range = [from, to];
  if (index !== wheel.selected) {
    items[wheel.selected]?.setAttribute("aria-selected", "false");
    items[index].setAttribute("aria-selected", "true");
    refs.yearWheel.setAttribute("aria-activedescendant", items[index].id);
    wheel.selected = index;
  }
  wheel.index = index;
}

function scrollYearWheelTo(index) {
  const last = state.wheel.years.length - 1;
  refs.yearWheel.scrollTo({ top: Math.min(last, Math.max(0, index)) * WHEEL_ITEM_HEIGHT, behavior: "smooth" });
}

function applyYearWheel(action) {
  if (action === "done" && state.wheel) refs.birthYear.value = String(state.wheel.years[state.wheel.index]);
  if (action === "clear") refs.birthYear.value = "";
  if (action !== "cancel") calcAge();
  closeYearWheel();
}

function handleYearWheelClick(event) {
  const actionButton = event.target.closest("[data-wheel]");
  if (actionButton) {
    applyYearWheel(actionButton.dataset.wheel);
    return;
  }
  const item = event.target.closest(".wheel__item");
  if (item && state.wheel) {
    scrollYearWheelTo(state.wheel.years.indexOf(Number(item.dataset.year)));
    return;
  }
  if (event.target === refs.yearWheelLayer) closeYearWheel();
}

function handleYearWheelKeydown(event) {
  if (!state.wheel) return;
  const steps = { ArrowUp: -1, ArrowDown: 1, PageUp: -5, PageDown: 5 };
  if (event.key in steps) {
    event.preventDefault();
    scrollYearWheelTo(state.wheel.index + steps[event.key]);
  } else if (event.key === "Home" || event.key === "End") {
    event.preventDefault();
    scrollYearWheelTo(event.key === "Home" ? 0 : state.wheel.years.length - 1);
  } else if (event.key === "Enter" && !event.target.closest("[data-wheel]")) {
    event.preventDefault();
    applyYearWheel("done");
  } else if (event.key === "Escape") {
    event.preventDefault();
    closeYearWheel();
  }
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
    noon: "",
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
    !String(row.noon || "").trim() &&
    !String(row.night || "").trim() &&
    !String(row.usage || "").trim() &&
    toNumber(row.price) === 0
  );
}

function buildDoseFieldHtml(row, field) {
  return `
    <div class="drug-field drug-field--dose drug-field--${field} drug-field--dose-${field}">
      <label class="label">${DOSE_LABELS[field]}</label>
      <input class="mini" data-field="${field}" list="doseList" aria-label="${DOSE_LABELS[field]}" value="${escapeAttribute(row[field] || "")}" />
      <div class="dose-quick hidden">
        ${DOSE_OPTIONS.map((option) => `<button class="dose-quick__btn" type="button" data-action="set-dose" data-dose-field="${field}" data-dose-value="${escapeAttribute(option)}">${escapeHtml(option)}</button>`).join("")}
      </div>
    </div>`;
}

function renderDrugRows() {
  refs.drugRows.innerHTML = state.draftRows.map((row, index) => `
    <div class="drug-row ${row.expanded ? "is-open" : ""}" data-key="${row.key}">
      <div class="drug-row__index">${index + 1}</div>
      <div class="drug-row__main">
        <div class="drug-row__top">
          <div class="drug-field drug-field--ingredient">
            <label class="label"><span class="drug-inline-index">${index + 1}</span>Hoạt chất</label>
            <input class="mini ${isDrugDoseExceeded(row) ? "is-overdose" : ""}" data-field="activeIngredient" list="activeIngredientList" aria-label="Hoạt chất" value="${escapeAttribute(row.activeIngredient)}" />
          </div>
          <div class="drug-field drug-field--brand">
            <label class="label">Tên thương mại</label>
            <input class="mini" data-field="brandName" aria-label="Tên thương mại" value="${escapeAttribute(getDrugBrandDisplay(row))}" />
          </div>
          ${DOSE_FIELDS.map((field) => buildDoseFieldHtml(row, field)).join("")}
        </div>
        <div class="drug-row__bottom">
          <div class="drug-field drug-field--usage">
            <label class="label">Công dụng / HDSD</label>
            <textarea class="mini" data-field="usage" rows="2" aria-label="Công dụng / cách dùng">${escapeHtml(row.usage)}</textarea>
          </div>
          <div class="drug-field drug-field--unit">
            <label class="label">Đơn vị</label>
            <input class="mini" data-field="unit" aria-label="Đơn vị" value="${escapeAttribute(row.unit)}" />
          </div>
          <div class="drug-field drug-field--quantity">
            <label class="label">Số lượng</label>
            <input class="mini" data-field="quantity" inputmode="numeric" pattern="[0-9]*" aria-label="Số lượng" value="${escapeAttribute(row.quantity)}" />
            <div class="quantity-quick hidden">
              ${QUANTITY_OPTIONS.map((option) => `<button class="quantity-quick__btn ${["30", "60", "90"].includes(option) ? "is-common" : ""}" type="button" data-action="set-quantity" data-quantity-value="${escapeAttribute(option)}">${escapeHtml(option)}</button>`).join("")}
            </div>
          </div>
          <div class="drug-field drug-field--price">
            <label class="label">Đơn giá</label>
            <input class="mini" data-field="price" inputmode="numeric" aria-label="Đơn giá" value="${escapeAttribute(formatMoney(row.price))}" />
          </div>
          <div class="drug-subtotal"><span>Thành tiền</span><strong>${formatMoney(toNumber(row.quantity) * toNumber(row.price))}</strong></div>
          <div class="drug-field drug-field--remove">
            <button class="btn small danger drug-remove" data-action="remove" type="button" aria-label="Xóa dòng thuốc ${index + 1}" title="Xóa dòng thuốc">${iconHtml("trash-2")}<span class="remove-label">Xóa dòng</span></button>
          </div>
        </div>
        <button class="btn small drug-toggle" data-action="toggle-row" type="button" aria-expanded="${row.expanded ? "true" : "false"}"><span>${row.expanded ? "Thu gọn" : "Chi tiết"}</span>${iconHtml("chevron-down")}</button>
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
  if (!phoneLayoutQuery.matches) return brand;
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
  const doseInput = event.target.closest("input[data-field='morning'], input[data-field='noon'], input[data-field='night']");
  if (doseInput) {
    if (phoneLayoutQuery.matches) {
      toggleDoseQuickPicker(doseInput.closest(".drug-field--dose"));
    } else if (typeof doseInput.showPicker === "function") {
      try { doseInput.showPicker(); } catch {}
    }
  }
  const quantityInput = event.target.closest("input[data-field='quantity']");
  if (quantityInput && phoneLayoutQuery.matches) {
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
      applyDoseAlertStateToRowElement(rowElement, row);
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
      refreshRowSubtotal(rowElement, row);
      updateTotals();
      updateWarning();
    }
    return;
  }
  const toggleButton = event.target.closest("[data-action='toggle-row']");
  if (toggleButton) {
    const rowElement = toggleButton.closest(".drug-row");
    const row = state.draftRows.find((item) => item.key === rowElement.dataset.key);
    if (!row) return;
    row.expanded = !row.expanded;
    rowElement.classList.toggle("is-open", row.expanded);
    toggleButton.setAttribute("aria-expanded", String(row.expanded));
    toggleButton.querySelector("span").textContent = row.expanded ? "Thu gọn" : "Chi tiết";
    rowElement.querySelectorAll(".drug-field--usage textarea").forEach((element) => autoGrowField(element));
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

function refreshRowSubtotal(rowElement, row) {
  const subtotal = rowElement.querySelector(".drug-subtotal strong");
  if (subtotal) subtotal.textContent = formatMoney(toNumber(row.quantity) * toNumber(row.price));
}

function handleDrugRowChange(event) {
  const field = event.target?.dataset?.field;
  if (event.type === "focusout" && field !== "quantity") return;
  if (event.type === "focusin" && DOSE_FIELDS.includes(field) && !phoneLayoutQuery.matches && typeof event.target.showPicker === "function") {
    try { event.target.showPicker(); } catch {}
  }
  const rowElement = event.target.closest(".drug-row");
  if (!rowElement) return;
  const row = state.draftRows.find((item) => item.key === rowElement.dataset.key);
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
    if (event.type === "focusin") {
      // chọn hết để gõ đè ngay
      const input = event.target;
      setTimeout(() => input.select?.(), 0);
      return;
    }
    if (event.type === "input") {
      // cho phép ô trống khi đang gõ; chỉ nhận số nguyên dương
      const digits = event.target.value.replace(/\D/g, "");
      if (digits !== event.target.value) event.target.value = digits;
      row.quantity = digits === "" ? "" : Number(digits);
      closeQuantityQuickPickers();
    } else if (!toNumber(row.quantity) || toNumber(row.quantity) <= 0) {
      // blur/change mà trống hoặc ≤ 0 thì trả về 30
      row.quantity = 30;
      event.target.value = "30";
    }
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
  refreshRowSubtotal(rowElement, row);
  updateTotals();
  updateWarning();
}

function updateTotals() {
  const drugTotal = state.draftRows.reduce((sum, row) => sum + (toNumber(row.quantity) * toNumber(row.price)), 0);
  const service = state.moneyOverrides.service ?? (toNumber(refs.serviceMoney.value) || 0);
  refs.serviceFee.value = String(service);
  applyMoneyField(refs.drugMoney, "drug", drugTotal);
  applyMoneyField(refs.serviceMoney, "service", service);
  renderTotalMoney();
}

// thuốc sẽ âm kho nếu lưu toa hiện tại (khi sửa toa cũ, trả lại số lượng toa đó trước khi so)
function findProjectedNegativeStock() {
  const editing = state.editingVisitId ? findHistoryVisit(state.editingVisitId) : null;
  const restored = new Map();
  (editing?.drugs || []).forEach((item) => restored.set(String(item.drugId), (restored.get(String(item.drugId)) || 0) + Number(item.quantity || 0)));
  const requested = new Map();
  state.draftRows.forEach((row) => {
    if (row.drugId && toNumber(row.quantity) > 0) requested.set(row.drugId, (requested.get(row.drugId) || 0) + toNumber(row.quantity));
  });
  const negative = [];
  requested.forEach((quantity, drugId) => {
    const drug = state.drugs.find((item) => item._id === drugId);
    if (!drug) return;
    const after = Number(drug.quantity || 0) + (restored.get(drugId) || 0) - quantity;
    if (after < 0) negative.push({ name: drug.brandName || drug.activeIngredient, after });
  });
  return negative;
}

function updateWarning() {
  const names = state.draftRows.map((item) => normalizeText(`${item.activeIngredient} ${item.brandName}`));
  const warnings = [];
  if (names.some((item) => item.includes("olanzapine")) && names.some((item) => item.includes("quetiapine"))) warnings.push("Olanzapine + Quetiapine co the lam tang an than va ganh nang chuyen hoa.");
  if (names.some((item) => item.includes("diazepam")) && names.some((item) => item.includes("quetiapine"))) warnings.push("Diazepam + Quetiapine co the lam tang buon ngu, lu lan va te nga.");
  if (names.some((item) => item.includes("clozapine")) && names.some((item) => item.includes("carbamazepine"))) warnings.push("Clozapine + Carbamazepine lam tang nguy co suy tuy, nen tranh phoi hop.");
  const lines = warnings.map((item) => `- ${escapeHtml(item)}`);
  findProjectedNegativeStock().forEach((item) => {
    lines.push(`<span class="is-neg">${iconHtml("alert-triangle")} ${escapeHtml(item.name)} sẽ âm kho (còn ${formatNumber(item.after)})</span>`);
  });
  refs.warningBox.innerHTML = lines.join("<br>");
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
      noon: option.noon ?? profile.noon ?? "",
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
    noon: suggestion.noon || "",
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
      state.moneyOverrides.service = toNumber(refs.serviceMoney.value);
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

// âm kho lên trước, sau đó thuốc mới thêm/sửa gần nhất
function getSortedStockDrugs() {
  return state.drugs.slice().sort((a, b) => {
    const negativeA = Number(a.quantity) < 0;
    const negativeB = Number(b.quantity) < 0;
    if (negativeA !== negativeB) return negativeA ? -1 : 1;
    return new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0);
  });
}

function renderStockData() {
  const pending = state.pendingStockRows;
  refs.stockDataBox.innerHTML = `
    <div class="stock-manager">
      <div class="stock-toolbar">
        <div class="stock-toolbar__actions">
          <button class="btn small primary" data-action="add-drug" type="button">${iconHtml("plus")}<span>Thêm thuốc</span></button>
          <button class="btn small" data-action="reload-stock" type="button">${iconHtml("refresh-cw")}<span>Tải lại</span></button>
        </div>
        <div>
          <label class="label" for="stockPasteInput">Dán dữ liệu từ Excel</label>
          <textarea class="field stock-paste" id="stockPasteInput" rows="4" placeholder="Copy nhiều dòng từ Excel rồi dán vào đây. Thứ tự cột: Hoạt chất, Tên thương mại, Đơn vị, Tồn kho, Giá, Công dụng"></textarea>
        </div>
        <div class="stock-toolbar__actions">
          <button class="btn small primary" data-action="apply-stock-paste" type="button">${iconHtml("plus")}<span>Dán vào bảng</span></button>
        </div>
      </div>
      ${pending.length ? `
        <div class="stock-pending">
          <strong>${pending.length} dòng vừa dán, chưa lưu</strong>
          ${pending.map((row) => `
            <div class="stock-pending__row">
              <span>${escapeHtml(row.activeIngredient)}${row.brandName ? ` / ${escapeHtml(row.brandName)}` : ""} · ${escapeHtml(row.unit)} · tồn ${formatNumber(row.quantity)} · ${formatMoney(row.price)}</span>
              <button class="icon-btn" data-action="remove-pending" data-key="${row.key}" type="button" aria-label="Bỏ dòng ${escapeAttribute(row.activeIngredient)}" title="Bỏ dòng">${iconHtml("x")}</button>
            </div>`).join("")}
          <div class="stock-toolbar__actions">
            <button class="btn small primary" data-action="save-pending" type="button">${iconHtml("save")}<span>Lưu ${pending.length} dòng vừa dán</span></button>
            <button class="btn small" data-action="clear-pending" type="button">${iconHtml("x")}<span>Bỏ tất cả</span></button>
          </div>
        </div>` : ""}
      <div class="stock-list">
        <div class="stock-head"><div>Hoạt chất</div><div class="stock-row__qty">Tồn kho</div><div class="stock-row__price">Đơn giá</div><div></div></div>
        ${getSortedStockDrugs().map((drug) => {
          const negative = Number(drug.quantity) < 0;
          return `
            <div class="stock-row ${negative ? "is-negative" : ""}">
              <div class="stock-row__name">${escapeHtml(drug.activeIngredient)}${negative ? '<span class="badge-neg">Âm kho</span>' : ""}</div>
              <div class="stock-row__qty"><span class="stock-row__lbl">Tồn kho: </span>${formatNumber(drug.quantity)}</div>
              <div class="stock-row__price"><span class="stock-row__lbl">Đơn giá: </span>${formatMoney(drug.price)}</div>
              <div class="stock-row__act"><button class="btn small" data-action="open-drug" data-id="${drug._id}" type="button" aria-label="Chi tiết ${escapeAttribute(drug.activeIngredient)}" title="Chi tiết">${iconHtml("pencil")}<span>Chi tiết</span></button></div>
            </div>`;
        }).join("") || '<div class="code-empty">Chưa có thuốc trong kho.</div>'}
      </div>
    </div>
  `;
}

async function handleStockDataClick(event) {
  const actionElement = event.target.closest("[data-action]");
  if (!actionElement) return;
  const action = actionElement.dataset.action;

  try {
    if (action === "add-drug") {
      openDrugModal("");
      return;
    }

    if (action === "open-drug") {
      openDrugModal(actionElement.dataset.id);
      return;
    }

    if (action === "reload-stock") {
      await loadDrugs();
      return;
    }

    if (action === "apply-stock-paste") {
      const text = document.getElementById("stockPasteInput")?.value || "";
      const rows = parseStockPaste(text);
      if (!rows.length) throw new Error("Chưa có dữ liệu Excel hợp lệ để dán.");
      state.pendingStockRows = [...state.pendingStockRows, ...rows];
      renderStockData();
      showToast(`Đã dán ${rows.length} dòng. Bấm "Lưu" để thêm vào kho.`, "success");
      return;
    }

    if (action === "remove-pending") {
      state.pendingStockRows = state.pendingStockRows.filter((row) => row.key !== actionElement.dataset.key);
      renderStockData();
      return;
    }

    if (action === "clear-pending") {
      state.pendingStockRows = [];
      renderStockData();
      return;
    }

    if (action === "save-pending") {
      const rows = state.pendingStockRows.slice();
      const payloads = rows.map(buildStockPayload);
      setBusy(actionElement, true);
      try {
        for (let index = 0; index < rows.length; index += 1) {
          await fetchJson("/api/drugs", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payloads[index])
          });
          // bỏ khỏi danh sách chờ ngay để lần lưu lại sau lỗi không tạo trùng
          state.pendingStockRows = state.pendingStockRows.filter((row) => row.key !== rows[index].key);
        }
      } finally {
        await loadDrugs();
      }
      showToast(`Đã lưu ${rows.length} thuốc vào kho.`, "success");
    }
  } catch (error) {
    handleError(error);
  }
}

function openDrugModal(drugId) {
  const drug = drugId ? state.drugs.find((item) => item._id === drugId) : null;
  state.editingDrugId = drug?._id || "";
  refs.drugModalTitle.textContent = drug ? "Chi tiết thuốc" : "Thêm thuốc";
  refs.dmActive.value = drug?.activeIngredient || "";
  refs.dmBrand.value = drug?.brandName || "";
  refs.dmUnit.value = drug ? drug.unit || "" : "Viên";
  // thuốc mới mặc định tồn 999; thuốc đã có giữ đúng số trong kho (kể cả 0 hoặc âm)
  refs.dmQuantity.value = drug ? String(Number(drug.quantity ?? 0)) : "999";
  refs.dmPrice.value = formatMoney(drug?.price || 0);
  refs.dmUsage.value = drug?.usage || "";
  refs.dmNotes.value = drug?.notes || "";
  refs.dmDeleteBtn.classList.toggle("hidden", !drug);
  setAuthMessage(refs.drugModalMsg, "");
  refs.drugModal.showModal();
}

async function handleDrugFormSubmit(event) {
  event.preventDefault();
  const activeIngredient = refs.dmActive.value.trim();
  const quantityText = refs.dmQuantity.value.trim();
  if (!activeIngredient) return setAuthMessage(refs.drugModalMsg, "Nhập hoạt chất.");
  if (!quantityText || !Number.isFinite(Number(quantityText))) return setAuthMessage(refs.drugModalMsg, "Tồn kho phải là số.");
  const payload = buildStockPayload({
    activeIngredient,
    brandName: refs.dmBrand.value,
    unit: refs.dmUnit.value,
    quantity: Number(quantityText),
    price: toNumber(refs.dmPrice.value),
    usage: refs.dmUsage.value,
    notes: refs.dmNotes.value
  });

  setBusy(refs.dmSaveBtn, true);
  try {
    const id = state.editingDrugId;
    await fetchJson(id ? `/api/drugs/${id}` : "/api/drugs", {
      method: id ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    refs.drugModal.close();
    await loadDrugs();
    showToast(id ? "Đã lưu thuốc." : "Đã thêm thuốc vào kho.", "success");
  } catch (error) {
    setAuthMessage(refs.drugModalMsg, error.message);
  } finally {
    setBusy(refs.dmSaveBtn, false);
  }
}

async function deleteDrugFromModal() {
  const id = state.editingDrugId;
  if (!id || !window.confirm("Xóa thuốc này khỏi kho?")) return;
  try {
    await fetchJson(`/api/drugs/${id}`, { method: "DELETE" });
    refs.drugModal.close();
    await loadDrugs();
    showToast("Đã xóa thuốc khỏi kho.", "success");
  } catch (error) {
    setAuthMessage(refs.drugModalMsg, error.message);
  }
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
  const quantity = Number(row.quantity);
  return {
    activeIngredient,
    brandName,
    unit: String(row.unit || "Viên").trim() || "Viên",
    // 0 là số hợp lệ: không được tự đổi thành 999
    quantity: Number.isFinite(quantity) ? quantity : 999,
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

    if (cell4 && /^-?\d+([.,]\d+)?$/.test(cell4)) {
      row.quantity = Number(cell4.replace(",", "."));
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
  const dailyDose = DOSE_FIELDS.reduce((sum, field) => sum + toNumber(row[field]), 0) * strength.amount;
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
  const key = event.target.id === "drugMoney" ? "drug" : "service";
  const raw = event.target.value.trim();
  state.moneyOverrides[key] = raw ? toNumber(raw) : null;
  if (key === "service") syncServiceFeeFromMoney();
  renderTotalMoney();
}

// Tổng tiền = Tiền thuốc + Công khám; ô chỉ hiển thị, không nhập tay
function renderTotalMoney() {
  const drugValue = state.moneyOverrides.drug ?? toNumber(refs.drugMoney.dataset.computed);
  const serviceValue = state.moneyOverrides.service ?? toNumber(refs.serviceFee.value);
  refs.totalMoney.value = formatMoney(drugValue + serviceValue);
}

function resetMoneyOverrides() {
  state.moneyOverrides = { drug: null, service: null };
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
  if (state.saving) return;
  state.saving = true;
  updateSaveButtons();
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
    if (!patientPayload.fullName) throw new Error("Nhập họ tên bệnh nhân.");
    if (!patientPayload.phone) throw new Error("Nhập số điện thoại.");

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
      noon: String(row.noon || "").trim(),
      night: String(row.night || "").trim(),
      instruction: String(row.usage || "").trim()
    }));

    const editingId = state.editingVisitId;
    const editingVisit = editingId ? findHistoryVisit(editingId) : null;
    // sửa toa mà không đổi ngày thì giữ nguyên giờ khám cũ
    const visitDate = !refs.visitDate.value
      ? new Date().toISOString()
      : editingVisit && toDateInput(editingVisit.visitDate) === refs.visitDate.value
        ? editingVisit.visitDate
        : `${refs.visitDate.value}T09:00:00`;
    const visitPayload = {
      visitType: state.selectedPatientDetail?.visits?.length ? "revisit" : "initial",
      visitDate,
      doctor: refs.visitDoctor.value.trim() || state.clinicInfo.doctor,
      followUpDate: refs.followDate.value || "",
      symptom: refs.symptom.value.trim(),
      diagnosis: refs.icdInput.value.trim(),
      note: refs.adviceNote.value.trim(),
      serviceFee: toNumber(refs.serviceFee.value),
      drugs
    };

    const saved = await fetchJson(editingId ? `/api/visits/${editingId}` : `/api/patients/${patientId}/visits`, {
      method: editingId ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(visitPayload)
    });
    // lưu toa mới xong thì chuyển sang sửa chính toa vừa tạo: bấm lưu lần nữa sẽ cập nhật, không sinh toa trùng
    state.editingVisitId = saved._id;

    const warnings = saved.warnings || [];
    if (warnings.length) {
      showToast(`Đã lưu. Cảnh báo âm kho: ${warnings.map((item) => `${item.brandName} (${formatNumber(item.quantity)})`).join(", ")}`, "warn", 7000);
    } else {
      showToast(editingId ? "Đã lưu thay đổi toa." : "Đã lưu lượt khám và toa thuốc.", "success");
    }
    await Promise.all([loadDashboard(), loadQuickStats(), loadDrugs(), loadPatients()]);
  } catch (error) {
    handleError(error);
  } finally {
    state.saving = false;
    updateSaveButtons();
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
  // iframe riêng: CSS của toa không rò sang giao diện chính
  refs.rxFrame.srcdoc = buildPrescriptionHtml();
  refs.rxModal.showModal();
}

function autoGrowField(element) {
  if (!element) return;
  element.style.height = "auto";
  element.style.height = `${Math.max(element.scrollHeight, 50)}px`;
}

// dữ liệu cũ không có buổi trưa vẫn hiển thị đúng ("Trưa -")
function buildDoseText(row) {
  return DOSE_FIELDS.map((field) => `${DOSE_LABELS[field]} ${escapeHtml(row[field] || "-")}`).join(", ");
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
        <td>${buildDoseText(row)}</td>
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
      <td>${buildDoseText(row)}</td>
    </tr>
  `).join("");
  return `<!DOCTYPE html><html lang="vi"><head><meta charset="utf-8"><title>Toa thuốc</title><style>@page{size:A5 portrait;margin:8mm}html,body{width:148mm;min-height:210mm;margin:0;padding:0;background:#fff}body{font-family:"Segoe UI","Noto Sans",Arial,Helvetica,sans-serif;color:#111;font-size:13px;line-height:1.45}.sheet{width:132mm;min-height:194mm;margin:0 auto;padding:0}h1{font-size:22px;margin:0 0 8px;text-align:center}.meta{margin-bottom:12px;line-height:1.55}.meta div{margin-bottom:3px}table{width:100%;border-collapse:collapse;table-layout:fixed}th,td{border:1px solid #111;padding:6px;vertical-align:top;text-align:left;word-wrap:break-word}th{background:#f5f5f5}.footer{margin-top:14px;display:flex;justify-content:space-between;gap:16px;align-items:flex-start}.footer-note{white-space:pre-line;max-width:62%}.sign{min-width:200px;text-align:center}.sign-name{margin-top:42px;font-weight:700}@media screen{html{width:auto;background:#e9eef3}body{margin:12px auto;padding:8mm;box-sizing:border-box}}@media screen and (max-width:720px){html,body{width:auto;min-height:auto}body{font-size:12px;margin:0;padding:8px}.sheet{width:100%;min-height:auto}.meta{line-height:1.45}table{font-size:11px}th,td{padding:4px}.footer{flex-direction:column;gap:12px}.footer-note{max-width:none}.sign{min-width:0;width:100%}.sign-name{margin-top:20px}}@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}</style></head><body><div class="sheet"><h1>${escapeHtml(state.clinicInfo.name)}</h1><div class="meta"><div><strong>Bác sĩ:</strong> ${escapeHtml(currentDoctor)}</div><div><strong>Địa chỉ phòng khám:</strong> ${clinicAddress}</div><div><strong>Điện thoại:</strong> ${clinicPhone}</div><div><strong>Bệnh nhân:</strong> ${escapeHtml(refs.patientName.value)} - ${escapeHtml(refs.gender.value)} - ${escapeHtml(refs.age.value)} tuổi</div><div><strong>Địa chỉ:</strong> ${escapeHtml(refs.addressWard.value)}, ${escapeHtml(refs.province.value)}</div><div><strong>Số điện thoại:</strong> ${escapeHtml(refs.phone.value)}</div><div><strong>Ngày khám:</strong> ${escapeHtml(formatDate(refs.visitDate.value))}</div><div><strong>Chẩn đoán:</strong> ${escapeHtml(refs.icdInput.value)}</div></div><table><thead><tr><th style="width:8%">#</th><th style="width:42%">Tên thuốc</th><th style="width:12%">Đơn vị</th><th style="width:10%">SL</th><th style="width:28%">Cách dùng</th></tr></thead><tbody>${rows || "<tr><td colspan='5'>Chưa có thuốc.</td></tr>"}</tbody></table><div class="footer"><div class="footer-note"><strong>Tái khám:</strong> ${escapeHtml(refs.followDate.value ? formatDate(refs.followDate.value) : "Chưa hẹn")}<br><strong>Lời dặn:</strong><br>${escapeHtml(refs.adviceNote.value || "Không có")}</div><div class="sign"><div>Ngày ${today.getDate()} tháng ${today.getMonth() + 1} năm ${today.getFullYear()}</div><div style="margin-top:8px;font-weight:700">Bác sĩ điều trị</div><div class="sign-name">${escapeHtml(currentDoctor)}</div></div></div></div></body></html>`;
}

async function printPrescription() {
  if (state.selectedVisitId) {
    try { await fetchJson(`/api/visits/${state.selectedVisitId}/print`, { method: "POST" }); } catch {}
  }
  // in thẳng từ iframe xem toa: không mở cửa sổ mới, không đụng tới trang chính
  const frameWindow = refs.rxFrame.contentWindow;
  if (!frameWindow) throw new Error("Chưa dựng được toa để in.");
  frameWindow.focus();
  frameWindow.print();
}

function timestampForFile() {
  const now = new Date();
  return `${toDateInput(now)}-${String(now.getHours()).padStart(2, "0")}${String(now.getMinutes()).padStart(2, "0")}`;
}

function downloadJson(filename, data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

async function exportData() {
  const data = await fetchJson("/api/export");
  downloadJson(`pk-dr-minh-full-${timestampForFile()}.json`, data);
  showToast("Đã xuất toàn bộ dữ liệu.", "success");
}

const IMPORT_LABELS = { patients: "Bệnh nhân", visits: "Lượt khám", drugs: "Thuốc", settings: "Cài đặt" };

function validateImportFile(data) {
  if (data?.app !== "pk-dr-minh" || data?.version !== 1) {
    throw new Error("File không phải bản xuất của PK Dr. Minh (sai app hoặc phiên bản).");
  }
  Object.keys(IMPORT_LABELS).forEach((key) => {
    if (!Array.isArray(data.collections?.[key])) throw new Error(`File thiếu danh sách "${IMPORT_LABELS[key]}".`);
  });
}

async function handleImportFileChosen() {
  const file = refs.importFile.files?.[0];
  refs.importFile.value = "";
  if (!file) return;
  try {
    let data;
    try {
      data = JSON.parse(await file.text());
    } catch {
      throw new Error("File hỏng hoặc không phải JSON hợp lệ. Dữ liệu hiện tại không bị thay đổi.");
    }
    validateImportFile(data);
    // lấy bản dữ liệu hiện tại để so sánh và để tự sao lưu trước khi thay thế
    const current = await fetchJson("/api/export");
    state.importData = data;
    state.importBackup = current;
    const exportedAt = data.exportedAt ? new Date(data.exportedAt) : null;
    refs.importMeta.textContent = `File: ${file.name}${exportedAt && !Number.isNaN(exportedAt.getTime()) ? ` · xuất lúc ${exportedAt.toLocaleString("vi-VN")}` : ""}`;
    refs.importTable.innerHTML = `
      <thead><tr><th>Dữ liệu</th><th>Trong file</th><th>Hiện có</th></tr></thead>
      <tbody>${Object.keys(IMPORT_LABELS).map((key) => `
        <tr><td>${IMPORT_LABELS[key]}</td><td>${formatNumber(data.collections[key].length)}</td><td>${formatNumber(current.collections[key].length)}</td></tr>`).join("")}
      </tbody>`;
    refs.importConfirm.value = "";
    refs.importConfirmBtn.disabled = true;
    setAuthMessage(refs.importMsg, "");
    refs.importModal.showModal();
  } catch (error) {
    handleError(error);
  }
}

async function confirmImport() {
  if (refs.importConfirm.value !== "NAP" || !state.importData) return;
  setBusy(refs.importConfirmBtn, true);
  try {
    // luôn tải bản sao lưu dữ liệu hiện tại trước khi thay thế
    downloadJson(`pk-dr-minh-backup-truoc-khi-nap-${timestampForFile()}.json`, state.importBackup);
    await new Promise((resolve) => setTimeout(resolve, 500));
    const result = await fetchJson("/api/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(state.importData)
    });
    refs.importModal.close();
    state.importData = null;
    state.importBackup = null;
    createNewPatient();
    await initializeApp();
    const counts = Object.keys(IMPORT_LABELS).map((key) => `${formatNumber(result.counts[key])} ${IMPORT_LABELS[key].toLowerCase()}`).join(", ");
    showToast(`Đã nạp dữ liệu: ${counts}.`, "success", 6000);
  } catch (error) {
    setAuthMessage(refs.importMsg, error.message);
  } finally {
    setBusy(refs.importConfirmBtn, false);
    refs.importConfirmBtn.disabled = refs.importConfirm.value !== "NAP";
  }
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
  document.querySelectorAll("[data-clinic-name]").forEach((element) => { element.textContent = state.clinicInfo.name; });
  refs.authClinicName.textContent = state.clinicInfo.name;
  try { localStorage.setItem(CLINIC_NAME_CACHE_KEY, state.clinicInfo.name); } catch {}
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
  const send = () => fetch(resolveApiUrl(url), {
    ...options,
    credentials: "same-origin",
    headers: { ...options.headers, ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}) }
  });
  let response = await send();
  if (response.status === 401 && !String(url).startsWith("/api/auth/")) {
    try {
      await refreshAccessToken();
    } catch (error) {
      if (error instanceof AuthExpiredError) {
        endSession();
        throw error;
      }
      throw error;
    }
    response = await send();
  }
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
function showToast(message, type = "success", duration = 2600) {
  clearTimeout(state.toastTimer);
  refs.toast.textContent = message;
  refs.toast.className = `toast ${type}`;
  state.toastTimer = setTimeout(() => { refs.toast.className = "toast hidden"; }, duration);
}
function handleError(error) {
  if (error instanceof AuthExpiredError) return;
  console.error(error);
  showToast(error.message || "Đã xảy ra lỗi.", "error");
}
