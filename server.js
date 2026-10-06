const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const express = require("express");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");

loadLocalEnv();

const PORT = Number(process.env.PORT || 3000);
const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_URI_DIRECT = process.env.MONGODB_URI_DIRECT;
const TIMEZONE = "Asia/Ho_Chi_Minh";
const CORS_ORIGINS = String(process.env.CORS_ORIGINS || "")
  .split(",")
  .map((item) => item.trim())
  .filter(Boolean);

const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET;
const IS_PROD = process.env.NODE_ENV === "production";
const APP_BASE_URL = String(process.env.APP_BASE_URL || `http://localhost:${PORT}`).replace(/\/+$/, "");
const ACCESS_TOKEN_SECONDS = 15 * 60;
const SESSION_DAYS = 30;
const RESET_TOKEN_MINUTES = 30;
const CHANGE_CODE_MINUTES = 10;
const CHANGE_CODE_MAX_ATTEMPTS = 5;
const BCRYPT_COST = 12;
const REFRESH_COOKIE = "pk_rt";
const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const MIN_PASSWORD_LENGTH = 8;
const EXPORT_APP = "pk-dr-minh";
const EXPORT_VERSION = 1;

if (!MONGODB_URI) {
  throw new Error("Missing MONGODB_URI. Add it to the local .env file.");
}

if (!JWT_ACCESS_SECRET) {
  throw new Error("Missing JWT_ACCESS_SECRET. Add it to the local .env file.");
}

const app = express();
app.disable("x-powered-by");
app.set("trust proxy", 1);
app.use((req, res, next) => {
  const requestPath = req.path || "";
  if (path.basename(requestPath).startsWith(".")) {
    return res.status(404).end();
  }
  return next();
});
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (!origin) {
    return next();
  }

  if (CORS_ORIGINS.includes(origin)) {
    res.header("Access-Control-Allow-Origin", origin);
    res.header("Vary", "Origin");
    res.header("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.header("Access-Control-Allow-Credentials", "true");
  }

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  return next();
});
const jsonParser = express.json({ limit: "2mb" });
app.use((req, res, next) => (req.path === "/api/import" ? next() : jsonParser(req, res, next)));
// chỉ phục vụ đúng các file giao diện, không phục vụ cả thư mục dự án (server.js, backup/, scripts/...)
const PUBLIC_FILES = ["minh.html", "minh.css", "minh.js", "icd-data.js", "app-config.js"];
PUBLIC_FILES.forEach((name) => {
  app.get(`/${name}`, (_req, res) => res.sendFile(path.join(__dirname, name)));
});
app.get("/", (_req, res) => {
  res.sendFile(path.join(__dirname, "minh.html"));
});

const patientSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true, index: true },
    birthYear: { type: Number, min: 1900, max: 3000 },
    gender: { type: String, trim: true, default: "Nam" },
    address: { type: String, trim: true, default: "" },
    province: { type: String, trim: true, default: "" },
    notes: { type: String, trim: true, default: "" }
  },
  { timestamps: true }
);

patientSchema.index({ fullName: "text", phone: "text" });

const drugSchema = new mongoose.Schema(
  {
    activeIngredient: { type: String, required: true, trim: true },
    brandName: { type: String, required: true, trim: true },
    unit: { type: String, trim: true, default: "Vien" },
    usage: { type: String, trim: true, default: "" },
    // tồn kho được phép âm (kê vượt kho vẫn lưu, chỉ cảnh báo)
    quantity: { type: Number, default: 0 },
    price: { type: Number, min: 0, default: 0 },
    notes: { type: String, trim: true, default: "" }
  },
  { timestamps: true }
);

drugSchema.index({ activeIngredient: "text", brandName: "text" });

const visitDrugSchema = new mongoose.Schema(
  {
    drugId: { type: mongoose.Schema.Types.ObjectId, ref: "Drug", required: true },
    activeIngredient: { type: String, required: true, trim: true },
    brandName: { type: String, required: true, trim: true },
    usage: { type: String, trim: true, default: "" },
    unit: { type: String, trim: true, default: "Vien" },
    quantity: { type: Number, min: 1, required: true },
    morning: { type: String, trim: true, default: "" },
    noon: { type: String, trim: true, default: "" },
    night: { type: String, trim: true, default: "" },
    instruction: { type: String, trim: true, default: "" },
    unitPrice: { type: Number, min: 0, required: true },
    subtotal: { type: Number, min: 0, required: true }
  },
  { _id: false }
);

const visitSchema = new mongoose.Schema(
  {
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: "Patient", required: true, index: true },
    patientName: { type: String, required: true, trim: true },
    patientPhone: { type: String, required: true, trim: true },
    doctor: { type: String, trim: true, default: "Bác sĩ phụ trách", index: true },
    visitNo: { type: Number, required: true, min: 1 },
    visitType: { type: String, trim: true, default: "revisit" },
    visitDate: { type: Date, required: true, index: true },
    symptom: { type: String, trim: true, default: "" },
    diagnosis: { type: String, trim: true, default: "" },
    note: { type: String, trim: true, default: "" },
    followUpDate: { type: Date, default: null },
    serviceFee: { type: Number, min: 0, default: 0 },
    drugTotal: { type: Number, min: 0, default: 0 },
    totalMoney: { type: Number, min: 0, default: 0 },
    drugs: { type: [visitDrugSchema], default: [] },
    printedAt: { type: Date, default: null },
    printHistory: { type: [Date], default: [] }
  },
  { timestamps: true }
);

visitSchema.index({ patientId: 1, visitNo: 1 }, { unique: true });

const settingsSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, trim: true },
    clinicInfo: {
      name: { type: String, trim: true, default: "Phòng khám chuyên khoa tâm thần" },
      doctor: { type: String, trim: true, default: "Bác sĩ phụ trách" },
      address: { type: String, trim: true, default: "Chưa cập nhật địa chỉ" },
      hours: { type: String, trim: true, default: "Chưa cập nhật giờ làm việc" },
      phone: { type: String, trim: true, default: "Chưa cập nhật số điện thoại" }
    },
    clinicProfiles: {
      type: [
        new mongoose.Schema(
          {
            id: { type: String, required: true, trim: true },
            label: { type: String, trim: true, default: "Thông tin phòng khám" },
            name: { type: String, trim: true, default: "Phòng khám chuyên khoa tâm thần" },
            doctor: { type: String, trim: true, default: "Bác sĩ phụ trách" },
            address: { type: String, trim: true, default: "Chưa cập nhật địa chỉ" },
            hours: { type: String, trim: true, default: "Chưa cập nhật giờ làm việc" },
            phone: { type: String, trim: true, default: "Chưa cập nhật số điện thoại" }
          },
          { _id: false }
        )
      ],
      default: []
    },
    activeClinicProfileId: { type: String, trim: true, default: "" },
    icdList: {
      type: [
        new mongoose.Schema(
          {
            code: { type: String, required: true, trim: true },
            name: { type: String, required: true, trim: true }
          },
          { _id: false }
        )
      ],
      default: []
    }
  },
  { timestamps: true }
);

