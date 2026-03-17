import { test, expect } from '@playwright/test';
import { mockDJ } from '../../fixtures/mock-users';
import { loginAsDJ } from '../../utils/auth-helpers';

test.describe('DJ Authentication', () => {
  test('should login successfully with valid credentials', async ({ page }) => {
    await page.goto('/admin');
    
    // Fill email
    await page.fill('[data-testid="email-input"]', mockDJ.email);
    
    // Fill password
    await page.fill('[data-testid="password-input"]', mockDJ.password);
    
    // Click login
    await page.click('[data-testid="login-button"]');
    
    // Should redirect to dashboard
    await expect(page).toHaveURL(/.*admin/);
    
    // Dashboard should be visible
    await expect(page.locator('[data-testid="dashboard"]')).toBeVisible({ timeout: 10000 });
  });
  
  test('should show error with invalid credentials', async ({ page }) => {
    await page.goto('/admin');
    
    await page.fill('[data-testid="email-input"]', 'wrong@email.com');
    await page.fill('[data-testid="password-input"]', 'wrongpassword');
    await page.click('[data-testid="login-button"]');
    
    // Should show error message
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible({ timeout: 5000 });
  });
  
  test('should validate required fields', async ({ page }) => {
    await page.goto('/admin');
    
    // Try to login without filling fields
    await page.click('[data-testid="login-button"]');
    
    // Should show validation errors
    const emailError = page.locator('[data-testid="email-error"]');
    const passwordError = page.locator('[data-testid="password-error"]');
    
    await expect(emailError.or(passwordError)).toBeVisible({ timeout: 5000 });
  });
});
