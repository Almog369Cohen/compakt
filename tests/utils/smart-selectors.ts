import { Page, Locator } from '@playwright/test';

/**
 * Smart selector utilities with multi-strategy fallback
 * Tries data-testid first, then role, then text
 */

export async function smartWait(
  page: Page,
  testId: string,
  options?: {
    role?: string;
    name?: string | RegExp;
    text?: string | RegExp;
    timeout?: number;
  }
): Promise<Locator> {
  const timeout = options?.timeout || 10000;
  
  // Strategy 1: data-testid (most stable)
  try {
    const element = page.locator(`[data-testid="${testId}"]`);
    await element.waitFor({ timeout: 5000 });
    return element;
  } catch (e) {
    // Continue to next strategy
  }
  
  // Strategy 2: role + accessible name (semantic)
  if (options?.role && options?.name) {
    try {
      const element = page.getByRole(options.role as any, { name: options.name });
      await element.waitFor({ timeout: 5000 });
      return element;
    } catch (e) {
      // Continue to next strategy
    }
  }
  
  // Strategy 3: text content (last resort)
  if (options?.text) {
    try {
      const element = page.getByText(options.text);
      await element.waitFor({ timeout: 5000 });
      return element;
    } catch (e) {
      // All strategies failed
    }
  }
  
  throw new Error(`Element not found with testId: ${testId}`);
}

export async function clickWithRetry(
  page: Page,
  testId: string,
  options?: {
    role?: string;
    name?: string | RegExp;
    text?: string | RegExp;
    maxRetries?: number;
  }
): Promise<void> {
  const maxRetries = options?.maxRetries || 3;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      const element = await smartWait(page, testId, options);
      await element.click();
      return;
    } catch (e) {
      if (i === maxRetries - 1) throw e;
      await page.waitForTimeout(1000);
    }
  }
}

export async function fillFieldWithRetry(
  page: Page,
  testId: string,
  value: string,
  options?: {
    role?: string;
    name?: string | RegExp;
    maxRetries?: number;
  }
): Promise<void> {
  const maxRetries = options?.maxRetries || 3;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      const element = await smartWait(page, testId, options);
      await element.fill(value);
      return;
    } catch (e) {
      if (i === maxRetries - 1) throw e;
      await page.waitForTimeout(1000);
    }
  }
}

export async function waitForNavigation(
  page: Page,
  urlPattern: string | RegExp,
  timeout: number = 10000
): Promise<void> {
  await page.waitForURL(urlPattern, { timeout });
}

export async function waitForElement(
  page: Page,
  selector: string,
  options?: {
    state?: 'attached' | 'detached' | 'visible' | 'hidden';
    timeout?: number;
  }
): Promise<void> {
  await page.locator(selector).waitFor({
    state: options?.state || 'visible',
    timeout: options?.timeout || 10000,
  });
}
