// Dùng: npm run create-user -- <email> [--reset-password]
// Hệ thống chỉ có 1 user. Đã có user thì cần --reset-password để đổi mật khẩu.
const readline = require("readline");
const { Writable } = require("stream");
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const { User, Session, connectWithFallback, BCRYPT_COST, MIN_PASSWORD_LENGTH } = require("../server");

async function main() {
  const args = process.argv.slice(2);
  const resetPassword = args.includes("--reset-password");
  const emailArg = args.find((arg) => !arg.startsWith("--"));
  const email = String(emailArg || (await ask("Email: ", false))).trim().toLowerCase();
  if (!email) throw new Error("Cần nhập email.");

  await connectWithFallback();
  const existing = await User.findOne();
  if (existing && !resetPassword) {
    throw new Error(`Đã có tài khoản (${existing.email}). Chạy lại với --reset-password để đổi mật khẩu.`);
  }

  const password = await ask("Mật khẩu: ", true);
  if (password.length < MIN_PASSWORD_LENGTH) throw new Error(`Mật khẩu tối thiểu ${MIN_PASSWORD_LENGTH} ký tự.`);
  if (process.stdin.isTTY && (await ask("Nhập lại mật khẩu: ", true)) !== password) throw new Error("Hai mật khẩu không khớp.");

  const passwordHash = await bcrypt.hash(password, BCRYPT_COST);
  if (existing) {
    existing.email = email;
    existing.passwordHash = passwordHash;
    await existing.save();
    await Session.updateMany({ userId: existing._id, revokedAt: null }, { $set: { revokedAt: new Date() } });
    console.log(`Đã đổi mật khẩu cho ${email}; mọi phiên đăng nhập cũ đã bị thu hồi.`);
  } else {
    await User.create({ email, passwordHash });
    console.log(`Đã tạo tài khoản ${email}.`);
  }
}

function ask(question, hidden) {
  process.stdout.write(question);
  const output = hidden && process.stdin.isTTY ? new Writable({ write: (_chunk, _enc, done) => done() }) : process.stdout;
  const rl = readline.createInterface({ input: process.stdin, output, terminal: Boolean(hidden && process.stdin.isTTY) });
  return new Promise((resolve) => {
    rl.once("line", (line) => {
      rl.close();
      if (hidden && process.stdin.isTTY) process.stdout.write("\n");
      resolve(line);
    });
  });
}

main()
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
