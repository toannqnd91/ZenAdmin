# 🎯 Action Plan - Code Quality Improvement

**Mục tiêu:** Nâng Code Quality Score từ **8.5/10** lên **10/10**  
**Thời gian:** 2-3 tuần  
**Owner:** Development Team

---

## 📅 Week 1: Code Cleanup Sprint

### Day 1-2: Console.log Cleanup ⚡ CRITICAL

**Estimate:** 4-6 hours  
**Owner:** TBD  
**Priority:** P0

#### Tasks:
1. **Chạy cleanup script (Dry Run)**
   ```bash
   node scripts/cleanup-console-logs.js --dry-run
   ```

2. **Review kết quả**
   - Xem danh sách file sẽ bị modify
   - Đảm bảo không xóa nhầm logger files

3. **Chạy cleanup script (Production)**
   ```bash
   node scripts/cleanup-console-logs.js
   ```

4. **Thay thế bằng logger**
   - Các file quan trọng cần debug: Thay bằng `logger.debug()`
   - Các file không cần: Xóa hoàn toàn

5. **Test**
   ```bash
   npm run dev
   # Kiểm tra app vẫn hoạt động bình thường
   ```

6. **Commit**
   ```bash
   git add .
   git commit -m "chore: remove console.log statements from production code"
   ```

**Success Criteria:**
- ✅ Không còn console.log trong production code (trừ logger files)
- ✅ App vẫn hoạt động bình thường
- ✅ Các debug logs quan trọng đã được thay bằng logger

---

### Day 3-4: Fix TypeScript Errors ⚡ CRITICAL

**Estimate:** 8-10 hours  
**Owner:** TBD  
**Priority:** P0

#### Tasks:
1. **Chạy typecheck**
   ```bash
   npm run typecheck 2>&1 | tee typecheck-errors.txt
   ```

2. **Phân loại errors**
   - Critical errors (blocking)
   - Warning errors (non-blocking)
   - Low priority errors

3. **Fix từng loại error**
   
   **A. Implicit any errors**
   ```typescript
   // ❌ Before
   function process(data) {
     return data
   }
   
   // ✅ After
   function process(data: ProcessData): ProcessData {
     return data
   }
   ```

   **B. Null/undefined errors**
   ```typescript
   // ❌ Before
   const value = obj.property.value
   
   // ✅ After
   const value = obj?.property?.value ?? defaultValue
   ```

   **C. Type mismatch errors**
   ```typescript
   // ❌ Before
   const id: string = 123
   
   // ✅ After
   const id: string = String(123)
   ```

4. **Enable strict mode (gradually)**
   ```json
   // tsconfig.json
   {
     "compilerOptions": {
       "strict": true,
       "noImplicitAny": true,
       "strictNullChecks": true
     }
   }
   ```

5. **Verify**
   ```bash
   npm run typecheck
   # Should pass with 0 errors
   ```

6. **Commit**
   ```bash
   git add .
   git commit -m "fix: resolve TypeScript errors and enable strict mode"
   ```

**Success Criteria:**
- ✅ `npm run typecheck` pass với 0 errors
- ✅ Strict mode enabled
- ✅ App vẫn hoạt động bình thường

---

### Day 5: Replace Any Types 🔧 HIGH

**Estimate:** 6-8 hours  
**Owner:** TBD  
**Priority:** P1

#### Tasks:
1. **Tìm tất cả any types**
   ```bash
   grep -rn ": any" app/ > any-types-list.txt
   ```

2. **Phân loại theo priority**
   - **P0**: Public APIs, Service methods
   - **P1**: Component props, emits
   - **P2**: Internal utilities
   - **P3**: Decorators, generic utilities (có thể giữ any)

