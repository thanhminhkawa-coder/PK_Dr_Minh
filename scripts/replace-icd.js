// Dùng: npm run replace-icd            (xem trước, không ghi)
//       npm run replace-icd -- --yes   (thay TOÀN BỘ danh sách mã ICD trong DB bằng icd-data.js)
// Trỏ vào DB nào là do MONGODB_URI trong .env (Atlas thì dùng URI của Atlas). Lưu bản sao danh sách cũ ra file trước khi ghi.
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const mongoose = require("mongoose");
const { connectWithFallback } = require("../server");

async function main() {
  const sandbox = { window: {} };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, "..", "icd-data.js"), "utf8"), sandbox);
  const next = (sandbox.window.ICD_IMPORT || []).map((x) => ({ code: String(x.code).trim(), name: String(x.name).trim() })).filter((x) => x.code && x.name);
  if (!next.length) throw new Error("icd-data.js không có mã nào.");

  await connectWithFallback();
  const Settings = mongoose.model("Settings");
  const doc = await Settings.findOne({ key: "app-settings" }).lean();
  const old = doc?.icdList || [];
  console.log(`DB: ${mongoose.connection.host}/${mongoose.connection.name}`);
  console.log(`Danh sách hiện tại: ${old.length} mã. Danh sách mới (icd-data.js): ${next.length} mã.`);
  if (!process.argv.includes("--yes")) return console.log("Chưa ghi gì. Thêm --yes để thay thế.");

  const backup = path.join(__dirname, `icd-backup-${new Date().toISOString().replace(/[:.]/g, "-")}.json`);
  fs.writeFileSync(backup, JSON.stringify(old, null, 2));
  await Settings.updateOne({ key: "app-settings" }, { $set: { icdList: next } }, { upsert: true });
  console.log(`Đã thay ${old.length} → ${next.length} mã. Bản sao cũ: ${backup}`);
}

main()
  .catch((error) => { console.error(error.message); process.exitCode = 1; })
  .finally(() => mongoose.disconnect());
