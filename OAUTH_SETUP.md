# 🔐 Hướng dẫn Setup Google OAuth

## 1. Tạo Google Cloud Project

1. Truy cập [Google Cloud Console](https://console.cloud.google.com/)
2. Tạo project mới hoặc chọn project có sẵn
3. Enable Google+ API và Google OAuth2 API

## 2. Tạo OAuth 2.0 Credentials

1. Vào **APIs & Services** > **Credentials**
2. Click **Create Credentials** > **OAuth 2.0 Client IDs**
3. Chọn **Web application**
4. Điền thông tin:
   - **Name**: Game Launcher OAuth
   - **Authorized JavaScript origins**: 
     - `http://localhost:5173`
     - `http://localhost:3000`
   - **Authorized redirect URIs**:
     - `http://localhost:3000/api/auth/google/callback`

## 3. Cập nhật file .env

Thêm vào file `.env`:

```env
# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here

# GitHub OAuth (optional)
GITHUB_CLIENT_ID=your_github_client_id_here
GITHUB_CLIENT_SECRET=your_github_client_secret_here

# JWT Secret
JWT_SECRET=your_super_secret_jwt_key_here
```

## 4. Test OAuth

Sau khi setup xong, restart server và test:

```bash
npm run dev
```

Truy cập: `http://localhost:3000/api/auth/google` để test Google OAuth

## 5. Frontend Integration

Trong React component:

```jsx
const handleGoogleLogin = () => {
  window.location.href = 'http://localhost:3000/api/auth/google';
};

<button onClick={handleGoogleLogin}>
  Login with Google
</button>
```

## 6. Troubleshooting

- Đảm bảo redirect URI chính xác
- Kiểm tra Google Cloud Console có enable APIs
- Restart server sau khi thay đổi .env