const Patient = mongoose.model("Patient", patientSchema);
const Drug = mongoose.model("Drug", drugSchema);
const Visit = mongoose.model("Visit", visitSchema);
const Settings = mongoose.model("Settings", settingsSchema);

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    passwordResetTokenHash: { type: String, default: "" },
    passwordResetExpires: { type: Date, default: null },
    passwordChangeCodeHash: { type: String, default: "" },
    passwordChangeCodeExpires: { type: Date, default: null },
    passwordChangeAttempts: { type: Number, default: 0 }
  },
  { timestamps: true }
);

const sessionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    tokenHash: { type: String, required: true, unique: true },
    familyId: { type: String, required: true, index: true },
    absoluteExpiresAt: { type: Date, required: true, expires: 0 },
    revokedAt: { type: Date, default: null },
    replacedByHash: { type: String, default: "" }
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);
const Session = mongoose.model("Session", sessionSchema);

app.get("/api/health", async (_req, res) => {
  const mongoState = mongoose.connection.readyState === 1 ? "connected" : "disconnected";
  res.json({ ok: true, mongoState });
});

// ---- Auth: access token (JWT, trong bộ nhớ trình duyệt) + refresh token (opaque, cookie HttpOnly) ----

const authRouter = express.Router();
// ponytail: rate limit in-memory, mất khi restart; đủ cho 1 user
const rateBuckets = new Map();
const GENERIC_LOGIN_ERROR = "Email hoặc mật khẩu không đúng";
const FORGOT_MESSAGE = "Nếu email tồn tại trong hệ thống, đường dẫn đặt lại mật khẩu đã được gửi.";
let dummyPasswordHash = "";

authRouter.post("/login", async (req, res) => {
  const email = normalizeEmail(req.body?.email);
  const password = String(req.body?.password || "");
  const limitKey = `login|${req.ip}|${email}`;
  if (isRateLimited(limitKey)) {
    throw createHttpError(429, "Thử quá nhiều lần. Vui lòng đợi 15 phút rồi thử lại.");
  }

  const user = email ? await User.findOne({ email }) : null;
  // luôn chạy bcrypt để thời gian phản hồi không lộ email có tồn tại hay không
  dummyPasswordHash = dummyPasswordHash || bcrypt.hashSync(crypto.randomBytes(8).toString("hex"), BCRYPT_COST);
  const passwordOk = await bcrypt.compare(password, user ? user.passwordHash : dummyPasswordHash);
  if (!user || !passwordOk) {
    recordRateHit(limitKey);
    throw createHttpError(401, GENERIC_LOGIN_ERROR);
  }

  rateBuckets.delete(limitKey);
  const absoluteExpiresAt = new Date(Date.now() + SESSION_DAYS * 86400000);
  await issueRefreshToken(res, user._id, crypto.randomUUID(), absoluteExpiresAt);
  res.json({ accessToken: signAccessToken(user._id), user: { email: user.email } });
});

authRouter.post("/refresh", async (req, res) => {
  const token = readCookie(req, REFRESH_COOKIE);
  const reject = () => {
    clearRefreshCookie(res);
    return res.status(401).json({ error: "Phiên đăng nhập đã hết hạn." });
  };
  if (!token) return reject();

  const tokenHash = sha256(token);
  const now = new Date();
  // thu hồi nguyên tử: chỉ một request thắng khi cùng lúc dùng chung một token
  const current = await Session.findOneAndUpdate(
    { tokenHash, revokedAt: null, absoluteExpiresAt: { $gt: now } },
    { $set: { revokedAt: now } }
  );
  if (!current) {
    const reused = await Session.findOne({ tokenHash }).lean();
    if (reused) {
      await Session.updateMany({ familyId: reused.familyId, revokedAt: null }, { $set: { revokedAt: now } });
    }
    return reject();
  }

  const user = await User.findById(current.userId).lean();
  if (!user) return reject();

  // giữ nguyên absoluteExpiresAt: không gia hạn khi refresh
  const nextHash = await issueRefreshToken(res, current.userId, current.familyId, current.absoluteExpiresAt);
  await Session.updateOne({ _id: current._id }, { $set: { replacedByHash: nextHash } });
  res.json({ accessToken: signAccessToken(user._id), user: { email: user.email } });
});

authRouter.post("/logout", async (req, res) => {
  const token = readCookie(req, REFRESH_COOKIE);
  if (token) {
    const session = await Session.findOne({ tokenHash: sha256(token) }).lean();
    if (session) {
      await Session.updateMany({ familyId: session.familyId, revokedAt: null }, { $set: { revokedAt: new Date() } });
    }
  }
  clearRefreshCookie(res);
  res.json({ ok: true });
});

authRouter.get("/me", requireAuth, async (req, res) => {
  const user = await User.findById(req.userId).lean();
  if (!user) throw createHttpError(401, "Phiên đăng nhập không hợp lệ.");
  res.json({ user: { email: user.email } });
});

authRouter.post("/forgot-password", async (req, res) => {
  const email = normalizeEmail(req.body?.email);
  const limitKey = `forgot|${req.ip}|${email}`;
  if (isRateLimited(limitKey)) {
    throw createHttpError(429, "Thử quá nhiều lần. Vui lòng đợi 15 phút rồi thử lại.");
  }
  recordRateHit(limitKey);

  const user = email ? await User.findOne({ email }) : null;
  if (user) {
    const token = crypto.randomBytes(32).toString("hex");
    user.passwordResetTokenHash = sha256(token);
    user.passwordResetExpires = new Date(Date.now() + RESET_TOKEN_MINUTES * 60000);
    await user.save();
    // không await: thời gian phản hồi không phụ thuộc email có tồn tại hay không
    sendResetEmail(user.email, `${APP_BASE_URL}/?reset=${token}`).catch((error) => {
      console.error("Không gửi được email đặt lại mật khẩu:", error.message);
    });
  }
  res.json({ message: FORGOT_MESSAGE });
});

authRouter.post("/reset-password", async (req, res) => {
  const token = String(req.body?.token || "");
  const password = String(req.body?.password || "");
  if (password.length < MIN_PASSWORD_LENGTH) {
    throw createHttpError(400, `Mật khẩu tối thiểu ${MIN_PASSWORD_LENGTH} ký tự.`);
  }

  const user = token
    ? await User.findOne({ passwordResetTokenHash: sha256(token), passwordResetExpires: { $gt: new Date() } })
    : null;
  if (!user) {
    throw createHttpError(400, "Đường dẫn đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.");
  }

  user.passwordHash = await bcrypt.hash(password, BCRYPT_COST);
  user.passwordResetTokenHash = "";
  user.passwordResetExpires = null;
  await user.save();
  await Session.updateMany({ userId: user._id, revokedAt: null }, { $set: { revokedAt: new Date() } });
  res.json({ ok: true });
});

