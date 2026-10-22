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
const ACCESS_TOKEN_SECONDS = 15 * 60;
const SESSION_DAYS = 30;
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
const PUBLIC_FILES = ["minh.html", "minh.css", "minh.js", "icd-data.js", "app-config.js", "doctor-logo.png", "manifest.webmanifest", "icon-192.png", "icon-512.png", "apple-touch-icon.png"];
// logo công khai (màn đăng nhập cũng cần): lấy từ DB nếu đã tải lên, không thì dùng file mặc định
// ba logo mặc định để chọn trong Cài đặt (thư mục logos/)
const LOGO_PRESETS = ["original", "teal", "outline"];
app.get("/logos/:name", (req, res, next) => {
  const name = String(req.params.name || "").replace(/\.png$/, "");
  if (!LOGO_PRESETS.includes(name)) return next();
  res.sendFile(path.join(__dirname, "logos", `${name}.png`));
});
app.get("/clinic-logo.png", async (_req, res) => {
  res.set("Cache-Control", "no-cache");
  try {
    const doc = await AppLogo.findOne({ key: "main" });
    if (doc?.data) {
      res.set("Content-Type", doc.contentType);
      return res.send(doc.data);
    }
  } catch {}
  res.sendFile(path.join(__dirname, "clinic-logo.png"));
});
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

// logo phòng khám do người dùng tải lên (dùng cho thanh trên, màn đăng nhập và toa thuốc); chưa tải thì dùng file mặc định clinic-logo.png
const logoSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true },
    data: { type: Buffer, required: true },
    contentType: { type: String, required: true },
    preset: { type: String, default: "custom" } // original | teal | outline | custom (ảnh tự tải lên)
  },
  { timestamps: true }
);

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
const AppLogo = mongoose.model("AppLogo", logoSchema);

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
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

// tạo mã 6 số, lưu băm và gửi về email (dùng cho cả đổi mật khẩu và quên mật khẩu)
async function sendChangeCode(user) {
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
}

// Đổi mật khẩu khi đã đăng nhập: gửi mã 6 số về email, nhập đúng mã mới được đổi
authRouter.post("/change-password/request", requireAuth, async (req, res) => {
  const limitKey = `chgreq|${req.userId}`;
  if (isRateLimited(limitKey)) {
    throw createHttpError(429, "Yêu cầu mã quá nhiều lần. Vui lòng đợi 15 phút rồi thử lại.");
  }
  recordRateHit(limitKey);

  const user = await User.findById(req.userId);
  if (!user) throw createHttpError(401, "Phiên đăng nhập không hợp lệ.");
  await sendChangeCode(user);
  res.json({ email: user.email, expiresInMinutes: CHANGE_CODE_MINUTES });
});

