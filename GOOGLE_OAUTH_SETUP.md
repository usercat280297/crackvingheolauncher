# 🔐 Hướng dẫn tạo Google OAuth Credentials

## Vấn đề hiện tại
- Launcher đang hiển thị "Epic Games, Inc." vì đang dùng GOOGLE_CLIENT_ID của Epic Games
- Bạn cần tạo OAuth credentials riêng cho app của mình

## Các bước thực hiện

### 1. Truy cập Google Cloud Console
- Vào: https://console.cloud.google.com/
- Đăng nhập bằng tài khoản Google của bạn

### 2. Tạo Project mới
- Click "Select a project" ở góc trên
- Click "NEW PROJECT"
- Đặt tên: "Game Launcher" (hoặc tên bạn muốn)
- Click "CREATE"

### 3. Enable Google+ API
- Vào menu bên trái → "APIs & Services" → "Library"
- Tìm "Google+ API"
- Click "ENABLE"

### 4. Tạo OAuth Consent Screen
- Vào "APIs & Services" → "OAuth consent screen"
- Chọn "External" → Click "CREATE"
- Điền thông tin:
  - **App name**: Game Launcher (tên app của bạn)
  - **User support email**: Email của bạn
  - **Developer contact**: Email của bạn
- Click "SAVE AND CONTINUE"
- Scopes: Click "ADD OR REMOVE SCOPES"
  - Chọn: `userinfo.email`, `userinfo.profile`, `openid`
  - Click "UPDATE" → "SAVE AND CONTINUE"
- Test users: Thêm email của bạn để test
- Click "SAVE AND CONTINUE"

### 5. Tạo OAuth Client ID
- Vào "APIs & Services" → "Credentials"
- Click "CREATE CREDENTIALS" → "OAuth client ID"
- Application type: **Web application**
- Name: "Game Launcher Web Client"
- **Authorized redirect URIs**: Thêm:
  ```
  http://localhost:3000/api/auth/google/callback
  ```
- Click "CREATE"

### 6. Lấy Client ID và Client Secret
- Sau khi tạo, bạn sẽ thấy popup với:
  - **Client ID**: Dạng `xxxxx.apps.googleusercontent.com`
  - **Client Secret**: Dạng `GOCSPX-xxxxx`
- Copy 2 giá trị này

### 7. Cập nhật file .env
Mở file `.env` và thay thế:

```env
# Thay thế bằng Client ID và Secret mới của bạn
GOOGLE_CLIENT_ID=YOUR_CLIENT_ID.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-YOUR_CLIENT_SECRET
```

### 8. Restart Server
```bash
# Dừng server (Ctrl+C)
# Chạy lại
npm run dev
```

## ✅ Kết quả
- Google OAuth sẽ hiển thị tên app của bạn thay vì "Epic Games, Inc."
- 43k thành viên của bạn có thể đăng ký/đăng nhập bình thường
- OAuth sẽ mở trong popup window, không làm gián đoạn launcher

## 🔒 Bảo mật
- **KHÔNG** commit file `.env` lên GitHub
- **KHÔNG** chia sẻ Client Secret với ai
- Nếu bị lộ, vào Google Cloud Console → Credentials → Reset Secret

## 📝 Lưu ý cho Production
Khi deploy lên server thật (không phải localhost):
1. Vào Google Cloud Console → Credentials
2. Edit OAuth Client ID
3. Thêm Authorized redirect URIs:
   ```
   https://yourdomain.com/api/auth/google/callback
   ```
4. Cập nhật `.env` trên server với domain thật
