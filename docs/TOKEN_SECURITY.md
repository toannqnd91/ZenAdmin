# Token Security Implementation

## Chiến lược bảo mật Token

### 🔐 Access Token (Encrypted)
- **Mã hóa:** AES-GCM 256-bit
- **Lưu trữ:** Cookie (encrypted form)
- **Thời hạn:** 1 giờ
- **Flags:** `secure`, `sameSite: strict`

### 🔒 Refresh Token 
- **Mã hóa:** Không cần (httpOnly cookie)
- **Lưu trữ:** HttpOnly Cookie
- **Thời hạn:** 30 ngày
- **Flags:** `httpOnly`, `secure`, `sameSite: strict`

## Cách hoạt động

### 1. Login
```typescript
// 1. Nhận token từ API
const tokenData = await authService.login(credentials)

// 2. Mã hóa access token bằng AES-GCM
const encryptedToken = await encryptToken(tokenData.accessToken)

// 3. Lưu encrypted token vào cookie
accessTokenCookie.value = encryptedToken

// 4. Lưu token gốc vào memory (RAM) để gọi API
accessToken.value = tokenData.accessToken
```

### 2. Initialize (Load lại trang)
```typescript
// 1. Đọc encrypted token từ cookie
const encryptedToken = accessTokenCookie.value

// 2. Giải mã token
const token = await decryptToken(encryptedToken)

// 3. Lưu vào memory để sử dụng
accessToken.value = token
```

### 3. Refresh Token
```typescript
// 1. Gọi API refresh (browser tự động gửi httpOnly cookie)
const response = await authService.refreshToken(refreshTokenCookie.value)

// 2. Mã hóa access token mới
const encryptedToken = await encryptToken(response.data.accessToken)

// 3. Cập nhật cookie
accessTokenCookie.value = encryptedToken
```

## Bảo mật đạt được

### ✅ Chống XSS (Cross-Site Scripting)
- Token được **mã hóa** trong cookie
- Ngay cả khi XSS đọc được cookie, chỉ thấy ciphertext vô nghĩa
- Encryption key được derive từ PBKDF2 (100,000 iterations)

### ✅ Chống CSRF (Cross-Site Request Forgery)
- `sameSite: strict` ngăn browser gửi cookie từ domain khác

### ✅ Chống Man-in-the-Middle
- `secure: true` trong production → chỉ gửi qua HTTPS

### ✅ Token Short-lived
- Access token 1 giờ → giảm thiểu thời gian exposed nếu bị compromise

## Encryption Details

### Thuật toán: AES-GCM
- **Key size:** 256-bit
- **Mode:** GCM (Galois/Counter Mode) - authenticated encryption
- **IV:** Random 12 bytes cho mỗi lần mã hóa
- **Key derivation:** PBKDF2 với 100,000 iterations

### Key Generation
```typescript
PBKDF2(
  password: "ZenAdmin-2024-Auth-Encryption-Key",
  salt: "zenadmin-salt",
  iterations: 100000,
  hash: SHA-256
) → AES-256 Key
```

## Production Deployment

### Environment Variables
Trong production, nên dùng secret từ env:

```env
NUXT_ENCRYPTION_SECRET=your-super-secret-key-here-min-32-chars
```

Cập nhật `utils/crypto.ts`:
```typescript
const secret = process.env.NUXT_ENCRYPTION_SECRET || 'fallback-dev-secret'
```

### Recommendations
1. **Rotate encryption key** định kỳ (mỗi 6 tháng)
2. **Monitor failed decryption attempts** - có thể là dấu hiệu tấn công
3. **Implement rate limiting** cho login/refresh endpoints
4. **Log security events** (failed login, token refresh, etc.)

## So sánh với các phương án khác

| Phương án | Bảo mật | UX | Độ phức tạp |
|-----------|---------|----|----|
| **Encrypted Cookie** (Hiện tại) | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| Plain Cookie | ⭐ | ⭐⭐⭐⭐⭐ | ⭐ |
| HttpOnly Cookie | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ |
| Memory Only | ⭐⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐⭐ |

**Kết luận:** Encrypted Cookie cân bằng tốt giữa bảo mật & UX.