// kiểm tra mã (không tiêu thụ mã); mã sai được tính vào số lần thử
async function assertChangeCode(user, code) {
  const live = user && user.passwordChangeCodeHash && user.passwordChangeCodeExpires > new Date() && user.passwordChangeAttempts < CHANGE_CODE_MAX_ATTEMPTS;
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

// Quên mật khẩu (chưa đăng nhập): cùng cơ chế mã 6 số. Email không tồn tại vẫn trả về như thành công,
// bước nhập mã sẽ báo mã hết hạn.
function findForgotUser(req) {
  return User.findOne({ email: normalizeEmail(req.body?.email) });
}

authRouter.post("/forgot-password/request", async (req, res) => {
  const email = normalizeEmail(req.body?.email);
  const limitKey = `forgot|${req.ip}|${email}`;
  if (isRateLimited(limitKey)) {
    throw createHttpError(429, "Thử quá nhiều lần. Vui lòng đợi 15 phút rồi thử lại.");
  }
  recordRateHit(limitKey);
  const user = await findForgotUser(req);
  if (user) await sendChangeCode(user);
  res.json({ email, expiresInMinutes: CHANGE_CODE_MINUTES });
});

authRouter.post("/forgot-password/verify", async (req, res) => {
  await assertChangeCode(await findForgotUser(req), req.body?.code);
  res.json({ ok: true });
});

authRouter.post("/forgot-password/reset", async (req, res) => {
  const password = String(req.body?.password || "");
  if (password.length < MIN_PASSWORD_LENGTH) {
    throw createHttpError(400, `Mật khẩu tối thiểu ${MIN_PASSWORD_LENGTH} ký tự.`);
  }
  const user = await findForgotUser(req);
  await assertChangeCode(user, req.body?.code);
  user.passwordHash = await bcrypt.hash(password, BCRYPT_COST);
  user.passwordChangeCodeHash = "";
  user.passwordChangeCodeExpires = null;
  user.passwordChangeAttempts = 0;
  await user.save();
  await Session.updateMany({ userId: user._id, revokedAt: null }, { $set: { revokedAt: new Date() } });
  res.json({ ok: true });
});

app.use("/api/auth", authRouter);
app.use("/api", requireAuth);

// logo đang dùng: preset (original | teal | outline) hoặc custom (ảnh tự tải lên)
app.get("/api/logo", async (_req, res, next) => {
  try {
    const doc = await AppLogo.findOne({ key: "main" }, { preset: 1 }).lean();
    res.json({ preset: doc ? doc.preset || "custom" : "original" });
  } catch (error) {
    next(error);
  }
});

// chọn logo mặc định ({ preset }) hoặc tải ảnh lên ({ dataUrl }: PNG/JPEG/WebP, tối đa ~1MB sau giải mã, đã thu nhỏ ở trình duyệt)
app.put("/api/logo", async (req, res, next) => {
  try {
    const preset = String(req.body?.preset || "");
    if (preset) {
      if (!LOGO_PRESETS.includes(preset)) return res.status(400).json({ error: "Logo mặc định không hợp lệ." });
      const data = fs.readFileSync(path.join(__dirname, "logos", `${preset}.png`));
      await AppLogo.findOneAndUpdate({ key: "main" }, { data, contentType: "image/png", preset }, { upsert: true, new: true, setDefaultsOnInsert: true });
      return res.json({ ok: true, preset });
    }
    const match = /^data:(image\/(?:png|jpeg|webp));base64,([A-Za-z0-9+/=]+)$/.exec(String(req.body?.dataUrl || ""));
    if (!match) return res.status(400).json({ error: "Ảnh logo không hợp lệ (chỉ nhận PNG, JPEG hoặc WebP)." });
    const data = Buffer.from(match[2], "base64");
    if (!data.length || data.length > 1024 * 1024) return res.status(400).json({ error: "Ảnh logo quá lớn (tối đa 1MB)." });
    await AppLogo.findOneAndUpdate({ key: "main" }, { data, contentType: match[1], preset: "custom" }, { upsert: true, new: true, setDefaultsOnInsert: true });
    res.json({ ok: true, preset: "custom" });
  } catch (error) {
    next(error);
  }
});

app.delete("/api/logo", async (_req, res, next) => {
  try {
    await AppLogo.deleteOne({ key: "main" });
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

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

// "Tên <email@x.com>" hoặc chỉ "email@x.com" -> { name, email }
function parseMailAddress(value) {
  const text = String(value || "").trim();
  const match = /^\s*"?([^"<]*?)"?\s*<([^>]+)>\s*$/.exec(text);
  return match ? { name: match[1].trim() || undefined, email: match[2].trim() } : { email: text };
}

// Gửi qua API HTTPS của Brevo (cổng 443). Render gói miễn phí chặn cổng SMTP 25/465/587 nên không gửi bằng SMTP được.
async function sendMailViaBrevo({ to, subject, text, html }) {
  const sender = parseMailAddress(process.env.MAIL_FROM || process.env.SMTP_USER);
  if (!sender.email) throw new Error("Thiếu MAIL_FROM (địa chỉ người gửi đã xác nhận trong Brevo).");
  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: { "api-key": process.env.BREVO_API_KEY, "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      sender: { name: sender.name || "PK Dr. Minh", email: sender.email },
      to: [{ email: to }],
      subject,
      textContent: text,
      htmlContent: html || undefined
    }),
    signal: AbortSignal.timeout(20000)
  });
  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`Brevo ${response.status}: ${detail.slice(0, 300)}`);
  }
}

