# KhoiThe Affiliate System

## Hướng dẫn deploy lên Railway (không cần biết code)

---

### BƯỚC 1 — Đưa code lên GitHub

1. Tải code về máy (file zip tôi gửi)
2. Vào **github.com** → **New repository** → đặt tên `affiliate-khoithe` → **Create**
3. Upload toàn bộ file lên repo (kéo thả vào GitHub)

---

### BƯỚC 2 — Tạo Database trên Railway

1. Vào **railway.app** → **New Project**
2. Chọn **Deploy from GitHub repo** → chọn `affiliate-khoithe`
3. Sau khi deploy xong → click **+ New** → **Database** → **PostgreSQL**
4. Click vào PostgreSQL → tab **Variables** → copy giá trị **DATABASE_URL**

---

### BƯỚC 3 — Điền biến môi trường

Trong Railway → chọn service app → tab **Variables** → thêm từng dòng:

```
DATABASE_URL         = (dán từ bước 2)
JWT_SECRET           = khoithe-affiliate-secret-2024-change-me
PUSHER_APP_ID        = 2162439
PUSHER_KEY           = 265f17b66ab89c44e2f1
PUSHER_SECRET        = 9413e167c944de55f122
PUSHER_CLUSTER       = ap1
NEXT_PUBLIC_PUSHER_KEY     = 265f17b66ab89c44e2f1
NEXT_PUBLIC_PUSHER_CLUSTER = ap1
WEBHOOK_SECRET       = khoithe-webhook-2024
NEXT_PUBLIC_APP_URL  = https://affiliate.khoithe.com
```

---

### BƯỚC 4 — Khởi tạo database

Trong Railway → service app → tab **Settings** → **Deploy** → thêm vào **Start Command**:
```
npx prisma db push && npm start
```

---

### BƯỚC 5 — Trỏ domain

1. Trong Railway → service → **Settings** → **Networking** → **Custom Domain** → nhập `affiliate.khoithe.com`
2. Railway sẽ hiển thị một giá trị CNAME (dạng `xxx.railway.app`)
3. Vào DNS của khoithe.com → **Add Record**:
   - Type: `CNAME`
   - Name: `affiliate`
   - Value: (dán giá trị Railway cung cấp)
4. Chờ 5-10 phút là truy cập được

---

### BƯỚC 6 — Tạo tài khoản Admin đầu tiên

Hệ thống tự tạo tài khoản admin mặc định:
- **Username:** `admin`
- **Password:** `admin123`

⚠️ **Đổi mật khẩu ngay sau khi đăng nhập lần đầu!**

---

### BƯỚC 7 — Kết nối Google Sheet

1. Mở Google Sheet chứa dữ liệu khách hàng
2. Đảm bảo Sheet có các cột theo thứ tự:
   ```
   STT | Họ và tên | Số điện thoại | Email | Affiliate (mã) | Ngày đăng ký
   ```
3. Vào **Extensions** → **Apps Script**
4. Xóa code cũ → paste toàn bộ nội dung file `APPS_SCRIPT.js`
5. Đổi `WEBHOOK_URL` thành `https://affiliate.khoithe.com/api/sync`
6. Đổi `WEBHOOK_SECRET` thành `khoithe-webhook-2024` (phải khớp với env)
7. Click **Save** → Click **Run** → Cấp quyền khi được hỏi
8. Để chạy tự động: **Triggers** → **+ Add Trigger** → chọn `syncToWebapp` → **Time-driven** → **Every 5 minutes**

---

### Tài khoản mặc định sau khi chạy seed

| Username | Password  | Vai trò     |
|----------|-----------|-------------|
| admin    | admin123  | Quản trị    |

Gói giá mặc định đã được tạo: Cơ bản (10M), Nâng cao (15M), Premium (20M), Đặc biệt (30M)
