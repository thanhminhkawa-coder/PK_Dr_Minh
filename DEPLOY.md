# Trien khai on dinh: Netlify + Backend rieng + MongoDB

Day la huong phu hop nhat voi bo ma hien tai.

- Frontend tinh: Netlify
- Backend Node/Express: Render, Railway hoac VPS Node
- Database: MongoDB Atlas

Khong nen doi sang `Vercel + Supabase` o thoi diem nay vi ma hien tai dang dung:

- Express chay lau dai
- Mongoose/MongoDB
- nhieu API CRUD theo MongoDB

## 1. Frontend tren Netlify

Cac file dung cho frontend:

- `minh.html`
- `minh.css`
- `minh.js`
- `icd-data.js`
- `app-config.js`
- `netlify.toml`

Lam nhu sau:

1. Dua repo hoac thu muc goc len Netlify.
2. Dat `Publish directory` la `.`
3. Khi da co URL backend that, sua `app-config.js`:

```js
window.APP_CONFIG = {
  API_BASE: "https://your-backend-domain.com"
};
```

## 2. Backend rieng

Chay backend:

```bash
npm install
npm start
```

Bien moi truong can co:

- `PORT`
- `MONGODB_URI`
- `MONGODB_URI_DIRECT`
- `CORS_ORIGINS`

Vi du:

```env
PORT=3000
MONGODB_URI=...
MONGODB_URI_DIRECT=...
CORS_ORIGINS=https://your-site.netlify.app
```

## 3. Kiem tra sau khi deploy

Kiem tra backend:

- `/api/health`
- `/api/patients`
- `/api/drugs`
- `/api/settings`

Kiem tra frontend:

- mo site Netlify
- tai duoc danh sach benh nhan
- luu duoc benh nhan moi
- luu duoc toa thuoc
- mo duoc xem/in toa

## 4. Vi sao chon huong nay

- it sua ma nhat
- giu nguyen MongoDB hien co
- de bao tri hon ep Express hien tai sang serverless
- de mo rong backend doc lap khi du lieu tang

## 5. Ket luan ngan

Neu ban muon trien khai online on dinh, hay dung:

- Netlify cho giao dien
- mot backend Node rieng
- MongoDB Atlas cho du lieu

Day la huong an toan nhat cho bo ma hien tai.
