# ✅ Code Quality & Best Practices Checklist

## 🎯 Tổng Quan

Checklist đầy đủ để đảm bảo code **CLEAN** và **SMART**.

---

## 1. Code Cleanliness

### ❌ Issues Found
- **202 console.log** statements in production code
- **50 any types** - Should use proper TypeScript types
- Multiple TODO/FIXME comments

### ✅ Clean Code Standards

#### No Console Logs in Production
```typescript
// ❌ Bad
console.log('Debug info', data)

// ✅ Good - Use logger
import { logger } from '@/utils/logger'
logger.debug('Debug info', data)

// ✅ Good - Use smartConsole
import { smartConsole } from '@/utils/smart-logger'
smartConsole.log('Debug info', data)  // Auto-disabled in production
```

#### No Any Types
```typescript
// ❌ Bad
function process(data: any) {
  return data
}

// ✅ Good
interface ProcessData {
  id: number
  name: string
}

function process(data: ProcessData) {
  return data
}

// ✅ Good - Use generics
function process<T>(data: T): T {
  return data
}
```

#### No Debugger Statements
```typescript
// ❌ Bad
debugger;

// ✅ Good - Use breakpoints in DevTools
```

#### No TODO/FIXME in Production
```typescript
// ❌ Bad
// TODO: Fix this later

// ✅ Good - Create issue in tracker
// GitHub Issue #123: Refactor this function
```

---

## 2. TypeScript Best Practices

### ✅ Strict Mode
```typescript
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true
  }
}
```

### ✅ Proper Types
```typescript
// ❌ Bad
const data: any = await fetch()

// ✅ Good
interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
}

const data: ApiResponse<User> = await fetch()
```

### ✅ Type Guards
```typescript
// ✅ Good
function isUser(obj: unknown): obj is User {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    'name' in obj
  )
}

if (isUser(data)) {
  console.log(data.name)  // Type-safe
}
```

---

## 3. Vue Best Practices

### ✅ Composition API
```vue
<script setup lang="ts">
// ✅ Good - Use Composition API
import { ref, computed } from 'vue'

const count = ref(0)
const doubled = computed(() => count.value * 2)
</script>
```

### ✅ Props with Types
```vue
<script setup lang="ts">
// ✅ Good
interface Props {
  title: string
  count?: number
}

const props = withDefaults(defineProps<Props>(), {
  count: 0
})
</script>
```

### ✅ Emits with Types
```vue
<script setup lang="ts">
// ✅ Good
interface Emits {
  (e: 'update', value: string): void
  (e: 'delete', id: number): void
}

const emit = defineEmits<Emits>()
</script>
```

---

## 4. Performance Best Practices

### ✅ Use getCached for Read Operations
```typescript
// ❌ Bad
async getProducts() {
  return this.get('/products')  // Always network
}

// ✅ Good
async getProducts() {
  return this.getCached('/products', {}, 5 * 60 * 1000)  // Cache 5 min
}
```

### ✅ Invalidate Cache on Mutations
```typescript
// ✅ Good
async createProduct(data) {
  const result = await this.post('/products', data)
  this.invalidateCache('ProductService:GET:/products')
  return result
}
```

### ✅ Use Request Deduplication
```typescript
// ✅ Good
import { requestDeduplicator } from '@/utils/request-deduplication'

const products = await requestDeduplicator.deduplicate(
  'products',
  () => productService.getProducts()
)
```

### ✅ Use Batch Loading
```typescript
// ✅ Good
import { createBatchLoader } from '@/utils/batch-loader'

const categoryLoader = createBatchLoader({
  batchFn: (ids) => fetchCategoriesByIds(ids)
})

const categories = await categoryLoader.loadMany([1, 2, 3])
```

---

## 5. Security Best Practices

### ✅ Input Validation
```typescript
// ✅ Good
import { z } from 'zod'

const userSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
})

const validated = userSchema.parse(input)
```

### ✅ Input Sanitization
```typescript
// ✅ Good
import { sanitizeHtml } from '@/utils/sanitizer'

const clean = sanitizeHtml(userInput)
```

### ✅ No Hardcoded Secrets
```typescript
// ❌ Bad
const API_KEY = 'sk-1234567890'

// ✅ Good
const API_KEY = process.env.NUXT_PUBLIC_API_KEY
```

---

## 6. Error Handling Best Practices

### ✅ Use Error Tracker
```typescript
// ✅ Good
import { errorTracker } from '@/utils/error-tracker'

try {
  await riskyOperation()
} catch (error) {
  errorTracker.captureException(error, {
    component: 'ProductList',
    userId: user.id
  })
  throw error
}
```

### ✅ Proper Error Messages
```typescript
// ❌ Bad
throw new Error('Error')

// ✅ Good
throw new Error('Failed to fetch products: Network timeout')
```

### ✅ Handle All Promises
```typescript
// ❌ Bad
fetchData()  // Unhandled promise

// ✅ Good
fetchData().catch(error => {
  errorTracker.captureException(error)
})

// ✅ Better
await fetchData()
```

---

## 7. Testing Best Practices

### ✅ Unit Tests
```typescript
// ✅ Good
import { describe, it, expect } from 'vitest'

describe('ProductService', () => {
  it('should fetch products', async () => {
    const products = await productService.getProducts()
    expect(products).toBeDefined()
    expect(Array.isArray(products.data)).toBe(true)
  })
})
```

