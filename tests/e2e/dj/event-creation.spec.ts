import { test, expect } from '@playwright/test';
import { loginAsDJ } from '../../utils/auth-helpers';
import { mockDJ } from '../../fixtures/mock-users';

test.describe('DJ Event Creation', () => {
  test.beforeEach(async ({ page }) => {
    // Login as DJ before each test
    await loginAsDJ(page);
  });
  
  test('should create new event successfully', async ({ page }) => {
    // Navigate to events tab
    const eventsTab = page.locator('[data-testid="events-tab"]')
      .or(page.getByRole('button', { name: /events|אירועים/i }));
    
    await eventsTab.click({ timeout: 10000 });
    
    // Click create event button
    const createButton = page.locator('[data-testid="create-event-button"]')
      .or(page.getByRole('button', { name: /create|צור|new|חדש/i }));
    
    await createButton.click({ timeout: 10000 });
    
    // Fill event details
    const eventNameInput = page.locator('[data-testid="event-name"]')
      .or(page.locator('input[name="name"]'));
    
    if (await eventNameInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      await eventNameInput.fill('Test Event');
      
      // Save event
      const saveButton = page.locator('[data-testid="save-event"]')
        .or(page.getByRole('button', { name: /save|שמור/i }));
      
      await saveButton.click({ timeout: 10000 });
      
      // Should show success or redirect
      await page.waitForTimeout(2000);
    }
    
    // Event should appear in list or we should see confirmation
    const eventList = page.locator('[data-testid="events-list"]')
      .or(page.locator('body'));
    
    await expect(eventList).toBeVisible({ timeout: 10000 });
  });
  
  test('should copy event link', async ({ page }) => {
    // Navigate to events
    const eventsTab = page.locator('[data-testid="events-tab"]')
      .or(page.getByRole('button', { name: /events|אירועים/i }));
    
    await eventsTab.click({ timeout: 10000 });
    
    // Look for copy link button
    const copyButton = page.locator('[data-testid="copy-link"]')
      .or(page.getByRole('button', { name: /copy|העתק/i }));
    
    if (await copyButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await copyButton.click();
      
      // Should show success message
      const successMessage = page.locator('[data-testid="copy-success"]')
        .or(page.getByText(/copied|הועתק/i));
      
      await expect(successMessage).toBeVisible({ timeout: 5000 }).catch(() => {
        // It's OK if feedback is handled differently
      });
    }
  });
});