async function sendMail({ to, subject, text, html, devNote }) {
  if (process.env.BREVO_API_KEY) return sendMailViaBrevo({ to, subject, text, html });
  if (!process.env.SMTP_HOST) {
    console.log(`[dev] Chưa cấu hình SMTP. ${devNote}`);
    return;
  }

  const port = Number(process.env.SMTP_PORT || 587);
  // Render không có đường ra IPv6 nhưng container vẫn có địa chỉ IPv6, nodemailer chọn nhầm IPv6 (ENETUNREACH):
  // tự tra địa chỉ IPv4 rồi kết nối thẳng, giữ tên máy chủ cho bước kiểm tra chứng chỉ TLS
  let host = process.env.SMTP_HOST;
  try { host = (await require("dns").promises.lookup(host, { family: 4 })).address; } catch {}
  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    tls: { servername: process.env.SMTP_HOST },
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
  });
  await transporter.sendMail({ from: process.env.MAIL_FROM || process.env.SMTP_USER, to, subject, text, html });
}

const dayKeyFmt = new Intl.DateTimeFormat("en-CA", { timeZone: TIMEZONE, year: "numeric", month: "2-digit", day: "2-digit" });
const vnDayKey = (value) => dayKeyFmt.format(new Date(value)); // "YYYY-MM-DD" theo giờ VN, không phụ thuộc TZ của tiến trình
const vnMonthKey = (value) => vnDayKey(value).slice(0, 7); // "YYYY-MM"

app.get("/api/stats", async (_req, res, next) => {
  try {
    const [total, visits] = await Promise.all([
      Patient.countDocuments(),
      // ponytail: tải toàn bộ lượt khám vào bộ nhớ, chuyển sang aggregate khi > ~50k lượt
      Visit.find({}, { patientId: 1, visitNo: 1, visitDate: 1, followUpDate: 1, totalMoney: 1 }).lean()
    ]);
    res.json(buildStats(total, visits, new Date()));
  } catch (error) {
    next(error);
  }
});

// chi tiết cho các ô thống kê: các lượt khám trong khoảng ngày [from, to] (giờ VN)
app.get("/api/stats/visits", async (req, res, next) => {
  try {
    const from = String(req.query.from || "");
    const to = String(req.query.to || "");
    const okDay = (value) => /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value));
    if (!okDay(from) || !okDay(to) || from > to) return res.status(400).json({ error: "Khoảng ngày không hợp lệ." });
    if ((Date.parse(to) - Date.parse(from)) / 86400000 > 400) return res.status(400).json({ error: "Chọn tối đa khoảng 1 năm." });
    // lấy dư 1 ngày mỗi đầu rồi lọc lại theo ngày giờ VN
    const lo = new Date(Date.parse(from) - 86400000);
    const hi = new Date(Date.parse(to) + 2 * 86400000);
    const rows = await Visit.find(
      { visitDate: { $gte: lo, $lt: hi } },
      { patientId: 1, patientName: 1, visitNo: 1, visitDate: 1, serviceFee: 1, drugTotal: 1, totalMoney: 1, updatedAt: 1, createdAt: 1 }
    ).sort({ visitDate: 1, visitNo: 1 }).lean();
    const visits = rows
      .map((visit) => ({
        _id: visit._id,
        patientId: visit.patientId,
        patientName: visit.patientName,
        visitNo: visit.visitNo,
        day: vnDayKey(visit.visitDate),
        serviceFee: Number(visit.serviceFee || 0),
        drugTotal: Number(visit.drugTotal || 0),
        totalMoney: Number(visit.totalMoney || 0),
        updatedAt: visit.updatedAt || visit.createdAt || visit.visitDate
      }))
      .filter((visit) => visit.day >= from && visit.day <= to)
      // mới cập nhật nhất lên đầu (các danh sách chi tiết trong ô thống kê)
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    res.json({ visits });
  } catch (error) {
    next(error);
  }
});

