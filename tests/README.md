# Compakt Test Suite

מערכת טסטים אוטומטיים חכמה עם Playwright.

## 🚀 Quick Start

### הרצת כל הטסטים
```bash
npm run test:e2e
```

### הרצת smoke tests בלבד (מהיר)
```bash
npm run test:smoke
```

### הרצה במצב UI (לדיבאג)
```bash
npm run test:e2e:ui
```

### הרצה במצב debug
```bash
npm run test:debug
```

---

## 📁 מבנה התיקיות

```
tests/
├── e2e/                    # End-to-end tests
│   ├── auth/              # Authentication tests
│   ├── dj/                # DJ flow tests
│   ├── couple/            # Couple flow tests
│   ├── hq/                # HQ admin tests
│   └── smoke/             # Smoke tests (critical paths)
├── fixtures/              # Test data
│   └── mock-users.ts      # Mock users and data
└── utils/                 # Test utilities
    ├── smart-selectors.ts # Smart selector helpers
    └── auth-helpers.ts    # Authentication helpers
```

---

## 🎭 Mock Data

כל הטסטים משתמשים ב-**mock data** - אין צורך בהקמה ידנית!

### משתמשים מזויפים
```typescript
// DJ
email: 'test-dj@compakt.test'
password: 'TestPassword123!'

// Couple
email: 'couple@compakt.test'
otp: '123456' (תמיד עובד בטסטים)

// Staff
email: 'staff@compakt.test'
password: 'StaffPassword123!'
```

---

## 🛠️ כתיבת טסטים חדשים

### 1. צור קובץ חדש
```bash
tests/e2e/[category]/my-test.spec.ts
```

### 2. השתמש ב-helpers
```typescript
import { test, expect } from '@playwright/test';
import { loginAsDJ } from '../../utils/auth-helpers';
import { clickWithRetry, fillFieldWithRetry } from '../../utils/smart-selectors';

test('my test', async ({ page }) => {
  await loginAsDJ(page);
  
  await clickWithRetry(page, 'my-button');
  await fillFieldWithRetry(page, 'my-input', 'value');
  
  await expect(page.locator('[data-testid="result"]')).toBeVisible();
});
```

### 3. הוסף data-testid לאלמנטים חדשים
```tsx
<button data-testid="my-button">Click me</button>
<input data-testid="my-input" />
```

---

## 🎯 Smart Selectors

הטסטים משתמשים באסטרטגיית selectors חכמה:

1. **Level 1**: `data-testid` (הכי יציב)
2. **Level 2**: role + accessible name (סמנטי)
3. **Level 3**: text content (אחרון)

```typescript
// טוב ביותר
await page.click('[data-testid="submit-button"]');

// גם טוב
await page.getByRole('button', { name: 'Submit' }).click();

// אחרון
await page.getByText('Submit').click();
```

---

## 🔄 Retry Logic

כל הפעולות עם retry אוטומטי:

```typescript
// Auto-retry על click
await clickWithRetry(page, 'button-id');

// Auto-retry על fill
await fillFieldWithRetry(page, 'input-id', 'value');

// Smart wait עם fallback
await smartWait(page, 'element-id', {
  role: 'button',
  name: /submit/i
});
```

---

## 🐛 דיבאג טסטים נכשלים

### 1. הרץ במצב UI
```bash
npm run test:e2e:ui
```

### 2. בדוק screenshots
```bash
test-results/
└── [test-name]/
    └── screenshot.png
```

### 3. הרץ טסט ספציפי
```bash
npx playwright test tests/e2e/auth/dj-login.spec.ts
```

### 4. הרץ עם headed mode
```bash
npx playwright test --headed
```

---

## 📊 Test Reports

אחרי הרצה, פתח את הדוח:
```bash
npx playwright show-report
```

---

## ✅ Best Practices

### Do's
- ✅ תמיד הוסף `data-testid` לאלמנטים חשובים
- ✅ השתמש ב-mock data
- ✅ כתוב טסטים קריאים
- ✅ השתמש ב-helpers
- ✅ בדוק על mobile

### Don'ts
- ❌ אל תסמוך על timeouts קבועים
- ❌ אל תשתמש ב-class names כ-selectors
- ❌ אל תכתוב טסטים תלויים זה בזה
- ❌ אל תשכח screenshots

---

## 🎯 Smoke Tests

הטסטים הקריטיים ביותר (Top 5):

1. DJ can login
2. Public event link opens
3. Health check responds
4. Homepage loads
5. Admin page requires auth

הרץ אותם לפני כל commit:
```bash
npm run test:smoke
```

---

## 🚀 CI/CD

הטסטים רצים אוטומטית ב-GitHub Actions על כל PR.

ראה: `.github/workflows/playwright-tests.yml`

---

## 💡 Tips

### מהיר יותר
- הרץ רק smoke tests לפני commit
- הרץ full suite לפני push
- השתמש ב-`--headed` רק לדיבאג

### יציב יותר
- השתמש ב-`data-testid`
- השתמש ב-retry helpers
- המתן לאלמנטים במקום timeouts

### קל יותר לתחזוקה
- שמור helpers ב-`utils/`
- שמור mock data ב-`fixtures/`
- כתוב טסטים קריאים

---

## 📚 Resources

- [Playwright Docs](https://playwright.dev)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [Selectors](https://playwright.dev/docs/selectors)
- [Assertions](https://playwright.dev/docs/test-assertions)

---

**עודכן**: ${new Date().toISOString().split('T')[0]}