// Đổi mật khẩu khi đã đăng nhập: gửi mã 6 số về email, nhập đúng mã mới được đổi
authRouter.post("/change-password/request", requireAuth, async (req, res) => {
  const limitKey = `chgreq|${req.userId}`;
  if (isRateLimited(limitKey)) {
    throw createHttpError(429, "Yêu cầu mã quá nhiều lần. Vui lòng đợi 15 phút rồi thử lại.");
  }
  recordRateHit(limitKey);

  const user = await User.findById(req.userId);
  if (!user) throw createHttpError(401, "Phiên đăng nhập không hợp lệ.");
  const code = String(crypto.randomInt(0, 1000000)).padStart(6, "0");
  user.passwordChangeCodeHash = sha256(code);
  user.passwordChangeCodeExpires = new Date(Date.now() + CHANGE_CODE_MINUTES * 60000);
  user.passwordChangeAttempts = 0;
  await user.save();
  try {
    await sendMail({
      to: user.email,
      subject: "Mã xác nhận đổi mật khẩu PK Dr. Minh",
      text: `Mã xác nhận đổi mật khẩu của bạn là ${code} (hết hạn sau ${CHANGE_CODE_MINUTES} phút, chỉ dùng một lần).\n\nNếu bạn không yêu cầu, hãy bỏ qua email này.`,
      html: `<p>Mã xác nhận đổi mật khẩu của bạn là <strong style="font-size:20px;letter-spacing:3px">${code}</strong></p><p>Mã hết hạn sau ${CHANGE_CODE_MINUTES} phút, chỉ dùng một lần. Nếu bạn không yêu cầu, hãy bỏ qua email này.</p>`,
      devNote: `Mã đổi mật khẩu cho ${user.email}: ${code}`
    });
  } catch (error) {
    console.error("Không gửi được email mã đổi mật khẩu:", error.message);
    throw createHttpError(502, "Không gửi được email. Vui lòng thử lại sau.");
  }
  res.json({ email: user.email, expiresInMinutes: CHANGE_CODE_MINUTES });
});

// kiểm tra mã (không tiêu thụ mã); mã sai được tính vào số lần thử
async function assertChangeCode(user, code) {
  const live = user.passwordChangeCodeHash && user.passwordChangeCodeExpires > new Date() && user.passwordChangeAttempts < CHANGE_CODE_MAX_ATTEMPTS;
  if (!live) throw createHttpError(400, "Mã xác nhận đã hết hạn. Vui lòng gửi lại mã.");
  const expected = Buffer.from(user.passwordChangeCodeHash);
  const given = Buffer.from(sha256(String(code || "").trim()));
  if (!crypto.timingSafeEqual(expected, given)) {
    user.passwordChangeAttempts += 1;
    await user.save();
    throw createHttpError(400, "Mã xác nhận không đúng.");
  }
}

authRouter.post("/change-password/verify", requireAuth, async (req, res) => {
  const user = await User.findById(req.userId);
  if (!user) throw createHttpError(401, "Phiên đăng nhập không hợp lệ.");
  await assertChangeCode(user, req.body?.code);
  res.json({ ok: true });
});

authRouter.post("/change-password/confirm", requireAuth, async (req, res) => {
  const password = String(req.body?.password || "");
  if (password.length < MIN_PASSWORD_LENGTH) {
    throw createHttpError(400, `Mật khẩu tối thiểu ${MIN_PASSWORD_LENGTH} ký tự.`);
  }

  const user = await User.findById(req.userId);
  if (!user) throw createHttpError(401, "Phiên đăng nhập không hợp lệ.");
  await assertChangeCode(user, req.body?.code);

  user.passwordHash = await bcrypt.hash(password, BCRYPT_COST);
  user.passwordChangeCodeHash = "";
  user.passwordChangeCodeExpires = null;
  user.passwordChangeAttempts = 0;
  await user.save();
  // thu hồi mọi phiên (kể cả thiết bị khác), cấp lại phiên mới cho thiết bị đang đổi
  await Session.updateMany({ userId: user._id, revokedAt: null }, { $set: { revokedAt: new Date() } });
  await issueRefreshToken(res, user._id, crypto.randomUUID(), new Date(Date.now() + SESSION_DAYS * 86400000));
  res.json({ ok: true });
});

app.use("/api/auth", authRouter);
app.use("/api", requireAuth);

function requireAuth(req, res, next) {
  const match = /^Bearer (.+)$/.exec(req.headers.authorization || "");
  try {
    const payload = jwt.verify(match ? match[1] : "", JWT_ACCESS_SECRET, { algorithms: ["HS256"] });
    req.userId = payload.sub;
    return next();
  } catch {
    return res.status(401).json({ error: "Cần đăng nhập." });
  }
}

function signAccessToken(userId) {
  return jwt.sign({ sub: String(userId) }, JWT_ACCESS_SECRET, { algorithm: "HS256", expiresIn: ACCESS_TOKEN_SECONDS });
}

async function issueRefreshToken(res, userId, familyId, absoluteExpiresAt) {
  const token = crypto.randomBytes(32).toString("hex");
  const tokenHash = sha256(token);
  await Session.create({ userId, tokenHash, familyId, absoluteExpiresAt });
  const maxAge = Math.max(0, Math.floor((absoluteExpiresAt.getTime() - Date.now()) / 1000));
  res.append("Set-Cookie", `${REFRESH_COOKIE}=${token}; HttpOnly; SameSite=Strict; Path=/api/auth; Max-Age=${maxAge}${IS_PROD ? "; Secure" : ""}`);
  return tokenHash;
}

function clearRefreshCookie(res) {
  res.append("Set-Cookie", `${REFRESH_COOKIE}=; HttpOnly; SameSite=Strict; Path=/api/auth; Max-Age=0${IS_PROD ? "; Secure" : ""}`);
}

function readCookie(req, name) {
  for (const part of String(req.headers.cookie || "").split(";")) {
    const index = part.indexOf("=");
    if (index > 0 && part.slice(0, index).trim() === name) {
      const raw = part.slice(index + 1).trim();
      try {
        return decodeURIComponent(raw);
      } catch {
        return raw;
      }
    }
  }
  return "";
}

function sha256(value) {
  return crypto.createHash("sha256").update(String(value)).digest("hex");
}

function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

function isRateLimited(key) {
  const cutoff = Date.now() - RATE_LIMIT_WINDOW_MS;
  const hits = (rateBuckets.get(key) || []).filter((time) => time > cutoff);
  rateBuckets.set(key, hits);
  return hits.length >= RATE_LIMIT_MAX;
}

function recordRateHit(key) {
  if (rateBuckets.size > 5000) {
    const cutoff = Date.now() - RATE_LIMIT_WINDOW_MS;
    rateBuckets.forEach((times, bucketKey) => {
      if (!times.some((time) => time > cutoff)) rateBuckets.delete(bucketKey);
    });
  }
  const hits = rateBuckets.get(key) || [];
  hits.push(Date.now());
  rateBuckets.set(key, hits);
}