// bệnh nhân có lịch hẹn hôm nay (cùng cách tính với ô "Lịch hẹn hôm nay") kèm đã đến hay chưa
app.get("/api/stats/appointments", async (_req, res, next) => {
  try {
    const today = vnDayKey(new Date());
    const visits = await Visit.find({}, { patientId: 1, patientName: 1, visitNo: 1, visitDate: 1, followUpDate: 1, updatedAt: 1 }).lean();
    const byPatient = new Map();
    visits.forEach((visit) => {
      const key = String(visit.patientId);
      if (!byPatient.has(key)) byPatient.set(key, []);
      byPatient.get(key).push(visit);
    });
    const list = [];
    byPatient.forEach((items, patientId) => {
      const appointment = appointmentToday(items, today);
      if (appointment) {
        const touched = Math.max(...items.map((visit) => new Date(visit.updatedAt || visit.visitDate).getTime()));
        list.push({ patientId, patientName: appointment.patientName, arrived: appointment.arrived, touched });
      }
    });
    list.sort((a, b) => b.touched - a.touched); // mới cập nhật nhất lên đầu
    res.json({ today, appointments: list });
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
            totalRevenue: { $sum: "$totalMoney" },
            visitDates: { $push: "$visitDate" },
            followUpDates: { $push: "$followUpDate" }
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
        totalRevenue: stat?.totalRevenue || 0,
        visitDates: stat?.visitDates || [],
        followUpDates: (stat?.followUpDates || []).filter(Boolean)
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

    // tên và SĐT được chép vào từng lần khám lúc tạo: đồng bộ lại để mọi lần khám khớp hồ sơ
    await Visit.updateMany({ patientId: patient._id }, { $set: { patientName: patient.fullName, patientPhone: patient.phone } });

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
      // keepDrugs: không sửa gì ở chỉ định thuốc thì giữ nguyên toa cũ (số lượng, giá, kho), chỉ cập nhật thông tin còn lại
      const keepDrugs = req.body?.keepDrugs === true;
      const items = keepDrugs ? visit.drugs || [] : await buildVisitDrugItems(payload.drugs, session, visit.drugs || []);
      const drugTotal = keepDrugs ? visit.drugTotal || 0 : items.reduce((sum, item) => sum + item.subtotal, 0);

      // chỉ thuốc có chênh lệch số lượng mới đụng tới kho
      if (!keepDrugs) await applyStockDeltas(buildStockDeltas(visit.drugs || [], items), session);

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
            ...(keepDrugs ? {} : { drugs: items })
          }
        },
        { new: true, runValidators: true, session }
      ).lean();
      touchedDrugIds = keepDrugs ? [] : [...(visit.drugs || []), ...items].map((item) => item.drugId);
    });

    res.json({ ...updatedVisit, warnings: await findNegativeStockWarnings(touchedDrugIds) });
  } catch (error) {
    next(error);
  } finally {
    await session.endSession();
  }
});

