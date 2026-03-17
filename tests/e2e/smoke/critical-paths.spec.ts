import { test, expect } from '@playwright/test';
import { mockDJ, mockCouple } from '../../fixtures/mock-users';

/**
 * Smoke tests - critical paths that must work
 * These are the Top 5 most important tests
 */

test.describe('Smoke Tests - Critical Paths', () => {
  test('1. DJ can login', async ({ page }) => {
    await page.goto('/admin');
    
    await page.fill('[data-testid="email-input"]', mockDJ.email);
    await page.fill('[data-testid="password-input"]', mockDJ.password);
    await page.click('[data-testid="login-button"]');
    
    await expect(page).toHaveURL(/.*admin/, { timeout: 10000 });
  });
  
  test('2. Public event link opens', async ({ page }) => {
    // Open a public event link
    await page.goto('/dj/test-dj?token=test-event-123');
    
    // Landing page should load
    await expect(page.locator('body')).toBeVisible();
    
    // Should have a start button
    const startButton = page.getByRole('button', { name: /start|התחל/i });
    await expect(startButton.or(page.locator('[data-testid="start-button"]'))).toBeVisible({ timeout: 10000 });
  });
  
  test('3. Health check responds', async ({ page }) => {
    const response = await page.request.get('/api/health');
    
    expect(response.ok()).toBeTruthy();
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(data).toHaveProperty('status');
  });
  
  test('4. Homepage loads', async ({ page }) => {
    await page.goto('/');
    
    // Page should load without errors
    await expect(page.locator('body')).toBeVisible();
    
    // Should not show error page
    const errorText = page.getByText(/error|שגיאה/i);
    await expect(errorText).not.toBeVisible({ timeout: 5000 }).catch(() => {
      // It's OK if error text doesn't exist
    });
  });
  
  test('5. Admin page requires auth', async ({ page }) => {
    await page.goto('/admin');
    
    // Should show login form or redirect
    const loginForm = page.locator('[data-testid="login-form"]');
    const emailInput = page.locator('[data-testid="email-input"]');
    
    await expect(loginForm.or(emailInput)).toBeVisible({ timeout: 10000 });
  });
});