async function sendResetEmail(to, link) {
  await sendMail({
    to,
    subject: "Đặt lại mật khẩu PK Dr. Minh",
    text: `Mở đường dẫn sau để đặt lại mật khẩu (hết hạn sau ${RESET_TOKEN_MINUTES} phút, chỉ dùng một lần):\n${link}\n\nNếu bạn không yêu cầu, hãy bỏ qua email này.`,
    html: `<p>Mở đường dẫn sau để đặt lại mật khẩu (hết hạn sau ${RESET_TOKEN_MINUTES} phút, chỉ dùng một lần):</p><p><a href="${link}">${link}</a></p><p>Nếu bạn không yêu cầu, hãy bỏ qua email này.</p>`,
    devNote: `Link đặt lại mật khẩu cho ${to}: ${link}`
  });
}

async function sendMail({ to, subject, text, html, devNote }) {
  if (!process.env.SMTP_HOST) {
    console.log(`[dev] Chưa cấu hình SMTP. ${devNote}`);
    return;
  }

  const port = Number(process.env.SMTP_PORT || 587);
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: port === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
  });
  await transporter.sendMail({ from: process.env.MAIL_FROM || process.env.SMTP_USER, to, subject, text, html });
}

app.get("/api/dashboard", async (_req, res, next) => {
  try {
    const doctorFilter = String(_req.query.doctor || "").trim();
    const now = new Date();
    const startToday = atStartOfDay(now);
    const startMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const visitMatch = buildDoctorVisitMatch(doctorFilter);

    const [
      drugCount,
      todayRevenueAgg,
      monthRevenueAgg,
      lowStockDrugs,
      scopedVisits,
      scopedPatientCount
    ] = await Promise.all([
      Drug.countDocuments(),
      revenueTotalBetween(startToday, new Date(), visitMatch),
      revenueTotalBetween(startMonth, new Date(), visitMatch),
      Drug.find({}).sort({ quantity: 1, updatedAt: -1 }).limit(6).lean(),
      Visit.find(visitMatch).lean(),
      Visit.aggregate([
        { $match: visitMatch },
        { $group: { _id: "$patientId" } },
        { $count: "total" }
      ])
    ]);
    const patientCount = scopedPatientCount[0]?.total || 0;
    const visitTodayCount = scopedVisits.filter((visit) => {
      const visitDate = new Date(visit.visitDate || visit.createdAt || Date.now());
      return visitDate >= startToday && visitDate <= now;
    }).length;
    const visitsThisMonthCount = scopedVisits.filter((visit) => {
      const visitDate = new Date(visit.visitDate || visit.createdAt || Date.now());
      return visitDate >= startMonth && visitDate <= now;
    }).length;

    res.json({
      summary: {
        patientCount,
        drugCount,
        visitTodayCount,
        visitsThisMonthCount,
        todayRevenue: todayRevenueAgg.totalRevenue,
        monthRevenue: monthRevenueAgg.totalRevenue
      },
      lowStockDrugs
    });
  } catch (error) {
    next(error);
  }
});

app.get("/api/quick-stats", async (_req, res, next) => {
  try {
    const doctorFilter = String(_req.query.doctor || "").trim();
    const visits = await Visit.find(buildDoctorVisitMatch(doctorFilter)).sort({ visitDate: 1, createdAt: 1 }).lean();
    const now = new Date();
    const thisWeekStart = new Date(now);
    thisWeekStart.setDate(now.getDate() - 7);
    const lastWeekStart = new Date(now);
    lastWeekStart.setDate(now.getDate() - 14);
    const startMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endPrevMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    res.json({
      weekCount: countVisitsBetween(visits, thisWeekStart, now),
      previousWeekCount: countVisitsBetween(visits, lastWeekStart, thisWeekStart),
      monthCount: countVisitsBetween(visits, startMonth, now),
      previousMonthCount: countVisitsBetween(visits, startPrevMonth, endPrevMonth),
      monthProfit: profitBetween(visits, startMonth, now),
      previousMonthProfit: profitBetween(visits, startPrevMonth, endPrevMonth),
      revisit: buildRevisitStats(visits)
    });
  } catch (error) {
    next(error);
  }
});

app.get("/api/patients", async (req, res, next) => {
  try {
    const search = String(req.query.search || "").trim();
    const doctorFilter = String(req.query.doctor || "").trim();
    const query = buildPatientSearch(search);
    const patients = await Patient.find(query).sort({ updatedAt: -1, createdAt: -1 }).lean();
    const patientIds = patients.map((patient) => patient._id);

    let statsByPatient = new Map();
    if (patientIds.length) {
      const visitStats = await Visit.aggregate([
        { $match: { patientId: { $in: patientIds } } },
        { $sort: { visitDate: -1, createdAt: -1 } },
        {
          $group: {
            _id: "$patientId",
            visitCount: { $sum: 1 },
            lastVisitAt: { $first: "$visitDate" },
            lastDiagnosis: { $first: "$diagnosis" },
            lastDoctor: { $first: "$doctor" },
            lastFollowUpDate: { $first: "$followUpDate" },
            totalRevenue: { $sum: "$totalMoney" }
          }
        }
      ]);

      statsByPatient = new Map(visitStats.map((item) => [String(item._id), item]));
    }

    const rows = patients.map((patient) => {
      const stat = statsByPatient.get(String(patient._id));
      return {
        ...patient,
        visitCount: stat?.visitCount || 0,
        lastVisitAt: stat?.lastVisitAt || null,
        lastDiagnosis: stat?.lastDiagnosis || "",
        lastDoctor: stat?.lastDoctor || "",
        lastFollowUpDate: stat?.lastFollowUpDate || null,
        totalRevenue: stat?.totalRevenue || 0
      };
    });

    const filteredRows = doctorFilter
      ? rows.filter((item) => normalizeSearchText(item.lastDoctor).includes(normalizeSearchText(doctorFilter)))
      : rows;

    res.json(filteredRows);
  } catch (error) {
    next(error);
  }
});

app.get("/api/patients/:id", async (req, res, next) => {
  try {
    const patient = await Patient.findById(req.params.id).lean();
    if (!patient) {
      return res.status(404).json({ error: "Khong tim thay benh nhan." });
    }

    const visits = await Visit.find({ patientId: patient._id })
      .sort({ visitDate: -1, createdAt: -1 })
      .lean();

    res.json({
      patient,
      visits,
      medicationHistory: summarizeMedicationHistory(visits)
    });
  } catch (error) {
    next(error);
  }
});

app.post("/api/patients", async (req, res, next) => {
  try {
    const payload = sanitizePatientPayload(req.body);
    const patient = await Patient.create(payload);
    res.status(201).json(patient);
  } catch (error) {
    next(error);
  }
});

