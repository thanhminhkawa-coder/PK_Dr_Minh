const CLINIC_STORAGE_KEY = "pk_clinic_info_v3";
const ICD_STORAGE_KEY = "pk_icd_list_v1";
const CLINIC_NAME_CACHE_KEY = "pk_clinic_name";
const NOTICE_KEY = "pk_notice";
// ponytail: phân trang client, chuyển sang server-side khi > ~5000 hồ sơ
const pageSize = () => (phoneLayoutQuery.matches ? 8 : 10); // số hàng mỗi trang: điện thoại 8, còn lại 10
const TABS = ["home", "patients", "stock", "stats", "clinic"];
const WHEEL_ITEM_HEIGHT = 44;
const WHEEL_MIN_YEAR = 1920;
const WHEEL_DEFAULT_YEAR = 1980;
const DEFAULT_SERVICE_FEE = 200000;
const DOSE_FIELDS = ["morning", "noon", "night"];
const DOSE_LABELS = { morning: "Sáng", noon: "Trưa", night: "Tối" };
const DOSE_OPTIONS = ["0", "0.25", "0.5", "1", "1.5", "2", "3", "4", "5", "6"];
const QUANTITY_OPTIONS = Array.from({ length: 194 }, (_, index) => String(index + 7));
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
  patients: [],
  filteredPatients: [],
  page: 1,
  dateFilter: "", // yyyy-mm-dd: chỉ giữ bệnh nhân có ít nhất một lần khám vào ngày này
  scrollMode: (() => { try { return localStorage.getItem("patientListMode") !== "pages"; } catch { return true; } })(), // true: cuộn vô hạn, false: phân trang
  shown: 0, // số hàng đã hiện ở chế độ cuộn
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
  stockOpen: new Set(),
  patientOpen: new Set(),
  patientRxOpen: new Set(),
  patientRxCache: new Map(), // id -> { date, items } toa lần khám gần nhất
  editingDrugId: "",
  icdList: getDefaultIcdList(),
  selectedIcdCode: "",
  editingIcdCode: "",
  deletingIcdCode: "",
  deletingDrugId: "",
  icdSearch: "",
  stockSearch: "",
  stockInId: "",
  clinicInfo: { ...DEFAULT_CLINIC_INFO },
  clinicProfiles: [],
  activeClinicProfileId: "",
  toastTimer: null,
  moneyOverrides: { drug: null, service: null },
  user: null,
  importData: null,
  wheel: null
};

const refs = {};

const phoneLayoutQuery = window.matchMedia("(max-width: 767px)");
// điện thoại / màn cảm ứng: năm sinh chỉ chọn bằng bánh xe, không bật bàn phím
const wheelOnlyQuery = window.matchMedia("(pointer: coarse), (max-width: 767px)");

window.addEventListener("DOMContentLoaded", () => {
  cacheRefs();
  bindEvents();
  bindScrollChaining();
  renderClinicInfo();
  seedForm();
  syncBirthYearMode();
  updateSaveButtons();
  bootAuth();
});

function cacheRefs() {
  [
    "splash", "authScreen", "appRoot", "authClinicName", "loginForm", "loginEmail", "loginPassword", "loginPasswordToggle",
    "loginMsg", "loginSubmit", "showForgotBtn", "forgotForm", "forgotEmail", "forgotMsg", "forgotSubmit", "forgotIntro", "forgotStepEmail", "forgotStepCode", "forgotStepNew", "forgotOtp", "forgotResendBtn",
    "resetPassword", "resetPassword2", "accountEmail", "passwordModal", "pwIntro", "pwStepCode", "pwStepNew", "pwOtp", "pwNew", "pwNew2", "pwResendBtn", "pwMsg", "pwSendBtn", "pwConfirmBtn", "saveFab", "newFab", "importFile",
    "statsModal", "statsTitle", "statsRange", "statsFrom", "statsTo", "statsMetric", "statsBody", "patientCountText", "searchInput", "dateFilter", "dateFilterInput", "patientListToggle", "patientList",
    "patientListBody", "patientPager", "newBtn", "visitPicker",
    "newPrescriptionBtn", "icdEditSingle", "icdEditMulti", "icdMultiList", "icdAddRowBtn", "icdView", "stockInModal", "stockInName", "stockInCurrent", "stockInAfter", "stockInQty", "stockInConfirmBtn", "stockAddModal", "stockPasteInput", "stockPasteApplyBtn", "stockManualBtn", "icdEditModal", "icdEditTitle", "icdDeleteModal", "icdDeleteText", "icdDeleteConfirmBtn", "drugDeleteModal", "drugDeleteText", "drugDeleteConfirmBtn", "icdEditCode", "icdEditName", "icdEditSaveBtn", "visitDate", "patientName", "birthYear", "birthYearWrap", "yearSuggestBox", "age", "gender", "addressWard",
    "province", "provinceSuggestBox", "phone", "visitDoctor", "symptom", "symptomSuggestBox", "icdInput", "icdSuggestBox", "codeDataMore", "stockDataMore",
    "codeDataBox", "previewPrintBtn", "addDrugBtn", "drugSummary", "drugRows", "drugAddBar", "stockDataBox", "stockTabBox",
    "followDate", "serviceFee", "adviceNote", "drugMoney", "serviceMoney", "totalMoney",
    "statVisitsToday", "statAppointmentsToday", "statAppointmentsArrived", "statRevenueToday", "statVisitsMonth", "statVisitsMonthLabel",
    "statPatientsTotal", "statPatientsNew", "statRevisitRate", "statRevisitSub", "statRevenueMonth", "statRevenueMonthLabel", "toast", "rxModal", "rxFrame", "rxPrintBtn", "rxShareBtn",
    "rxCloseBtn", "clinicDisplayName", "clinicDisplayDoctor", "clinicDisplayAddress", "clinicDisplayHours",
    "clinicDisplayPhone", "clinicModal", "clinicModalTitle", "clinicDeleteModal", "clinicDeleteText", "clinicDeleteConfirmBtn", "clinicProfileSelect", "addClinicBtn", "deleteClinicBtn",
    "toggleClinicBtn", "saveClinicBtn", "clinicNameInput", "clinicDoctorInput",
    "clinicAddressInput", "clinicHoursInput", "clinicPhoneInput", "activeIngredientList",
    "doctorList", "serviceFeeList", "serviceFeeSuggestBox",
    "drugModal", "drugForm", "dmActive", "dmBrand", "dmUnit", "dmQuantity", "dmPrice", "dmUsage", "dmNotes", "dmDeleteBtn",
    "dmSaveBtn", "drugModalTitle", "drugModalMsg",
    "importModal", "importMeta", "importTable", "importConfirm", "importConfirmBtn", "importMsg",
    "yearWheelLayer", "yearWheelPanel", "yearWheel", "themeMenuBtn"
  ].forEach((id) => {
    refs[id] = document.getElementById(id);
  });
}

// ---- Giao diện Sáng / Tối / Theo hệ thống (lưu theo thiết bị ở localStorage, không lên server) ----

const THEME_KEY = "pk-theme";
const darkSchemeQuery = window.matchMedia("(prefers-color-scheme: dark)");

function getThemePref() {
  try {
    const value = localStorage.getItem(THEME_KEY);
    return value === "light" || value === "dark" ? value : "system";
  } catch {
    return "system";
  }
}

function setThemePref(value) {
  try {
    localStorage.setItem(THEME_KEY, value);
  } catch {
    // trình duyệt chặn bộ nhớ: vẫn áp dụng cho phiên hiện tại
  }
  applyTheme(value);
}

function applyTheme(pref = getThemePref()) {
  const dark = pref === "dark" || (pref === "system" && darkSchemeQuery.matches);
  document.documentElement.dataset.theme = dark ? "dark" : "light";
  document.querySelectorAll("[data-theme-btn]").forEach((button) => {
    button.querySelector("use").setAttribute("href", dark ? "#i-sun" : "#i-moon");
    button.querySelector("span").textContent = dark ? "Giao diện sáng" : "Giao diện tối";
  });
  // chọn cố định thì thanh trình duyệt đổi màu theo; theo hệ thống thì mỗi thẻ meta tự theo media
  const [light, night] = document.querySelectorAll('meta[name="theme-color"]');
  if (light && night) {
    light.content = pref === "dark" ? "#242528" : "#ffffff";
    night.content = pref === "light" ? "#ffffff" : "#242528";
  }
}

// Điện thoại: bảng cuộn lồng trong trang. Safari/Chrome "dính" cử chỉ vào bảng nên đang vuốt liên tục mà chạm đáy/đầu bảng thì trang không cuộn tiếp.
// Khi bảng đã hết chỗ cuộn theo hướng đang vuốt, tự cuộn trang thay, rồi cho trôi tiếp (quán tính giả lập) lúc nhả tay.
function bindScrollChaining() {
  const SCROLLERS = "#patientListBody, .code-manager__list, .stock-list";
  const atEdge = (el, dy) => (dy > 0 ? el.scrollTop + el.clientHeight >= el.scrollHeight - 1 : el.scrollTop <= 0);
  let lastY = 0;
  let lastT = 0;
  let velocity = 0; // px/ms, dương = cuộn xuống
  let driving = false; // trang đang được cuộn bằng tay trong cử chỉ này
  let glide = 0;
  const stopGlide = () => { cancelAnimationFrame(glide); glide = 0; };
  const startGlide = () => {
    let prev = performance.now();
    const step = (now) => {
      const dt = Math.min(now - prev, 32);
      prev = now;
      window.scrollBy(0, velocity * dt);
      velocity *= Math.pow(0.95, dt / 16);
      glide = Math.abs(velocity) > 0.02 ? requestAnimationFrame(step) : 0;
    };
    glide = requestAnimationFrame(step);
  };
  document.addEventListener("touchstart", (event) => {
    stopGlide();
    lastY = event.touches[0].clientY;
    lastT = event.timeStamp;
    velocity = 0;
    driving = false;
  }, { passive: true });
  document.addEventListener("touchmove", (event) => {
    const y = event.touches[0].clientY;
    const dy = lastY - y;
    const dt = event.timeStamp - lastT;
    lastY = y;
    lastT = event.timeStamp;
    const box = phoneLayoutQuery.matches && event.target.closest?.(SCROLLERS);
    if (!box || !dy || !atEdge(box, dy)) { driving = false; return; }
    event.preventDefault();
    window.scrollBy(0, dy);
    if (dt > 0) velocity = velocity * 0.6 + (dy / dt) * 0.4;
    driving = true;
  }, { passive: false });
  const release = () => {
    if (driving && Math.abs(velocity) > 0.05) startGlide();
    driving = false;
  };
  document.addEventListener("touchend", release, { passive: true });
  document.addEventListener("touchcancel", release, { passive: true });
  document.addEventListener("wheel", (event) => {
    const box = phoneLayoutQuery.matches && event.target.closest?.(SCROLLERS);
    if (!box || !event.deltaY || !atEdge(box, event.deltaY)) return;
    event.preventDefault();
    window.scrollBy(0, event.deltaY);
  }, { passive: false });
}

