import { Page } from '@playwright/test';
import { mockDJ, mockCouple, mockStaff } from '../fixtures/mock-users';
import { clickWithRetry, fillFieldWithRetry, waitForNavigation } from './smart-selectors';

/**
 * Authentication helpers for tests
 */

export async function loginAsDJ(page: Page, credentials = mockDJ): Promise<void> {
  await page.goto('/admin');

  await fillFieldWithRetry(page, 'email-input', credentials.email, {
    role: 'textbox',
    name: /email/i,
  });

  await fillFieldWithRetry(page, 'password-input', credentials.password, {
    role: 'textbox',
    name: /password/i,
  });

  await clickWithRetry(page, 'login-button', {
    role: 'button',
    name: /login|התחבר/i,
  });

  await waitForNavigation(page, /.*admin/);
}

export async function loginAsStaff(page: Page): Promise<void> {
  await page.goto('/admin');

  await fillFieldWithRetry(page, 'email-input', mockStaff.email);
  await fillFieldWithRetry(page, 'password-input', mockStaff.password);
  await clickWithRetry(page, 'login-button');

  await waitForNavigation(page, /.*admin/);
}

export async function verifyEmailOTP(
  page: Page,
  email: string = mockCouple.email,
  otp: string = mockCouple.otp
): Promise<void> {
  // Fill email
  await fillFieldWithRetry(page, 'email-input', email, {
    role: 'textbox',
    name: /email|מייל/i,
  });

  // Click send OTP
  await clickWithRetry(page, 'send-otp', {
    role: 'button',
    name: /send|שלח/i,
  });

  // Wait for OTP input to appear
  await page.waitForTimeout(1000);

  // Fill OTP
  await fillFieldWithRetry(page, 'otp-input', otp, {
    role: 'textbox',
    name: /code|קוד/i,
  });

  // Click verify
  await clickWithRetry(page, 'verify-otp', {
    role: 'button',
    name: /verify|אמת/i,
  });

  // Wait for verification
  await page.waitForTimeout(1000);
}

export async function logout(page: Page): Promise<void> {
  await clickWithRetry(page, 'logout-button', {
    role: 'button',
    name: /logout|התנתק/i,
  });

  await waitForNavigation(page, /.*admin|.*login/);
}

/**
 * Mock API routes for testing
 */
export async function mockOTPVerification(page: Page): Promise<void> {
  // Intercept OTP send request
  await page.route('**/api/auth/email/send-otp', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true }),
    });
  });

  // Intercept OTP verify request
  await page.route('**/api/auth/email/verify-otp', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        verified: true,
        token: 'mock-session-token',
      }),
    });
  });
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(page: Page): Promise<boolean> {
  const url = page.url();
  return !url.includes('/admin') || url.includes('/admin/dashboard');
}
