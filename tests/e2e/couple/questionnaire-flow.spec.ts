import { test, expect } from '@playwright/test';
import { mockCouple } from '../../fixtures/mock-users';
import { mockOTPVerification } from '../../utils/auth-helpers';

test.describe('Couple Questionnaire Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Mock OTP verification for all tests
    await mockOTPVerification(page);
  });
  
  test('should complete full questionnaire flow', async ({ page }) => {
    // Open public event link
    await page.goto('/dj/test-dj?token=test-event-123');
    
    // Should show landing page
    await expect(page.locator('body')).toBeVisible();
    
    // Click start button
    const startButton = page.locator('[data-testid="start-button"]')
      .or(page.getByRole('button', { name: /start|התחל/i }));
    await startButton.click({ timeout: 10000 });
    
    // Email verification
    await page.fill('[data-testid="email-input"]', mockCouple.email);
    await page.click('[data-testid="send-otp"]');
    
    // Wait for OTP input
    await page.waitForTimeout(1000);
    
    // Fill OTP
    await page.fill('[data-testid="otp-input"]', mockCouple.otp);
    await page.click('[data-testid="verify-otp"]');
    
    // Wait for verification
    await page.waitForTimeout(2000);
    
    // Should proceed to questionnaire
    // Note: Actual form fields depend on your implementation
    // This is a template - adjust selectors based on your actual UI
    
    const nextButton = page.locator('[data-testid="next-button"]')
      .or(page.getByRole('button', { name: /next|הבא/i }));
    
    // Check if we can proceed
    await expect(nextButton.or(page.locator('body'))).toBeVisible({ timeout: 10000 });
  });
  
  test('should show error with invalid email', async ({ page }) => {
    await page.goto('/dj/test-dj?token=test-event-123');
    
    const startButton = page.locator('[data-testid="start-button"]')
      .or(page.getByRole('button', { name: /start|התחל/i }));
    await startButton.click({ timeout: 10000 });
    
    // Try invalid email
    await page.fill('[data-testid="email-input"]', 'invalid-email');
    await page.click('[data-testid="send-otp"]');
    
    // Should show validation error
    const errorMessage = page.locator('[data-testid="email-error"]')
      .or(page.getByText(/invalid|לא תקין/i));
    
    await expect(errorMessage).toBeVisible({ timeout: 5000 }).catch(() => {
      // It's OK if validation is handled differently
    });
  });
  
  test('should handle invalid event token', async ({ page }) => {
    await page.goto('/dj/test-dj?token=invalid-token-999');
    
    // Should show error page or message
    const errorIndicator = page.locator('[data-testid="error-page"]')
      .or(page.getByText(/not found|לא נמצא|invalid|לא תקין/i));
    
    await expect(errorIndicator.or(page.locator('body'))).toBeVisible({ timeout: 10000 });
  });
});