3. **Thay thế từng loại**

   **A. Service methods**
   ```typescript
   // ❌ Before
   async updateWidgetInstance(id: number, data: any): Promise<ApiResponse<any>> {
     return this.put(`/widget-instances/${id}`, data)
   }
   
   // ✅ After
   interface WidgetInstanceUpdate {
     name?: string
     slug?: string
     data?: Record<string, unknown>
   }
   
   async updateWidgetInstance(
     id: number, 
     data: WidgetInstanceUpdate
   ): Promise<ApiResponse<WidgetInstance>> {
     return this.put(`/widget-instances/${id}`, data)
   }
   ```

   **B. Component props**
   ```typescript
   // ❌ Before
   interface Props {
     items: any[]
   }
   
   // ✅ After
   interface Props {
     items: Product[]
   }
   ```

   **C. Event handlers**
   ```typescript
   // ❌ Before
   const handleClick = (e: any) => {
     console.log(e.target.value)
   }
   
   // ✅ After
   const handleClick = (e: MouseEvent) => {
     const target = e.target as HTMLInputElement
     console.log(target.value)
   }
   ```

4. **Giữ any cho generic utilities**
   ```typescript
   // ✅ OK to keep any for decorators
   function Cached(ttl: number) {
     return function (
       target: any,
       propertyKey: string,
       descriptor: PropertyDescriptor
     ) {
       // ...
     }
   }
   ```

5. **Verify**
   ```bash
   npm run typecheck
   npm run lint
   npm run test
   ```

6. **Commit**
   ```bash
   git add .
   git commit -m "refactor: replace any types with proper TypeScript types"
   ```

**Success Criteria:**
- ✅ Giảm any types xuống <20 instances (chỉ giữ ở decorators, utilities)
- ✅ Public APIs có proper types
- ✅ Component props/emits có proper types

---

## 📅 Week 2: Quality Improvements

### Day 1-2: Resolve TODOs 📝 MEDIUM

**Estimate:** Variable (4-8 hours)  
**Owner:** TBD  
**Priority:** P2

#### Tasks:
1. **List tất cả TODOs**
   ```bash
   grep -rn "TODO\|FIXME" app/ > todos-list.txt
   ```

2. **Phân loại TODOs**
   - **Implement now**: Critical functionality
   - **Create issue**: Future features
   - **Remove**: Obsolete comments

3. **Xử lý từng loại**

   **A. Implement now (Critical)**
   ```typescript
   // ❌ Before
   function saveDraft() { /* TODO */ }
   
   // ✅ After
   async function saveDraft() {
     try {
       const draft = prepareDraftData()
       await orderService.saveDraft(draft)
       toast.success('Draft saved successfully')
     } catch (error) {
       toast.error('Failed to save draft')
       logger.error('saveDraft error:', error)
     }
   }
   ```

   **B. Create GitHub issues (Future)**
   ```typescript
   // ❌ Before
   // TODO: Implement export functionality
   
   // ✅ After
   // GitHub Issue #456: Implement export functionality
   // Planned for Sprint 23
   ```

   **C. Remove obsolete**
   ```typescript
   // ❌ Before
   // TODO: Fix this later
   const data = processData()
   
   // ✅ After (if already working)
   const data = processData()
   ```

4. **Create GitHub issues**
   - Template:
     ```markdown
     ## Description
     [TODO description]
     
     ## Location
     File: app/pages/orders/create.vue
     Line: 1568
     
     ## Priority
     Medium
     
     ## Estimate
     4 hours
     ```

5. **Commit**
   ```bash
   git add .
   git commit -m "chore: resolve TODOs - implement critical, create issues for future"
   ```

**Success Criteria:**
- ✅ Không còn TODO trong critical paths
- ✅ Future TODOs có GitHub issues
- ✅ Code comments rõ ràng

---

### Day 3: ESLint Auto-fix 🔧 LOW

**Estimate:** 1-2 hours  
**Owner:** TBD  
**Priority:** P3

#### Tasks:
1. **Chạy ESLint auto-fix**
   ```bash
   npm run lint -- --fix
   ```

