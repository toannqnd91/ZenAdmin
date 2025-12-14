# 🚀 Quick Start Guide

## ⚡ Cài Đặt Nhanh

### 1. Install Dependencies

```bash
# Sử dụng npm (recommended để tránh conflict)
npm install --legacy-peer-deps

# Hoặc nếu dùng pnpm
pnpm install
```

### 2. Install Pinia (State Management)

```bash
npm install pinia @pinia/nuxt --legacy-peer-deps
```

### 3. Install Playwright (E2E Testing - Optional)

```bash
npx playwright install
```

## 🏃 Chạy Development Server

```bash
npm run dev
```

Server sẽ chạy tại: http://localhost:3000

## 🧪 Chạy Tests

```bash
# Unit tests
npm run test

# Unit tests với coverage
npm run test:coverage

# Unit tests với UI
npm run test:ui

# Performance benchmarks
npm run test:bench

# E2E tests (cần install Playwright trước)
npm run test:e2e
```

## 🐳 Docker

```bash
# Build Docker image
npm run docker:build

# Start container
npm run docker:run

# View logs
npm run docker:logs

# Stop container
npm run docker:stop
```

## 📝 Configuration

### Environment Variables

Tạo file `.env` từ template:

```bash
cp .env.example .env
```

Hoặc tạo thủ công với nội dung:

```env
NUXT_PUBLIC_API_BASE_URL=https://localhost:7002/api/v1
NUXT_PUBLIC_IMAGE_BASE_URL=https://localhost:7002
NUXT_PUBLIC_APP_TITLE=Zen Dashboard
```

## 🔧 Fix Common Issues

### Issue 1: Dependency Conflicts

```bash
# Clear cache và reinstall
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
```

### Issue 2: TypeScript Errors

```bash
# Restart TypeScript server trong VS Code
Ctrl+Shift+P → "TypeScript: Restart TS Server"
```

### Issue 3: Pinia Not Found

```bash
# Install với legacy peer deps
npm install pinia @pinia/nuxt --legacy-peer-deps

# Thêm vào nuxt.config.ts
modules: ['@pinia/nuxt']
```

### Issue 4: Playwright Not Installed

```bash
# Install Playwright browsers
npx playwright install
```

## 📚 Project Structure

```
zen-admin/
├── app/
│   ├── components/      # Vue components
│   ├── composables/     # Vue composables
│   ├── pages/           # Auto-routed pages
│   ├── services/        # API services (30+ services)
│   ├── schemas/         # Zod validation schemas
│   ├── stores/          # Pinia stores
│   └── utils/           # Utilities (cache, logger, etc.)
├── server/
│   ├── api/             # Server endpoints
│   └── middleware/      # Security middleware
├── tests/
│   ├── unit/            # Unit tests
│   ├── e2e/             # E2E tests
│   └── benchmarks/      # Performance benchmarks
└── .github/workflows/   # CI/CD pipelines
```

## 🎯 Key Features

### Caching
```typescript
import { apiCache } from '@/utils/cache-manager'

// Cache data
apiCache.set('key', data, 60000) // 1 minute TTL

// Get cached data
const cached = apiCache.get('key')

// Invalidate cache
apiCache.invalidatePattern('products:')
```

### Performance Monitoring
```typescript
import { performanceMonitor } from '@/utils/performance-monitor'

// Monitor async operations
await performanceMonitor.measure('operation', async () => {
  // Your code here
})

// Get performance summary
const summary = performanceMonitor.getSummary('operation')
```

### Logging
```typescript
import { logger } from '@/utils/logger'

logger.info('User logged in', { userId: 123 })
logger.error('API failed', { error, endpoint: '/api/users' })
```

### Validation
```typescript
import { loginSchema } from '@/schemas'

const result = loginSchema.safeParse(formData)
if (!result.success) {
  console.error(result.error.errors)
}
```

### State Management
```typescript
import { useAuthStore } from '@/stores/auth.store'

const authStore = useAuthStore()
await authStore.login({ email, password })
```

## 📊 Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Run TypeScript type checking |
| `npm run test` | Run unit tests |
| `npm run test:coverage` | Run tests with coverage |
| `npm run test:ui` | Run tests with UI |
| `npm run test:bench` | Run performance benchmarks |
| `npm run test:e2e` | Run E2E tests |
| `npm run docker:build` | Build Docker image |
| `npm run docker:run` | Start Docker container |
| `npm run docker:stop` | Stop Docker container |

## 🚀 Next Steps

1. ✅ Read [README.md](./README.md) for overview
2. ✅ Check [ENTERPRISE_UPGRADE.md](./ENTERPRISE_UPGRADE.md) for details
3. ✅ Review [OPTIMIZATION_GUIDE.md](./OPTIMIZATION_GUIDE.md) for performance
4. ✅ See [FINAL_SUMMARY.md](./FINAL_SUMMARY.md) for complete summary

## 💡 Tips

- Use `--legacy-peer-deps` khi install để tránh dependency conflicts
- Restart TS server nếu gặp TypeScript errors
- Check logs với `npm run docker:logs` khi dùng Docker
- Run benchmarks để track performance: `npm run test:bench`

## 🆘 Need Help?

- Check documentation trong thư mục docs/
- Review example tests trong tests/
- See service examples trong app/services/

---

**Happy Coding!** 🎉
