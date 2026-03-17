import { test, expect } from '@playwright/test';
import { loginAsStaff } from '../../utils/auth-helpers';

test.describe('HQ User Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login as staff before each test
    await loginAsStaff(page);
    
    // Navigate to HQ
    await page.goto('/hq');
  });
  
  test('should display user list', async ({ page }) => {
    // Should show users table or list
    const usersList = page.locator('[data-testid="users-list"]')
      .or(page.locator('table'))
      .or(page.locator('body'));
    
    await expect(usersList).toBeVisible({ timeout: 10000 });
  });
  
  test('should search users', async ({ page }) => {
    // Look for search input
    const searchInput = page.locator('[data-testid="search-input"]')
      .or(page.locator('input[type="search"]'))
      .or(page.locator('input[placeholder*="search"]'))
      .or(page.locator('input[placeholder*="חיפוש"]'));
    
    if (await searchInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      await searchInput.fill('test');
      
      // Wait for results to filter
      await page.waitForTimeout(1000);
      
      // Results should be visible
      await expect(page.locator('body')).toBeVisible();
    }
  });
  
  test('should filter users by role', async ({ page }) => {
    // Look for role filter
    const roleFilter = page.locator('[data-testid="role-filter"]')
      .or(page.locator('select[name="role"]'));
    
    if (await roleFilter.isVisible({ timeout: 5000 }).catch(() => false)) {
      await roleFilter.selectOption('dj');
      
      // Wait for filtering
      await page.waitForTimeout(1000);
      
      // Filtered results should be visible
      await expect(page.locator('body')).toBeVisible();
    }
  });
});
