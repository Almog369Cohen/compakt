# מדריך להוספת data-testid - Compakt

מדריך מהיר להוספת data-testid attributes לקומפוננטות קריטיות.

---

## 🎯 למה data-testid?

- ✅ **יציב** - לא משתנה כשמשנים CSS
- ✅ **ברור** - קל למצוא בטסטים
- ✅ **מהיר** - Playwright מוצא מהר
- ✅ **תחזוקה** - קל לעדכן

---

## 📋 רשימת קומפוננטות קריטיות

### 1. Authentication (דף התחברות)
**קובץ**: `src/app/admin/page.tsx`

```tsx
// Login form
<form data-testid="login-form">
  <input 
    data-testid="email-input"
    type="email"
    placeholder="Email"
  />
  <input 
    data-testid="password-input"
    type="password"
    placeholder="Password"
  />
  <button data-testid="login-button">
    Login
  </button>
  <div data-testid="error-message">
    {error}
  </div>
</form>
```

---

### 2. DJ Dashboard
**קובץ**: `src/app/admin/page.tsx`

```tsx
// Dashboard
<div data-testid="dashboard">
  <button data-testid="events-tab">Events</button>
  <button data-testid="couples-tab">Couples</button>
  <button data-testid="profile-tab">Profile</button>
  <button data-testid="logout-button">Logout</button>
</div>
```

---

### 3. Event Creation
**קובץ**: `src/components/admin/EventsManager.tsx`

```tsx
// Events list
<div data-testid="events-list">
  {events.map(event => (
    <div key={event.id} data-testid={`event-${event.id}`}>
      <button data-testid="copy-link">Copy Link</button>
      <button data-testid="edit-event">Edit</button>
      <button data-testid="delete-event">Delete</button>
    </div>
  ))}
</div>

// Create event button
<button data-testid="create-event-button">
  Create Event
</button>

// Event form
<form data-testid="event-form">
  <input data-testid="event-name" />
  <input data-testid="event-date" />
  <button data-testid="save-event">Save</button>
</form>
```

---

### 4. Couple Questionnaire
**קובץ**: `src/components/journey/JourneyApp.tsx`

```tsx
// Landing page
<div data-testid="landing-page">
  <button data-testid="start-button">Start</button>
  <button data-testid="resume-button">Resume</button>
</div>

// Email gate
<div data-testid="email-gate">
  <input data-testid="email-input" />
  <button data-testid="send-otp">Send Code</button>
  <input data-testid="otp-input" />
  <button data-testid="verify-otp">Verify</button>
  <div data-testid="email-error">{error}</div>
</div>

// Questionnaire
<div data-testid="questionnaire">
  <button data-testid="next-button">Next</button>
  <button data-testid="prev-button">Previous</button>
  <button data-testid="save-button">Save</button>
  <button data-testid="submit-button">Submit</button>
</div>

// Success page
<div data-testid="success-page">
  <div data-testid="success-message">Success!</div>
</div>
```

---

### 5. HQ Admin Panel
**קובץ**: `src/app/hq/page.tsx`

```tsx
// HQ Dashboard
<div data-testid="hq-dashboard">
  <input data-testid="search-input" />
  <select data-testid="role-filter" />
  <select data-testid="plan-filter" />
  <button data-testid="export-csv">Export CSV</button>
</div>

// Users list
<div data-testid="users-list">
  {users.map(user => (
    <div key={user.id} data-testid={`user-${user.id}`}>
      <input 
        type="checkbox" 
        data-testid={`user-checkbox-${user.id}`}
      />
    </div>
  ))}
</div>

// Bulk actions
<div data-testid="bulk-actions">
  <select data-testid="bulk-action-select" />
  <button data-testid="bulk-action-apply">Apply</button>
</div>
```

---

## 🎨 Naming Conventions

### Do's ✅
```tsx
// Good - descriptive and clear
data-testid="email-input"
data-testid="submit-button"
data-testid="error-message"
data-testid="user-list"

// Good - with ID for dynamic items
data-testid={`event-${event.id}`}
data-testid={`user-checkbox-${user.id}`}
```

### Don'ts ❌
```tsx
// Bad - too generic
data-testid="button"
data-testid="input"
data-testid="div"

// Bad - using classes
data-testid="btn-primary"
data-testid="form-control"

// Bad - too specific
data-testid="submit-button-on-page-3-step-2"
```

---

## 📝 Quick Reference

### Buttons
```tsx
<button data-testid="[action]-button">
  {/* login-button, submit-button, save-button */}
</button>
```

### Inputs
```tsx
<input data-testid="[field]-input">
  {/* email-input, password-input, name-input */}
</input>
```

### Forms
```tsx
<form data-testid="[name]-form">
  {/* login-form, event-form, profile-form */}
</form>
```

### Lists
```tsx
<div data-testid="[items]-list">
  {/* users-list, events-list, songs-list */}
</div>
```

### Messages
```tsx
<div data-testid="[type]-message">
  {/* error-message, success-message, warning-message */}
</div>
```

---

## 🚀 Implementation Checklist

### Phase 1: Critical (עכשיו)
- [ ] Login form (`src/app/admin/page.tsx`)
- [ ] Email OTP gate (`src/components/auth/EmailGate.tsx`)
- [ ] Start button (`src/components/journey/LandingHome.tsx`)
- [ ] Submit button (`src/components/journey/JourneyApp.tsx`)
- [ ] Dashboard tabs (`src/app/admin/page.tsx`)

### Phase 2: Important (השבוע)
- [ ] Event creation (`src/components/admin/EventsManager.tsx`)
- [ ] Event list (`src/components/admin/EventsManager.tsx`)
- [ ] Copy link button
- [ ] HQ search (`src/app/hq/page.tsx`)
- [ ] HQ filters

### Phase 3: Nice to Have (בהזדמנות)
- [ ] All other buttons
- [ ] All other inputs
- [ ] All other forms
- [ ] Error states
- [ ] Loading states

---

## 💡 Tips

1. **Start with critical paths** - Login, Submit, Start
2. **Add as you go** - כל feature חדש = data-testid חדש
3. **Be consistent** - השתמש באותן conventions
4. **Document** - רשום איפה הוספת
5. **Test** - הרץ טסטים אחרי הוספה

---

## 🔍 Finding Missing data-testid

הרץ טסט ותראה איפה הוא נכשל:
```bash
npm run test:e2e:ui
```

הטסט יראה לך בדיוק איזה selector לא נמצא.

---

## ✅ Verification

אחרי הוספה, וודא:
```bash
# Run smoke tests
npm run test:smoke

# Should pass!
```

---

**עודכן**: ${new Date().toISOString().split('T')[0]}