### ✅ Test Coverage
```bash
# Target: 70%+
npm run test:coverage
```

---

## 8. Documentation Best Practices

### ✅ JSDoc Comments
```typescript
/**
 * Fetch products with caching
 * @param options - Query options
 * @returns Promise with products array
 * @throws {Error} If network request fails
 */
async getProducts(options?: QueryOptions): Promise<ApiResponse<Product[]>> {
  return this.getCached('/products', options, 5 * 60 * 1000)
}
```

### ✅ README Files
```markdown
# Component Name

## Usage
\`\`\`vue
<ProductList :items="products" />
\`\`\`

## Props
- `items` (Product[]) - List of products

## Events
- `@select` - Emitted when product is selected
```

---

## 9. Git Best Practices

### ✅ Commit Messages
```bash
# ❌ Bad
git commit -m "fix"

# ✅ Good
git commit -m "fix: resolve cache invalidation issue in ProductService"
git commit -m "feat: add request deduplication utility"
git commit -m "refactor: optimize service layer caching"
```

### ✅ Branch Naming
```bash
# ✅ Good
feature/add-batch-loader
fix/cache-invalidation
refactor/optimize-services
```

---

## 10. Cleanup Script

### Run Cleanup
```bash
# Remove console.log, debugger
node scripts/cleanup-code.js

# Output:
# 🧹 Cleaning up code...
# 
#   ✓ Cleaned: composables/useProducts.ts
#   ✓ Cleaned: pages/products/index.vue
# 
# 📊 Cleanup Summary:
#   Files scanned: 150
#   console.log removed: 202
#   debugger removed: 5
#   TODOs found: 10
#   any types found: 50
# 
# ✅ Cleanup complete!
```

---

## 11. Final Checklist

### Code Quality
- [ ] Run cleanup script: `node scripts/cleanup-code.js`
- [ ] No console.log in production code
- [ ] No debugger statements
- [ ] No any types (use proper types)
- [ ] No TODO/FIXME comments
- [ ] All imports organized
- [ ] No unused variables
- [ ] No dead code

### TypeScript
- [ ] Strict mode enabled
- [ ] All functions have return types
- [ ] All parameters have types
- [ ] No implicit any
- [ ] Type guards for unknown types

### Performance
- [ ] All read methods use getCached
- [ ] All mutations invalidate cache
- [ ] Request deduplication where needed
- [ ] Batch loading for N+1 queries
- [ ] Lazy loading for heavy components

### Security
- [ ] Input validation with Zod
- [ ] Input sanitization
- [ ] No hardcoded secrets
- [ ] CORS configured
- [ ] Rate limiting enabled

### Testing
- [ ] 70%+ test coverage
- [ ] All critical paths tested
- [ ] E2E tests for main flows
- [ ] Performance benchmarks

### Documentation
- [ ] JSDoc for public APIs
- [ ] README for each module
- [ ] Usage examples
- [ ] Migration guides

---

## 12. Automated Checks

### Pre-commit Hook
```bash
# .husky/pre-commit
#!/bin/sh
npm run lint
npm run typecheck
npm run test
```

### CI/CD Pipeline
```yaml
# .github/workflows/ci.yml
- name: Lint
  run: npm run lint
  
- name: Type Check
  run: npm run typecheck
  
- name: Test
  run: npm run test
  
- name: Build
  run: npm run build
```

---

## 13. Code Review Checklist

### Before PR
- [ ] Code is clean (no console.log, debugger)
- [ ] Types are proper (no any)
- [ ] Tests are added/updated
- [ ] Documentation is updated
- [ ] Performance is optimized
- [ ] Security is considered

### During Review
- [ ] Code follows conventions
- [ ] Logic is clear and maintainable
- [ ] Edge cases are handled
- [ ] Error handling is proper
- [ ] Performance is acceptable

---

## ✅ Current Status

### Issues to Fix
- ❌ **202 console.log** statements → Run cleanup script
- ❌ **50 any types** → Replace with proper types
- ❌ **Multiple TODOs** → Create issues and fix

### Already Good
- ✅ Service layer pattern
- ✅ Caching strategy
- ✅ Request optimization
- ✅ Error tracking
- ✅ Performance monitoring
- ✅ Security measures
- ✅ Testing infrastructure
- ✅ Documentation

---

## 🎯 Action Plan

### Step 1: Run Cleanup
```bash
node scripts/cleanup-code.js
```

### Step 2: Fix Any Types
```bash
# Find all any types
grep -r ": any" app/

# Replace with proper types
```

### Step 3: Fix TODOs
```bash
# Find all TODOs
grep -r "TODO\|FIXME" app/

# Create issues and fix
```

### Step 4: Verify
```bash
npm run lint
npm run typecheck
npm run test
```

---

## 🎉 Goal

**Clean Code Score: 10/10**
- ✅ Zero console.log in production
- ✅ Zero any types
- ✅ Zero debugger statements
- ✅ Zero TODOs in production
- ✅ 100% TypeScript strict
- ✅ 70%+ test coverage
- ✅ Full documentation

**Smart Code Score: 10/10**
- ✅ Auto-caching everywhere
- ✅ Request deduplication
- ✅ Batch loading
- ✅ Smart decorators
- ✅ Performance monitoring
- ✅ Error tracking
- ✅ Best practices

**PRODUCTION PERFECT!** 🚀✨