function bindEvents() {
  darkSchemeQuery.addEventListener("change", () => { if (getThemePref() === "system") applyTheme(); });
  applyTheme();
  document.addEventListener("click", handleAppAction);
  window.addEventListener("hashchange", () => {
    if (!refs.appRoot.classList.contains("hidden")) applyTabFromHash();
  });
  let resizeFrame = 0;
  window.addEventListener("resize", () => {
    cancelAnimationFrame(resizeFrame);
    resizeFrame = requestAnimationFrame(() => { fitPatientListHeight(); syncFollowDateWidth(); });
  });
  phoneLayoutQuery.addEventListener("change", () => {
    updateSaveButtons();
    renderPatientList();
    renderDrugRows();
  });
  wheelOnlyQuery.addEventListener("change", () => {
    updateShareButton();
    syncBirthYearMode();
    closeYearWheel();
  });

  refs.loginForm.addEventListener("submit", handleLoginSubmit);
  refs.forgotForm.addEventListener("submit", handleForgotSubmit);
  // điện thoại: đang gõ (bàn phím mở) thì ẩn thanh nav dưới và nút lưu để chúng không bị đẩy lên theo bàn phím
  // chỉ các ô thật sự bật bàn phím; ô dùng vòng quay (inputmode none / readonly) và ô chọn ngày gốc (date) thì không,
  // nếu không nút lưu bị ẩn oan trong lúc chọn ngày / vòng quay
  const isTypingField = (el) => el?.matches?.("input:not([type=checkbox],[type=radio],[type=button],[type=submit],[type=file],[type=hidden],[type=date],[type=time],[readonly],[inputmode=none]), textarea:not([readonly]), select");
  let kbTimer;
  document.addEventListener("focusin", (event) => {
    if (!phoneLayoutQuery.matches || !isTypingField(event.target)) return;
    clearTimeout(kbTimer);
    document.body.classList.add("kb-open");
  });
  document.addEventListener("focusout", () => {
    clearTimeout(kbTimer);
    kbTimer = setTimeout(() => {
      if (!isTypingField(document.activeElement)) document.body.classList.remove("kb-open");
    }, 100);
  });
  // Safari: chạm ra ngoài hay bấm "Xong" có khi đóng bàn phím mà ô vẫn giữ focus (không có focusout).
  // Theo dõi chiều cao vùng nhìn thấy: bàn phím đóng (cao trở lại gần như ban đầu) thì hiện lại nút lưu + thanh nav.
  if (window.visualViewport) {
    let fullHeight = window.visualViewport.height;
    window.addEventListener("orientationchange", () => { fullHeight = 0; });
    window.visualViewport.addEventListener("resize", () => {
      const height = window.visualViewport.height;
      fullHeight = Math.max(fullHeight, height);
      const keyboardOpen = height < fullHeight - 150;
      if (!keyboardOpen) document.body.classList.remove("kb-open");
      else if (phoneLayoutQuery.matches && isTypingField(document.activeElement)) document.body.classList.add("kb-open");
    });
  }
  window.addEventListener("scroll", () => document.querySelectorAll(".stock-menu").forEach((menu) => menu.classList.add("hidden")), { passive: true });
  // điện thoại: chạm ra ngoài (vùng tối) thì đóng hộp thoại
  document.addEventListener("click", (event) => {
    const dialog = event.target;
    if (!phoneLayoutQuery.matches || dialog.tagName !== "DIALOG" || !dialog.open || dialog.classList.contains("modal--full")) return;
    const rect = dialog.getBoundingClientRect();
    const inside = event.clientX >= rect.left && event.clientX <= rect.right && event.clientY >= rect.top && event.clientY <= rect.bottom;
    if (!inside) dialog.close();
  });
  // điện thoại: bàn phím mở thì hộp thoại (bottom sheet) trượt lên trên bàn phím một lần, mượt; đóng bàn phím thì trượt về
  const openSheet = () => document.querySelector("dialog.modal[open]:not(.modal--full)");
  const typingInSheet = (dialog) => dialog.contains(document.activeElement) && document.activeElement.matches("input, textarea");
  const opensKeyboard = (element) => element?.matches?.("input:not([type=checkbox],[type=radio],[type=button],[type=submit],[type=file],[type=hidden]), textarea") && !element.readOnly && !element.disabled;

  // (1) Khóa cuộn trang khi có hộp thoại mở. Safari trên iPhone cuộn cả trang để "đưa ô nhập vào tầm nhìn" mỗi lần
  // chuyển ô (overflow: hidden không chặn được kiểu cuộn này); trang Home dài nên cuộn nhiều, hộp thoại giật mạnh.
  // Ghim trang ở đầu bằng margin âm cho body, có cuộn nào thì kéo về ngay; đóng hộp thoại thì trả lại vị trí cũ.
  let lockedScrollY = null;
  const lockPageScroll = () => {
    if (lockedScrollY !== null || !phoneLayoutQuery.matches) return;
    lockedScrollY = window.scrollY;
    document.body.style.marginTop = `-${lockedScrollY}px`;
    window.scrollTo(0, 0);
  };
  const unlockPageScroll = () => {
    if (lockedScrollY === null || document.querySelector("dialog.modal[open]")) return;
    const y = lockedScrollY;
    lockedScrollY = null;
    document.body.style.marginTop = "";
    window.scrollTo(0, y);
  };
  window.addEventListener("scroll", () => {
    if (lockedScrollY !== null && window.scrollY !== 0) window.scrollTo(0, 0);
  });
  // chỉ hộp thoại (thẻ <details> cũng có thuộc tính open nhưng không liên quan)
  new MutationObserver((records) => records.forEach(({ target }) => {
    if (!target.matches?.("dialog.modal")) return;
    if (target.open) lockPageScroll();
    else unlockPageScroll();
  }))
    .observe(document.body, { subtree: true, attributes: true, attributeFilter: ["open"] });

  // hộp thoại không vuốt kéo được: chỉ vùng bên trong thật sự cuộn được mới nhận cử chỉ vuốt, và hết đầu/cuối thì
  // chặn luôn (không chuyền sang trang phía sau, vì Safari sẽ kéo cả hộp thoại giật)
  let dragY = 0;
  let dragX = 0;
  document.addEventListener("touchstart", (event) => { dragY = event.touches[0].clientY; dragX = event.touches[0].clientX; }, { passive: true, capture: true });
  document.addEventListener("touchmove", (event) => {
    if (lockedScrollY === null || !event.cancelable || !event.target.closest?.("dialog.modal[open]")) return;
    const dy = event.touches[0].clientY - dragY;
    // vuốt ngang trong vùng cuộn ngang (biểu đồ thống kê): cho cuộn bình thường
    if (Math.abs(event.touches[0].clientX - dragX) > Math.abs(dy)) {
      for (let el = event.target; el && el.tagName !== "DIALOG"; el = el.parentElement) {
        if (el.scrollWidth > el.clientWidth + 1 && /auto|scroll/.test(getComputedStyle(el).overflowX)) return;
      }
    }
    for (let el = event.target; el && el.tagName !== "DIALOG"; el = el.parentElement) {
      if (el.scrollHeight <= el.clientHeight + 1 || !/auto|scroll/.test(getComputedStyle(el).overflowY)) continue;
      const atTop = el.scrollTop <= 0;
      const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 1;
      if ((dy > 0 && atTop) || (dy < 0 && atBottom)) break; // đã hết đầu/cuối: chặn
      return; // cuộn bình thường
    }
    event.preventDefault();
  }, { passive: false });
  // (2) Không để Safari tự cuộn khi focus ô nhập trong hộp thoại: dời ô ra khỏi màn hình đúng 1 khung hình lúc focus
  // (Safari thấy ô ở phía trên nên không cuộn gì), giữ nguyên vị trí cuộn bên trong hộp thoại, rồi trả ô về chỗ cũ.
  const focusWithoutScroll = (input) => {
    const scroller = input.closest(".modal__body");
    const keep = scroller?.scrollTop;
    input.style.transform = "translateY(-2000px)";
    if (document.activeElement !== input) input.focus({ preventScroll: true });
    let restored = false;
    const restore = () => {
      if (restored) return;
      restored = true;
      input.style.transform = "";
      if (scroller) scroller.scrollTop = keep;
      // ô chuyển tới bằng mũi tên trên bàn phím có thể nằm ngoài phần đang thấy của hộp thoại: cuộn trong hộp thoại thôi
      if (!scroller) return;
      const box = scroller.getBoundingClientRect();
      const rect = input.getBoundingClientRect();
      if (rect.bottom > box.bottom) scroller.scrollTop += rect.bottom - box.bottom + 12;
      else if (rect.top < box.top) scroller.scrollTop -= box.top - rect.top + 12;
    };
    requestAnimationFrame(restore);
    setTimeout(restore, 100); // dự phòng khi trình duyệt không chạy khung hình (tab ẩn)
  };
  let sheetTouch = null;
  document.addEventListener("touchstart", (event) => {
    sheetTouch = { x: event.touches[0].clientX, y: event.touches[0].clientY };
  }, { passive: true, capture: true });
  document.addEventListener("touchend", (event) => {
    const target = event.target;
    if (lockedScrollY === null || !opensKeyboard(target) || target === document.activeElement || !openSheet()?.contains(target)) return;
    const touch = event.changedTouches[0];
    // vuốt để cuộn nội dung hộp thoại (bắt đầu trên ô nhập) thì để yên, chỉ xử lý cú chạm
    if (sheetTouch && Math.hypot(touch.clientX - sheetTouch.x, touch.clientY - sheetTouch.y) > 10) return;
    event.preventDefault();
    focusWithoutScroll(target);
  }, { passive: false, capture: true });

  // (3) Nâng hộp thoại lên trên bàn phím MỘT lần rồi giữ nguyên vị trí (chuyển ô nhập, cuộn đều không đổi);
  // chỉ hạ xuống khi không còn ô nhập nào giữ con trỏ. Nhớ chiều cao bàn phím lần trước để lần sau nâng ngay cùng lúc bàn phím trượt lên.
  let settleTimer;
  // nhớ chiều cao bàn phím qua các lần mở trang; lần đầu chưa đo được thì đoán theo màn hình (~40%), đo xong chỉnh lại
  let lastKeyboard = 0;
  try { lastKeyboard = Number(localStorage.getItem("kbHeight")) || 0; } catch {}
  const setSheetLift = (dialog, value, locked) => {
    dialog.style.setProperty("--kb", `${value}px`);
    dialog.classList.toggle("kb-up", value > 0);
    if (locked) dialog.dataset.kbLocked = "1";
    else delete dialog.dataset.kbLocked;
  };
  const settleSheet = () => {
    clearTimeout(settleTimer);
    settleTimer = setTimeout(() => {
      const vv = window.visualViewport;
      const dialog = openSheet();
      if (!vv || !dialog || !phoneLayoutQuery.matches) return;
      if (!typingInSheet(dialog)) {
        setSheetLift(dialog, 0, false);
        return;
      }
      if (dialog.dataset.kbLocked) return;
      const keyboard = Math.round(Math.max(0, window.innerHeight - vv.height - vv.offsetTop));
      if (keyboard < 80) return; // bàn phím chưa lên hẳn: chờ lần đo sau
      lastKeyboard = keyboard;
      try { localStorage.setItem("kbHeight", keyboard); } catch {}
      setSheetLift(dialog, keyboard, true);
    }, 80);
  };
  window.visualViewport?.addEventListener("resize", settleSheet);
  // đóng hộp thoại thì xóa độ nâng cũ, nếu không lần mở sau bị lệch
  document.addEventListener("close", (event) => {
    if (event.target.style) setSheetLift(event.target, 0, false);
  }, true);
  document.addEventListener("focusin", (event) => {
    const dialog = openSheet();
    if (!phoneLayoutQuery.matches || !dialog?.contains(event.target) || !opensKeyboard(event.target)) return;
    // chuyển ô bằng mũi tên trên bàn phím: cũng chặn Safari tự cuộn
    if (lockedScrollY !== null) focusWithoutScroll(event.target);
    if (!dialog.dataset.kbLocked && (parseFloat(dialog.style.getPropertyValue("--kb")) || 0) === 0) {
      dialog.style.setProperty("--kb", `${lastKeyboard || Math.round(window.innerHeight * 0.4)}px`);
      dialog.classList.add("kb-up");
    }
    settleSheet();
  });
  document.addEventListener("focusout", () => setTimeout(settleSheet, 50));
  // điện thoại: bàn phím bật lên thì thẻ đăng nhập trượt lên vừa đủ để không bị che, rời ô nhập thì trượt về giữa
  const authCard = refs.authScreen.querySelector(".auth__card");
  let authKbTimer;
  let authShift = 0;
  // Chạm ô nhập: đặt thẻ lên NGAY (đoán chiều cao bàn phím từ lần trước) cùng lúc bàn phím trượt lên, rồi chỉnh lại đúng một lần khi bàn phím ổn định.
  // Trước đây thẻ đứng yên rồi mới nhích sau 350ms, và Safari tự cuộn trang nên bị giật hai lần.
  let authSettle;
  const authKeyboard = () => {
    let saved = 0;
    try { saved = Number(localStorage.getItem("kbHeight")) || 0; } catch {}
    return saved || Math.round(window.innerHeight * 0.4);
  };
  const shiftAuthCard = (keyboardHeight) => {
    const rect = authCard.getBoundingClientRect();
    const visibleBottom = window.innerHeight - keyboardHeight - 16;
    const next = Math.min(Math.max(rect.bottom + authShift - visibleBottom, 0), Math.max(rect.top + authShift - 8, 0));
    if (Math.abs(next - authShift) < 6) return;
    authShift = next;
    authCard.style.setProperty("--kb-shift", `${-authShift}px`);
  };
  const fitAuthCard = () => {
    const vv = window.visualViewport;
    if (!vv || !phoneLayoutQuery.matches || !refs.authScreen.contains(document.activeElement)) return;
    clearTimeout(authSettle);
    authSettle = setTimeout(() => {
      const keyboard = Math.round(Math.max(0, window.innerHeight - vv.height - vv.offsetTop));
      if (keyboard < 80) return;
      try { localStorage.setItem("kbHeight", keyboard); } catch {}
      shiftAuthCard(keyboard);
    }, 120);
  };
  // chặn Safari tự cuộn trang khi chạm ô nhập (nguyên nhân giật), chỉ focus
  refs.authScreen.addEventListener("touchend", (event) => {
    const input = event.target.closest("input");
    if (!input || input === document.activeElement || !phoneLayoutQuery.matches) return;
    event.preventDefault();
    input.focus({ preventScroll: true });
  }, { passive: false });
  refs.authScreen.addEventListener("focusin", (event) => {
    if (!event.target.matches("input") || !phoneLayoutQuery.matches) return;
    clearTimeout(authKbTimer);
    shiftAuthCard(authKeyboard());
    fitAuthCard();
  });
  refs.authScreen.addEventListener("focusout", () => {
    clearTimeout(authKbTimer);
    authKbTimer = setTimeout(() => {
      if (refs.authScreen.contains(document.activeElement)) return;
      authShift = 0;
      authCard.style.setProperty("--kb-shift", "0px");
    }, 150);
  });
  window.visualViewport?.addEventListener("resize", fitAuthCard);
  refs.forgotResendBtn.addEventListener("click", sendForgotCode);
  [refs.forgotOtp].forEach((el) => { el.addEventListener("input", handleOtpInput); el.addEventListener("keydown", handleOtpKeydown); });
  refs.showForgotBtn.addEventListener("click", () => {
    refs.forgotEmail.value = refs.loginEmail.value;
    openForgot();
  });
  refs.loginPasswordToggle.addEventListener("click", toggleLoginPassword);
  refs.pwSendBtn.addEventListener("click", sendPasswordCode);
  refs.pwResendBtn.addEventListener("click", sendPasswordCode);
  refs.pwConfirmBtn.addEventListener("click", confirmPasswordChange);
  refs.pwOtp.addEventListener("input", handleOtpInput);
  refs.pwOtp.addEventListener("keydown", handleOtpKeydown);
  document.addEventListener("click", (event) => {
    const eye = event.target.closest("[data-pw-eye]");
    if (eye) { const input = document.getElementById(eye.dataset.pwEye); setPasswordVisible(input, input.type === "password"); }
  });
  refs.passwordModal.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && (event.target === refs.pwNew || event.target === refs.pwNew2)) confirmPasswordChange();
  });

  refs.patientListToggle.addEventListener("click", () => {
    state.patientListOpen = !state.patientListOpen;
    if (!state.patientListOpen) {
      // đóng nút sổ thì xóa luôn thanh tìm kiếm
      state.wasSearching = false;
      refs.searchInput.value = "";
      applySearch("");
    }
    syncPatientListVisibility();
  });
  refs.searchInput.addEventListener("input", handleSearchInput);
  refs.searchInput.addEventListener("keydown", handleSearchKeydown);
  refs.patientListBody.addEventListener("click", handlePatientListClick);
  refs.patientListBody.addEventListener("dblclick", handlePatientListClick);
  refs.patientListBody.addEventListener("keydown", handlePatientListKeydown);
  refs.patientPager.addEventListener("click", handlePagerClick);
  refs.patientListBody.addEventListener("scroll", loadMorePatients, { passive: true });
  enhanceDateInput(refs.dateFilterInput);
  [refs.statsFrom, refs.statsTo].forEach(enhanceDateInput);
  refs.statsFrom.addEventListener("change", loadStatsChart);
  refs.statsTo.addEventListener("change", loadStatsChart);
  refs.statsFrom.addEventListener("input", loadStatsChart);
  refs.statsTo.addEventListener("input", loadStatsChart);
  refs.statsMetric.addEventListener("click", (event) => {
    const btn = event.target.closest("[data-metric]");
    if (!btn) return;
    statsMetric = btn.dataset.metric;
    renderStatsChart();
  });
  document.getElementById("panel-stats").addEventListener("click", (event) => {
    const card = event.target.closest("[data-stat]");
    if (card) openStatsModal(card.dataset.stat).catch(handleError);
  });
  document.getElementById("panel-stats").addEventListener("keydown", (event) => {
    const card = event.target.closest("[data-stat]");
    if (card && (event.key === "Enter" || event.key === " ")) { event.preventDefault(); openStatsModal(card.dataset.stat).catch(handleError); }
  });
  // gõ tay: lọc khi đủ ngày hợp lệ, thiếu/xóa thì bỏ lọc; chọn từ lịch thì đi qua sự kiện change
  refs.dateFilterInput.addEventListener("input", () => applyDateFilter(refs.dateFilterInput.value));
  refs.dateFilterInput.addEventListener("change", () => applyDateFilter(refs.dateFilterInput.value));
  refs.visitPicker.addEventListener("click", handleVisitPickerClick);
  refs.visitPicker.addEventListener("keydown", handleVisitPickerKeydown);
  [refs.visitDate, refs.followDate].forEach(enhanceDateInput);
  syncFollowDateWidth();
  refs.birthYear.addEventListener("input", handleBirthYearInput);
  refs.birthYear.addEventListener("click", () => { if (!refs.birthYear.dataset.kb) openYearWheel(); });
  refs.age.addEventListener("input", () => {
    refs.age.value = refs.age.value.replace(/\D/g, "").slice(0, 3);
    calcBirthYear();
  });
  refs.age.addEventListener("click", () => { if (!refs.age.dataset.kb) openYearWheel("age", { anchor: refs.age }); });
  // gõ bằng bàn phím xong (rời ô) thì ô quay lại dùng vòng quay
  [refs.birthYear, refs.age, refs.serviceMoney].forEach((input) => input.addEventListener("blur", () => {
    if (!input.dataset.kb) return;
    delete input.dataset.kb;
    syncBirthYearMode();
  }));
  initToastDismiss();
  updateShareButton();
  // mọi thao tác sửa form (gõ, chọn, vòng quay, nút) đều kiểm tra lại chấm chưa lưu
  let dirtyFrame = 0;
  ["input", "change", "click", "keyup"].forEach((type) => document.addEventListener(type, () => {
    clearTimeout(dirtyFrame);
    dirtyFrame = setTimeout(updateVisitDirtyDot, 30);
  }, true));
  document.fonts?.ready.then(() => fitPatientListHeight());
  document.addEventListener("input", syncWheelToTypedValue);
  document.addEventListener("keydown", handleWheelInputKeydown);
  refs.yearWheelLayer.addEventListener("click", handleYearWheelClick);
  refs.yearWheelLayer.addEventListener("keydown", handleYearWheelKeydown);
  refs.yearWheel.addEventListener("scroll", scheduleYearWheelUpdate, { passive: true });
  refs.province.addEventListener("input", handleProvinceInput);
  refs.province.addEventListener("focus", () => showProvinceSuggestions(refs.province.value));
  refs.symptom.addEventListener("input", handleSymptomInput);
  refs.symptom.addEventListener("focus", () => renderSymptomSuggestions(refs.symptom.value));
  refs.codeDataMore.addEventListener("toggle", () => {
    refs.codeDataBox.classList.toggle("hidden", !refs.codeDataMore.open);
    if (refs.codeDataMore.open && document.getElementById("codeRows")) renderCodeRows();
  });
  refs.icdInput.addEventListener("input", renderIcdSuggest);
  refs.icdInput.addEventListener("input", handleDiagnosisInput);
  refs.icdInput.addEventListener("input", () => autoGrowField(refs.icdInput));
  refs.icdInput.addEventListener("focus", renderIcdSuggest);
  refs.icdInput.addEventListener("focus", () => autoGrowField(refs.icdInput));
  refs.icdInput.addEventListener("blur", () => autoGrowField(refs.icdInput));
  refs.icdView.addEventListener("click", () => refs.icdInput.focus());
  refs.icdInput.addEventListener("click", renderIcdSuggest);
  refs.icdInput.addEventListener("change", handleDiagnosisInput);
  refs.codeDataBox.addEventListener("click", handleCodeDataClick);
  refs.codeDataBox.addEventListener("dblclick", handleCodeDataClick);
  refs.icdEditSaveBtn.addEventListener("click", saveIcdEdit);
  refs.icdDeleteConfirmBtn.addEventListener("click", confirmIcdDelete);
  refs.drugDeleteConfirmBtn.addEventListener("click", confirmDrugDelete);
  refs.icdMultiList.addEventListener("input", (event) => {
    if (event.target.classList.contains("icd-row__name")) autoGrowField(event.target);
  });
  refs.codeDataBox.addEventListener("input", (event) => {
    if (event.target.id !== "icdSearchInput") return;
    state.icdSearch = event.target.value;
    renderCodeRows();
  });
  refs.icdEditModal.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" || !["INPUT", "TEXTAREA"].includes(event.target.tagName)) return;
    if (!refs.icdEditMulti.classList.contains("hidden")) {
      // nhập nhiều mã: Enter ở ô mã thì sang ô tên; Enter ở ô tên của dòng cuối thì thêm dòng mới
      event.preventDefault();
      const row = event.target.closest(".icd-row");
      if (event.target.classList.contains("icd-row__code")) row.querySelector(".icd-row__name").focus();
      else if (row === refs.icdMultiList.lastElementChild) addIcdRow(true);
      else row.nextElementSibling.querySelector(".icd-row__code").focus();
      return;
    }
    saveIcdEdit();
  });
  // bấm Thêm mã / xóa dòng không lấy focus khỏi ô đang gõ, và giữ nguyên trạng thái bàn phím:
  // đang bật (đang có ô nhập được chọn) thì vẫn bật, đang tắt thì vẫn tắt
  const icdKeyboardOn = () => refs.icdEditModal.contains(document.activeElement) && document.activeElement.matches("input, textarea");
  ["pointerdown", "mousedown"].forEach((type) => {
    refs.icdAddRowBtn.addEventListener(type, (event) => event.preventDefault());
    refs.icdMultiList.addEventListener(type, (event) => { if (event.target.closest(".icd-row__del")) event.preventDefault(); });
  });
  refs.icdAddRowBtn.addEventListener("click", () => addIcdRow(!phoneLayoutQuery.matches || icdKeyboardOn()));
  refs.icdMultiList.addEventListener("click", (event) => {
    const del = event.target.closest(".icd-row__del");
    if (!del) return;
    const keyboardOn = icdKeyboardOn();
    const row = del.closest(".icd-row");
    const hadFocus = row.contains(document.activeElement);
    const neighbour = row.nextElementSibling || row.previousElementSibling;
    row.remove();
    if (!refs.icdMultiList.children.length) addIcdRow(keyboardOn);
    else if (hadFocus && keyboardOn) neighbour?.querySelector(".icd-row__code").focus({ preventScroll: true }); // ô đang gõ bị xóa: chuyển sang dòng bên cạnh để bàn phím không tắt
    renumberIcdRows();
  });
  refs.stockDataMore.addEventListener("toggle", () => {
    refs.stockDataBox.classList.toggle("hidden", !refs.stockDataMore.open);
    if (refs.stockDataMore.open) renderStockData();
  });
  refs.addDrugBtn.addEventListener("click", () => {
    state.draftRows.push(createDraftRow());
    renderDrugRows();
    updateTotals();
  });
  // dòng thuốc và thanh thêm thuốc (nằm riêng bên dưới) dùng chung các xử lý
  [refs.drugRows, refs.drugAddBar].forEach((box) => {
    box.addEventListener("input", handleDrugRowChange);
    box.addEventListener("change", handleDrugRowChange);
    box.addEventListener("focusin", handleDrugRowChange);
    box.addEventListener("focusout", handleDrugRowChange);
    box.addEventListener("click", handleDrugRowClick);
    box.addEventListener("focusin", showDrugSearchSuggest);
    box.addEventListener("input", showDrugSearchSuggest);
    box.addEventListener("pointerdown", (event) => {
      // bấm nút chọn nhanh không làm ô nhập mất focus (và đóng bảng chọn trước khi click kịp xảy ra)
      if (event.target.closest(".dose-quick, .quantity-quick, .drug-suggest")) event.preventDefault();
    });
  });
  document.getElementById("patientRowMenu").addEventListener("click", (event) => {
    const item = event.target.closest("[data-action]");
    const menu = event.currentTarget;
    menu.classList.add("hidden");
    refs.patientListBody.querySelector(`.patient-row[data-id="${menu.dataset.id}"] .pr-card ${{ remove: ".del-patient", rx: ".pt-rx" }[item?.dataset.action] || ".pt-toggle"}`)?.click();
  });
  document.getElementById("drugRowMenu").addEventListener("click", (event) => {
    const item = event.target.closest("[data-action]");
    const menu = event.currentTarget;
    menu.classList.add("hidden");
    // chuyển thành bấm vào nút ẩn tương ứng trong dòng thuốc
    refs.drugRows.querySelector(`.drug-row[data-key="${menu.dataset.key}"] [data-action="${item?.dataset.action}"]`)?.click();
  });
  // gõ tay xong (rời ô) thì ô quay lại dùng vòng quay
  // bấm vào nhãn "Âm kho" trong toa: mở thẳng hộp Nhập kho của thuốc đó
  refs.drugRows.addEventListener("click", (event) => {
    const badge = event.target.closest("[data-stock-in]");
    if (badge) openStockIn(badge.dataset.stockIn);
  });
  refs.drugRows.addEventListener("focusout", (event) => {
    const input = event.target;
    if (!input.dataset?.kb) return;
    delete input.dataset.kb;
    if (phoneLayoutQuery.matches) input.setAttribute("inputmode", "none");
  });
  [refs.stockDataBox, refs.stockTabBox].forEach((box) => {
    box.addEventListener("click", handleStockDataClick);
    box.addEventListener("dblclick", handleStockDataClick);
  });
  [refs.stockDataBox, refs.stockTabBox].forEach((box) => box.addEventListener("input", (event) => {
    if (event.target.id !== "stockSearchInput") return;
    state.stockSearch = event.target.value;
    renderStockRows();
  }));
  refs.stockPasteApplyBtn.addEventListener("click", applyStockPaste);
  refs.stockInConfirmBtn.addEventListener("click", confirmStockIn);
  refs.stockInQty.addEventListener("input", updateStockInPreview);
  refs.stockInQty.addEventListener("keydown", (event) => { if (event.key === "Enter") confirmStockIn(); });
  refs.stockManualBtn.addEventListener("click", () => {
    refs.stockAddModal.close();
    openDrugModal("");
  });
  refs.drugForm.addEventListener("submit", handleDrugFormSubmit);
  refs.dmDeleteBtn.addEventListener("click", deleteDrugFromModal);
  refs.serviceMoney.addEventListener("input", syncServiceFeeFromMoney);
  refs.serviceMoney.addEventListener("input", renderServiceFeeSuggest);
  refs.serviceMoney.addEventListener("focus", openServiceFeePicker);
  refs.serviceMoney.addEventListener("click", openServiceFeePicker);
  refs.serviceMoney.addEventListener("focus", () => formatMoneyField(refs.serviceMoney, false));
  refs.serviceMoney.addEventListener("blur", () => formatMoneyField(refs.serviceMoney, true));
  refs.serviceMoney.addEventListener("input", handleMoneyOverrideInput);
  refs.previewPrintBtn.addEventListener("click", showPrescriptionPreview);
  refs.rxCloseBtn.addEventListener("click", () => refs.rxModal.close());
  refs.rxPrintBtn.addEventListener("click", () => printPrescription().catch(handleError));
  refs.rxShareBtn.addEventListener("click", sharePrescriptionToZalo);
  refs.newBtn.addEventListener("click", createNewPatient);
  refs.newPrescriptionBtn.addEventListener("click", createNewPrescription);
  refs.saveFab.addEventListener("click", saveEncounter);
  refs.newFab.addEventListener("click", () => {
    createNewPatient();
    document.getElementById("visitFormCard").scrollIntoView({ behavior: "smooth", block: "start" });
  });
  refs.importFile.addEventListener("change", handleImportFileChosen);
  refs.importConfirm.addEventListener("input", () => {
    refs.importConfirmBtn.disabled = refs.importConfirm.value !== "NAP";
  });
  refs.importConfirmBtn.addEventListener("click", confirmImport);
  refs.toggleClinicBtn.addEventListener("click", () => openClinicModal("edit"));
  refs.clinicProfileSelect.addEventListener("change", handleClinicProfileChange);
  refs.addClinicBtn.addEventListener("click", () => openClinicModal("add"));
  refs.deleteClinicBtn.addEventListener("click", openClinicDelete);
  // điện thoại: nút ⋮ mở menu Thêm / Chỉnh sửa / Xóa hồ sơ phòng khám (cùng kiểu menu Kho thuốc)
  const clinicMenu = document.getElementById("clinicMenu");
  document.getElementById("clinicMoreBtn").addEventListener("click", (event) => {
    const opening = clinicMenu.classList.contains("hidden");
    clinicMenu.classList.toggle("hidden", !opening);
    if (!opening) return;
    clinicMenu.querySelector('[data-clinic-action="deleteClinicBtn"]').disabled = refs.deleteClinicBtn.disabled;
    const rect = event.currentTarget.getBoundingClientRect();
    const below = rect.bottom + 6;
    clinicMenu.style.right = `${Math.max(8, window.innerWidth - rect.right)}px`;
    clinicMenu.style.top = `${below + clinicMenu.offsetHeight > window.innerHeight - 8 ? Math.max(8, rect.top - clinicMenu.offsetHeight - 6) : below}px`;
  });
  clinicMenu.addEventListener("click", (event) => {
    const item = event.target.closest("[data-clinic-action]");
    if (!item || item.disabled) return;
    clinicMenu.classList.add("hidden");
    refs[item.dataset.clinicAction].click();
  });
  refs.clinicDeleteConfirmBtn.addEventListener("click", deleteClinicProfile);
  refs.clinicModal.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && event.target.tagName === "INPUT") saveClinicInfo();
  });
  refs.saveClinicBtn.addEventListener("click", saveClinicInfo);

  document.addEventListener("click", (event) => {
    if (!event.target.closest(".picker-wrap") && !event.target.closest(".money-picker")) {
      refs.yearSuggestBox.classList.add("hidden");
      refs.provinceSuggestBox.classList.add("hidden");
      refs.serviceFeeSuggestBox.classList.add("hidden");
    }
    if (!event.target.closest("#symptom") && !event.target.closest("#symptomSuggestBox")) refs.symptomSuggestBox.classList.add("hidden");
    if (!event.target.closest("#icdInput") && !event.target.closest("#icdSuggestBox")) refs.icdSuggestBox.classList.add("hidden");
    if (!event.target.closest(".stock-menu, .stock-more, .code-more, .drug-more, .clinic-more, .pt-more")) document.querySelectorAll(".stock-menu").forEach((menu) => menu.classList.add("hidden"));
    if (!event.target.closest(".drug-search")) document.querySelectorAll(".drug-suggest").forEach((box) => box.classList.add("hidden"));
    if (!event.target.closest(".drug-field--dose")) closeDoseQuickPickers();
    if (!event.target.closest(".drug-field--quantity")) closeQuantityQuickPickers();
  });
}

// ---- Nút dùng chung: làm mới / xuất / nạp / đăng xuất / đóng dialog / quay lại đăng nhập ----

