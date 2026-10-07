# Triển khai PK Dr. Minh: chỉ dùng Render

Một web service Render chạy Express, phục vụ cả giao diện tĩnh (`minh.html`, `minh.css`, `minh.js`, ...) lẫn `/api` trên cùng một domain. Dữ liệu nằm ở MongoDB Atlas. Không dùng Netlify, nên `app-config.js` giữ nguyên `API_BASE: ""`.

## 1. Tạo web service trên Render

1. Render Dashboard → **New** → **Web Service** → chọn repo.
2. Cấu hình:
   - **Runtime**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
3. Thêm các biến môi trường ở mục 2, rồi **Deploy**.

## 2. Biến môi trường

| Biến | Bắt buộc | Ví dụ / ghi chú |
|---|---|---|
| `MONGODB_URI` | có | Chuỗi kết nối Atlas, có tên database `PK-DrMinh`. |
| `MONGODB_URI_DIRECT` | không | Chuỗi dự phòng dạng `mongodb://host1,host2,...` khi DNS SRV bị lỗi. |
| `JWT_ACCESS_SECRET` | có | Chuỗi ngẫu nhiên dài. Tạo bằng `openssl rand -hex 32`. Thiếu thì server không khởi động. |
| `NODE_ENV` | có | `production`. Bật cờ `Secure` cho cookie đăng nhập (cần HTTPS, Render đã có sẵn). |
| `SMTP_HOST` | để gửi email quên mật khẩu | `smtp.gmail.com` |
| `SMTP_PORT` | như trên | `587` (STARTTLS) hoặc `465` (SSL) |
| `SMTP_USER` | như trên | Địa chỉ Gmail gửi thư |
| `SMTP_PASS` | như trên | **App Password** của Gmail (mục 4), không phải mật khẩu đăng nhập Gmail |
| `MAIL_FROM` | không | `"PK Dr. Minh <your-account@gmail.com>"`. Bỏ trống thì dùng `SMTP_USER`. |
| `CORS_ORIGINS` | không | Không cần khi giao diện và API cùng domain. |
| `PORT` | không | Render tự đặt. |

Lưu ý:
- Biến môi trường trên Render luôn thắng file `.env` (server chỉ đọc file khi biến chưa có).
- Nếu thiếu `SMTP_HOST`, link đặt lại mật khẩu được in ra log của service thay vì gửi email.

## 3. Tạo tài khoản đăng nhập

Hệ thống chỉ có một người dùng. Sau lần deploy đầu tiên, mở **Shell** của service trên Render và chạy:

```bash
npm run create-user -- email-cua-ban@gmail.com
```

Nhập mật khẩu (tối thiểu 8 ký tự, không hiện ra màn hình). Đã có tài khoản thì lệnh từ chối, trừ khi thêm `--reset-password`:

```bash
npm run create-user -- email-cua-ban@gmail.com --reset-password
```

Đổi mật khẩu bằng cách này sẽ thu hồi mọi phiên đăng nhập cũ.

## 4. Tạo Gmail App Password

1. Vào <https://myaccount.google.com/security> và bật **Xác minh 2 bước** cho tài khoản Gmail gửi thư.
2. Vào <https://myaccount.google.com/apppasswords>, đặt tên (ví dụ `PK Dr. Minh`) rồi bấm **Tạo**.
3. Chép mật khẩu 16 ký tự (bỏ khoảng trắng) vào `SMTP_PASS`.
4. `SMTP_USER` là địa chỉ Gmail đó, `SMTP_HOST=smtp.gmail.com`, `SMTP_PORT=587`.

## 5. Atlas Network Access

Atlas chặn mọi kết nối lạ theo mặc định, nên cần cho phép Render:

1. Atlas → **Security** → **Network Access** → **Add IP Address**.
2. Cách an toàn: thêm các **Outbound IP** của service (Render → service → **Connect** → **Outbound**).
3. Cách nhanh (kém an toàn hơn): `0.0.0.0/0`. Chỉ nên dùng tạm khi thử.

Atlas là replica set nên transaction (lưu lượt khám, sửa toa, nạp dữ liệu) chạy bình thường.

## 6. Thay đổi trong database

Lần chạy đầu, Mongoose tự tạo thêm hai collection và index:

- `users`: email (unique), `passwordHash`, token đặt lại mật khẩu.
- `sessions`: refresh token đã băm, kèm index TTL trên `absoluteExpiresAt` (Mongo tự xóa phiên hết hạn).

Collection cũ (`patients`, `visits`, `drugs`, `settings`) không đổi tên field. Field mới đều có giá trị mặc định, dữ liệu hiện có dùng tiếp được. Tồn kho thuốc giờ cho phép số âm.

## 7. Checklist sau khi deploy

- [ ] `https://<domain>/api/health` trả `{"ok":true,"mongoState":"connected"}`.
- [ ] `https://<domain>/api/patients` (không đăng nhập) trả 401.
- [ ] Mở trang, thấy màn hình đăng nhập; đăng nhập đúng thì vào được app.
- [ ] Tải lại trang vẫn còn đăng nhập; **Đăng xuất** rồi tải lại thì phải đăng nhập lại.
- [ ] **Quên mật khẩu**: nhận được email, link mở ra form mật khẩu mới, đặt xong đăng nhập lại được.
- [ ] Danh sách bệnh nhân hiện đủ, phân trang 20 hồ sơ/trang.
- [ ] Lưu một lượt khám thử: tồn kho trừ đúng; sửa toa đó thì kho chỉ đổi theo chênh lệch.
- [ ] Xem toa, in toa, gửi Zalo; layout không bị hẹp sau khi in.
- [ ] **Xuất dữ liệu** tải được file `pk-dr-minh-full-*.json`.
- [ ] Trên điện thoại: thêm vào màn hình chính, tab bar dưới đáy, chọn năm sinh bằng bánh xe.

## 8. Sao lưu

Bấm **Xuất dữ liệu** định kỳ và cất file ở nơi an toàn (file chứa dữ liệu bệnh nhân, không đưa lên nơi công khai). **Nạp dữ liệu** sẽ thay thế toàn bộ dữ liệu hiện tại và luôn tự tải bản sao lưu trước khi nạp.

## 9. File không còn dùng

`netlify.toml` không còn tác dụng (không dùng Netlify). Giữ hay xóa tùy bạn.