app.put("/api/patients/:id", async (req, res, next) => {
  try {
    const payload = sanitizePatientPayload(req.body);
    const patient = await Patient.findByIdAndUpdate(req.params.id, payload, {
      new: true,
      runValidators: true
    }).lean();

    if (!patient) {
      return res.status(404).json({ error: "Khong tim thay benh nhan de cap nhat." });
    }

    res.json(patient);
  } catch (error) {
    next(error);
  }
});

app.delete("/api/patients/:id", async (req, res, next) => {
  try {
    const patient = await Patient.findById(req.params.id).lean();
    if (!patient) {
      return res.status(404).json({ error: "Khong tim thay benh nhan de xoa." });
    }

    await Promise.all([
      Patient.deleteOne({ _id: req.params.id }),
      Visit.deleteMany({ patientId: req.params.id })
    ]);

    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

app.post("/api/patients/:id/visits", async (req, res, next) => {
  const session = await mongoose.startSession();

  try {
    let createdVisit = null;

    await session.withTransaction(async () => {
      const patient = await Patient.findById(req.params.id).session(session);
      if (!patient) {
        throw createHttpError(404, "Khong tim thay benh nhan de tai kham.");
      }

      const payload = sanitizeVisitPayload(req.body);
      const nextVisitNo = (await Visit.countDocuments({ patientId: patient._id }).session(session)) + 1;
      const items = await buildVisitDrugItems(payload.drugs, session);
      const drugTotal = items.reduce((sum, item) => sum + item.subtotal, 0);
      const totalMoney = drugTotal + payload.serviceFee;

      await applyStockDeltas(buildStockDeltas([], items), session);

      createdVisit = await Visit.create(
        [
          {
            patientId: patient._id,
            patientName: patient.fullName,
            patientPhone: patient.phone,
            doctor: payload.doctor,
            visitNo: nextVisitNo,
            visitType: payload.visitType,
            visitDate: payload.visitDate,
            symptom: payload.symptom,
            diagnosis: payload.diagnosis,
            note: payload.note,
            followUpDate: payload.followUpDate,
            serviceFee: payload.serviceFee,
            drugTotal,
            totalMoney,
            drugs: items
          }
        ],
        { session }
      );

      await Patient.updateOne(
        { _id: patient._id },
        {
          $set: {
            notes: payload.patientNote || patient.notes
          }
        },
        { session }
      );
    });

    const warnings = await findNegativeStockWarnings(createdVisit[0].drugs.map((item) => item.drugId));
    res.status(201).json({ ...createdVisit[0].toObject(), warnings });
  } catch (error) {
    next(error);
  } finally {
    await session.endSession();
  }
});

app.put("/api/visits/:id", async (req, res, next) => {
  const session = await mongoose.startSession();

  try {
    let updatedVisit = null;
    let touchedDrugIds = [];

    await session.withTransaction(async () => {
      const visit = await Visit.findById(req.params.id).session(session).lean();
      if (!visit) {
        throw createHttpError(404, "Khong tim thay luot kham de cap nhat.");
      }

      const payload = sanitizeVisitPayload(req.body);
      const items = await buildVisitDrugItems(payload.drugs, session);
      const drugTotal = items.reduce((sum, item) => sum + item.subtotal, 0);

      // chỉ thuốc có chênh lệch số lượng mới đụng tới kho
      await applyStockDeltas(buildStockDeltas(visit.drugs || [], items), session);

      // visitNo, patientId, printHistory giữ nguyên
      updatedVisit = await Visit.findByIdAndUpdate(
        visit._id,
        {
          $set: {
            doctor: payload.doctor,
            visitDate: payload.visitDate,
            symptom: payload.symptom,
            diagnosis: payload.diagnosis,
            note: payload.note,
            followUpDate: payload.followUpDate,
            serviceFee: payload.serviceFee,
            drugTotal,
            totalMoney: drugTotal + payload.serviceFee,
            drugs: items
          }
        },
        { new: true, runValidators: true, session }
      ).lean();
      touchedDrugIds = [...(visit.drugs || []), ...items].map((item) => item.drugId);
    });

    res.json({ ...updatedVisit, warnings: await findNegativeStockWarnings(touchedDrugIds) });
  } catch (error) {
    next(error);
  } finally {
    await session.endSession();
  }
});

app.post("/api/visits/:id/print", async (req, res, next) => {
  try {
    const printedAt = new Date();
    const visit = await Visit.findByIdAndUpdate(
      req.params.id,
      {
        $set: { printedAt },
        $push: { printHistory: printedAt }
      },
      { new: true }
    ).lean();

    if (!visit) {
      return res.status(404).json({ error: "Khong tim thay luot kham de in." });
    }

    res.json({ ok: true, printedAt: visit.printedAt, printHistory: visit.printHistory });
  } catch (error) {
    next(error);
  }
});

app.get("/api/drugs", async (req, res, next) => {
  try {
    const search = String(req.query.search || "").trim();
    const query = search
      ? {
          $or: [
            { activeIngredient: { $regex: escapeRegex(search), $options: "i" } },
            { brandName: { $regex: escapeRegex(search), $options: "i" } }
          ]
        }
      : {};

    const drugs = await Drug.find(query).sort({ updatedAt: -1, createdAt: -1 }).lean();
    res.json(drugs);
  } catch (error) {
    next(error);
  }
});

app.post("/api/drugs", async (req, res, next) => {
  try {
    const payload = sanitizeDrugPayload(req.body);
    const drug = await Drug.create(payload);
    res.status(201).json(drug);
  } catch (error) {
    next(error);
  }
});

app.put("/api/drugs/:id", async (req, res, next) => {
  try {
    const payload = sanitizeDrugPayload(req.body);
    const drug = await Drug.findByIdAndUpdate(req.params.id, payload, {
      new: true,
      runValidators: true
    }).lean();

    if (!drug) {
      return res.status(404).json({ error: "Khong tim thay thuoc de cap nhat." });
    }

    res.json(drug);
  } catch (error) {
    next(error);
  }
});

app.delete("/api/drugs/:id", async (req, res, next) => {
  try {
    const drug = await Drug.findByIdAndDelete(req.params.id).lean();
    if (!drug) {
      return res.status(404).json({ error: "Khong tim thay thuoc de xoa." });
    }

    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

app.get("/api/settings", async (_req, res, next) => {
  try {
    const settings = await getAppSettings();
    res.json(settings);
  } catch (error) {
    next(error);
  }
});

app.put("/api/settings", async (req, res, next) => {
  try {
    const payload = sanitizeSettingsPayload(req.body);
    const settings = await Settings.findOneAndUpdate(
      { key: "app-settings" },
      { $set: payload },
      { new: true, upsert: true, setDefaultsOnInsert: true, runValidators: true }
    ).lean();
    res.json(settings);
  } catch (error) {
    next(error);
  }
});

app.get("/api/revenue", async (req, res, next) => {
  try {
    const { from, to } = buildRange(req.query.from, req.query.to);
    const match = { visitDate: { $gte: from, $lte: to } };

    const [overviewAgg, hourly, daily, monthly, recent] = await Promise.all([
      Visit.aggregate([
        { $match: match },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: "$totalMoney" },
            totalDrugRevenue: { $sum: "$drugTotal" },
            totalServiceRevenue: { $sum: "$serviceFee" },
            totalVisits: { $sum: 1 }
          }
        }
      ]),
      aggregateRevenue(match, "%Y-%m-%d %H:00"),
      aggregateRevenue(match, "%Y-%m-%d"),
      aggregateRevenue(match, "%Y-%m"),
      Visit.find(match).sort({ visitDate: -1, createdAt: -1 }).limit(12).lean()
    ]);

    const overview = overviewAgg[0] || {
      totalRevenue: 0,
      totalDrugRevenue: 0,
      totalServiceRevenue: 0,
      totalVisits: 0
    };

    res.json({
      filters: { from, to },
      overview,
      hourly,
      daily,
      monthly,
      recent
    });
  } catch (error) {
    next(error);
  }
});

const EXPORT_MODELS = { patients: Patient, visits: Visit, drugs: Drug, settings: Settings };
// users/sessions không bao giờ nằm trong file xuất (mật khẩu, token)
const NEVER_EXPORT_COLLECTIONS = new Set(["users", "sessions"]);

app.get("/api/export", async (_req, res) => {
  const collections = {};
  for (const [name, Model] of Object.entries(EXPORT_MODELS)) {
    collections[name] = await Model.find().sort({ _id: 1 }).lean();
  }

  // báo nếu DB có collection nào khác chưa được xuất, để "toàn bộ" thật sự đủ
  const exported = new Set(Object.values(EXPORT_MODELS).map((Model) => Model.collection.name));
  const present = (await mongoose.connection.db.listCollections().toArray()).map((item) => item.name);
  const missing = present.filter((name) => !exported.has(name) && !NEVER_EXPORT_COLLECTIONS.has(name) && !name.startsWith("system."));
  if (missing.length) {
    console.warn(`/api/export: collection chưa được xuất: ${missing.join(", ")}`);
  }

  // sắp key cố định để hai lần xuất cùng dữ liệu cho ra file giống hệt nhau
  const sortKeys = (_key, value) =>
    value && typeof value === "object" && !Array.isArray(value)
      ? Object.fromEntries(Object.entries(value).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)))
      : value;
  const payload = { app: EXPORT_APP, version: EXPORT_VERSION, exportedAt: new Date().toISOString(), collections };
  res.type("json").send(JSON.stringify(payload, sortKeys));
});

app.post("/api/import", express.json({ limit: "50mb" }), async (req, res, next) => {
  const session = await mongoose.startSession();

  try {
    const { app: appName, version, collections } = req.body || {};
    if (appName !== EXPORT_APP || version !== EXPORT_VERSION) {
      throw createHttpError(400, "File không phải bản xuất của PK Dr. Minh (sai app hoặc phiên bản).");
    }
    for (const name of Object.keys(EXPORT_MODELS)) {
      if (!Array.isArray(collections?.[name])) {
        throw createHttpError(400, `File thiếu danh sách "${name}".`);
      }
    }

    // ép kiểu _id/ngày giờ qua schema; giữ nguyên _id, createdAt, updatedAt gốc
    const prepared = {};
    for (const [name, Model] of Object.entries(EXPORT_MODELS)) {
      prepared[name] = collections[name].map((raw, index) => {
        const doc = new Model(raw);
        const invalid = doc.validateSync();
        if (invalid) {
          throw createHttpError(400, `Dữ liệu "${name}" dòng ${index + 1} không hợp lệ: ${invalid.message}`);
        }
        return doc.toObject();
      });
    }

    // lỗi bất kỳ trong transaction thì abort, DB giữ nguyên như cũ
    await session.withTransaction(async () => {
      for (const [name, Model] of Object.entries(EXPORT_MODELS)) {
        await Model.collection.deleteMany({}, { session });
        for (let i = 0; i < prepared[name].length; i += 1000) {
          await Model.collection.insertMany(prepared[name].slice(i, i + 1000), { session });
        }
      }
    });

    res.json({
      ok: true,
      counts: Object.fromEntries(Object.keys(EXPORT_MODELS).map((name) => [name, prepared[name].length]))
    });
  } catch (error) {
    next(error);
  } finally {
    await session.endSession();
  }
});

app.get(/^\/(?!api(?:\/|$)).*/, (_req, res) => {
  res.sendFile(path.join(__dirname, "minh.html"));
});

app.use((error, _req, res, _next) => {
  const statusCode = error.statusCode || 500;
  const message = error.message || "Da co loi xay ra tren may chu.";
  if (statusCode >= 500) console.error(error);
  res.status(statusCode).json({ error: message });
});

async function startServer() {
  await connectWithFallback();
  console.log(`Connected to MongoDB host: ${mongoose.connection.host}, db: ${mongoose.connection.name}`);
  app.listen(PORT, () => {
    console.log(`PK Dr. Minh is running at http://localhost:${PORT}`);
  });
}

if (require.main === module) {
  startServer().catch((error) => {
    console.error("Cannot start server:", error);
    process.exit(1);
  });
}

module.exports = { User, Session, connectWithFallback, BCRYPT_COST, MIN_PASSWORD_LENGTH };

async function revenueTotalBetween(from, to, extraMatch = {}) {
  const result = await Visit.aggregate([
    { $match: { ...extraMatch, visitDate: { $gte: from, $lte: to } } },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: "$totalMoney" }
      }
    }
  ]);

  return result[0] || { totalRevenue: 0 };
}