2. **Review changes**
   ```bash
   git diff
   ```

3. **Fix remaining manual issues**
   - Indentation
   - Spacing
   - Unused imports

4. **Commit**
   ```bash
   git add .
   git commit -m "style: fix ESLint warnings and formatting issues"
   ```

**Success Criteria:**
- ✅ `npm run lint` pass với 0 warnings
- ✅ Code formatting consistent

---

### Day 4-5: Add Quality Gates 🚀 HIGH

**Estimate:** 4-6 hours  
**Owner:** TBD  
**Priority:** P1

#### Tasks:
1. **Add pre-commit hooks**
   ```bash
   npm install --save-dev husky lint-staged
   npx husky install
   ```

   **package.json:**
   ```json
   {
     "lint-staged": {
       "*.{ts,vue,js}": [
         "eslint --fix",
         "git add"
       ]
     }
   }
   ```

   **.husky/pre-commit:**
   ```bash
   #!/bin/sh
   . "$(dirname "$0")/_/husky.sh"
   
   npm run lint-staged
   npm run typecheck
   ```

2. **Update CI/CD pipeline**
   **.github/workflows/ci.yml:**
   ```yaml
   name: CI
   
   on: [push, pull_request]
   
   jobs:
     quality:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v3
         - uses: actions/setup-node@v3
           with:
             node-version: '20'
         
         - name: Install dependencies
           run: npm ci
         
         - name: Lint
           run: npm run lint
         
         - name: Type check
           run: npm run typecheck
         
         - name: Test
           run: npm run test
         
         - name: Build
           run: npm run build
   ```

3. **Add commit message linting**
   ```bash
   npm install --save-dev @commitlint/cli @commitlint/config-conventional
   ```

   **commitlint.config.js:**
   ```javascript
   module.exports = {
     extends: ['@commitlint/config-conventional']
   }
   ```

4. **Test hooks**
   ```bash
   # Make a change
   echo "test" >> test.txt
   git add test.txt
   git commit -m "test: verify pre-commit hooks"
   # Should run lint, typecheck
   ```

5. **Commit**
   ```bash
   git add .
   git commit -m "ci: add pre-commit hooks and quality gates"
   ```

**Success Criteria:**
- ✅ Pre-commit hooks chạy lint + typecheck
- ✅ CI/CD pipeline có quality checks
- ✅ Commit messages follow convention

---

## 📅 Week 3: Testing & Documentation

### Day 1-2: Increase Test Coverage 🧪 MEDIUM

**Estimate:** 8-10 hours  
**Owner:** TBD  
**Priority:** P2

#### Tasks:
1. **Check current coverage**
   ```bash
   npm run test:coverage
   ```

2. **Identify untested critical paths**
   - Service methods
   - Composables
   - Utility functions

3. **Write tests**
   
   **Example: Service test**
   ```typescript
   // app/services/__tests__/product.service.test.ts
   import { describe, it, expect, vi } from 'vitest'
   import { ProductService } from '../product.service'
   
   describe('ProductService', () => {
     it('should fetch products with caching', async () => {
       const service = new ProductService()
       const products = await service.getProducts()
       
       expect(products).toBeDefined()
       expect(Array.isArray(products.data)).toBe(true)
     })
     
     it('should invalidate cache on create', async () => {
       const service = new ProductService()
       const spy = vi.spyOn(service, 'invalidateCache')
       
       await service.createProduct({ name: 'Test' })
       
       expect(spy).toHaveBeenCalledWith('ProductService:GET:/products')
     })
   })
   ```

4. **Run tests**
   ```bash
   npm run test
   npm run test:coverage
   ```

5. **Target: 70%+ coverage**

6. **Commit**
   ```bash
   git add .
   git commit -m "test: increase test coverage to 70%+"
   ```

**Success Criteria:**
- ✅ Test coverage ≥ 70%
- ✅ Critical paths có tests
- ✅ All tests passing

