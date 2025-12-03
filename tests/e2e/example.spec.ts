import { test, expect } from '@playwright/test'

/**
 * Example E2E tests
 * These tests run in a real browser and test the full application flow
 */

test.describe('Authentication Flow', () => {
  test('should display login page', async ({ page }) => {
    await page.goto('/login')
    
    // Check page title
    await expect(page).toHaveTitle(/Zen Dashboard/)
    
    // Check login form elements
    await expect(page.getByLabel(/email/i)).toBeVisible()
    await expect(page.getByLabel(/password/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /login/i })).toBeVisible()
  })

  test('should show validation errors for empty form', async ({ page }) => {
    await page.goto('/login')
    
    // Click login without filling form
    await page.getByRole('button', { name: /login/i }).click()
    
    // Should show validation errors
    await expect(page.getByText(/email.*required/i)).toBeVisible()
    await expect(page.getByText(/password.*required/i)).toBeVisible()
  })

  test('should login successfully with valid credentials', async ({ page }) => {
    await page.goto('/login')
    
    // Fill login form
    await page.getByLabel(/email/i).fill('test@example.com')
    await page.getByLabel(/password/i).fill('password123')
    
    // Submit form
    await page.getByRole('button', { name: /login/i }).click()
    
    // Should redirect to dashboard
    await expect(page).toHaveURL(/\/dashboard/)
  })
})

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login')
    await page.getByLabel(/email/i).fill('test@example.com')
    await page.getByLabel(/password/i).fill('password123')
    await page.getByRole('button', { name: /login/i }).click()
    await page.waitForURL(/\/dashboard/)
  })

  test('should display dashboard widgets', async ({ page }) => {
    // Check for dashboard elements
    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible()
    
    // Check for stats cards (adjust selectors based on your UI)
    const statsCards = page.locator('[data-testid="stats-card"]')
    await expect(statsCards).toHaveCount(4)
  })

  test('should navigate to products page', async ({ page }) => {
    // Click products link in sidebar
    await page.getByRole('link', { name: /products/i }).click()
    
    // Should navigate to products page
    await expect(page).toHaveURL(/\/products/)
    await expect(page.getByRole('heading', { name: /products/i })).toBeVisible()
  })
})

test.describe('Products Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login and navigate to products
    await page.goto('/login')
    await page.getByLabel(/email/i).fill('test@example.com')
    await page.getByLabel(/password/i).fill('password123')
    await page.getByRole('button', { name: /login/i }).click()
    await page.waitForURL(/\/dashboard/)
    await page.getByRole('link', { name: /products/i }).click()
  })

  test('should display products list', async ({ page }) => {
    // Check products table
    await expect(page.getByRole('table')).toBeVisible()
    
    // Check for at least one product row
    const productRows = page.locator('tbody tr')
    await expect(productRows.first()).toBeVisible()
  })

  test('should open create product modal', async ({ page }) => {
    // Click add product button
    await page.getByRole('button', { name: /add product/i }).click()
    
    // Modal should be visible
    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(page.getByRole('heading', { name: /create product/i })).toBeVisible()
  })

  test('should search products', async ({ page }) => {
    // Type in search box
    await page.getByPlaceholder(/search/i).fill('test product')
    
    // Wait for search results
    await page.waitForTimeout(500)
    
    // Results should be filtered
    const productRows = page.locator('tbody tr')
    await expect(productRows).toHaveCount(1)
  })
})

test.describe('Performance', () => {
  test('should load dashboard within 3 seconds', async ({ page }) => {
    const startTime = Date.now()
    
    await page.goto('/login')
    await page.getByLabel(/email/i).fill('test@example.com')
    await page.getByLabel(/password/i).fill('password123')
    await page.getByRole('button', { name: /login/i }).click()
    await page.waitForURL(/\/dashboard/)
    
    const loadTime = Date.now() - startTime
    
    expect(loadTime).toBeLessThan(3000)
  })

  test('should have good Core Web Vitals', async ({ page }) => {
    await page.goto('/')
    
    // Measure performance metrics
    const metrics = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
      return {
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
        firstPaint: performance.getEntriesByName('first-paint')[0]?.startTime || 0
      }
    })
    
    // Assert performance thresholds
    expect(metrics.domContentLoaded).toBeLessThan(1000) // < 1s
    expect(metrics.loadComplete).toBeLessThan(2000) // < 2s
    expect(metrics.firstPaint).toBeLessThan(1500) // < 1.5s
  })
})