async function aggregateRevenue(match, format) {
  return Visit.aggregate([
    { $match: match },
    {
      $group: {
        _id: {
          $dateToString: {
            format,
            date: "$visitDate",
            timezone: TIMEZONE
          }
        },
        totalRevenue: { $sum: "$totalMoney" },
        totalVisits: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } }
  ]);
}

async function buildVisitDrugItems(drugs, session) {
  const requestedItems = Array.isArray(drugs) ? drugs : [];
  if (!requestedItems.length) {
    return [];
  }

  const uniqueDrugIds = [...new Set(requestedItems.map((item) => String(item.drugId || "")).filter(Boolean))];
  const catalog = await Drug.find({ _id: { $in: uniqueDrugIds } }).session(session).lean();
  const catalogMap = new Map(catalog.map((item) => [String(item._id), item]));

  return requestedItems.map((item) => {
    const drug = catalogMap.get(String(item.drugId));
    if (!drug) {
      throw createHttpError(400, "Co thuoc trong toa khong con ton tai trong danh muc.");
    }

    const quantity = clampNumber(item.quantity);
    if (quantity <= 0) {
      throw createHttpError(400, `So luong cua thuoc "${drug.brandName}" phai lon hon 0.`);
    }

    return {
      drugId: drug._id,
      activeIngredient: drug.activeIngredient,
      brandName: drug.brandName,
      usage: drug.usage,
      unit: drug.unit,
      quantity,
      morning: String(item.morning || "").trim(),
      noon: String(item.noon || "").trim(),
      night: String(item.night || "").trim(),
      instruction: String(item.instruction || "").trim(),
      unitPrice: drug.price,
      subtotal: drug.price * quantity
    };
  });
}