---

### Day 3: Add JSDoc Comments 📚 LOW

**Estimate:** 4-6 hours  
**Owner:** TBD  
**Priority:** P3

#### Tasks:
1. **Add JSDoc to public APIs**
   
   **Example:**
   ```typescript
   /**
    * Fetch products with caching support
    * 
    * @param options - Query options for filtering and pagination
    * @param options.search - Search term
    * @param options.categoryId - Filter by category
    * @returns Promise resolving to products array
    * @throws {Error} If network request fails
    * 
    * @example
    * ```typescript
    * const products = await productService.getProducts({
    *   search: 'laptop',
    *   categoryId: 123
    * })
    * ```
    */
   async getProducts(options?: QueryOptions): Promise<ApiResponse<Product[]>> {
     return this.getCached('/products', options, 5 * 60 * 1000)
   }
   ```

2. **Focus on:**
   - Service methods
   - Composables
   - Utility functions
   - Complex components

3. **Commit**
   ```bash
   git add .
   git commit -m "docs: add JSDoc comments to public APIs"
   ```

**Success Criteria:**
- ✅ Public APIs có JSDoc
- ✅ Examples included
- ✅ Parameters documented

---

### Day 4-5: Final Review & Testing 🎉

**Estimate:** 4-6 hours  
**Owner:** TBD  
**Priority:** P1

#### Tasks:
1. **Run full test suite**
   ```bash
   npm run lint
   npm run typecheck
   npm run test:coverage
   npm run build
   ```

2. **Manual testing**
   - Test critical user flows
   - Check console for errors
   - Verify performance

3. **Performance testing**
   ```bash
   npx lighthouse http://localhost:3000 --view
   ```

4. **Security audit**
   ```bash
   npm audit
   npm audit fix
   ```

5. **Update documentation**
   - Update PROJECT_AUDIT_REPORT.md
   - Update CHANGELOG.md
   - Update README.md

6. **Create release**
   ```bash
   git tag -a v2.0.0 -m "Code quality improvements - 10/10 score"
   git push origin v2.0.0
   ```

**Success Criteria:**
- ✅ All tests passing
- ✅ Lint + typecheck passing
- ✅ Build successful
- ✅ Performance metrics maintained
- ✅ Documentation updated

---

## 📊 Success Metrics

### Before (Current State)
- Code Quality Score: **8.5/10**
- Console.log: **50+**
- Any types: **100+**
- TODOs: **25+**
- TypeCheck: **FAILING**
- Test Coverage: **~60%**

### After (Target State)
- Code Quality Score: **10/10** ⭐⭐⭐⭐⭐
- Console.log: **0** (except logger files)
- Any types: **<20** (only in decorators)
- TODOs: **0** (all resolved or tracked)
- TypeCheck: **PASSING**
- Test Coverage: **≥70%**

---

## 🎯 Checklist

### Week 1
- [ ] Day 1-2: Console.log cleanup
- [ ] Day 3-4: Fix TypeScript errors
- [ ] Day 5: Replace any types

### Week 2
- [ ] Day 1-2: Resolve TODOs
- [ ] Day 3: ESLint auto-fix
- [ ] Day 4-5: Add quality gates

### Week 3
- [ ] Day 1-2: Increase test coverage
- [ ] Day 3: Add JSDoc comments
- [ ] Day 4-5: Final review & testing

---

## 📞 Support

**Questions?** Contact:
- Tech Lead: [Name]
- DevOps: [Name]
- QA Lead: [Name]

**Resources:**
- [PROJECT_AUDIT_REPORT.md](./PROJECT_AUDIT_REPORT.md)
- [CODE_QUALITY_CHECKLIST.md](./CODE_QUALITY_CHECKLIST.md)
- [PERFORMANCE_BEST_PRACTICES.md](./PERFORMANCE_BEST_PRACTICES.md)

---

**Let's achieve 10/10!** 🚀