function handleAppAction(event) {
  const menu = document.querySelector(".settings-menu");
  if (menu?.open && (!menu.contains(event.target) || event.target.closest("[data-app-action]"))) menu.open = false;
  const actionButton = event.target.closest("[data-app-action]");
  if (actionButton) {
    const action = actionButton.dataset.appAction;
    if (action === "change-password") openPasswordModal();
    if (action === "toggle-theme") setThemePref(document.documentElement.dataset.theme === "dark" ? "light" : "dark");
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
  const first = { login: refs.loginEmail, forgot: refs.forgotEmail }[view];
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

// ---- Đổi mật khẩu: gửi mã về email, nhập đủ 6 số (tự kiểm tra), rồi mới nhập mật khẩu mới ----

const OTP_LENGTH = 6;
let pwCode = "";
let pwVerifying = false;

function otpBoxes(otp) {
  return [...otp.querySelectorAll(".otp__box")];
}

function pwBoxes() {
  return otpBoxes(refs.pwOtp);
}

function fillOtp(otp) {
  otp.innerHTML = Array.from({ length: OTP_LENGTH }, (_, i) => `<input class="field otp__box" inputmode="numeric" maxlength="1" autocomplete="${i ? "off" : "one-time-code"}" aria-label="Số thứ ${i + 1}" />`).join("");
}

function showPasswordStep(step) {
  refs.pwStepCode.classList.toggle("hidden", step !== "code");
  refs.pwStepNew.classList.toggle("hidden", step !== "new");
  refs.pwSendBtn.classList.toggle("hidden", step !== "send");
  refs.pwConfirmBtn.classList.toggle("hidden", step !== "new");
}

function openPasswordModal() {
  pwCode = "";
  fillOtp(refs.pwOtp);
  [refs.pwNew, refs.pwNew2].forEach((input) => { input.value = ""; setPasswordVisible(input, false); });
  setAuthMessage(refs.pwMsg, "");
  refs.pwIntro.textContent = `Mã xác nhận gồm ${OTP_LENGTH} số sẽ được gửi tới ${refs.accountEmail.textContent}.`;
  showPasswordStep("send");
  refs.passwordModal.showModal();
}

// access token có thể đã hết hạn trong lúc mở popup: làm mới một lần rồi gọi lại
async function authedPost(url, body) {
  const send = () => fetchJson(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  try {
    return await send();
  } catch (error) {
    if (error.message !== "Cần đăng nhập.") throw error;
    await refreshAccessToken();
    return send();
  }
}

async function sendPasswordCode(event) {
  const button = event.currentTarget;
  setAuthMessage(refs.pwMsg, "");
  setBusy(button, true);
  try {
    const data = await authedPost("/api/auth/change-password/request", {});
    refs.pwIntro.textContent = `Đã gửi mã tới ${data.email}. Mã có hiệu lực ${data.expiresInMinutes} phút.`;
    pwBoxes().forEach((box) => { box.value = ""; });
    showPasswordStep("code");
    pwBoxes()[0].focus();
  } catch (error) {
    setAuthMessage(refs.pwMsg, error.message);
  } finally {
    setBusy(button, false);
  }
}

async function verifyPasswordCode() {
  const code = pwBoxes().map((box) => box.value).join("");
  if (code.length < OTP_LENGTH || pwVerifying) return;
  pwVerifying = true;
  setAuthMessage(refs.pwMsg, "");
  try {
    await authedPost("/api/auth/change-password/verify", { code });
    pwCode = code;
    refs.pwIntro.textContent = "Mã đúng. Nhập mật khẩu mới.";
    showPasswordStep("new");
    refs.pwNew.focus();
  } catch (error) {
    setAuthMessage(refs.pwMsg, error.message);
    pwBoxes().forEach((box) => { box.value = ""; });
    pwBoxes()[0].focus();
  } finally {
    pwVerifying = false;
  }
}

function handleOtpInput(event) {
  const box = event.target;
  if (!box.classList.contains("otp__box")) return;
  const boxes = otpBoxes(box.closest(".otp"));
  const digits = box.value.replace(/\D/g, "");
  box.value = digits.slice(-1);
  // dán nhiều số: rải vào các ô từ ô hiện tại
  if (digits.length > 1) digits.slice(0, OTP_LENGTH).split("").forEach((digit, i) => { if (boxes[i]) boxes[i].value = digit; });
  const next = boxes.find((item) => !item.value);
  (next || boxes[OTP_LENGTH - 1]).focus();
  if (box.closest(".otp") === refs.forgotOtp) verifyForgotCode();
  else verifyPasswordCode();
}

function handleOtpKeydown(event) {
  const box = event.target;
  if (!box.classList.contains("otp__box") || event.key !== "Backspace" || box.value) return;
  const prev = box.previousElementSibling;
  if (prev) { prev.value = ""; prev.focus(); }
}

async function confirmPasswordChange() {
  const password = refs.pwNew.value;
  if (password.length < 8) return setAuthMessage(refs.pwMsg, "Mật khẩu tối thiểu 8 ký tự.");
  if (password !== refs.pwNew2.value) return setAuthMessage(refs.pwMsg, "Hai mật khẩu không khớp.");
  setAuthMessage(refs.pwMsg, "");
  setBusy(refs.pwConfirmBtn, true);
  try {
    await authedPost("/api/auth/change-password/confirm", { code: pwCode, password });
    refs.passwordModal.close();
    showToast("Đã đổi mật khẩu.", "success");
  } catch (error) {
    setAuthMessage(refs.pwMsg, error.message);
  } finally {
    setBusy(refs.pwConfirmBtn, false);
  }
}

function setPasswordVisible(input, show) {
  input.type = show ? "text" : "password";
  const eye = document.querySelector(`[data-pw-eye="${input.id}"]`);
  eye.setAttribute("aria-pressed", String(show));
  eye.setAttribute("aria-label", show ? "Ẩn mật khẩu" : "Hiện mật khẩu");
  eye.title = show ? "Ẩn mật khẩu" : "Hiện mật khẩu";
  eye.querySelector("use").setAttribute("href", show ? "#i-eye-off" : "#i-eye");
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

// ---- Quên mật khẩu: cùng cơ chế gửi mã 6 số (email → mã → mật khẩu mới) ----

let forgotStep = "email";
let forgotCode = "";
let forgotVerifying = false;

function showForgotStep(step) {
  forgotStep = step;
  refs.forgotStepEmail.classList.toggle("hidden", step !== "email");
  refs.forgotStepCode.classList.toggle("hidden", step !== "code");
  refs.forgotStepNew.classList.toggle("hidden", step !== "new");
  refs.forgotSubmit.classList.toggle("hidden", step === "code");
  refs.forgotSubmit.textContent = step === "new" ? "Đổi mật khẩu" : "Gửi mã";
}

function openForgot() {
  forgotCode = "";
  [refs.resetPassword, refs.resetPassword2].forEach((input) => { input.value = ""; setPasswordVisible(input, false); });
  setAuthMessage(refs.forgotMsg, "");
  refs.forgotIntro.textContent = `Nhập email tài khoản. Mã xác nhận gồm ${OTP_LENGTH} số sẽ được gửi tới email đó.`;
  showForgotStep("email");
  showAuthView("forgot");
}

async function sendForgotCode() {
  const email = refs.forgotEmail.value.trim();
  if (!email) return setAuthMessage(refs.forgotMsg, "Nhập email.");
  setAuthMessage(refs.forgotMsg, "");
  const button = forgotStep === "code" ? refs.forgotResendBtn : refs.forgotSubmit;
  setBusy(button, true);
  try {
    const data = await authRequest("/api/auth/forgot-password/request", { email });
    refs.forgotIntro.textContent = `Nếu email tồn tại, mã đã được gửi tới ${data.email}. Mã có hiệu lực ${data.expiresInMinutes} phút.`;
    fillOtp(refs.forgotOtp);
    showForgotStep("code");
    otpBoxes(refs.forgotOtp)[0].focus();
  } catch (error) {
    setAuthMessage(refs.forgotMsg, error.message);
  } finally {
    setBusy(button, false);
  }
}

async function verifyForgotCode() {
  const boxes = otpBoxes(refs.forgotOtp);
  const code = boxes.map((box) => box.value).join("");
  if (code.length < OTP_LENGTH || forgotVerifying) return;
  forgotVerifying = true;
  setAuthMessage(refs.forgotMsg, "");
  try {
    await authRequest("/api/auth/forgot-password/verify", { email: refs.forgotEmail.value.trim(), code });
    forgotCode = code;
    refs.forgotIntro.textContent = "Mã đúng. Nhập mật khẩu mới.";
    showForgotStep("new");
    refs.resetPassword.focus();
  } catch (error) {
    setAuthMessage(refs.forgotMsg, error.message);
    boxes.forEach((box) => { box.value = ""; });
    boxes[0].focus();
  } finally {
    forgotVerifying = false;
  }
}

async function handleForgotSubmit(event) {
  event.preventDefault();
  if (forgotStep === "email") return sendForgotCode();
  const password = refs.resetPassword.value;
  if (password.length < 8) return setAuthMessage(refs.forgotMsg, "Mật khẩu tối thiểu 8 ký tự.");
  if (password !== refs.resetPassword2.value) return setAuthMessage(refs.forgotMsg, "Hai mật khẩu không khớp.");
  setAuthMessage(refs.forgotMsg, "");
  setBusy(refs.forgotSubmit, true);
  try {
    await authRequest("/api/auth/forgot-password/reset", { email: refs.forgotEmail.value.trim(), code: forgotCode, password });
    refs.loginEmail.value = refs.forgotEmail.value.trim();
    showAuthView("login");
    setAuthMessage(refs.loginMsg, "Đã đặt lại mật khẩu. Vui lòng đăng nhập.", true);
  } catch (error) {
    setAuthMessage(refs.forgotMsg, error.message);
  } finally {
    setBusy(refs.forgotSubmit, false);
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
  let hash = location.hash.replace("#", "");
  if (hash === "settings") hash = "clinic"; // tab Cài đặt cũ đã gộp vào Phòng khám
  const tab = TABS.includes(hash) ? hash : "home";
  if (location.hash !== `#${tab}`) history.replaceState(null, "", `#${tab}`);
  showTab(tab);
}

function showTab(tab) {
  state.activeTab = tab;
  // bảng danh sách bệnh nhân là cùng một khối: ở tab Bệnh nhân thì chuyển sang đó, quay lại Home thì chuyển về chỗ cũ
  const patientCard = refs.patientList.closest(".patient-top");
  const tabHost = document.getElementById("patientsTabHost");
  if (tab === "patients" && patientCard.parentElement !== tabHost) {
    tabHost.append(patientCard);
  } else if (tab !== "patients" && patientCard.parentElement === tabHost) {
    document.querySelector("#panel-home .main-layout").prepend(patientCard);
  }
  patientCard.classList.toggle("in-tab", tab === "patients");
  syncPatientListVisibility();
  document.querySelectorAll("[data-panel]").forEach((panel) => panel.classList.toggle("hidden", panel.dataset.panel !== tab));
  document.querySelectorAll("a.tab").forEach((link) => {
    const active = link.dataset.tab === tab;
    link.classList.toggle("is-active", active);
    if (active) link.setAttribute("aria-current", "page");
    else link.removeAttribute("aria-current");
  });
  refs.saveFab.classList.toggle("hidden", tab !== "home");
  refs.newFab.classList.toggle("hidden", tab !== "home");
  if (tab === "stats" && accessToken) loadStats().catch(handleError);
  if (tab === "stock") renderStockData();
  else if (tab === "home" && !refs.stockDataBox.classList.contains("hidden")) renderStockData();
  if (tab === "home") syncFollowDateWidth();
  window.scrollTo(0, 0);
  if (tab === "patients") fitPatientListHeight();
  if (tab === "home") {
    fitPatientListHeight();
    autoGrowField(refs.icdInput);
    }
}

async function initializeApp() {
  try {
    await Promise.all([loadHealth(), loadStats(), loadDrugs(), loadPatients(), loadSettings()]);
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
  // nhớ tên phòng khám để hiện trên màn hình đăng nhập lần sau (chưa đăng nhập thì chưa gọi được API)
  try { localStorage.setItem(CLINIC_NAME_CACHE_KEY, state.clinicInfo.name); } catch {}

  const shouldMigrateClinic = localStorage.getItem(CLINIC_STORAGE_KEY)
    && (!Array.isArray(serverSettings?.clinicProfiles) || !serverSettings.clinicProfiles.length);
  const shouldMigrateIcd = localStorage.getItem(ICD_STORAGE_KEY) && (!Array.isArray(serverSettings?.icdList) || !serverSettings.icdList.length);

  if (shouldMigrateClinic || shouldMigrateIcd) {
    await persistSettings();
  }
}

async function loadHealth() {
  const health = await fetchJson("/api/health");
}

// ---- Chi tiết các ô thống kê (bấm vào ô để mở) ----
let statsKind = "";
let statsMetric = "count";
let statsVisits = [];
let statsToken = 0;
const STAT_TITLES = {
  visitsToday: "Bệnh nhân khám hôm nay",
  appointmentsToday: "Lịch hẹn hôm nay",
  revenueToday: "Doanh thu hôm nay",
  visitsMonth: "Lượt khám tháng",
  revenueMonth: "Doanh thu tháng"
};

const statsEmpty = (text) => `<p class="muted stats-empty">${escapeHtml(text)}</p>`;

async function openStatsModal(kind) {
  statsKind = kind;
  const today = toDateInput(new Date());
  refs.statsTitle.textContent = STAT_TITLES[kind] || "Chi tiết";
  refs.statsBody.innerHTML = statsEmpty("Đang tải...");
  const chart = kind === "visitsMonth" || kind === "revenueMonth";
  refs.statsRange.classList.toggle("hidden", !chart);
  refs.statsMetric.classList.toggle("hidden", !chart);
  refs.statsModal.classList.toggle("is-chart", chart);
  refs.statsModal.showModal();
  if (chart) {
    statsMetric = kind === "revenueMonth" ? "money" : "count";
    refs.statsFrom.value = `${today.slice(0, 8)}01`;
    refs.statsTo.value = today;
    statsChartKey = "";
    await loadStatsChart();
    return;
  }
  const token = ++statsToken;
  if (kind === "appointmentsToday") {
    const { appointments } = await fetchJson("/api/stats/appointments");
    if (token !== statsToken) return;
    const arrived = appointments.filter((item) => item.arrived).length;
    refs.statsBody.innerHTML = appointments.length
      ? `<p class="muted stats-sum">Đã đến: ${formatNumber(arrived)} / ${formatNumber(appointments.length)}</p><ol class="stats-list">${appointments.map((item) => `<li><span class="stats-list__name">${escapeHtml(item.patientName)}</span><span class="follow-badge ${item.arrived ? "up" : "neutral"}">${item.arrived ? "Đã đến" : "Chưa đến"}</span></li>`).join("")}</ol>`
      : statsEmpty("Hôm nay không có lịch hẹn.");
    return;
  }
  const { visits } = await fetchJson(`/api/stats/visits?from=${today}&to=${today}`);
  if (token !== statsToken) return;
  if (!visits.length) {
    refs.statsBody.innerHTML = statsEmpty("Hôm nay chưa có lượt khám.");
    return;
  }
  if (kind === "visitsToday") {
    refs.statsBody.innerHTML = `<p class="muted stats-sum">${formatNumber(visits.length)} lượt khám</p><ol class="stats-list">${visits.map((v) => `<li><span class="stats-list__name">${escapeHtml(v.patientName)}</span><span class="muted">Lần ${formatNumber(v.visitNo)}</span></li>`).join("")}</ol>`;
    return;
  }
  const fee = visits.reduce((sum, v) => sum + v.serviceFee, 0);
  const total = visits.reduce((sum, v) => sum + v.totalMoney, 0);
  refs.statsBody.innerHTML = `<ol class="stats-list">${visits.map((v) => `<li class="stats-list--two"><span class="stats-list__name">${escapeHtml(v.patientName)}<small class="muted">Thuốc ${formatMoney(v.drugTotal)} · Tổng ${formatMoney(v.totalMoney)}</small></span><strong>${formatMoney(v.serviceFee)}</strong></li>`).join("")}</ol>
    <div class="stats-total"><div><span class="muted">Tổng công khám</span><strong>${formatMoney(fee)}</strong></div><div><span class="muted">Tổng doanh thu</span><strong>${formatMoney(total)}</strong></div></div>`;
}

// biểu đồ luôn hiện tối thiểu 7 ngày một lần xem: khoảng ngắn hơn thì kéo dài thêm các ngày kế tiếp cho đủ 7
const statsChartEnd = (from, to) => {
  const min = new Date(Date.parse(from) + 6 * 86400000).toISOString().slice(0, 10);
  return to > min ? to : min;
};
let statsChartKey = "";
async function loadStatsChart() {
  if (!refs.statsModal.open || (statsKind !== "visitsMonth" && statsKind !== "revenueMonth")) return;
  const from = refs.statsFrom.value;
  const to = refs.statsTo.value;
  // đang gõ dở (chưa đủ ngày hợp lệ): giữ nguyên biểu đồ cũ, không nháy thông báo
  if (!from || !to) return;
  if (from > to) {
    refs.statsBody.innerHTML = statsEmpty("Từ ngày phải trước hoặc bằng Đến ngày.");
    statsChartKey = "";
    return;
  }
  if ((Date.parse(to) - Date.parse(from)) / 86400000 > 366) {
    refs.statsBody.innerHTML = statsEmpty("Chọn khoảng tối đa 1 năm.");
    statsChartKey = "";
    return;
  }
  const key = `${from}|${to}`;
  if (key === statsChartKey) return; // change + input cùng bắn: chỉ tải một lần
  statsChartKey = key;
  const token = ++statsToken;
  try {
    const { visits } = await fetchJson(`/api/stats/visits?from=${from}&to=${statsChartEnd(from, to)}`);
    if (token !== statsToken) return;
    statsVisits = visits;
    renderStatsChart();
  } catch (error) {
    statsChartKey = "";
    throw error;
  }
}

function renderStatsChart() {
  const from = refs.statsFrom.value;
  const to = refs.statsTo.value;
  if (!from || !to || from > to) return;
  refs.statsMetric.querySelectorAll("[data-metric]").forEach((btn) => {
    const on = btn.dataset.metric === statsMetric;
    btn.classList.toggle("is-on", on);
    btn.setAttribute("aria-pressed", String(on));
  });
  const money = statsMetric === "money";
  refs.statsTitle.textContent = money ? STAT_TITLES.revenueMonth : STAT_TITLES.visitsMonth;
  const days = [];
  for (let t = Date.parse(from); t <= Date.parse(statsChartEnd(from, to)); t += 86400000) days.push(new Date(t).toISOString().slice(0, 10));
  const sums = new Map(days.map((day) => [day, 0]));
  statsVisits.forEach((v) => sums.set(v.day, (sums.get(v.day) || 0) + (money ? v.totalMoney : 1)));
  const values = days.map((day) => sums.get(day) || 0);
  const inRange = days.filter((day) => day <= to).length; // các ngày kéo dài thêm cho đủ 7 không tính vào tổng
  const total = values.slice(0, inRange).reduce((a, b) => a + b, 0);
  const max = Math.max(...values, 0);
  const fmt = (n) => (money ? formatMoney(n) : formatNumber(n));
  const AXW = money ? 40 : 24;
  // khung nhìn luôn đủ 7 cột (mỗi cột rộng 1/7 khung); nhiều hơn 7 ngày thì cuộn ngang
  const avail = Math.max(210, (refs.statsBody.clientWidth || 343) - AXW - 2);
  const STEP = avail / 7;
  const W = Math.max(avail, days.length * STEP), H = 240, L = 0, R = 0, T = 14, B = 26;
  const pw = W - L - R, ph = H - T - B;
  // trục dọc: 4 khoảng đều nhau, chọn bước "tròn" (1, 2, 2.5, 5 × 10^n); lượt khám thì bước là số nguyên
  const rawStep = Math.max(max, 1) / 4;
  const mag = 10 ** Math.floor(Math.log10(rawStep));
  let tickStep = [1, 2, 2.5, 5, 10].map((k) => k * mag).find((s) => s >= rawStep);
  if (!money) tickStep = Math.max(1, Math.ceil(tickStep));
  const top = tickStep * 4;
  const short = (n) => (!money || n < 1000 ? formatNumber(n) : n >= 1e6 ? `${+(n / 1e6).toFixed(2)}tr` : `${+(n / 1e3).toFixed(1)}k`);
  const yOf = (value) => T + ph - (value / top) * ph;
  const ticks = [0, 1, 2, 3, 4].map((i) => i * tickStep);
  const step = pw / days.length;
  const bw = Math.max(2, Math.min(30, step * 0.55));
  const bars = values.map((value, i) => {
    const y = yOf(value);
    const x = L + i * step + (step - bw) / 2;
    const [, mm, dd] = days[i].split("-");
    return `<g><title>${dd}/${mm}: ${fmt(value)}</title><rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${bw.toFixed(1)}" height="${Math.max(T + ph - y, value ? 2 : 0).toFixed(1)}" rx="2" class="stats-bar"/></g><text x="${(x + bw / 2).toFixed(1)}" y="${H - 8}" text-anchor="middle" class="stats-axis">${dd}</text>`;
  }).join("");
  const grid = ticks.map((v) => `<line x1="${L}" x2="${W - R}" y1="${yOf(v).toFixed(1)}" y2="${yOf(v).toFixed(1)}" class="${v === 0 ? "stats-base" : "stats-grid"}"/>`).join("");
  const axis = `<svg class="stats-yaxis" width="${AXW}" height="${H}" viewBox="0 0 ${AXW} ${H}" aria-hidden="true">${ticks.map((v) => `<text x="0" y="${(yOf(v) + 3).toFixed(1)}" text-anchor="start" class="stats-axis">${short(v)}</text>`).join("")}</svg>`;
  refs.statsBody.innerHTML = `
    <div class="stats-total">
      <div><span class="muted">${money ? "Tổng doanh thu" : "Tổng lượt khám"}</span><strong>${fmt(total)}</strong></div>
      <div><span class="muted">TB mỗi ngày</span><strong>${fmt(Math.round(total / Math.max(1, inRange)))}</strong></div>
    </div>
    <div class="stats-chart-row">${axis}<div class="stats-chart-wrap"><svg class="stats-chart" viewBox="0 0 ${W} ${H}" style="width:${W}px;height:${H}px" role="img" aria-label="Biểu đồ ${money ? "doanh thu" : "lượt khám"} theo ngày">${grid}${bars}</svg></div></div>`;
  // nhiều ngày: mở ra là đang ở các ngày gần nhất (bên phải), lướt sang trái để xem ngày cũ
  const wrap = refs.statsBody.querySelector(".stats-chart-wrap");
  if (wrap) wrap.scrollLeft = wrap.scrollWidth;
}

async function loadStats() {
  const { today, quick, patients, finance } = await fetchJson("/api/stats");
  const monthLabel = `Tháng ${Number(today.slice(5, 7))}/${today.slice(0, 4)}`;
  refs.statVisitsToday.textContent = formatNumber(quick.visitsToday);
  refs.statAppointmentsToday.textContent = formatNumber(quick.appointmentsToday);
  refs.statAppointmentsArrived.textContent = `Đã đến: ${formatNumber(quick.appointmentsArrived)}`;
  refs.statRevenueToday.textContent = formatMoney(quick.revenueToday);
  refs.statVisitsMonth.textContent = formatNumber(quick.visitsThisMonth);
  refs.statVisitsMonthLabel.textContent = monthLabel;
  refs.statPatientsTotal.textContent = formatNumber(patients.total);
  refs.statPatientsNew.textContent = formatNumber(patients.newThisMonth);
  refs.statRevisitRate.textContent = patients.revisitDue ? `${patients.revisitRate}%` : "—";
  refs.statRevisitSub.textContent = patients.revisitDue
    ? `${formatNumber(patients.revisitReturned)}/${formatNumber(patients.revisitDue)}`
    : "Chưa có lịch hẹn tới hạn";
  refs.statRevenueMonth.textContent = formatMoney(finance.revenueThisMonth);
  refs.statRevenueMonthLabel.textContent = monthLabel;
}

async function loadPatients() {
  state.patients = await fetchJson("/api/patients");
  state.patientRxCache.clear();
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
  if (state.activeTab === "stock" || !refs.stockDataBox.classList.contains("hidden")) renderStockData();
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

// danh sách bệnh nhân ẩn sẵn; hiện khi bấm nút sổ hoặc khi bắt đầu gõ tìm kiếm (rồi vẫn đóng lại được bằng nút sổ)
function syncPatientListVisibility() {
  const visible = Boolean(state.patientListOpen) || state.activeTab === "patients";
  refs.patientList.classList.toggle("hidden", !visible);
  refs.patientListToggle.setAttribute("aria-expanded", String(visible));
  if (visible) fitPatientListHeight();
}

function handleSearchInput(event) {
  const searching = event.target.value.trim() !== "";
  if (searching) {
    if (!state.wasSearching) state.openBeforeSearch = Boolean(state.patientListOpen);
    state.patientListOpen = true; // mỗi lần gõ đều mở lại danh sách
  } else if (state.wasSearching) {
    state.patientListOpen = Boolean(state.openBeforeSearch); // xóa hết chữ tìm: về trạng thái trước khi tìm
  }
  state.wasSearching = searching;
  applySearch(event.target.value);
}

function handleSearchKeydown(event) {
  if (event.key === "Enter") {
    event.preventDefault();
    applySearch(refs.searchInput.value);
  }
}

function applyDateFilter(value) {
  if (value === state.dateFilter) return;
  state.dateFilter = value;
  refs.dateFilter.classList.toggle("is-active", Boolean(value));
  if (value) state.patientListOpen = true;
  applySearch(refs.searchInput.value);
}

function applySearch(rawValue, { keepPage = false } = {}) {
  state.search = String(rawValue || "").trim();
  syncPatientListVisibility();
  const keyword = normalizeText(state.search);
  // mỗi bệnh nhân có nhiều lần khám: khớp nếu bất kỳ ngày khám HOẶC ngày tái khám nào rơi vào ngày đã chọn
  const base = state.dateFilter
    ? state.patients.filter((patient) => [...(patient.visitDates || [patient.lastVisitAt]), ...(patient.followUpDates || [patient.lastFollowUpDate])]
      .some((d) => d && toDateInput(d) === state.dateFilter))
    : state.patients;
  state.filteredPatients = keyword
    ? base.filter((patient) => normalizeText(buildPatientHaystack(patient)).includes(keyword))
    : base.slice();
  // còn hẹn (từ hôm nay trở đi): ngày tái khám tăng dần; sau đó quá hẹn (tăng dần); cuối cùng chưa hẹn. Sort ổn định.
  const today = startOfDay(new Date()).getTime();
  const rank = (p) => {
    const t = p.lastFollowUpDate ? startOfDay(new Date(p.lastFollowUpDate)).getTime() : NaN;
    if (Number.isNaN(t)) return [2, 0];
    return [t >= today ? 0 : 1, t];
  };
  // đang tìm kiếm: trùng họ tên lên trước, rồi tới địa chỉ, các trường còn lại sau; trong mỗi nhóm giữ thứ tự tái khám như trên
  const relevance = (p) => {
    if (!keyword) return 0;
    if (normalizeText(p.fullName || "").includes(keyword)) return 0;
    if (normalizeText(`${p.address || ""} ${p.province || ""}`).includes(keyword)) return 1;
    return 2;
  };
  state.filteredPatients.sort((a, b) => {
    const [ga, ta] = rank(a);
    const [gb, tb] = rank(b);
    return relevance(a) - relevance(b) || ga - gb || ta - tb;
  });
  refs.patientCountText.textContent = `${formatNumber(state.filteredPatients.length)} hồ sơ`;
  if (!keepPage) { state.page = 1; state.shown = 0; }
  renderPatientList();
}

function clearSearch() {
  refs.searchInput.value = "";
  handleSearchInput({ target: refs.searchInput });
}

function togglePatientRow(row) {
  const id = row.dataset.id;
  const open = !state.patientOpen.has(id);
  state.patientOpen[open ? "add" : "delete"](id);
  row.classList.toggle("is-open", open);
  row.querySelectorAll(".pt-toggle").forEach((btn) => btn.setAttribute("aria-expanded", open));
  fitPatientListHeight();
}

function buildPatientRxHtml(id) {
  const rx = state.patientRxCache.get(id);
  if (!rx) return '<div class="drug-field"><span class="clinic-meta-label">Đang tải toa thuốc…</span></div>';
  const head = `<div class="drug-field">${labelHtml("pill", `Toa thuốc lần khám gần nhất${rx.date ? ` (${formatDate(rx.date)})` : ""}`)}</div>`;
  if (!rx.items.length) return `${head}<div class="drug-field"><span class="muted">Chưa có toa thuốc.</span></div>`;
  return head + rx.items.map((name) => `<div class="drug-field"><span class="rx-item">${escapeHtml(name)}</span></div>`).join("");
}

async function loadPatientRx(id) {
  try {
    const detail = await fetchJson(`/api/patients/${id}`);
    const latest = detail.visits?.[0]; // API đã sắp lần khám mới nhất lên đầu
    state.patientRxCache.set(id, { date: latest?.visitDate || "", items: (latest?.drugs || []).map((d) => d.activeIngredient || d.brandName || "—") });
  } catch (error) {
    state.patientRxOpen.delete(id);
    handleError(error);
  }
  const row = refs.patientListBody.querySelector(`.patient-row[data-id="${id}"]`);
  if (!row) return;
  row.classList.toggle("is-rx-open", state.patientRxOpen.has(id));
  row.querySelector(".patient-rx").innerHTML = buildPatientRxHtml(id);
  fitPatientListHeight();
}

function togglePatientRx(row) {
  const id = row.dataset.id;
  const open = !state.patientRxOpen.has(id);
  state.patientRxOpen[open ? "add" : "delete"](id);
  row.classList.toggle("is-rx-open", open);
  row.querySelectorAll(".pt-rx").forEach((btn) => btn.setAttribute("aria-expanded", open));
  if (open && !state.patientRxCache.has(id)) loadPatientRx(id);
  fitPatientListHeight();
}

function handlePatientListClick(event) {
  const moreBtn = event.target.closest(".pt-more");
  if (moreBtn) {
    const menu = document.getElementById("patientRowMenu");
    const row = moreBtn.closest(".patient-row");
    const opening = menu.classList.contains("hidden") || menu.dataset.id !== row.dataset.id;
    menu.classList.toggle("hidden", !opening);
    if (!opening) return;
    menu.dataset.id = row.dataset.id;
    menu.querySelector('[data-action="toggle"] span').textContent = state.patientOpen.has(row.dataset.id) ? "Thu gọn chi tiết" : "Xem chi tiết";
    menu.querySelector('[data-action="rx"] span').textContent = state.patientRxOpen.has(row.dataset.id) ? "Ẩn toa thuốc" : "Xem toa thuốc";
    const rect = moreBtn.getBoundingClientRect();
    const below = rect.bottom + 6;
    menu.style.right = `${Math.max(8, window.innerWidth - rect.right)}px`;
    menu.style.top = `${below + menu.offsetHeight > window.innerHeight - 8 ? Math.max(8, rect.top - menu.offsetHeight - 6) : below}px`;
    return;
  }
  const rxBtn = event.target.closest(".pt-rx");
  if (rxBtn && event.type === "click") {
    togglePatientRx(rxBtn.closest(".patient-row[data-id]"));
    return;
  }
  if (rxBtn) return;
  const toggleBtn = event.target.closest(".pt-toggle");
  const clickedRow = event.target.closest(".patient-row[data-id]");
  // chỉ nút mũi tên mới mở/đóng chi tiết
  if (event.type === "click" && clickedRow && !event.target.closest(".del-patient, .patient-detail")) {
    if (toggleBtn) togglePatientRow(clickedRow);
    return;
  }
  if (toggleBtn) return;
  const deleteBtn = event.target.closest(".del-patient");
  if (deleteBtn) {
    if (event.type === "dblclick") return;
    deletePatient(deleteBtn.dataset.id).catch(handleError);
    return;
  }
  // mở bệnh nhân: nhấp đúp vào dòng (hoặc Enter khi dòng đang focus)
  if (event.type !== "dblclick") return;
  const row = event.target.closest(".patient-row[data-id]");
  if (row) {
    openPatientFromList(row.dataset.id);
  }
}

function handlePatientListKeydown(event) {
  if (event.key !== "Enter" || event.target !== event.target.closest(".patient-row[data-id]")) return;
  event.preventDefault();
  openPatientFromList(event.target.dataset.id);
}

function openPatientFromList(id) {
  // đang ở tab Bệnh nhân: mở hồ sơ thì chuyển sang Home để thấy form
  if (state.activeTab === "patients") location.hash = "#home";
  selectPatient(id).then(() => document.getElementById("visitFormCard").scrollIntoView({ behavior: "smooth", block: "start" })).catch(handleError);
}

function renderPatientList() {
  const total = state.filteredPatients.length;
  const pages = Math.max(1, Math.ceil(total / pageSize()));
  state.page = Math.min(Math.max(1, state.page), pages);
  const start = state.scrollMode ? 0 : (state.page - 1) * pageSize();
  if (state.scrollMode) state.shown = Math.min(total, Math.max(state.shown, pageSize() * 2));
  const rows = state.filteredPatients.slice(start, state.scrollMode ? state.shown : start + pageSize());
  refs.patientList.classList.toggle("is-scroll", state.scrollMode);
  refs.patientList.classList.toggle("is-searching", Boolean(state.search));
  refs.patientListBody.innerHTML = rows.map(buildPatientRow).join("")
    || '<div class="patient-row patient-row--empty">Không có bệnh nhân phù hợp.</div>';
  refs.patientListBody.scrollTop = 0;
  fitPatientListHeight();
  renderPager(total, pages, start, rows.length);
  rows.filter((p) => state.patientRxOpen.has(p._id) && !state.patientRxCache.has(p._id)).forEach((p) => loadPatientRx(p._id));
}

// chế độ cuộn: gần chạm đáy thì nối thêm một lô hàng (không vẽ lại các hàng đã có)
function loadMorePatients() {
  if (!state.scrollMode) return;
  const el = refs.patientListBody;
  if (state.shown >= state.filteredPatients.length || el.scrollTop + el.clientHeight < el.scrollHeight - 120) return;
  const from = state.shown;
  state.shown = Math.min(state.filteredPatients.length, from + pageSize());
  const rows = state.filteredPatients.slice(from, state.shown);
  el.insertAdjacentHTML("beforeend", rows.map(buildPatientRow).join(""));
  fitPatientNames();
  renderPager(state.filteredPatients.length, 1, 0, state.shown);
  rows.filter((p) => state.patientRxOpen.has(p._id) && !state.patientRxCache.has(p._id)).forEach((p) => loadPatientRx(p._id));
}

// xóa maxHeight rồi đặt lại làm khung hết cuộn được trong chốc lát nên scrollTop về 0 (danh sách bị giật); giữ lại vị trí cuộn
function keepScroll(el, fn) {
  const top = el.scrollTop;
  fn();
  el.scrollTop = top;
}

// khung danh sách cao đúng bằng 5 dòng đầu (dòng cao thấp khác nhau tùy nội dung/khổ màn hình)
// rút gọn phần đầu của tên cho vừa chỗ trống, tên gọi cuối luôn hiện đủ
function fitPatientNames() {
  // đang tìm kiếm: hiện đủ họ tên (xuống dòng khi dài); bình thường thì rút gọn để tên, tuổi, hẹn, số lần khám nằm chung một dòng
  if (refs.patientList.classList.contains("is-searching")) {
    refs.patientListBody.querySelectorAll(".pc__nm-a").forEach((el) => { el.textContent = el.dataset.full; });
    return;
  }
  refs.patientListBody.querySelectorAll(".pc__nm-a").forEach((el) => {
    const box = el.parentElement;
    if (!box.clientWidth) return; // thẻ đang ẩn (bảng PC)
    const full = el.dataset.full;
    const others = [...box.children].filter((child) => child !== el);
    const gap = parseFloat(getComputedStyle(box).columnGap) || 0;
    const margin = parseFloat(getComputedStyle(box.querySelector(".pc__nm-b") || el).marginLeft) || 0;
    const avail = box.clientWidth - others.reduce((sum, child) => sum + child.offsetWidth, 0) - gap * others.length - margin;
    // cắt đúng ranh giới từ thì có dấu cách trước "…" ("Vũ Thị …"); cắt giữa từ thì "…" sát chữ ("Trần mi…")
    const cut = (n) => {
      const kept = full.slice(0, n);
      return full[n] === " " || full[n - 1] === " " ? `${kept.trimEnd()} …` : `${kept}…`;
    };
    el.textContent = full;
    if (el.scrollWidth <= avail) return;
    let lo = 1;
    let hi = full.length - 1;
    while (lo < hi) {
      const mid = Math.ceil((lo + hi) / 2);
      el.textContent = cut(mid);
      if (el.scrollWidth <= avail) lo = mid; else hi = mid - 1;
    }
    el.textContent = cut(lo);
  });
}

function fitPatientListHeight() {
  fitPatientNames();
  keepScroll(refs.patientListBody, () => {
    const rows = [...refs.patientListBody.querySelectorAll(".patient-row:not(.patient-row--empty)")];
    refs.patientListBody.style.height = "";
    refs.patientListBody.style.minHeight = "";
    refs.patientListBody.style.maxHeight = "";
    if (!rows[0] || !rows[0].offsetHeight) return;
    const h = (el) => el.getBoundingClientRect().height;
    const extra = (row) => (row.classList.contains("is-open") ? h(row.querySelector(".patient-detail")) : 0) + (row.classList.contains("is-rx-open") ? h(row.querySelector(".patient-rx")) : 0);
    // cố định cao đúng một trang (hàng cao đều nhau), trang cuối thiếu hàng vẫn giữ chiều cao
    const base = Math.min(...rows.map((row) => h(row) - extra(row))); // hàng thấp nhất = cỡ chuẩn (ICD ≤ 2 dòng)
    // cao tối thiểu một trang; hàng nào dài hoặc mở chi tiết thì khung dài ra, nên không cuộn trong khung
    if (state.scrollMode) {
      // cuộn vô hạn: khung cao đúng một trang (giống Kho thuốc), phần còn lại cuộn trong khung
      refs.patientListBody.style.minHeight = "";
      // cao bằng đúng 10 (hoặc 8) hàng đầu như khi phân trang: hàng nào cao hơn chuẩn (ICD dài) cũng được tính
      const firstPage = rows.slice(0, pageSize()).reduce((sum, row) => sum + h(row) - extra(row), 0);
      refs.patientListBody.style.maxHeight = rows.length > pageSize() || state.shown < state.filteredPatients.length ? `${Math.ceil(Math.max(firstPage, base * pageSize())) - 1}px` : "";
    } else {
      refs.patientListBody.style.maxHeight = "";
      refs.patientListBody.style.minHeight = `${Math.ceil(base * pageSize())}px`;
    }
  });
}

function renderPager(total, pages, start, count) {
  if (!total) {
    refs.patientPager.innerHTML = "";
    return;
  }
  const modeBtn = (mode, icon, label, on) => `<button class="pager__mode-btn ${on ? "is-on" : ""}" type="button" data-mode="${mode}" aria-pressed="${on}" aria-label="${label}" title="${label}">${iconHtml(icon)}<span>${mode === "scroll" ? "Cuộn" : "Trang"}</span></button>`;
  const modeSwitch = `<div class="pager__mode" role="group" aria-label="Cách xem danh sách">${modeBtn("scroll", "list", "Cuộn liên tục", state.scrollMode)}${modeBtn("pages", "layers", "Chia trang", !state.scrollMode)}</div>`;
  if (state.scrollMode) {
    refs.patientPager.innerHTML = `<div class="pager__left"><div class="pager__range">1–${formatNumber(count)} / ${formatNumber(total)}</div>${modeSwitch}</div>`;
    return;
  }
  const current = state.page;
  // điện thoại: trước, trang hiện tại, ⋯, sau; PC: trước, trang liền trước, hiện tại, trang liền sau, ⋯, sau
  const pageNumbers = phoneLayoutQuery.matches ? [current] : [current - 1, current, current + 1].filter((page) => page >= 1 && page <= pages);
  const pageButton = (page) => `<button class="pager__btn ${page === current ? "is-current" : ""}" type="button" data-page="${page}" aria-label="Trang ${page}" ${page === current ? 'aria-current="page"' : ""}>${page}</button>`;
  refs.patientPager.innerHTML = `
    <div class="pager__left"><div class="pager__range">${formatNumber(start + 1)}–${formatNumber(start + count)} / ${formatNumber(total)}</div>${modeSwitch}</div>
    ${pages > 1 ? `
      <div class="pager__list">
        <button class="pager__btn" type="button" data-page="prev" aria-label="Trang trước" ${current === 1 ? "disabled" : ""}>${iconHtml("chevron-left")}</button>
        ${pageNumbers.map(pageButton).join("")}
        <button class="pager__btn pager__more" type="button" data-page="more" aria-label="Chọn trang" aria-haspopup="dialog">…</button>
        <button class="pager__btn" type="button" data-page="next" aria-label="Trang sau" ${current === pages ? "disabled" : ""}>${iconHtml("chevron-right")}</button>
      </div>` : ""}
  `;
}

function handlePagerClick(event) {
  const modeBtn = event.target.closest("[data-mode]");
  if (modeBtn) {
    const scroll = modeBtn.dataset.mode === "scroll";
    if (scroll === state.scrollMode) return;
    state.scrollMode = scroll;
    try { localStorage.setItem("patientListMode", scroll ? "scroll" : "pages"); } catch {}
    state.page = 1;
    state.shown = 0;
    renderPatientList();
    return;
  }
  const button = event.target.closest("[data-page]");
  if (!button || button.disabled) return;
  const target = button.dataset.page;
  if (target === "more") {
    openYearWheel("page", { anchor: button });
    return;
  }
  state.page = target === "prev" ? state.page - 1 : target === "next" ? state.page + 1 : Number(target);
  renderPatientList();
  if (phoneLayoutQuery.matches) refs.patientListBody.closest(".patient-top").scrollIntoView({ block: "start" });
}

const labelHtml = (icon, text) => `<span class="clinic-meta-label">${iconHtml(icon)}${text}</span>`;

function iconHtml(name) {
  return `<svg class="icon" aria-hidden="true"><use href="#i-${name}"/></svg>`;
}

function buildPatientRow(patient) {
  const age = patient.birthYear ? new Date().getFullYear() - Number(patient.birthYear) : "";
  const follow = getFollowStatus(patient.lastFollowUpDate);
  const visitTags = buildVisitTags(patient.visitCount);
  const deleteLabel = `Xóa bệnh nhân ${patient.fullName}`;
  const open = state.patientOpen.has(patient._id);
  const rxOpen = state.patientRxOpen.has(patient._id);
  const rxBtn = `<button class="icon-btn pt-rx" type="button" aria-expanded="${rxOpen}" aria-label="Toa thuốc lần khám gần nhất của ${escapeAttribute(patient.fullName)}" title="Toa thuốc lần khám gần nhất">${iconHtml("pill")}</button>`;
  const ro = (icon, label, cls, value) => `<div class="drug-field ${cls}">${labelHtml(icon, label)}<strong>${escapeHtml(String(value ?? "") || "—")}</strong></div>`;
  return `
    <div class="patient-row ${patient._id === state.selectedPatientId ? "active" : ""} ${open ? "is-open" : ""} ${rxOpen ? "is-rx-open" : ""}" data-id="${patient._id}" role="button" tabindex="0" title="Nhấp đúp để mở hồ sơ">
      <div class="pr-table">
        <div>${formatDate(patient.lastVisitAt)}</div>
        <div class="patient-meta">
          <strong>${escapeHtml(patient.fullName)} <span class="visit-tag">${Math.max(1, Number(patient.visitCount) || 0)}L</span></strong>
        </div>
        <div>${escapeHtml(String(age || ""))}</div>
        <div><span class="follow-badge ${follow.cls}">${escapeHtml(follow.label)}</span></div>
        <div>${escapeHtml(patient.lastDiagnosis || "")}</div>
        <div>${formatMoney(patient.totalRevenue)}</div>
        <div class="pr-act">${rxBtn}<button class="icon-btn danger del-patient" data-id="${patient._id}" type="button" aria-label="${escapeAttribute(deleteLabel)}" title="Xóa">${iconHtml("trash-2")}</button><button class="icon-btn pt-toggle" data-id="${patient._id}" type="button" aria-expanded="${open}" aria-label="Chi tiết ${escapeAttribute(patient.fullName)}" title="Chi tiết">${iconHtml("chevron-down")}</button></div>
      </div>
      <div class="pr-card">
        <div class="pc__l1">
          <div class="pc__main">
            <strong class="pc__name">${cardNameHtml(patient.fullName)}${age !== "" ? `<span class="pc__age">${escapeHtml(String(age))} tuổi</span>` : ""}<span class="pc__tags"><span class="follow-badge ${follow.cls}" title="${escapeAttribute(follow.label)}"><span class="fb-full">${escapeHtml(follow.label)}</span><span class="fb-short">${escapeHtml(follow.short || follow.label)}</span></span><span class="visit-tag">${Math.max(1, Number(patient.visitCount) || 0)}L</span></span></strong>
          </div>
          <div class="pc__act">
            ${rxBtn}
            <button class="icon-btn pt-rx pt-rx-close" type="button" aria-expanded="${rxOpen}" aria-label="Thu gọn toa thuốc của ${escapeAttribute(patient.fullName)}" title="Thu gọn toa thuốc">${iconHtml("chevron-down")}</button>
            <button class="icon-btn danger del-patient" data-id="${patient._id}" type="button" aria-label="${escapeAttribute(deleteLabel)}" title="Xóa">${iconHtml("trash-2")}</button>
            <button class="icon-btn pt-toggle" data-id="${patient._id}" type="button" aria-expanded="${open}" aria-label="Chi tiết ${escapeAttribute(patient.fullName)}" title="Chi tiết">${iconHtml("chevron-down")}</button>
            <button class="icon-btn pt-more" type="button" aria-label="Tùy chọn ${escapeAttribute(patient.fullName)}" aria-haspopup="menu" title="Tùy chọn">${iconHtml("more-vertical")}</button>
          </div>
        </div>
        <div class="pc__l3"><span class="pc__icd">${escapeHtml(patient.lastDiagnosis || "Chưa có chẩn đoán")}</span><span class="pc__total">${formatMoney(patient.totalRevenue)}</span></div>
      </div>
      <div class="patient-rx">${rxOpen ? buildPatientRxHtml(patient._id) : ""}</div>
      <div class="patient-detail">
        ${ro("stethoscope", "Mã chẩn đoán", "pd-full pd-icd", patient.lastDiagnosis)}${ro("user", "Họ và tên", "pd-name", patient.fullName)}${ro("calendar", "Ngày khám", "pd-date", formatDate(patient.lastVisitAt))}${ro("phone", "Số điện thoại", "pd-1", patient.phone)}${ro("users", "Giới tính", "pd-1", patient.gender)}${ro("cake", "Năm sinh", "pd-1", patient.birthYear)}${ro("repeat", "Số lần khám", "pd-1 pd-visits", formatNumber(patient.visitCount))}${ro("map-pin", "Địa chỉ", "pd-full", patient.address)}
      </div>
    </div>
  `;
}

// Tên thẻ: phần đầu co lại thành "…", họ tên cuối (tên gọi) luôn hiện đủ
function cardNameHtml(fullName) {
  const words = String(fullName || "").trim().split(/\s+/);
  const last = words.length > 1 ? words.pop() : "";
  return `<span class="pc__nm-a" data-full="${escapeAttribute(words.join(" "))}">${escapeHtml(words.join(" "))}</span>${last ? `<span class="pc__nm-b">${escapeHtml(last)}</span>` : ""}`;
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
  // mặc định mở bản nháp lần khám mới (điền sẵn từ lần gần nhất); chỉ chọn lần khám đã lưu khi được yêu cầu
  if (findHistoryVisit(editVisitId)) selectVisit(editVisitId);
  else startNewVisitDraft();
  renderPatientList();
  if (!quiet) showToast("Đã mở hồ sơ bệnh nhân.", "success");
}

function findHistoryVisit(visitId) {
  return (state.selectedPatientDetail?.visits || []).find((item) => item._id === visitId) || null;
}

// ---- Thanh chọn Lần khám ----
// selectedVisitId = editingVisitId: id lần khám đã lưu đang chọn (Lưu = PUT), hoặc "" khi đang ở bản nháp lần mới (Lưu = POST)

function renderVisitPicker() {
  const visits = [...(state.selectedPatientDetail?.visits || [])].sort((a, b) => (a.visitNo || 0) - (b.visitNo || 0));
  const isDraft = !state.editingVisitId;
  const draftNo = visits.length + 1;
  const chips = visits.map((visit) => {
    const on = visit._id === state.editingVisitId;
    return `<button type="button" class="visit-chip" role="radio" aria-checked="${on}" tabindex="${on ? 0 : -1}" data-visit-id="${escapeAttribute(visit._id)}" title="L${visit.visitNo} · ${escapeAttribute(formatDate(visit.visitDate))}">L${visit.visitNo}</button>`;
  });
  if (isDraft) chips.push(`<button type="button" class="visit-chip is-draft" role="radio" aria-checked="true" tabindex="0" title="Lần khám mới (chưa lưu)">L${draftNo}</button>`);
  else chips.push('<button type="button" class="visit-chip visit-chip--add" tabindex="-1" aria-label="Tạo lần khám mới" title="Tạo lần khám mới"><svg class="icon" aria-hidden="true"><use href="#i-plus"/></svg></button>');
  const hadFocus = refs.visitPicker.contains(document.activeElement);
  refs.visitPicker.innerHTML = chips.join("");
  if (hadFocus) refs.visitPicker.querySelector('[aria-checked="true"]')?.focus({ preventScroll: true });
  updateVisitDirtyDot();
}

// chấm tròn nhỏ ở ô Lần khám cũ đang sửa khi có thông tin chưa lưu; lưu xong thì mất
function updateVisitDirtyDot() {
  const dirty = Boolean(state.editingVisitId) && state.savedSignature !== undefined && formSignature() !== state.savedSignature;
  refs.visitPicker.querySelector('.visit-chip[aria-checked="true"]:not(.is-draft)')?.classList.toggle("is-dirty", dirty);
}

function handleVisitPickerClick(event) {
  const chip = event.target.closest(".visit-chip");
  if (!chip) return;
  if (chip.classList.contains("visit-chip--add")) startNewVisitDraft();
  else if (chip.dataset.visitId && chip.dataset.visitId !== state.editingVisitId) selectVisit(chip.dataset.visitId);
}

// ← → chỉ di chuyển focus giữa các ô; Enter / Space (click mặc định của nút) mới chọn
function handleVisitPickerKeydown(event) {
  const step = { ArrowLeft: -1, ArrowUp: -1, ArrowRight: 1, ArrowDown: 1 }[event.key];
  if (!step) return;
  const chips = [...refs.visitPicker.querySelectorAll(".visit-chip")];
  const next = chips[chips.indexOf(document.activeElement) + step];
  if (!next) return;
  event.preventDefault();
  next.focus();
}

function refreshVisitView() {
  renderVisitPicker();
  updateSaveButtons();
  updateTotals();
  updateWarning();
}

// bấm ô Lk: đổ lại đúng dữ liệu đã lưu của Lk; thay đổi chưa lưu bị bỏ, không hỏi
function selectVisit(visitId) {
  const visit = findHistoryVisit(visitId);
  if (!visit) return;
  state.selectedVisitId = state.editingVisitId = visit._id;
  fillFormFromRecord(state.selectedPatientDetail.patient, visit);
  refreshVisitView();
}

// bản nháp lần khám mới: copy lần gần nhất, trừ ngày khám (hôm nay) và ngày tái khám (trống)
function startNewVisitDraft() {
  const latest = state.selectedPatientDetail?.visits?.[0] || null;
  state.selectedVisitId = state.editingVisitId = "";
  fillFormFromRecord(state.selectedPatientDetail?.patient, latest);
  refs.visitDate.value = toDateInput(new Date());
  refs.followDate.value = "";
  // lần khám mới được server tính theo giá kho hiện tại
  state.draftRows.forEach((row) => {
    const drug = state.drugs.find((item) => item._id === row.drugId);
    if (drug) row.price = Number(drug.price || 0);
  });
  renderDrugRows();
  refreshVisitView();
}

// lưu xong: nút nổi đổi thành dấu tick trong 4 giây
function showSaveDone() {
  clearTimeout(state.saveDoneTimer);
  state.saveDone = true;
  state.saveDoneTimer = setTimeout(() => { state.saveDone = false; updateSaveButtons(); }, 4000);
  updateSaveButtons();
}

function updateSaveButtons() {
  const label = state.saveDone ? "Đã lưu" : state.editingVisitId ? "Lưu thay đổi" : "Hoàn tất khám";
  const button = refs.saveFab;
  button.querySelector("use").setAttribute("href", state.saveDone ? "#i-check" : "#i-save");
  button.classList.toggle("is-done", Boolean(state.saveDone));
  button.querySelector(".save-label").textContent = label;
  button.setAttribute("aria-label", label);
  button.title = label;
  button.disabled = state.saving;
  button.classList.toggle("is-busy", state.saving);
  button.setAttribute("aria-busy", String(state.saving));
}

// Ô ngày dạng dd/mm/yyyy: Backspace xóa dần từ năm sang tháng rồi ngày. `.value` vẫn đọc/ghi yyyy-mm-dd như ô date gốc.
function enhanceDateInput(input) {
  const nativeValue = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value");
  const picker = document.createElement("input");
  picker.type = "date";
  picker.className = "date-native";
  picker.tabIndex = -1;
  picker.setAttribute("aria-label", "Chọn ngày");
  const button = document.createElement("button");
  button.type = "button";
  button.className = "date-pick-btn";
  button.title = button.ariaLabel = "Chọn ngày";
  button.innerHTML = '<svg class="icon" aria-hidden="true"><use href="#i-calendar"/></svg>';
  const wrap = document.createElement("div");
  wrap.className = "date-field";
  input.before(wrap);
  wrap.append(input, picker, button);
  input.type = "text";
  input.inputMode = "numeric";
  input.placeholder = "dd/mm/yyyy";
  input.maxLength = 10;
  const format = (digits) => [digits.slice(0, 2), digits.slice(2, 4), digits.slice(4, 8)].filter(Boolean).join("/");
  Object.defineProperty(input, "value", {
    get() {
      const [d, m, y] = nativeValue.get.call(input).split("/");
      if (!y || y.length !== 4) return "";
      const iso = `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
      return Number.isNaN(Date.parse(iso)) || new Date(iso).toISOString().slice(0, 10) !== iso ? "" : iso;
    },
    set(iso) {
      const [y, m, d] = String(iso || "").slice(0, 10).split("-");
      nativeValue.set.call(input, y && m && d ? `${d}/${m}/${y}` : "");
      picker.value = iso || "";
    }
  });
  input.addEventListener("input", (event) => {
    const digits = nativeValue.get.call(input).replace(/\D/g, "").slice(0, 8);
    // gõ xong ngày (2 số) hoặc tháng (4 số) thì tự thêm "/"; khi xóa lùi thì không thêm lại để còn xóa được
    const typing = String(event?.inputType || "").startsWith("insert");
    nativeValue.set.call(input, format(digits) + (typing && (digits.length === 2 || digits.length === 4) ? "/" : ""));
  });
  // ô date gốc (trong suốt) nằm đè lên icon: chạm trực tiếp vào nó nên iOS/Android/Safari đều mở được lịch
  picker.addEventListener("click", () => {
    picker.value = input.value;
    try { picker.showPicker?.(); } catch {}
  });
  picker.addEventListener("change", () => {
    input.value = picker.value;
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
}

// Ngày tái khám rộng bằng ô Ngày khám (trừ điện thoại: 1 cột, rộng hết hàng)
function syncFollowDateWidth() {
  const follow = refs.followDate.closest(".date-field");
  const width = refs.visitDate.closest(".date-field").offsetWidth;
  follow.style.width = phoneLayoutQuery.matches || !width ? "" : `${width}px`;
}

function getGender() {
  return document.querySelector('#gender input[name="gender"]:checked')?.value || "Nam";
}

function setGender(value) {
  const radio = [...document.querySelectorAll('#gender input[name="gender"]')].find((item) => item.value === value);
  (radio || document.querySelector('#gender input[name="gender"]')).checked = true;
}

function setAdviceNote(value) {
  refs.adviceNote.value = value;
}

function fillFormFromRecord(patient, visit) {
  refs.patientName.value = patient?.fullName || "";
  refs.birthYear.value = patient?.birthYear || "";
  setGender(patient?.gender);
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
    price: Number(drug.unitPrice || 0),
    quantityManual: true // số lượng đã lưu: không tự tính lại theo liều
  })) : [createDraftRow()];
  renderDrugRows();
  if (visit?._id) { state.savedSignature = formSignature(); state.savedDrugSignature = drugSignature(); }
}

function drugSignature() {
  return JSON.stringify(state.draftRows.filter((row) => row.drugId && toNumber(row.quantity) > 0).map((row) => [row.drugId, toNumber(row.quantity), String(row.morning || "").trim(), String(row.noon || "").trim(), String(row.night || "").trim(), String(row.usage || "").trim()]));
}

// chữ ký nội dung form: so với lúc nạp lần khám để biết có thay đổi gì chưa
function formSignature() {
  return JSON.stringify([
    refs.patientName.value.trim(), refs.phone.value.trim(), refs.birthYear.value.trim(), getGender(), refs.addressWard.value.trim(), refs.province.value.trim(),
    refs.visitDoctor.value.trim(), refs.visitDate.value, refs.followDate.value, refs.symptom.value.trim(), refs.icdInput.value.trim(), refs.adviceNote.value.trim(), toNumber(refs.serviceFee.value),
    state.draftRows.filter((row) => row.drugId && toNumber(row.quantity) > 0).map((row) => [row.drugId, toNumber(row.quantity), String(row.morning || "").trim(), String(row.noon || "").trim(), String(row.night || "").trim(), String(row.usage || "").trim()])
  ]);
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
  setGender("Nam");
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
  renderPatientList();
  refreshVisitView();
}

// "Toa mới": chỉ xóa hết dòng thuốc của lần khám đang chọn để kê lại từ đầu
function createNewPrescription() {
  state.draftRows = [createDraftRow()];
  state.autoSuggestedRowKeys = [];
  state.moneyOverrides.drug = null;
  renderDrugRows();
  updateTotals();
  updateWarning();
}

function handleBirthYearInput() {
  calcAge();
  if (!wheelOnlyQuery.matches && !state.wheel) showYearSuggestions(refs.birthYear.value);
}

function syncBirthYearMode() {
  const wheelOnly = wheelOnlyQuery.matches;
  [refs.birthYear, refs.age].forEach((input) => {
    input.readOnly = wheelOnly;
    input.setAttribute("inputmode", wheelOnly ? "none" : "numeric");
  });
  refs.serviceMoney.readOnly = phoneLayoutQuery.matches;
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

function openYearWheel(kind = "year", target = null) {
  const fee = kind === "fee";
  const rowOption = kind === "dose" || kind === "qty";
  const sheet = wheelOnlyQuery.matches;
  let values;
  let startIndex;
  let label = "Năm sinh";
  if (fee) {
    label = "Công khám";
    values = [0, ...SERVICE_FEE_OPTIONS];
    const current = toNumber(refs.serviceMoney.value) || DEFAULT_SERVICE_FEE;
    startIndex = values.reduce((best, value, index) => (Math.abs(value - current) < Math.abs(values[best] - current) ? index : best), 0);
  } else if (kind === "page") {
    label = "Trang";
    values = Array.from({ length: Math.max(1, Math.ceil(state.filteredPatients.length / pageSize())) }, (_, index) => index + 1);
    startIndex = Math.min(values.length - 1, Math.max(0, state.page - 1));
  } else if (kind === "age") {
    label = "Tuổi";
    values = Array.from({ length: 121 }, (_, index) => index);
    const current = refs.age.value.trim();
    startIndex = current === "" ? 40 : Math.min(120, Number(current));
  } else if (rowOption) {
    const row = state.draftRows.find((item) => item.key === target?.key);
    if (!row) return;
    label = kind === "dose" ? DOSE_LABELS[target.field] : "Số lượng";
    values = kind === "dose" ? ["", ...DOSE_OPTIONS] : QUANTITY_OPTIONS;
    const current = String(row[target.field] ?? "");
    startIndex = values.indexOf(current);
    if (startIndex < 0) startIndex = kind === "qty" ? values.reduce((best, value, index) => (Math.abs(toNumber(value) - toNumber(current)) < Math.abs(toNumber(values[best]) - toNumber(current)) ? index : best), 0) : 0;
  } else {
    const lastYear = new Date().getFullYear();
    values = Array.from({ length: lastYear - WHEEL_MIN_YEAR + 1 }, (_, index) => WHEEL_MIN_YEAR + index);
    const current = Number(refs.birthYear.value);
    startIndex = values.indexOf(values.includes(current) ? current : WHEEL_DEFAULT_YEAR);
  }

  refs.yearWheel.setAttribute("aria-label", label);
  refs.yearWheel.innerHTML = values
    .map((value, index) => `<div class="wheel__item" role="option" aria-selected="false" id="wheel-opt-${index}" data-index="${index}">${fee ? formatMoney(value) : value === "" ? "–" : value}</div>`)
    .join("");
  const input = fee ? refs.serviceMoney : kind === "age" ? refs.age : kind === "page" ? null : rowOption ? target?.anchor : refs.birthYear;
  state.wheel = { kind, target, years: values, index: startIndex, range: [0, -1], frame: 0, opener: document.activeElement, input, typed: false };

  refs.yearWheelLayer.classList.remove("hidden");
  refs.yearWheelLayer.classList.toggle("no-kb", kind === "page");
  refs.yearWheelLayer.classList.toggle("is-sheet", sheet);
  refs.yearWheelLayer.classList.toggle("is-pop", !sheet);
  if (sheet) document.body.style.overflow = "hidden";
  else positionYearWheelPopover();

  refs.yearWheel.scrollTop = state.wheel.index * WHEEL_ITEM_HEIGHT;
  updateYearWheel();
  // máy tính: giữ con trỏ trong ô để gõ số ngay (chọn sẵn toàn bộ để gõ đè); điện thoại: focus vòng quay
  if (!sheet && state.wheel.input) {
    state.wheel.input.focus({ preventScroll: true });
    state.wheel.input.select?.();
  } else refs.yearWheel.focus({ preventScroll: true });
}

// gõ từ bàn phím khi vòng quay đang mở (máy tính): vòng quay chạy theo số vừa gõ
function syncWheelToTypedValue(event) {
  const wheel = state.wheel;
  if (!wheel || event.target !== wheel.input) return;
  wheel.typed = true;
  wheel.syncIndex = wheel.index;
  const typed = String(event.target.value).trim();
  if (typed === "") return;
  const target = Number(typed.replace(/\./g, "").replace(",", ".")) ;
  const isDose = wheel.kind === "dose";
  const wanted = isDose ? Number(typed.replace(",", ".")) : target;
  if (Number.isNaN(wanted)) return;
  const nums = wheel.years.map((value) => (value === "" ? NaN : Number(value)));
  let best = -1;
  nums.forEach((n, i) => { if (!Number.isNaN(n) && (best < 0 || Math.abs(n - wanted) < Math.abs(nums[best] - wanted))) best = i; });
  if (best < 0) return;
  wheel.index = best;
  wheel.syncIndex = best;
  refs.yearWheel.scrollTop = best * WHEEL_ITEM_HEIGHT;
  updateYearWheel();
}

// Enter / Tab / Esc trong ô đang mở vòng quay (máy tính)
function handleWheelInputKeydown(event) {
  const wheel = state.wheel;
  if (!wheel || event.target !== wheel.input) return;
  if (event.key === "Escape") { event.preventDefault(); closeYearWheel(); }
  else if (event.key === "Enter") { event.preventDefault(); applyYearWheel(wheel.typed ? "cancel" : "done"); }
  else if (event.key === "Tab") applyYearWheel(wheel.typed ? "cancel" : "done");
  else if (!wheel.typed && ["ArrowUp", "ArrowDown"].includes(event.key)) {
    event.preventDefault();
    scrollYearWheelTo(wheel.index + (event.key === "ArrowUp" ? -1 : 1));
  }
}

function positionYearWheelPopover() {
  const anchor = (state.wheel?.kind === "fee" ? refs.serviceMoney : state.wheel?.target?.anchor || refs.birthYearWrap).getBoundingClientRect();
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
  const isFee = state.wheel?.kind === "fee";
  state.wheel = null;
  // ô Công khám mở vòng quay khi được focus nên không trả focus về nó (sẽ mở lại vòng quay)
  if (opener && opener !== document.body && !isFee && !wheelOnlyQuery.matches) opener.focus?.({ preventScroll: true });
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
  // đã gõ rồi nhưng người dùng quay vòng quay sang số khác: lấy số của vòng quay
  if (wheel.typed && index !== wheel.syncIndex) wheel.typed = false;
}

function scrollYearWheelTo(index) {
  const last = state.wheel.years.length - 1;
  refs.yearWheel.scrollTo({ top: Math.min(last, Math.max(0, index)) * WHEEL_ITEM_HEIGHT, behavior: "smooth" });
}

// iOS chỉ bật bàn phím khi focus xảy ra ngay trong thao tác chạm; ô đang bị chặn bàn phím (inputmode "none") đổi chế độ rồi focus thì có khi không hiện.
// Nên focus một ô tạm (đã bật bàn phím) ngay lập tức, rồi chuyển focus sang ô thật: bàn phím giữ nguyên.
function focusWithKeyboard(input, inputmode) {
  const probe = document.createElement("input");
  probe.setAttribute("inputmode", inputmode);
  probe.setAttribute("aria-hidden", "true");
  probe.tabIndex = -1;
  probe.style.cssText = "position:fixed;top:0;left:0;width:1px;height:1px;opacity:0;font-size:16px;";
  document.body.append(probe);
  probe.focus();
  setTimeout(() => {
    input.setAttribute("inputmode", inputmode);
    input.readOnly = false;
    input.focus();
    probe.remove();
  }, 60);
}

function applyYearWheel(action) {
  const wheel = state.wheel;
  if (wheel?.kind === "page") {
    closeYearWheel();
    if (action === "done" && wheel.years[wheel.index] !== state.page) {
      state.page = wheel.years[wheel.index];
      renderPatientList();
      if (phoneLayoutQuery.matches) refs.patientListBody.closest(".patient-top").scrollIntoView({ block: "start" });
    }
    return;
  }
  if (wheel && (wheel.kind === "dose" || wheel.kind === "qty")) {
    const rowElement = refs.drugRows.querySelector(`.drug-row[data-key="${wheel.target.key}"]`);
    const row = state.draftRows.find((item) => item.key === wheel.target.key);
    const input = rowElement?.querySelector(`input[data-field="${wheel.target.field}"]`);
    closeYearWheel();
    if (!row || !input) return;
    if (action === "keyboard") {
      // inputmode "none" (điện thoại) chặn bàn phím; đổi lại thành số rồi mới focus thì bàn phím hiện
      input.dataset.kb = "1";
      focusWithKeyboard(input, wheel.kind === "qty" ? "numeric" : "decimal");
    } else if (action === "done") {
      const value = wheel.years[wheel.index];
      row[wheel.target.field] = wheel.kind === "qty" ? toNumber(value) : value;
      input.value = row[wheel.target.field];
      if (wheel.kind === "qty") row.quantityManual = true;
      else { autoQuantity(row); syncQuantityInput(rowElement, row); }
      applyDoseAlertStateToRowElement(rowElement, row);
      refreshRowSubtotal(rowElement, row);
      updateTotals();
      updateWarning();
    }
    return;
  }
  if (action === "keyboard") {
    const input = state.wheel?.kind === "fee" ? refs.serviceMoney : state.wheel?.kind === "age" ? refs.age : refs.birthYear;
    closeYearWheel();
    input.dataset.kb = "1";
    focusWithKeyboard(input, "numeric");
    return;
  }
  if (state.wheel?.kind === "fee") {
    if (action === "done") {
      refs.serviceMoney.value = String(state.wheel.years[state.wheel.index]);
      state.moneyOverrides.service = toNumber(refs.serviceMoney.value);
      syncServiceFeeFromMoney();
      formatMoneyField(refs.serviceMoney, true);
      updateTotals();
    }
    closeYearWheel();
    return;
  }
  const isAge = state.wheel?.kind === "age";
  if (action === "done" && state.wheel) (isAge ? refs.age : refs.birthYear).value = String(state.wheel.years[state.wheel.index]);
  if (action === "clear") { refs.birthYear.value = ""; refs.age.value = ""; }
  if (action === "done") (isAge ? calcBirthYear : calcAge)();
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
    // nhấn vào một số: chọn luôn số đó (trừ vòng quay chọn trang vẫn chỉ cuộn tới)
    if (state.wheel.kind === "page") { scrollYearWheelTo(Number(item.dataset.index)); return; }
    state.wheel.index = Number(item.dataset.index);
    applyYearWheel("done");
    return;
  }
  // bấm ra ngoài là chọn năm đang ở giữa
  // (đã gõ số bằng bàn phím thì giữ số đã gõ, không lấy số trên vòng quay)
  if (event.target === refs.yearWheelLayer) applyYearWheel(state.wheel?.typed ? "cancel" : "done");
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
  autoGrowField(refs.icdInput);
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

// năm sinh → tuổi
function calcAge() {
  const year = Number(refs.birthYear.value || 0);
  refs.age.value = year ? String(Math.max(0, new Date().getFullYear() - year)) : "";
}

// tuổi → năm sinh
function calcBirthYear() {
  const age = refs.age.value.trim();
  refs.birthYear.value = age === "" ? "" : String(new Date().getFullYear() - Number(age));
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
  refs.codeDataBox.innerHTML = `
    <div class="code-manager">
      <div class="code-toolbar">
        <div class="code-search">
          <input class="field" id="icdSearchInput" type="search" placeholder="Tìm mã hoặc tên chẩn đoán..." autocomplete="off" aria-label="Tìm mã ICD" value="${escapeAttribute(state.icdSearch)}" />
          ${iconHtml("search")}
        </div>
        <button class="btn small primary" type="button" data-action="create-icd" title="Thêm mã ICD" aria-label="Thêm mã ICD">${iconHtml("plus")}<span>Thêm</span></button>
      </div>
      <div class="code-manager__list">
        <div class="code-head">
          <div>Mã ICD</div>
          <div>Tên chẩn đoán</div>
          <div></div>
        </div>
        <div id="codeRows"></div>
      </div>
      <div class="stock-menu hidden" id="codeMenu" role="menu">
        <button class="btn ghost" type="button" role="menuitem" data-action="edit-icd">${iconHtml("pencil")}<span>Chỉnh sửa</span></button>
        <button class="btn ghost" type="button" role="menuitem" data-action="delete-icd">${iconHtml("trash-2")}<span>Xóa</span></button>
      </div>
    </div>
  `;
  renderCodeRows();
}

function renderCodeRows() {
  const keyword = normalizeText(state.icdSearch.trim());
  const rows = state.icdList
    .filter((item) => !keyword || normalizeText(`${item.code} ${item.name}`).includes(keyword))
    .sort((a, b) => String(a.code).localeCompare(String(b.code), "vi"))
    .map((item) => `
      <div class="code-row ${item.code === state.selectedIcdCode ? "active" : ""}" data-action="use-icd" data-code="${escapeAttribute(item.code)}" title="Nhấp đúp để dùng mã này">
        <div class="code-row__code">${escapeHtml(item.code)}</div>
        <div class="code-row__name">${escapeHtml(item.name)}</div>
        <div class="code-row__actions">
          <button class="icon-btn" type="button" data-action="edit-icd" data-code="${escapeAttribute(item.code)}" aria-label="Sửa mã ${escapeAttribute(item.code)}" title="Sửa">${iconHtml("pencil")}</button>
          <button class="icon-btn danger" type="button" data-action="delete-icd" data-code="${escapeAttribute(item.code)}" aria-label="Xóa mã ${escapeAttribute(item.code)}" title="Xóa">${iconHtml("trash-2")}</button>
          <button class="icon-btn code-more" type="button" data-action="code-more" data-code="${escapeAttribute(item.code)}" aria-label="Tùy chọn mã ${escapeAttribute(item.code)}" aria-haspopup="menu" title="Tùy chọn">${iconHtml("more-vertical")}</button>
        </div>
      </div>
    `)
    .join("");
  document.getElementById("codeRows").innerHTML = rows || '<div class="code-empty">Không có mã ICD phù hợp.</div>';
  // khung chỉ hiện 5 dòng, còn lại cuộn
  const list = document.querySelector(".code-manager__list");
  // điện thoại: cột Mã ICD hẹp vừa đủ cho mã dài nhất
  list.style.setProperty("--code-w", `${Math.max(0, ...state.icdList.map((item) => String(item.code).length)) + 1}ch`);
  list.style.maxHeight = "";
  const items = [...list.querySelectorAll(".code-row")].slice(0, 5);
  if (items.length === 5 && list.offsetHeight) list.style.maxHeight = `${list.querySelector(".code-head").offsetHeight + items.reduce((sum, row) => sum + row.offsetHeight, 0) + 2}px`;
}

async function handleCodeDataClick(event) {
  const target = event.target.closest("[data-action]");
  const action = target?.dataset.action;
  const codeMenu = document.getElementById("codeMenu");
  if (!action) {
    codeMenu?.classList.add("hidden");
    return;
  }
  if (codeMenu && action !== "code-more") codeMenu.classList.add("hidden");
  // dùng mã ICD: nhấp đúp vào dòng; các nút khác: nhấp đơn
  if ((action === "use-icd") !== (event.type === "dblclick")) return;

  try {
    if (action === "code-more") {
      // điện thoại: nút ⋮ mở menu Chỉnh sửa / Xóa của mã này
      const menu = document.getElementById("codeMenu");
      const opening = menu.classList.contains("hidden") || menu.dataset.for !== target.dataset.code;
      menu.classList.toggle("hidden", !opening);
      if (!opening) return;
      menu.dataset.for = target.dataset.code;
      menu.querySelectorAll("[data-action]").forEach((item) => { item.dataset.code = target.dataset.code; });
      const rect = target.getBoundingClientRect();
      const below = rect.bottom + 6;
      menu.style.right = `${Math.max(8, window.innerWidth - rect.right)}px`;
      menu.style.top = `${below + menu.offsetHeight > window.innerHeight - 8 ? Math.max(8, rect.top - menu.offsetHeight - 6) : below}px`;
      return;
    }

    if (action === "edit-icd" || action === "create-icd") {
      const item = state.icdList.find((entry) => entry.code === target.dataset.code);
      state.editingIcdCode = item ? item.code : "";
      refs.icdEditTitle.textContent = item ? "Sửa mã chẩn đoán" : "Thêm mã chẩn đoán";
      refs.icdEditCode.value = item?.code || "";
      refs.icdEditName.value = item?.name || "";
      // thêm mới: nhập được nhiều mã một lần (có đánh số); sửa: chỉ một mã
      refs.icdEditSingle.classList.toggle("hidden", !item);
      refs.icdEditMulti.classList.toggle("hidden", Boolean(item));
      refs.icdAddRowBtn.classList.toggle("hidden", Boolean(item));
      if (!item) {
        refs.icdMultiList.innerHTML = "";
        addIcdRow(false);
      }
      refs.icdEditModal.showModal();
      return;
    }

    if (action === "delete-icd") {
      const item = state.icdList.find((entry) => entry.code === target.dataset.code);
      if (!item) return;
      state.deletingIcdCode = item.code;
      refs.icdDeleteText.textContent = `Xóa mã ${item.code} - ${item.name}?`;
      refs.icdDeleteModal.showModal();
      return;
    }

    if (action === "use-icd") {
      const code = target.dataset.code;
      const item = state.icdList.find((entry) => entry.code === code);
      if (!item) return;
      state.selectedIcdCode = item.code;
      refs.icdInput.value = `${item.code} - ${item.name}`;
      autoGrowField(refs.icdInput);
      renderCodeData();
      handleDiagnosisInput();
      return;
    }
  } catch (error) {
    handleError(error);
  }
}

function addIcdRow(focus) {
  const row = document.createElement("div");
  row.className = "icd-row";
  row.innerHTML = `<span class="icd-row__no" aria-hidden="true"></span><input class="field icd-row__code" placeholder="Mã ICD" aria-label="Mã ICD" autocomplete="off" /><textarea class="field icd-row__name" rows="1" placeholder="Tên chẩn đoán" aria-label="Tên chẩn đoán" autocomplete="off"></textarea><button class="icon-btn danger icd-row__del" type="button" aria-label="Xóa dòng" title="Xóa dòng">${iconHtml("trash-2")}</button>`;
  refs.icdMultiList.append(row);
  renumberIcdRows();
  // cuộn trong chính danh sách (không dùng scrollIntoView làm cả hộp nhảy) và focus ô mã mới để bàn phím giữ nguyên
  refs.icdMultiList.scrollTop = refs.icdMultiList.scrollHeight;
  if (focus) row.querySelector(".icd-row__code").focus({ preventScroll: true });
}

function renumberIcdRows() {
  refs.icdMultiList.querySelectorAll(".icd-row").forEach((row, index) => {
    row.querySelector(".icd-row__no").textContent = String(index + 1);
  });
}

async function saveIcdEdit() {
  if (!refs.icdEditMulti.classList.contains("hidden")) return saveIcdBatch();
  const code = refs.icdEditCode.value.trim();
  const name = refs.icdEditName.value.trim();
  const editing = state.editingIcdCode;
  if (!code || !name) return showToast("Nhập đầy đủ mã ICD và tên chẩn đoán.", "error");
  if (state.icdList.some((item) => item.code === code && item.code !== editing)) return showToast("Mã ICD bị trùng.", "error");
  try {
    state.icdList = state.icdList.map((item) => item.code === editing ? { code, name } : item);
    if (state.selectedIcdCode === editing) state.selectedIcdCode = code;
    await persistSettings();
    refs.icdEditModal.close();
    renderCodeRows();
    renderIcdSuggest();
    showToast("Đã sửa mã ICD.");
  } catch (error) {
    handleError(error);
  }
}

// thêm nhiều mã một lần: bỏ qua dòng để trống hoàn toàn, báo lỗi theo số thứ tự dòng
async function saveIcdBatch() {
  const rows = [...refs.icdMultiList.querySelectorAll(".icd-row")].map((row, index) => ({
    no: index + 1,
    code: row.querySelector(".icd-row__code").value.trim(),
    name: row.querySelector(".icd-row__name").value.trim()
  })).filter((row) => row.code || row.name);
  if (!rows.length) return showToast("Nhập ít nhất một mã ICD.", "error");
  const seen = new Set(state.icdList.map((item) => item.code));
  for (const row of rows) {
    if (!row.code || !row.name) return showToast(`Dòng ${row.no}: nhập đầy đủ mã ICD và tên chẩn đoán.`, "error");
    if (seen.has(row.code)) return showToast(`Dòng ${row.no}: mã ${row.code} bị trùng.`, "error");
    seen.add(row.code);
  }
  try {
    rows.forEach(({ code, name }) => state.icdList.push({ code, name }));
    await persistSettings();
    refs.icdEditModal.close();
    renderCodeRows();
    renderIcdSuggest();
    showToast(rows.length > 1 ? `Đã thêm ${rows.length} mã ICD.` : "Đã thêm mã ICD.");
  } catch (error) {
    handleError(error);
  }
}

async function confirmDrugDelete() {
  if (!state.deletingDrugId) return;
  setBusy(refs.drugDeleteConfirmBtn, true);
  try {
    await fetchJson(`/api/drugs/${state.deletingDrugId}`, { method: "DELETE" });
    refs.drugDeleteModal.close();
    state.deletingDrugId = "";
    await loadDrugs();
    showToast("Đã xóa thuốc khỏi kho.", "success");
  } catch (error) {
    handleError(error);
  } finally {
    setBusy(refs.drugDeleteConfirmBtn, false);
  }
}

async function confirmIcdDelete() {
  try {
    state.icdList = state.icdList.filter((item) => item.code !== state.deletingIcdCode);
    if (state.selectedIcdCode === state.deletingIcdCode) state.selectedIcdCode = "";
    await persistSettings();
    refs.icdDeleteModal.close();
    renderCodeRows();
    renderIcdSuggest();
    showToast("Đã xóa mã ICD.");
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
      <input class="mini" data-field="${field}" placeholder="–" ${phoneLayoutQuery.matches ? 'inputmode="none"' : ""} aria-label="${DOSE_LABELS[field]}" value="${escapeAttribute(row[field] || "")}" />
      <span class="drug-lbl">${DOSE_LABELS[field]}</span>
      <div class="dose-quick hidden">
        ${DOSE_OPTIONS.map((option) => `<button class="dose-quick__btn" type="button" data-action="set-dose" data-dose-field="${field}" data-dose-value="${escapeAttribute(option)}">${escapeHtml(option)}</button>`).join("")}
      </div>
    </div>`;
}

// luôn có đúng 1 dòng tìm (draft trống) ở cuối danh sách
function ensureSearchRow() {
  const filled = state.draftRows.filter((row) => !isPristineDraftRow(row));
  state.draftRows = [...filled, state.draftRows.find(isPristineDraftRow) || createDraftRow()];
}

function buildDrugCalcHtml(row) {
  return `<span>Đơn giá: ${escapeHtml(formatMoney(row.price))}</span><span>Thành tiền: ${escapeHtml(formatMoney(toNumber(row.quantity) * toNumber(row.price)))}</span>`;
}

function buildDrugRowHtml(row, index) {
  if (isPristineDraftRow(row)) {
    return `
    <div class="drug-row drug-row--search" data-key="${row.key}">
      <div class="drug-search">
        ${iconHtml("search")}
        <input class="mini" data-field="activeIngredient" ${phoneLayoutQuery.matches ? "" : 'list="activeIngredientList"'} autocomplete="off" aria-label="Thêm thuốc" placeholder="${phoneLayoutQuery.matches ? "Tìm thuốc để thêm…" : "Gõ tên hoạt chất hoặc tên thương mại để thêm thuốc…"}" value="" />
        <div class="suggest-box drug-suggest hidden"></div>
      </div>
      <button class="icon-btn drug-search__print" type="button" data-action="preview-print" aria-label="Xem / In toa" title="Xem / In toa">${iconHtml("printer")}<span class="drug-search__lbl">Xem / In toa</span></button>
      <button class="btn small primary drug-search__new" type="button" data-action="new-prescription" aria-label="Toa mới: xóa hết thuốc" title="Xóa hết thuốc để kê toa mới cho lần khám đang chọn"><svg class="icon ic-phone" aria-hidden="true"><use href="#i-plus"/></svg><svg class="icon ic-pc" aria-hidden="true"><use href="#i-pill"/></svg><span class="drug-search__lbl">Toa mới</span></button>
    </div>`;
  }
  const number = index + 1;
  return `
    <div class="drug-row ${row.expanded ? "is-open" : ""}" data-key="${row.key}">
      <div class="drug-row__line">
        <div class="drug-cell drug-cell--index">${number}</div>
        <div class="drug-cell drug-cell--drug">
          <div class="drug-name"><span class="drug-name__idx">${number}. </span><span class="drug-name__text">${escapeHtml(row.activeIngredient)}</span><span class="drug-badges"></span></div>
        </div>
        ${DOSE_FIELDS.map((field) => buildDoseFieldHtml(row, field)).join("")}
        <div class="drug-field drug-field--quantity">
          <input class="mini" data-field="quantity" inputmode="${phoneLayoutQuery.matches ? "none" : "numeric"}" pattern="[0-9]*" aria-label="Số lượng" value="${escapeAttribute(row.quantity)}" />
          <span class="drug-lbl">Số lượng</span>
          <div class="quantity-quick hidden">
            ${QUANTITY_OPTIONS.map((option) => `<button class="quantity-quick__btn ${["30", "60", "90"].includes(option) ? "is-common" : ""}" type="button" data-action="set-quantity" data-quantity-value="${escapeAttribute(option)}">${escapeHtml(option)}</button>`).join("")}
          </div>
        </div>
        <div class="drug-cell drug-cell--price">${escapeHtml(formatMoney(row.price))}</div>
        <div class="drug-cell drug-cell--subtotal drug-subtotal"><strong>${escapeHtml(formatMoney(toNumber(row.quantity) * toNumber(row.price)))}</strong></div>
        <div class="drug-calc">${buildDrugCalcHtml(row)}</div>
        <div class="drug-actions">
          <button class="icon-btn danger drug-remove" data-action="remove" type="button" aria-label="Xóa dòng thuốc ${number}" title="Xóa dòng thuốc">${iconHtml("trash-2")}</button>
          <button class="icon-btn drug-toggle" data-action="toggle-row" type="button" aria-expanded="${row.expanded ? "true" : "false"}" aria-label="Chi tiết thuốc ${number}" title="Chi tiết">${iconHtml("chevron-down")}<span class="drug-toggle__text">${row.expanded ? "Thu gọn" : "Chi tiết"}</span></button>
          <button class="icon-btn drug-more" data-action="drug-more" type="button" aria-label="Tùy chọn dòng thuốc ${number}" aria-haspopup="menu" title="Tùy chọn">${iconHtml("more-vertical")}</button>
        </div>
      </div>
      <div class="drug-detail">
        ${detailFieldHtml("pill", "Hoạt chất", "drug-field--active", row.activeIngredient)}${detailFieldHtml("tag", "Tên thương mại", "drug-field--brand", getDrugBrandDisplay(row))}${detailFieldHtml("package", "Đơn vị", "drug-field--unit", row.unit)}${detailFieldHtml("clipboard-list", "Công dụng / HDSD", "drug-field--usage", row.usage)}
      </div>
    </div>`;
}

function detailFieldHtml(icon, label, cls, value) {
  return `<div class="drug-field ${cls}">${labelHtml(icon, label)}<strong>${escapeHtml(String(value ?? "") || "—")}</strong></div>`;
}

function renderDrugRows() {
  ensureSearchRow();
  // dòng nháp trống (ô tìm thuốc) nằm riêng ở thanh thêm thuốc bên dưới; các dòng thuốc thật nằm trong bảng
  const rowsHtml = [];
  let barHtml = "";
  state.draftRows.forEach((row, index) => {
    if (isPristineDraftRow(row)) barHtml += buildDrugRowHtml(row, index);
    else rowsHtml.push(buildDrugRowHtml(row, index));
  });
  refs.drugRows.innerHTML = rowsHtml.join("");
  refs.drugRows.closest(".drug-table").classList.toggle("is-empty", !rowsHtml.length);
  refs.drugAddBar.innerHTML = barHtml;
  refreshDrugRowStates();
}

function refreshDrugRowStates() {
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

// ---- Ô thêm thuốc (điện thoại): bấm vào hiện thuốc dùng gần đây, gõ thì hiện danh sách khớp ----

const RECENT_DRUGS_KEY = "pk_recent_drugs";

function getRecentDrugIds() {
  try { return JSON.parse(localStorage.getItem(RECENT_DRUGS_KEY) || "[]"); } catch { return []; }
}

function rememberRecentDrug(id) {
  if (!id) return;
  try { localStorage.setItem(RECENT_DRUGS_KEY, JSON.stringify([id, ...getRecentDrugIds().filter((item) => item !== id)].slice(0, 12))); } catch {}
}

function showDrugSearchSuggest(event) {
  const input = event.target;
  if (!phoneLayoutQuery.matches || !input.matches?.(".drug-row--search input[data-field='activeIngredient']")) return;
  const box = input.parentElement.querySelector(".drug-suggest");
  const keyword = normalizeText(input.value.trim());
  const available = state.drugs;
  let rows;
  if (keyword) {
    rows = available.filter((drug) => normalizeText(`${drug.activeIngredient} ${drug.brandName || ""}`).includes(keyword)).slice(0, 30);
  } else {
    const byId = new Map(available.map((drug) => [drug._id, drug]));
    rows = getRecentDrugIds().map((id) => byId.get(id)).filter(Boolean).slice(0, 8);
  }
  const heading = keyword ? "" : rows.length ? '<div class="suggest-head">Gần đây</div>' : "";
  box.innerHTML = heading + (rows.map((drug) => `<div class="suggest-item" data-drug-id="${escapeAttribute(drug._id)}">${escapeHtml(drug.activeIngredient)}${drug.brandName ? `<small>${escapeHtml(drug.brandName)}</small>` : ""}</div>`).join("")
    || (keyword ? '<div class="suggest-item">Không có thuốc phù hợp.</div>' : ""));
  box.classList.toggle("hidden", !box.innerHTML);
}

function pickDrugFromSearch(drug, rowKey) {
  if (!drug) return;
  if (state.draftRows.some((row) => row.drugId === drug._id)) {
    showToast(`${drug.activeIngredient} đã có trong toa.`, "error");
    // xóa chữ đã gõ ở ô tìm, nếu không dòng đó thành một dòng thuốc thừa
    const typed = state.draftRows.find((item) => item.key === rowKey);
    if (typed && !typed.drugId) typed.activeIngredient = "";
    renderDrugRows();
    updateTotals();
    return;
  }
  // dòng đang gõ có thể đã mang chữ vừa nhập, nên lấy đúng dòng theo key
  const row = state.draftRows.find((item) => item.key === rowKey) || state.draftRows.find(isPristineDraftRow) || createDraftRow();
  if (!state.draftRows.includes(row)) state.draftRows.push(row);
  applyCatalogDrugToRow(row, drug);
  renderDrugRows();
  updateTotals();
  updateWarning();
  refs.drugRows.querySelector(`.drug-row[data-key="${row.key}"] input[data-field="morning"]`)?.focus();
}

function handleDrugRowClick(event) {
  const suggestion = event.target.closest(".drug-suggest [data-drug-id]");
  if (suggestion) {
    pickDrugFromSearch(state.drugs.find((item) => item._id === suggestion.dataset.drugId), suggestion.closest(".drug-row")?.dataset.key);
    return;
  }
  const moreButton = event.target.closest("[data-action='drug-more']");
  if (moreButton) {
    // điện thoại: nút ⋮ mở menu Chi tiết / Xóa của dòng thuốc này
    const menu = document.getElementById("drugRowMenu");
    const rowElement = moreButton.closest(".drug-row");
    const opening = menu.classList.contains("hidden") || menu.dataset.key !== rowElement.dataset.key;
    menu.classList.toggle("hidden", !opening);
    if (!opening) return;
    menu.dataset.key = rowElement.dataset.key;
    const expanded = state.draftRows.find((item) => item.key === rowElement.dataset.key)?.expanded;
    menu.querySelector('[data-action="toggle-row"] span').textContent = expanded ? "Thu gọn chi tiết" : "Xem chi tiết";
    const rect = moreButton.getBoundingClientRect();
    const below = rect.bottom + 6;
    menu.style.right = `${Math.max(8, window.innerWidth - rect.right)}px`;
    menu.style.top = `${below + menu.offsetHeight > window.innerHeight - 8 ? Math.max(8, rect.top - menu.offsetHeight - 6) : below}px`;
    return;
  }
  if (event.target.closest("[data-action='preview-print']")) {
    showPrescriptionPreview();
    return;
  }
  if (event.target.closest("[data-action='new-prescription']")) {
    createNewPrescription();
    showToast("Đã tạo toa mới.", "success");
    return;
  }
  // điện thoại: chạm vào Sáng / Trưa / Tối / Số lượng mở vòng quay chọn giống Năm sinh
  const optionInput = event.target.closest("input[data-field='morning'], input[data-field='noon'], input[data-field='night'], input[data-field='quantity']");
  if (optionInput && !optionInput.dataset.kb && !state.wheel) {
    const field = optionInput.dataset.field;
    openYearWheel(field === "quantity" ? "qty" : "dose", { key: optionInput.closest(".drug-row").dataset.key, field, anchor: optionInput });
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
      autoQuantity(row);
      syncQuantityInput(rowElement, row);
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

// cập nhật dòng chính (tên, dòng phụ, đơn giá, thành tiền) sau khi sửa
function refreshRowSubtotal(rowElement, row) {
  const set = (selector, html) => { const el = rowElement.querySelector(selector); if (el) el.innerHTML = html; };
  set(".drug-name__text", escapeHtml(row.activeIngredient));
  set(".drug-cell--price", escapeHtml(formatMoney(row.price)));
  set(".drug-subtotal", `<strong>${escapeHtml(formatMoney(toNumber(row.quantity) * toNumber(row.price)))}</strong>`);
  set(".drug-calc", buildDrugCalcHtml(row));
}

function handleDrugRowChange(event) {
  const field = event.target?.dataset?.field;
  if (event.type === "focusout" && field !== "quantity") return;
  const rowElement = event.target.closest(".drug-row");
  if (!rowElement) return;
  const row = state.draftRows.find((item) => item.key === rowElement.dataset.key);
  if (!row || !field) return;

  if (field === "activeIngredient") {
    const wasSearch = rowElement.classList.contains("drug-row--search");
    row.activeIngredient = event.target.value;
    if (event.type === "change") {
      const drug = findMatchingDrugByIngredient(row.activeIngredient, row.brandName);
      if (drug && state.draftRows.some((item) => item !== row && item.drugId === drug._id)) {
        showToast(`${drug.activeIngredient} đã có trong toa.`, "error");
        row.activeIngredient = "";
        renderDrugRows();
        updateTotals();
        return;
      }
      if (drug) {
        applyCatalogDrugToRow(row, drug);
      } else {
        row.drugId = "";
        row.brandName = composeBrandName(row.brandName, row.activeIngredient);
      }
      renderDrugRows();
      if (wasSearch && row.drugId) refs.drugRows.querySelector(`.drug-row[data-key="${row.key}"] input[data-field="morning"]`)?.focus();
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
      row.quantityManual = true;
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
    if (DOSE_FIELDS.includes(field)) { autoQuantity(row); syncQuantityInput(rowElement, row); }
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
  // dòng tìm đang gõ dở (cuối danh sách, chưa gắn thuốc) không tính vào số thuốc
  const lastIndex = state.draftRows.length - 1;
  const count = state.draftRows.filter((row, index) => !isPristineDraftRow(row) && (row.drugId || (row.activeIngredient && index < lastIndex))).length;
  refs.drugSummary.innerHTML = `<span class="muted">${count} thuốc · Tiền thuốc</span> <strong>${escapeHtml(formatMoney(drugTotal))}</strong>`;
}

// tồn kho dự kiến của từng thuốc nếu lưu toa hiện tại (khi sửa toa cũ, trả lại số lượng toa đó trước khi so)
function computeProjectedStock() {
  const editing = state.editingVisitId ? findHistoryVisit(state.editingVisitId) : null;
  const restored = new Map();
  (editing?.drugs || []).forEach((item) => restored.set(String(item.drugId), (restored.get(String(item.drugId)) || 0) + Number(item.quantity || 0)));
  const requested = new Map();
  state.draftRows.forEach((row) => {
    if (row.drugId && toNumber(row.quantity) > 0) requested.set(row.drugId, (requested.get(row.drugId) || 0) + toNumber(row.quantity));
  });
  const projected = new Map();
  requested.forEach((quantity, drugId) => {
    const drug = state.drugs.find((item) => item._id === drugId);
    if (drug) projected.set(drugId, { drug, after: Number(drug.quantity || 0) + (restored.get(drugId) || 0) - quantity });
  });
  return projected;
}

function updateWarning() {
  refreshDrugRowStates();
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
  refs.serviceFeeList.innerHTML = SERVICE_FEE_OPTIONS.map((value) => `<option value="${value}"></option>`).join("");
}

// Công khám chọn bằng vòng quay như Năm sinh
function openServiceFeePicker() {
  if (state.wheel || refs.serviceMoney.dataset.kb) return;
  refs.serviceFeeSuggestBox.classList.add("hidden");
  openYearWheel("fee");
}

function renderServiceFeeSuggest() {
  if (phoneLayoutQuery.matches) return;
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

// bảng kho thuốc hiện ở tab Kho thuốc hoặc trong mục sổ của Home; chỉ dựng ở nơi đang xem để không trùng id
function stockHost() {
  return state.activeTab === "stock" ? refs.stockTabBox : refs.stockDataBox;
}

function renderStockData() {
  const pending = state.pendingStockRows;
  const host = stockHost();
  (host === refs.stockTabBox ? refs.stockDataBox : refs.stockTabBox).innerHTML = "";
  host.innerHTML = `
    <div class="stock-manager">
      <div class="code-toolbar">
        <div class="code-search">
          <input class="field" id="stockSearchInput" type="search" placeholder="Tìm hoạt chất hoặc tên thương mại..." autocomplete="off" aria-label="Tìm thuốc trong kho" value="${escapeAttribute(state.stockSearch)}" />
          ${iconHtml("search")}
        </div>
        <button class="btn small primary" type="button" data-action="add-drug" aria-label="Thêm thuốc" title="Thêm thuốc">${iconHtml("plus")}<span>Thêm thuốc</span></button>
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
        <div id="stockRows"></div>
      </div>
      <div class="stock-menu hidden" id="stockMenu" role="menu">
        <button class="btn ghost" type="button" role="menuitem" data-action="toggle-stock">${iconHtml("eye")}<span>Xem chi tiết</span></button>
        <button class="btn ghost" type="button" role="menuitem" data-action="stock-in">${iconHtml("download")}<span>Nhập kho</span></button>
        <button class="btn ghost" type="button" role="menuitem" data-action="open-drug">${iconHtml("pencil")}<span>Chỉnh sửa</span></button>
        <button class="btn ghost" type="button" role="menuitem" data-action="delete-drug">${iconHtml("trash-2")}<span>Xóa</span></button>
      </div>
    </div>
  `;
  renderStockRows();
}

function renderStockRows() {
  const keyword = normalizeText(state.stockSearch.trim());
  const drugs = getSortedStockDrugs().filter((drug) => !keyword || normalizeText(`${drug.activeIngredient} ${drug.brandName || ""}`).includes(keyword));
  document.getElementById("stockRows").innerHTML = drugs.map((drug) => {
    const negative = Number(drug.quantity) < 0;
    const open = state.stockOpen.has(drug._id);
    return `
      <div class="stock-item ${open ? "is-open" : ""}">
      <div class="stock-row ${negative ? "is-negative" : ""}" data-action="use-drug" data-id="${drug._id}" title="Nhấp đúp để thêm vào toa">
        <div class="stock-row__name">${escapeHtml(drug.activeIngredient)}${negative ? `<button class="badge-neg" type="button" data-action="stock-in" data-id="${drug._id}" title="Nhập kho thuốc này">Âm kho</button>` : ""}</div>
        <div class="stock-row__qty"><span class="stock-row__lbl">Tồn kho: </span>${formatNumber(drug.quantity)}</div>
        <div class="stock-row__price"><span class="stock-row__lbl">Đơn giá: </span>${formatMoney(drug.price)}</div>
        <div class="stock-row__act"><button class="icon-btn" data-action="stock-in" data-id="${drug._id}" type="button" aria-label="Nhập kho ${escapeAttribute(drug.activeIngredient)}" title="Nhập kho">${iconHtml("download")}</button><button class="icon-btn" data-action="open-drug" data-id="${drug._id}" type="button" aria-label="Sửa ${escapeAttribute(drug.activeIngredient)}" title="Sửa">${iconHtml("pencil")}</button><button class="icon-btn danger" data-action="delete-drug" data-id="${drug._id}" type="button" aria-label="Xóa ${escapeAttribute(drug.activeIngredient)}" title="Xóa">${iconHtml("trash-2")}</button><button class="icon-btn stock-toggle" data-action="toggle-stock" data-id="${drug._id}" type="button" aria-expanded="${open}" aria-label="Chi tiết ${escapeAttribute(drug.activeIngredient)}" title="Chi tiết">${iconHtml("chevron-down")}</button><button class="icon-btn stock-more" data-action="stock-more" data-id="${drug._id}" type="button" aria-label="Tùy chọn ${escapeAttribute(drug.activeIngredient)}" aria-haspopup="menu" title="Tùy chọn">${iconHtml("more-vertical")}</button></div>
      </div>
      <div class="stock-detail">
        ${detailFieldHtml("pill", "Hoạt chất", "drug-field--active", drug.activeIngredient)}${detailFieldHtml("tag", "Tên thương mại", "drug-field--brand", drug.brandName)}${detailFieldHtml("package", "Đơn vị", "drug-field--unit", drug.unit)}${detailFieldHtml("clipboard-list", "Công dụng / HDSD", "drug-field--usage", drug.usage)}${drug.notes ? detailFieldHtml("sticky-note", "Ghi chú", "drug-field--usage", drug.notes) : ""}
      </div>
      </div>`;
  }).join("") || '<div class="code-empty">Không có thuốc phù hợp.</div>';
  fitStockList();
}

// khung cố định cao 8 dòng (kể cả khi mở chi tiết), còn lại cuộn
function toggleStockItem(item) {
  const id = item.querySelector(".stock-toggle").dataset.id;
  const open = !state.stockOpen.has(id);
  state.stockOpen[open ? "add" : "delete"](id);
  item.classList.toggle("is-open", open);
  item.querySelector(".stock-toggle").setAttribute("aria-expanded", open);
  fitStockList();
}

function fitStockList() {
  const list = document.querySelector(".stock-list");
  if (!list) return;
  // tab Kho thuốc: danh sách cuộn tràn theo trang, không giới hạn chiều cao
  if (list.closest("#stockTabBox")) { list.style.maxHeight = "none"; return; }
  keepScroll(list, () => {
    list.style.maxHeight = "";
    const rows = [...list.querySelectorAll(".stock-row")];
    if (rows.length < 8 || !list.offsetHeight) return;
    const rowsHeight = rows.slice(0, 8).reduce((total, el) => total + el.offsetHeight, 0);
    list.style.maxHeight = `${list.querySelector(".stock-head").offsetHeight + rowsHeight + 2}px`;
  });
}

function updateStockInPreview() {
  const drug = state.drugs.find((item) => item._id === state.stockInId);
  const current = Number(drug?.quantity || 0);
  const add = Number(refs.stockInQty.value) || 0;
  refs.stockInCurrent.textContent = formatNumber(current);
  refs.stockInAfter.textContent = formatNumber(current + add);
}

async function confirmStockIn() {
  const add = Number(refs.stockInQty.value);
  if (!Number.isInteger(add) || add <= 0) return showToast("Nhập số lượng nhập kho là số nguyên dương.", "error");
  setBusy(refs.stockInConfirmBtn, true);
  try {
    // lấy tồn mới nhất từ server để không ghi đè thay đổi của lượt khám vừa lưu
    const fresh = (await fetchJson("/api/drugs")).find((item) => item._id === state.stockInId);
    if (!fresh) throw new Error("Thuốc không còn trong kho.");
    await fetchJson(`/api/drugs/${fresh._id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        activeIngredient: fresh.activeIngredient,
        brandName: fresh.brandName,
        unit: fresh.unit,
        usage: fresh.usage,
        notes: fresh.notes,
        price: fresh.price,
        quantity: Number(fresh.quantity || 0) + add
      })
    });
    refs.stockInModal.close();
    await loadDrugs();
    showToast(`Đã nhập kho ${formatNumber(add)} ${fresh.unit || ""}.`.trim(), "success");
  } catch (error) {
    handleError(error);
  } finally {
    setBusy(refs.stockInConfirmBtn, false);
  }
}

function applyStockPaste() {
  try {
    const rows = parseStockPaste(refs.stockPasteInput.value || "");
    if (!rows.length) throw new Error("Chưa có dữ liệu Excel hợp lệ để dán.");
    state.pendingStockRows = [...state.pendingStockRows, ...rows];
    refs.stockPasteInput.value = "";
    refs.stockAddModal.close();
    renderStockData();
    showToast(`Đã dán ${rows.length} dòng. Bấm "Lưu" để thêm vào kho.`, "success");
  } catch (error) {
    handleError(error);
  }
}

function openStockIn(id) {
  const drug = state.drugs.find((item) => item._id === id);
  if (!drug) return;
  state.stockInId = drug._id;
  refs.stockInName.textContent = [drug.activeIngredient, drug.brandName].filter(Boolean).join(" / ");
  refs.stockInQty.value = "50";
  updateStockInPreview();
  refs.stockInModal.showModal();
  // điện thoại: không tự bật bàn phím cùng lúc với hộp thoại (Safari đẩy hộp thoại lệch khỏi màn hình)
  if (!phoneLayoutQuery.matches) refs.stockInQty.focus();
}

async function handleStockDataClick(event) {
  const actionElement = event.target.closest("[data-action]");
  const stockMenu = document.getElementById("stockMenu");
  if (!actionElement) {
    stockMenu?.classList.add("hidden");
    return;
  }
  const action = actionElement.dataset.action;
  if (stockMenu && action !== "stock-more") stockMenu.classList.add("hidden");
  // đưa thuốc vào toa: nhấp đúp vào dòng; các nút khác: nhấp đơn
  if (action === "use-drug" && event.type === "click") return;
  if ((action === "use-drug") !== (event.type === "dblclick")) return;

  try {
    if (action === "use-drug") {
      const drug = state.drugs.find((item) => item._id === actionElement.dataset.id);
      if (!drug) return;
      if (state.draftRows.some((row) => row.drugId === drug._id)) {
        showToast(`${drug.activeIngredient} đã có trong toa.`, "error");
        return;
      }
      const row = state.draftRows.find(isPristineDraftRow) || createDraftRow();
      if (!state.draftRows.includes(row)) state.draftRows.push(row);
      // điện thoại: toa dài ra đẩy Kho thuốc xuống, bù lại để dòng vừa nhấp đúp đứng yên trên màn hình
      const topBefore = actionElement.getBoundingClientRect().top;
      applyCatalogDrugToRow(row, drug);
      renderDrugRows();
      updateTotals();
      updateWarning();
      if (phoneLayoutQuery.matches) window.scrollBy({ top: actionElement.getBoundingClientRect().top - topBefore, behavior: "instant" });
      showToast(`Đã thêm ${drug.activeIngredient} vào toa.`);
      return;
    }

    if (action === "delete-drug") {
      const drug = state.drugs.find((item) => item._id === actionElement.dataset.id);
      if (!drug) return;
      state.deletingDrugId = drug._id;
      refs.drugDeleteText.textContent = `Xóa thuốc ${[drug.activeIngredient, drug.brandName].filter(Boolean).join(" / ")} khỏi kho?`;
      refs.drugDeleteModal.showModal();
      return;
    }

    if (action === "stock-more") {
      // điện thoại: một nút ⋮ mở menu 3 tùy chọn (nhập kho, chỉnh sửa, xem chi tiết) của thuốc này
      const menu = document.getElementById("stockMenu");
      const opening = menu.classList.contains("hidden") || menu.dataset.for !== actionElement.dataset.id;
      menu.classList.toggle("hidden", !opening);
      if (!opening) return;
      menu.dataset.for = actionElement.dataset.id;
      menu.querySelectorAll("[data-action]").forEach((item) => { item.dataset.id = actionElement.dataset.id; });
      const open = state.stockOpen.has(actionElement.dataset.id);
      menu.querySelector('[data-action="toggle-stock"] span').textContent = open ? "Thu gọn chi tiết" : "Xem chi tiết";
      const rect = actionElement.getBoundingClientRect();
      const below = rect.bottom + 6;
      menu.style.right = `${Math.max(8, window.innerWidth - rect.right)}px`;
      menu.style.top = `${below + menu.offsetHeight > window.innerHeight - 8 ? Math.max(8, rect.top - menu.offsetHeight - 6) : below}px`;
      return;
    }

    if (action === "toggle-stock") {
      const id = actionElement.dataset.id;
      toggleStockItem(actionElement.closest(".stock-item") || document.querySelector(`.stock-toggle[data-id="${id}"]`)?.closest(".stock-item"));
      fitStockList();
      return;
    }

    if (action === "stock-in") {
      openStockIn(actionElement.dataset.id);
      return;
    }

    if (action === "add-drug") {
      // điện thoại: mở thẳng hộp nhập từng thuốc, bỏ bước dán từ Excel
      if (phoneLayoutQuery.matches) openDrugModal("");
      else refs.stockAddModal.showModal();
      return;
    }

    if (action === "open-drug") {
      openDrugModal(actionElement.dataset.id);
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

// số lượng mặc định = (sáng + trưa + tối) × 30; thôi tự tính khi người dùng đã tự chọn/gõ số lượng
// liều có thể là số thập phân ("0.25", "1,5"); toNumber coi dấu chấm là phân cách nghìn nên không dùng được
const doseValue = (value) => Number(String(value || "").replace(",", ".")) || 0;

function autoQuantity(row) {
  if (row.quantityManual) return;
  const perDay = DOSE_FIELDS.reduce((sum, field) => sum + doseValue(row[field]), 0);
  if (perDay > 0) row.quantity = Math.ceil(perDay * 30);
}

function syncQuantityInput(rowElement, row) {
  const input = rowElement?.querySelector("input[data-field='quantity']");
  if (input) input.value = row.quantity;
}

function applyCatalogDrugToRow(row, drug) {
  rememberRecentDrug(drug?._id);
  row.drugId = drug?._id || "";
  row.activeIngredient = drug?.activeIngredient || row.activeIngredient;
  row.brandName = composeBrandName(drug?.brandName || row.brandName, row.activeIngredient);
  row.unit = drug?.unit || row.unit || "Viên";
  row.quantity = toNumber(row.quantity) || 30;
  row.usage = drug?.usage || row.usage || "";
  row.price = Number(drug?.price || row.price || 0);
  // mặc định 1 viên sáng và tối, trưa để trống
  if (!DOSE_FIELDS.some((field) => String(row[field] || "").trim())) { row.morning = "1"; row.night = "1"; }
  autoQuantity(row);
}

function applyDoseAlertStateToRowElement(rowElement, row) {
  const exceeded = isDrugDoseExceeded(row);
  const doseInfo = getDrugDoseLimitInfo(row);
  const title = exceeded && doseInfo
    ? `Vượt liều tối đa/ngày: ${formatDoseValue(doseInfo.dailyDose)} > ${formatDoseValue(doseInfo.maxDose)} ${doseInfo.unit}`
    : "";
  rowElement.querySelectorAll('[data-field="activeIngredient"], .drug-field--dose .mini').forEach((input) => {
    input.classList.toggle("is-overdose", exceeded);
    input.title = title;
  });
  const badges = rowElement.querySelector(".drug-badges");
  if (!badges) return;
  const stock = row.drugId ? computeProjectedStock().get(row.drugId) : null;
  const negative = Boolean(stock && stock.after < 0);
  rowElement.classList.toggle("is-negative", negative);
  badges.innerHTML = `${exceeded ? '<span class="drug-badge drug-badge--danger" title="' + escapeAttribute(title) + '">Quá liều</span>' : ""}${
    stock ? (negative
      ? `<button class="drug-badge drug-badge--danger drug-badge--btn" type="button" data-stock-in="${escapeAttribute(row.drugId)}" title="Nhập kho thuốc này">Âm kho −${escapeHtml(formatNumber(Math.abs(stock.after)))}</button>`
      : `<span class="drug-badge drug-badge--ok">Kho ${escapeHtml(formatNumber(stock.drug.quantity))}</span>`) : ""}`;
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
  const dailyDose = DOSE_FIELDS.reduce((sum, field) => sum + doseValue(row[field]), 0) * strength.amount;
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
  }) || state.drugs.find((drug) => normalizeText(drug.activeIngredient).includes(normalizedIngredient))
    // gõ tên thương mại cũng tìm ra đúng thuốc trong kho (để kiểm tra trùng và gắn với kho)
    || (normalizedIngredient && state.drugs.find((drug) => normalizeText(drug.brandName || "").includes(normalizedIngredient)));
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
  if (state.editingVisitId && formSignature() === state.savedSignature) {
    showToast("Chưa có thay đổi nào để lưu.", "warn");
    return;
  }
  state.saving = true;
  updateSaveButtons();
  try {
    const patientPayload = {
      fullName: refs.patientName.value.trim(),
      phone: refs.phone.value.trim(),
      birthYear: refs.birthYear.value.trim(),
      gender: getGender(),
      address: refs.addressWard.value.trim(),
      province: refs.province.value.trim(),
      notes: ""
    };
    if (!patientPayload.fullName) throw new Error("Nhập đầy đủ thông tin bệnh nhân.");
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
      drugs,
      // sửa lần khám cũ mà không đụng tới chỉ định thuốc: báo máy chủ giữ nguyên toa và kho
      keepDrugs: Boolean(editingId) && drugSignature() === state.savedDrugSignature
    };

    const saved = await fetchJson(editingId ? `/api/visits/${editingId}` : `/api/patients/${patientId}/visits`, {
      method: editingId ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(visitPayload)
    });
    // lưu lần mới xong thì chọn luôn lần vừa tạo: bấm lưu lần nữa sẽ là PUT, không sinh trùng
    // loadPatients() bên dưới nạp lại bệnh nhân và chọn đúng lần này (selectPatient với editVisitId)
    state.selectedVisitId = state.editingVisitId = saved._id;

    const warnings = saved.warnings || [];
    if (warnings.length) {
      showToast(`Đã lưu. Cảnh báo âm kho: ${warnings.map((item) => `${item.brandName} (${formatNumber(item.quantity)})`).join(", ")}`, "warn", 7000);
    } else {
      showToast(editingId ? `Đã lưu thay đổi lần khám L${saved.visitNo}.` : "Đã lưu lượt khám và toa thuốc.", "success");
    }
    state.savedSignature = formSignature();
    state.savedDrugSignature = drugSignature();
    updateVisitDirtyDot();
    showSaveDone();
    await Promise.all([loadStats(), loadDrugs(), loadPatients()]);
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
  await Promise.all([loadStats(), loadPatients()]);
}

function showPrescriptionPreview() {
  // iframe riêng: CSS của toa không rò sang giao diện chính
  refs.rxFrame.srcdoc = buildPrescriptionHtml();
  prepareShareFile();
  refs.rxModal.showModal();
}

function autoGrowField(element) {
  if (!element) return;
  // ô Chẩn đoán khi không focus: gọn 1 dòng (CSS cắt bằng …), chỉ giãn khi đang sửa
  if (element === refs.icdInput) {
    refs.icdView.textContent = element.value || element.placeholder;
    refs.icdView.classList.toggle("is-placeholder", !element.value);
    if (document.activeElement !== element) {
      element.style.height = "";
      return;
    }
  }
  element.style.height = "auto";
  // min-height trong CSS giữ chiều cao tối thiểu bằng control; cộng viền vì scrollHeight không tính
  element.style.height = `${element.scrollHeight + element.offsetHeight - element.clientHeight}px`;
}

// dữ liệu cũ không có buổi trưa vẫn hiển thị đúng ("Trưa -")
function buildDoseText(row) {
  return DOSE_FIELDS.map((field) => `${DOSE_LABELS[field]} ${escapeHtml(row[field] || "-")}`).join(", ");
}

// ảnh đại diện đầu toa: nạp sẵn để vẽ canvas đồng bộ được
const rxLogo = new Image();
rxLogo.src = "/doctor-logo.png";

// Vẽ ảnh toa bằng canvas thuần (không dùng SVG foreignObject: Safari làm canvas bị "tainted" hoặc ra ảnh trống)
function drawPrescriptionCanvas() {
  const W = 1240, H = 1754, X = 106, CW = W - 2 * X;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  const FONT = '"Segoe UI","Noto Sans",Arial,Helvetica,sans-serif';
  const font = (size, bold) => { ctx.font = `${bold ? "700 " : ""}${size}px ${FONT}`; };
  const wrap = (text, width) => String(text).split("\n").flatMap((line) => {
    const out = [];
    let cur = "";
    for (const word of line.split(" ")) {
      const next = cur ? `${cur} ${word}` : word;
      if (cur && ctx.measureText(next).width > width) { out.push(cur); cur = word; } else cur = next;
    }
    out.push(cur);
    return out;
  });
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, W, H);
  ctx.textBaseline = "top";
  ctx.fillStyle = "#111";
  let y = 106;
  const doctor = refs.visitDoctor.value.trim() || state.clinicInfo.doctor || "";
  // đầu toa theo mẫu: tên phòng khám đậm, địa chỉ, điện thoại; tiêu đề ĐƠN THUỐC ở giữa
  const hasLogo = rxLogo.complete && rxLogo.naturalWidth > 0;
  // ảnh cao đúng bằng khối chữ đầu toa (tên + địa chỉ + SĐT), cùng mép trên nên căn giữa theo chiều dọc
  const headLines = [];
  font(38, true);
  wrap(String(state.clinicInfo.name || "").toUpperCase(), CW - 170).forEach((line) => headLines.push([line, true]));
  font(24);
  [`Địa chỉ: ${state.clinicInfo.address || "Chưa cập nhật địa chỉ"}`, `SĐT: ${state.clinicInfo.phone || "Chưa cập nhật số điện thoại"}`].forEach((text) => {
    wrap(text, CW - 170).forEach((line) => headLines.push([line, false]));
  });
  const textH = headLines.reduce((sum, [, bold]) => sum + (bold ? 52 : 36), 6);
  const LOGO = textH;
  if (hasLogo) ctx.drawImage(rxLogo, X, y - 3, LOGO, LOGO);
  const HX = hasLogo ? X + LOGO + 24 : X;
  const headTop = y;
  headLines.forEach(([line, bold]) => {
    font(bold ? 38 : 24, bold);
    ctx.fillText(line, HX, y);
    y += bold ? 52 : 36;
  });
  y = Math.max(y, headTop + (hasLogo ? LOGO : 0)) + 36;
  font(52, true);
  ctx.textAlign = "center";
  ctx.fillText("ĐƠN THUỐC", W / 2, y);
  ctx.textAlign = "left";
  y += 90;
  const LW = 150;
  // một ô "Nhãn: giá trị" trong cột rộng w; trả về chiều cao đã dùng
  const field = (label, value, x, w, boldValue) => {
    font(24, true);
    ctx.fillText(label, x, y);
    font(24, boldValue);
    const lines = wrap(value || "", w - LW);
    lines.forEach((line, i) => ctx.fillText(line, x + LW, y + i * 38));
    return 38 * Math.max(1, lines.length);
  };
  const pair = (a, b) => {
    const colW = CW / 2;
    y += Math.max(field(a[0], a[1], X, colW, a[2]), field(b[0], b[1], X + colW, colW));
  };
  pair(["Họ tên:", refs.patientName.value], ["Tuổi:", `${refs.age.value} tuổi (${getGender()})`]);
  pair(["Ngày khám:", formatDate(refs.visitDate.value)], ["Điện thoại:", refs.phone.value]);
  y += field("Địa chỉ:", [refs.addressWard.value, refs.province.value].filter(Boolean).join(", "), X, CW);
  y += field("Chẩn đoán:", refs.icdInput.value, X, CW);
  y += 24;
  const cols = [0.08, 0.42, 0.12, 0.10, 0.28].map((r) => r * CW);
  const rows = state.draftRows.filter((row) => row.brandName || row.activeIngredient).map((row, index) => [
    String(index + 1),
    [row.activeIngredient, composeBrandName(row.brandName, row.activeIngredient)].filter(Boolean).join(" / "),
    row.unit || "Viên",
    String(row.quantity || ""),
    DOSE_FIELDS.map((field) => `${DOSE_LABELS[field]} ${row[field] || "-"}`).join(", ")
  ]);
  const drawRow = (cells, bold, bg) => {
    font(22, bold);
    const lines = cells.map((cell, i) => wrap(cell, cols[i] - 20));
    const h = Math.max(...lines.map((l) => l.length)) * 30 + 20;
    let cx = X;
    cells.forEach((_, i) => {
      if (bg) { ctx.fillStyle = bg; ctx.fillRect(cx, y, cols[i], h); }
      ctx.strokeStyle = "#111";
      ctx.lineWidth = 1;
      ctx.strokeRect(cx, y, cols[i], h);
      ctx.fillStyle = "#111";
      lines[i].forEach((line, j) => {
        if (bold) { ctx.textAlign = "center"; ctx.fillText(line, cx + cols[i] / 2, y + 10 + j * 30); ctx.textAlign = "left"; }
        else ctx.fillText(line, cx + 10, y + 10 + j * 30);
      });
      cx += cols[i];
    });
    y += h;
  };
  drawRow(["#", "Tên thuốc", "Đơn vị", "SL", "Cách dùng"], true, "#f5f5f5");
  if (rows.length) rows.forEach((cells) => drawRow(cells, false));
  else {
    font(22);
    ctx.strokeRect(X, y, CW, 50);
    ctx.fillText("Chưa có thuốc.", X + 10, y + 10);
    y += 50;
  }
  y += 28;
  const leftW = CW * 0.64;
  let ly = y;
  const put = (label, text) => {
    font(24, true);
    const pw = ctx.measureText(label).width;
    ctx.fillText(label, X, ly);
    font(24);
    const lines = wrap(text, leftW - pw);
    lines.forEach((line, i) => { ctx.fillText(line, X + pw, ly + i * 38); });
    ly += 38 * Math.max(1, lines.length);
  };
  put("Tái khám: ", refs.followDate.value ? formatDate(refs.followDate.value) : "Chưa hẹn");
  font(24, true);
  ctx.fillText("Lời dặn:", X, ly);
  ly += 38;
  font(24);
  wrap(refs.adviceNote.value || "Không có", leftW).forEach((line) => { ctx.fillText(line, X, ly); ly += 38; });
  const today = new Date();
  const cx = X + CW - 140;
  ctx.textAlign = "center";
  font(24);
  ctx.fillText(`Ngày ${today.getDate()} tháng ${today.getMonth() + 1} năm ${today.getFullYear()}`, cx, y);
  font(24, true);
  ctx.fillText("Bác sĩ khám bệnh", cx, y + 50);
  ctx.fillText(doctor, cx, y + 50 + 38 + 80);
  return canvas;
}

function prescriptionBlob(type = "image/jpeg") {
  return new Promise((resolve, reject) => {
    try {
      drawPrescriptionCanvas().toBlob((blob) => (blob ? resolve(blob) : reject(new Error("Không tạo được ảnh toa thuốc."))), type, 0.96);
    } catch (error) {
      reject(error);
    }
  });
}

// Web không gửi thẳng được vào Zalo: điện thoại mở bảng chia sẻ để chọn Zalo; máy tính copy ảnh rồi mở Zalo web để dán.
// navigator.share phải chạy ngay trong lúc nhấn (Safari hủy nếu chờ lâu) nên ảnh được dựng sẵn khi mở xem toa.
function prepareShareFile() {
  const name = slugify(refs.patientName.value || "benh-nhan");
  state.rxShareFile = prescriptionBlob().then((blob) => new File([blob], `toa-thuoc-${name}.jpg`, { type: "image/jpeg" }));
  state.rxShareFile.catch(() => {});
}

async function sharePrescriptionToZalo() {
  try {
    if (!state.rxShareFile) prepareShareFile();
    // máy tính: nút là "Copy ảnh": chép ảnh toa vào bộ nhớ tạm để dán (Ctrl+V / ⌘V) vào Zalo hay chỗ khác.
    // Gọi clipboard.write ngay trong lúc nhấn (trước mọi await), nếu không Safari sẽ từ chối.
    if (!wheelOnlyQuery.matches) {
      try {
        await navigator.clipboard.write([new ClipboardItem({ "image/png": prescriptionBlob("image/png") })]);
        flashShareCopied();
      } catch {
        downloadShareFile(await state.rxShareFile);
      }
      return;
    }
    const file = await state.rxShareFile;
    if (navigator.share && navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: "Toa thuốc", text: `Toa thuốc của ${refs.patientName.value || "bệnh nhân"}` });
      } catch (error) {
        if (error.name !== "AbortError") throw error; // người dùng đóng bảng chia sẻ thì bỏ qua
      }
      return;
    }
    downloadShareFile(file);
  } catch (error) {
    handleError(error);
  }
}

// nút Gửi (điện thoại) / Copy ảnh (máy tính)
function updateShareButton() {
  const pc = !wheelOnlyQuery.matches;
  const copied = pc && state.shareCopied;
  const label = pc ? (copied ? "Đã copy" : "Copy ảnh") : "Gửi";
  refs.rxShareBtn.querySelector("use").setAttribute("href", copied ? "#i-check" : pc ? "#i-copy" : "#i-send");
  refs.rxShareBtn.querySelector("span").textContent = label;
  refs.rxShareBtn.setAttribute("aria-label", pc ? "Copy ảnh toa thuốc" : "Gửi");
  refs.rxShareBtn.title = pc ? "Copy ảnh toa thuốc để dán (Ctrl+V) vào Zalo hoặc nơi khác" : "Gửi";
}

// copy xong: nút đổi thành dấu tick trong 4 giây
function flashShareCopied() {
  clearTimeout(state.shareCopiedTimer);
  state.shareCopied = true;
  updateShareButton();
  state.shareCopiedTimer = setTimeout(() => { state.shareCopied = false; updateShareButton(); }, 4000);
}

function downloadShareFile(file) {
  const url = URL.createObjectURL(file);
  Object.assign(document.createElement("a"), { href: url, download: file.name }).click();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
  showToast(window.isSecureContext ? "Đã tải ảnh toa về máy. Hãy gửi ảnh này qua Zalo." : "Chia sẻ sang Zalo cần mở trang bằng HTTPS. Đã tải ảnh toa về máy.", "warn");
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
      <td class="dose">${DOSE_FIELDS.map((field) => `<span>${DOSE_LABELS[field]} ${escapeHtml(row[field] || "-")}</span>`).join(", ")}</td>
    </tr>
  `).join("");
  const info = `<div class="pi"><b>Họ tên:</b><span class="wide">${escapeHtml(refs.patientName.value)}</span><b>Tuổi:</b><span class="wide">${escapeHtml(refs.age.value)} tuổi (${escapeHtml(getGender())})</span><b>Điện thoại:</b><span class="wide">${escapeHtml(refs.phone.value)}</span><b>Ngày khám:</b><span class="wide">${escapeHtml(formatDate(refs.visitDate.value))}</span><b>Địa chỉ:</b><span class="wide">${escapeHtml([refs.addressWard.value, refs.province.value].filter(Boolean).join(", "))}</span><b>Chẩn đoán:</b><span class="wide">${escapeHtml(refs.icdInput.value)}</span></div>`;
  const css = '@page{size:A5 portrait;margin:8mm}html,body{width:148mm;min-height:210mm;margin:0;padding:0;background:#fff}body{font-family:"Segoe UI","Noto Sans",Arial,Helvetica,sans-serif;color:#111;font-size:12px;line-height:1.4}.sheet{width:132mm;min-height:194mm;margin:0 auto;padding:0}.head{display:flex;gap:10px;align-items:center}.logo-box{position:relative;flex:none;width:64px;height:64px;transform:translateY(-2px)}.logo{position:absolute;inset:0;width:100%;height:100%;object-fit:contain}.head-text{min-width:0}.clinic{font-size:17px;font-weight:700;text-transform:uppercase;margin:0 0 2px}.clinic-line{margin:0}h1{font-size:24px;margin:14px 0 12px;text-align:center}.pi{display:grid;grid-template-columns:max-content minmax(0,1fr) max-content minmax(0,1fr);gap:3px 10px;margin-bottom:12px}.pi b{font-weight:700}.pi span{overflow-wrap:anywhere}.pi .wide{grid-column:2/-1}table{width:100%;border-collapse:collapse;table-layout:fixed;font-size:11px}.dose span{white-space:nowrap}th,td{border:1px solid #111;padding:4px 5px;vertical-align:top;text-align:left;word-wrap:break-word}th{background:#f5f5f5}.footer{margin-top:14px;display:flex;justify-content:space-between;gap:16px;align-items:flex-start}.footer-note{white-space:pre-line;max-width:62%}.sign{min-width:200px;text-align:center}.sign-name{margin-top:42px;font-weight:700}@media screen{html{width:auto;background:#e9eef3}body{margin:12px auto;padding:8mm;box-sizing:border-box}}@media screen and (max-width:720px){html,body{width:auto;min-height:auto}body{font-size:12px;margin:0;padding:8px}.sheet{width:100%;min-height:auto}.clinic{font-size:15px}h1{font-size:20px}table{font-size:10px}th,td{padding:3px 4px}.footer{gap:8px}.footer-note{max-width:none;flex:1 1 0;min-width:0;font-size:10.5px}.sign{min-width:0;flex:1 1 0}.sign-name{margin-top:20px}}@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}';
  return `<!DOCTYPE html><html lang="vi"><head><meta charset="utf-8"><title>Toa thuốc</title><style>${css}</style></head><body><div class="sheet"><div class="head"><div class="logo-box"><img class="logo" src="${location.origin}/doctor-logo.png" alt=""></div><div class="head-text"><p class="clinic">${escapeHtml(state.clinicInfo.name)}</p><p class="clinic-line">Địa chỉ: ${clinicAddress}</p><p class="clinic-line">SĐT: ${clinicPhone}</p></div></div><h1>ĐƠN THUỐC</h1>${info}<table><thead><tr><th style="width:6%">#</th><th style="width:38%">Tên thuốc</th><th style="width:11%">Đơn vị</th><th style="width:8%">SL</th><th style="width:37%">Cách dùng</th></tr></thead><tbody>${rows || "<tr><td colspan='5'>Chưa có thuốc.</td></tr>"}</tbody></table><div class="footer"><div class="footer-note"><strong>Tái khám:</strong> ${escapeHtml(refs.followDate.value ? formatDate(refs.followDate.value) : "Chưa hẹn")}<br><strong>Lời dặn:</strong><br>${escapeHtml(refs.adviceNote.value || "Không có")}</div><div class="sign"><div>Ngày ${today.getDate()} tháng ${today.getMonth() + 1} năm ${today.getFullYear()}</div><div style="margin-top:8px;font-weight:700">Bác sĩ khám bệnh</div><div class="sign-name">${escapeHtml(currentDoctor)}</div></div></div></div><script>(function(){var t=document.querySelector(".head-text"),b=document.querySelector(".logo-box");function f(){b.style.width=b.style.height=t.offsetHeight+"px"}f();addEventListener("load",f);addEventListener("resize",f)})()</script></body></html>`;
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
    // lấy bản dữ liệu hiện tại để so sánh
    const current = await fetchJson("/api/export");
    state.importData = data;
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
    const result = await fetchJson("/api/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(state.importData)
    });
    refs.importModal.close();
    state.importData = null;
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
    if (clinicModalMode === "add") {
      const id = createClinicProfileId();
      state.clinicProfiles.push({ id, label: "", ...DEFAULT_CLINIC_INFO });
      state.activeClinicProfileId = id;
    }
    upsertActiveClinicProfile(updatedClinicInfo);
    await persistSettings();
    renderClinicInfo();
    refs.clinicModal.close();
    showToast(clinicModalMode === "add" ? "Đã thêm thông tin phòng khám." : "Đã lưu thông tin phòng khám vào hệ thống.", "success");
  } catch (error) {
    handleError(error);
  }
}

function renderClinicInfo() {
  state.clinicInfo = getActiveClinicProfile();
  document.querySelectorAll("[data-clinic-name]").forEach((element) => { element.textContent = state.clinicInfo.name; });

  document.title = `${state.clinicInfo.name} | Hồ sơ khám và kê toa`;
  refs.clinicDisplayName.textContent = state.clinicInfo.name;
  refs.clinicDisplayDoctor.textContent = state.clinicInfo.doctor;
  refs.clinicDisplayAddress.textContent = state.clinicInfo.address;
  refs.clinicDisplayHours.textContent = state.clinicInfo.hours;
  refs.clinicDisplayPhone.textContent = state.clinicInfo.phone;
  [["clinicDisplayAddress", "address"], ["clinicDisplayHours", "hours"], ["clinicDisplayPhone", "phone"]].forEach(([ref, key]) => {
    refs[ref].classList.toggle("is-empty", state.clinicInfo[key] === DEFAULT_CLINIC_INFO[key]);
  });
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

let clinicModalMode = "edit";

function openClinicModal(mode) {
  clinicModalMode = mode;
  const info = mode === "add" ? DEFAULT_CLINIC_INFO : state.clinicInfo;
  refs.clinicNameInput.value = info.name;
  refs.clinicDoctorInput.value = info.doctor;
  refs.clinicAddressInput.value = info.address;
  refs.clinicHoursInput.value = info.hours;
  refs.clinicPhoneInput.value = info.phone;
  refs.clinicModalTitle.textContent = mode === "add" ? "Thêm thông tin phòng khám" : "Sửa thông tin phòng khám";
  refs.clinicModal.showModal();
  // điện thoại: không tự bật bàn phím khi mở hộp thoại (giống Kho thuốc)
  if (!phoneLayoutQuery.matches) refs.clinicNameInput.select();
}

function openClinicDelete() {
  if (state.clinicProfiles.length <= 1) return showToast("Cần giữ lại ít nhất một bộ thông tin phòng khám.", "error");
  const activeProfile = state.clinicProfiles.find((profile) => profile.id === state.activeClinicProfileId);
  refs.clinicDeleteText.textContent = `Xóa ${activeProfile?.label || activeProfile?.doctor || activeProfile?.name || "bộ thông tin này"}?`;
  refs.clinicDeleteModal.showModal();
}

async function deleteClinicProfile() {
  try {
    state.clinicProfiles = state.clinicProfiles.filter((profile) => profile.id !== state.activeClinicProfileId);
    state.activeClinicProfileId = resolveActiveClinicProfileId("", state.clinicProfiles);
    state.clinicInfo = getActiveClinicProfile();
    await persistSettings();
    refs.clinicDeleteModal.close();
    renderClinicInfo();
    showToast("Đã xóa bộ thông tin phòng khám.", "success");
  } catch (error) {
    handleError(error);
  }
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

function buildPatientHaystack(patient) {
  return [patient.fullName, patient.phone, patient.address, patient.province, patient.birthYear, patient.gender, patient.lastDiagnosis, patient.lastDoctor].join(" ");
}

function getFollowStatus(dateValue) {
  if (!dateValue) return { label: "Chưa hẹn", cls: "neutral" };
  const today = startOfDay(new Date());
  const target = startOfDay(new Date(dateValue));
  if (Number.isNaN(target.getTime())) return { label: "Không hợp lệ", cls: "neutral" };
  const diff = Math.round((target - today) / 86400000);
  if (diff > 0) return { label: `Còn ${diff} ngày`, short: `${diff}N`, cls: "up" };
  if (diff === 0) return { label: "Hôm nay", short: "HN", cls: "down" };
  return { label: `Quá ${Math.abs(diff)} ngày`, short: `Q${Math.abs(diff)}N`, cls: "down" };
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
function hideToast() {
  clearTimeout(state.toastTimer);
  if (refs.toast.classList.contains("hidden")) return;
  // trượt ra rồi mới ẩn; bỏ transform kéo tay để chạy tiếp từ vị trí hiện tại
  refs.toast.classList.remove("is-dragging");
  refs.toast.style.transform = "";
  refs.toast.style.opacity = "";
  refs.toast.classList.add("is-leaving");
  state.toastLeave = setTimeout(() => {
    refs.toast.className = "toast hidden";
    if (refs.toast.matches(":popover-open")) refs.toast.hidePopover();
  }, 220);
}
function showToast(message, type = "success", duration = 2600) {
  clearTimeout(state.toastTimer);
  clearTimeout(state.toastLeave);
  const toastIcon = { success: "circle-check", error: "circle-alert", warn: "alert-triangle" }[type] || "circle-check";
  refs.toast.innerHTML = `<span class="toast__icon">${iconHtml(toastIcon)}</span><span class="toast__msg"></span><button class="toast__close" type="button" aria-label="Đóng thông báo">${iconHtml("x")}</button>`;
  refs.toast.querySelector(".toast__msg").textContent = message;
  refs.toast.style.transform = "";
  refs.toast.style.opacity = "";
  refs.toast.className = `toast ${type}`;
  // máy tính: đưa thông báo lên lớp trên cùng để không bị hộp thoại đang mở (vd. Xem toa thuốc) che mất
  if (!wheelOnlyQuery.matches && refs.toast.showPopover) {
    refs.toast.setAttribute("popover", "manual");
    try {
      if (refs.toast.matches(":popover-open")) refs.toast.hidePopover();
      refs.toast.showPopover();
    } catch {}
  }
  state.toastTimer = setTimeout(hideToast, duration);
}
// nhấn dấu x để tắt (cả PC); điện thoại còn vuốt lên để tắt
function initToastDismiss() {
  let startY = null;
  refs.toast.addEventListener("click", (event) => { if (event.target.closest(".toast__close")) hideToast(); });
  refs.toast.addEventListener("touchstart", (event) => { startY = event.touches[0].clientY; clearTimeout(state.toastTimer); refs.toast.classList.add("is-dragging"); }, { passive: true });
  refs.toast.addEventListener("touchmove", (event) => {
    if (startY === null) return;
    const dy = Math.min(0, event.touches[0].clientY - startY);
    refs.toast.style.transform = `translateY(${dy}px)`;
    refs.toast.style.opacity = String(Math.max(0.2, 1 + dy / 80));
  }, { passive: true });
  refs.toast.addEventListener("touchend", (event) => {
    if (startY === null) return;
    const dy = event.changedTouches[0].clientY - startY;
    startY = null;
    refs.toast.classList.remove("is-dragging");
    if (dy < -30) { hideToast(); return; }
    refs.toast.style.transform = "";
    refs.toast.style.opacity = "";
    state.toastTimer = setTimeout(hideToast, 1500);
  });
}
function handleError(error) {
  if (error instanceof AuthExpiredError) return;
  console.error(error);
  showToast(error.message || "Đã xảy ra lỗi.", "error");
}