// delta > 0: toa dùng thêm thuốc (trừ kho); delta < 0: hoàn kho
function buildStockDeltas(oldItems, newItems) {
  const deltas = new Map();
  const add = (item, sign) => {
    const key = String(item.drugId);
    deltas.set(key, (deltas.get(key) || 0) + sign * item.quantity);
  };
  oldItems.forEach((item) => add(item, -1));
  newItems.forEach((item) => add(item, 1));
  return deltas;
}

async function applyStockDeltas(deltas, session) {
  for (const [drugId, delta] of deltas) {
    if (delta !== 0) {
      await Drug.updateOne({ _id: drugId }, { $inc: { quantity: -delta } }, { session });
    }
  }
}

async function findNegativeStockWarnings(drugIds) {
  const ids = [...new Set(drugIds.map(String))];
  const drugs = await Drug.find({ _id: { $in: ids }, quantity: { $lt: 0 } }).lean();
  return drugs.map((drug) => ({ drugId: drug._id, brandName: drug.brandName, quantity: drug.quantity }));
}

function sanitizePatientPayload(body = {}) {
  const payload = {
    fullName: String(body.fullName || "").trim(),
    phone: String(body.phone || "").trim(),
    birthYear: body.birthYear ? clampNumber(body.birthYear) : undefined,
    gender: String(body.gender || "Nam").trim(),
    address: String(body.address || "").trim(),
    province: String(body.province || "").trim(),
    notes: String(body.notes || "").trim()
  };

  if (!payload.fullName) {
    throw createHttpError(400, "Ho ten benh nhan la bat buoc.");
  }

  if (!payload.phone) {
    throw createHttpError(400, "So dien thoai la bat buoc.");
  }

  if (!payload.birthYear) {
    delete payload.birthYear;
  }

  return payload;
}

function sanitizeDrugPayload(body = {}) {
  const payload = {
    activeIngredient: String(body.activeIngredient || "").trim(),
    brandName: String(body.brandName || "").trim(),
    unit: String(body.unit || "Vien").trim(),
    usage: String(body.usage || "").trim(),
    quantity: clampNumber(body.quantity),
    price: clampNumber(body.price),
    notes: String(body.notes || "").trim()
  };

  if (!payload.activeIngredient) {
    throw createHttpError(400, "Hoat chat la bat buoc.");
  }

  if (!payload.brandName) {
    throw createHttpError(400, "Ten thuong mai la bat buoc.");
  }

  return payload;
}

function sanitizeSettingsPayload(body = {}) {
  const clinicProfiles = sanitizeClinicProfiles(body.clinicProfiles, body.clinicInfo);
  const activeClinicProfileId = sanitizeActiveClinicProfileId(body.activeClinicProfileId, clinicProfiles);
  const clinicInfo = clinicProfiles.find((profile) => profile.id === activeClinicProfileId) || sanitizeClinicInfo(body.clinicInfo);
  return {
    clinicInfo,
    clinicProfiles,
    activeClinicProfileId,
    icdList: sanitizeIcdList(body.icdList)
  };
}

function sanitizeClinicInfo(input = {}) {
  return {
    name: String(input.name || "Phòng khám chuyên khoa tâm thần").trim() || "Phòng khám chuyên khoa tâm thần",
    doctor: String(input.doctor || "Bác sĩ phụ trách").trim() || "Bác sĩ phụ trách",
    address: String(input.address || "Chưa cập nhật địa chỉ").trim() || "Chưa cập nhật địa chỉ",
    hours: String(input.hours || "Chưa cập nhật giờ làm việc").trim() || "Chưa cập nhật giờ làm việc",
    phone: String(input.phone || "Chưa cập nhật số điện thoại").trim() || "Chưa cập nhật số điện thoại"
  };
}

function sanitizeClinicProfiles(input = [], fallbackClinicInfo = {}) {
  const source = Array.isArray(input) && input.length ? input : [fallbackClinicInfo];
  const unique = new Map();
  source.forEach((item, index) => {
    const clinicInfo = sanitizeClinicInfo(item);
    const id = String(item?.id || `clinic-${index + 1}`).trim() || `clinic-${index + 1}`;
    const label = String(item?.label || item?.doctor || item?.name || `Thông tin ${index + 1}`).trim() || `Thông tin ${index + 1}`;
    if (!unique.has(id)) {
      unique.set(id, { id, label, ...clinicInfo });
    }
  });
  return unique.size ? [...unique.values()] : [{ id: "clinic-1", label: "Thông tin 1", ...sanitizeClinicInfo() }];
}

function sanitizeActiveClinicProfileId(input = "", clinicProfiles = []) {
  const value = String(input || "").trim();
  if (value && clinicProfiles.some((profile) => profile.id === value)) {
    return value;
  }
  return clinicProfiles[0]?.id || "";
}

function sanitizeIcdList(input = []) {
  if (!Array.isArray(input)) {
    return [];
  }

  const unique = new Map();
  input.forEach((item) => {
    const code = String(item?.code || "").trim();
    const name = String(item?.name || "").trim();
    if (code && name) {
      unique.set(code, { code, name });
    }
  });
  return [...unique.values()];
}

async function getAppSettings() {
  const settings = await Settings.findOne({ key: "app-settings" }).lean();
  if (settings) {
    const clinicProfiles = sanitizeClinicProfiles(settings.clinicProfiles, settings.clinicInfo);
    const activeClinicProfileId = sanitizeActiveClinicProfileId(settings.activeClinicProfileId, clinicProfiles);
    const clinicInfo = clinicProfiles.find((profile) => profile.id === activeClinicProfileId) || sanitizeClinicInfo(settings.clinicInfo);
    if (
      !Array.isArray(settings.clinicProfiles) || !settings.clinicProfiles.length
      || settings.activeClinicProfileId !== activeClinicProfileId
    ) {
      await Settings.updateOne(
        { key: "app-settings" },
        { $set: { clinicInfo, clinicProfiles, activeClinicProfileId } }
      );
    }
    return {
      ...settings,
      clinicInfo,
      clinicProfiles,
      activeClinicProfileId
    };
  }

  const clinicProfiles = sanitizeClinicProfiles([], sanitizeClinicInfo());
  const activeClinicProfileId = sanitizeActiveClinicProfileId("", clinicProfiles);
  return Settings.create({
    key: "app-settings",
    clinicInfo: clinicProfiles[0],
    clinicProfiles,
    activeClinicProfileId,
    icdList: []
  }).then((doc) => doc.toObject());
}