// xóa một lần khám (không hoàn kho), các lần khám sau tự tụt số (xóa lần 2 trong 1-2-3-4-5 thì 3,4,5 thành 2,3,4)
app.delete("/api/visits/:id", async (req, res, next) => {
  const session = await mongoose.startSession();

  try {
    let result = null;

    await session.withTransaction(async () => {
      const visit = await Visit.findById(req.params.id).session(session).lean();
      if (!visit) {
        throw createHttpError(404, "Khong tim thay luot kham de xoa.");
      }

      // không hoàn lại thuốc vào kho (theo yêu cầu): kho giữ nguyên số hiện tại
      await Visit.deleteOne({ _id: visit._id }, { session });

      // đánh lại số từng lần theo thứ tự tăng dần (chỉ số duy nhất patientId+visitNo nên không đổi hàng loạt một lượt)
      const later = await Visit.find({ patientId: visit.patientId, visitNo: { $gt: visit.visitNo } }, { visitNo: 1 }).sort({ visitNo: 1 }).session(session).lean();
      for (const item of later) {
        await Visit.updateOne({ _id: item._id }, { $set: { visitNo: item.visitNo - 1 } }, { session });
      }
      result = { ok: true, patientId: visit.patientId, remaining: await Visit.countDocuments({ patientId: visit.patientId }).session(session) };
    });

    res.json(result);
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

module.exports = { User, Session, connectWithFallback, BCRYPT_COST, MIN_PASSWORD_LENGTH, buildStats, sendMail, parseMailAddress };

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

// oldItems: toa cũ khi sửa lần khám. Thuốc đã có trong toa cũ giữ nguyên giá và thông tin (snapshot),
// chỉ thuốc mới thêm vào mới lấy giá và thông tin từ kho hiện tại.
async function buildVisitDrugItems(drugs, session, oldItems = []) {
  const requestedItems = Array.isArray(drugs) ? drugs : [];
  if (!requestedItems.length) {
    return [];
  }

  const snapshotMap = new Map();
  oldItems.forEach((item) => {
    if (!snapshotMap.has(String(item.drugId))) snapshotMap.set(String(item.drugId), item);
  });
  const uniqueDrugIds = [
    ...new Set(requestedItems.map((item) => String(item.drugId || "")).filter((id) => id && !snapshotMap.has(id)))
  ];
  const catalog = await Drug.find({ _id: { $in: uniqueDrugIds } }).session(session).lean();
  const catalogMap = new Map(catalog.map((item) => [String(item._id), item]));

  return requestedItems.map((item) => {
    const old = snapshotMap.get(String(item.drugId));
    const drug = old
      ? { _id: old.drugId, activeIngredient: old.activeIngredient, brandName: old.brandName, usage: old.usage, unit: old.unit, price: old.unitPrice }
      : catalogMap.get(String(item.drugId));
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
    // updateOne không khớp tài liệu nào thì không lỗi: thuốc đã xóa khỏi kho thì không còn kho để hoàn/trừ
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

// Lịch hẹn hôm nay của MỘT bệnh nhân (dùng chung cho ô số và danh sách chi tiết).
// Xếp theo số lần khám (visitNo) vì ngày khám của các lần cũ có thể trùng nhau.
// Lịch hẹn = lần khám gần nhất có ngày tái khám là hôm nay, miễn sau nó không có lần khám nào TRƯỚC hôm nay (lần đó đã hẹn lại ngày khác).
// Đã đến = sau lần đặt hẹn đó có lượt khám vào hôm nay.
function appointmentToday(items, today) {
  const sorted = [...items].sort((a, b) => a.visitNo - b.visitNo);
  for (let k = sorted.length - 1; k >= 0; k -= 1) {
    const later = sorted.slice(k + 1);
    if (later.some((visit) => vnDayKey(visit.visitDate) < today)) return null;
    const visit = sorted[k];
    if (visit.followUpDate && vnDayKey(visit.followUpDate) === today) {
      return {
        patientName: sorted[sorted.length - 1].patientName,
        arrived: later.some((item) => vnDayKey(item.visitDate) === today)
      };
    }
  }
  return null;
}

function buildStats(totalPatients, visits, now) {
  const today = vnDayKey(now);
  const month = today.slice(0, 7);
  const quick = { visitsToday: 0, appointmentsToday: 0, appointmentsArrived: 0, revenueToday: 0, visitsThisMonth: 0 };
  const patients = { total: totalPatients, newThisMonth: 0, revisitRate: 0, revisitReturned: 0, revisitDue: 0 };
  const finance = { revenueThisMonth: 0 };

  const byPatient = new Map();
  visits.forEach((visit) => {
    const key = String(visit.patientId);
    if (!byPatient.has(key)) byPatient.set(key, []);
    byPatient.get(key).push(visit);
    const dayKey = vnDayKey(visit.visitDate);
    const money = Number(visit.totalMoney || 0);
    if (dayKey === today) {
      quick.visitsToday += 1;
      quick.revenueToday += money;
    }
    if (dayKey.slice(0, 7) === month) {
      quick.visitsThisMonth += 1;
      finance.revenueThisMonth += money;
    }
  });

  byPatient.forEach((items) => {
    items.sort((a, b) => new Date(a.visitDate) - new Date(b.visitDate) || a.visitNo - b.visitNo);
    if (vnMonthKey(items[0].visitDate) === month) patients.newThisMonth += 1;

    const appointment = appointmentToday(items, today);
    if (appointment) {
      quick.appointmentsToday += 1;
      if (appointment.arrived) quick.appointmentsArrived += 1;
    }

    // Tái khám: có lượt khám nào SAU lượt này là "có quay lại"; chưa tới ngày hẹn và chưa quay lại thì chưa tính
    items.forEach((visit, index) => {
      if (!visit.followUpDate) return;
      const returned = index < items.length - 1;
      if (returned || vnDayKey(visit.followUpDate) < today) patients.revisitDue += 1;
      if (returned) patients.revisitReturned += 1;
    });
  });

  patients.revisitRate = patients.revisitDue ? Math.round((patients.revisitReturned / patients.revisitDue) * 100) : 0;
  return { today, quick, patients, finance };
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