function sanitizeVisitPayload(body = {}) {
  const visitDate = body.visitDate ? new Date(body.visitDate) : new Date();
  const followUpDate = body.followUpDate ? new Date(body.followUpDate) : null;

  if (Number.isNaN(visitDate.getTime())) {
    throw createHttpError(400, "Ngay gio kham khong hop le.");
  }

  if (followUpDate && Number.isNaN(followUpDate.getTime())) {
    throw createHttpError(400, "Ngay tai kham khong hop le.");
  }

  return {
    visitType: String(body.visitType || "revisit").trim() || "revisit",
    visitDate,
    doctor: String(body.doctor || "Bác sĩ phụ trách").trim() || "Bác sĩ phụ trách",
    symptom: String(body.symptom || "").trim(),
    diagnosis: String(body.diagnosis || "").trim(),
    note: String(body.note || "").trim(),
    patientNote: String(body.patientNote || "").trim(),
    followUpDate,
    serviceFee: clampNumber(body.serviceFee),
    drugs: Array.isArray(body.drugs) ? body.drugs : []
  };
}

function normalizeSearchText(value = "") {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\u0111/g, "d")
    .replace(/\u0110/g, "d")
    .trim();
}

function buildDoctorVisitMatch(doctorFilter = "") {
  const normalized = normalizeSearchText(doctorFilter);
  if (!normalized) {
    return {};
  }
  return {
    doctor: { $regex: escapeRegex(doctorFilter), $options: "i" }
  };
}

function summarizeMedicationHistory(visits) {
  const grouped = new Map();

  visits.forEach((visit) => {
    (visit.drugs || []).forEach((drug) => {
      const key = `${drug.drugId}-${drug.brandName}`;
      const current = grouped.get(key) || {
        drugId: drug.drugId,
        brandName: drug.brandName,
        activeIngredient: drug.activeIngredient,
        totalQuantity: 0,
        timesPrescribed: 0,
        lastVisitAt: null
      };

      current.totalQuantity += drug.quantity;
      current.timesPrescribed += 1;
      current.lastVisitAt = visit.visitDate;
      grouped.set(key, current);
    });
  });

  return [...grouped.values()].sort((a, b) => {
    const dateA = a.lastVisitAt ? new Date(a.lastVisitAt).getTime() : 0;
    const dateB = b.lastVisitAt ? new Date(b.lastVisitAt).getTime() : 0;
    return dateB - dateA;
  });
}

function buildPatientSearch(search) {
  if (!search) {
    return {};
  }

  const safeSearch = escapeRegex(search);
  return {
    $or: [
      { fullName: { $regex: safeSearch, $options: "i" } },
      { phone: { $regex: safeSearch, $options: "i" } }
    ]
  };
}

function countVisitsBetween(visits, from, to) {
  return visits.filter((visit) => {
    const date = new Date(visit.visitDate || visit.createdAt || Date.now());
    return date >= from && date < to;
  }).length;
}

function profitBetween(visits, from, to) {
  return visits
    .filter((visit) => {
      const date = new Date(visit.visitDate || visit.createdAt || Date.now());
      return date >= from && date < to;
    })
    .reduce((sum, visit) => sum + (Number(visit.totalMoney || 0) - Number(visit.drugTotal || 0)), 0);
}

function buildRevisitStats(visits) {
  const byPatient = new Map();
  visits.forEach((visit) => {
    const key = String(visit.patientId);
    if (!byPatient.has(key)) {
      byPatient.set(key, []);
    }
    byPatient.get(key).push(visit);
  });

  let scheduled = 0;
  let returned = 0;
  let onTime = 0;
  let late = 0;
  let missed = 0;

  byPatient.forEach((items) => {
    const ordered = items.slice().sort((a, b) => new Date(a.visitDate) - new Date(b.visitDate));
    ordered.forEach((visit, index) => {
      if (!visit.followUpDate) {
        return;
      }

      scheduled += 1;
      const follow = atStartOfDay(visit.followUpDate);
      const later = ordered.slice(index + 1).find((nextVisit) => atStartOfDay(nextVisit.visitDate) >= follow);
      if (!later) {
        missed += 1;
        return;
      }

      returned += 1;
      const diffDays = Math.round((atStartOfDay(later.visitDate) - follow) / 86400000);
      if (diffDays <= 0) {
        onTime += 1;
      } else {
        late += 1;
      }
    });
  });

  return {
    scheduled,
    returned,
    rate: scheduled ? Math.round((returned / scheduled) * 100) : 0,
    onTime,
    late,
    missed
  };
}

function buildRange(fromInput, toInput) {
  const now = new Date();
  const from = fromInput ? new Date(`${fromInput}T00:00:00`) : new Date(now.getFullYear(), now.getMonth(), 1);
  const to = toInput ? new Date(`${toInput}T23:59:59.999`) : now;

  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
    throw createHttpError(400, "Khoang thoi gian doanh thu khong hop le.");
  }

  if (from > to) {
    throw createHttpError(400, "Ngay bat dau phai nho hon hoac bang ngay ket thuc.");
  }

  return { from, to };
}

function atStartOfDay(date) {
  const clone = new Date(date);
  clone.setHours(0, 0, 0, 0);
  return clone;
}

function clampNumber(value) {
  const result = Number(value || 0);
  return Number.isFinite(result) ? result : 0;
}

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function createHttpError(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function loadLocalEnv() {
  // .env.local (dev local) thắng hoàn toàn; chỉ khi không có mới dùng .env
  const envPath = [".env.local", ".env"]
    .map((name) => path.join(__dirname, name))
    .find((p) => fs.existsSync(p));
  if (!envPath) {
    return;
  }

  const envContent = fs.readFileSync(envPath, "utf8");
  envContent.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      return;
    }

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex <= 0) {
      return;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed.slice(separatorIndex + 1).trim();
    if (key && !process.env[key]) {
      process.env[key] = value;
    }
  });
}

async function connectWithFallback() {
  try {
    await mongoose.connect(MONGODB_URI);
  } catch (error) {
    if (shouldUseDirectMongoUri(error)) {
      if (!MONGODB_URI_DIRECT) {
        throw new Error(
          "MongoDB SRV DNS bi loi va chua co MONGODB_URI_DIRECT de du phong."
        );
      }

      console.warn(
        "SRV DNS lookup failed. Falling back to direct MongoDB hosts from MONGODB_URI_DIRECT."
      );
      await mongoose.connect(MONGODB_URI_DIRECT);
      return;
    }

    throw error;
  }
}

function shouldUseDirectMongoUri(error) {
  if (!error) {
    return false;
  }

  const message = String(error.message || "");
  return (
    error.code === "ECONNREFUSED" &&
    error.syscall === "querySrv" &&
    message.includes("_mongodb._tcp.")
  );
}
