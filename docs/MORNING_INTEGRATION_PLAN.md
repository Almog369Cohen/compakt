# תוכנית אינטגרציה עם Morning - סליקה ומנויים

## 📋 סיכום מצב

**יש לך:** חשבון Morning קיים  
**צריך:** לסלוק תשלומים ולנהל מנויים דרך Compakt

---

## ✅ תשובות לשאלות שלך:

### 1. **האם אפשר לעשות סליקה דרך Morning?**

**כן! 100%** - Morning תומך בסליקת אשראי מלאה.

**מה יש ב-Morning:**
- ✅ API מלא לסליקת אשראי
- ✅ Webhooks לעדכונים בזמן אמת
- ✅ דפי תשלום מוכנים (Payment Pages)
- ✅ אינטגרציה עם אתרים חיצוניים
- ✅ תמיכה במנויים חוזרים

**אז כן - לא צריך עוד אתר לסליקה!**

---

### 2. **איך מקשרים מי שרכש מנוי לאפליקציה?**

יש **2 דרכים** לעשות את זה:

---

## 🎯 אופציה 1: דף תשלום של Morning (הכי פשוט!)

### איך זה עובד:

```
1. משתמש נרשם ל-Compakt
   ↓
2. בוחר Premium Trial
   ↓
3. מועבר לדף תשלום של Morning
   ↓
4. משלם בכרטיס אשראי
   ↓
5. Morning שולח Webhook ל-Compakt
   ↓
6. Compakt מעדכן את המשתמש ל-Premium
```

### יתרונות:
- ✅ **אפס פיתוח** - Morning מטפל בהכל
- ✅ **PCI compliant** - אין צורך בהסמכה
- ✅ **דף תשלום מוכן** - עיצוב מקצועי
- ✅ **מנויים אוטומטיים** - חיוב חודשי אוטומטי

### חסרונות:
- ❌ המשתמש יוצא מהאתר שלך
- ❌ פחות שליטה על העיצוב

---

## 🎯 אופציה 2: API של Morning (שליטה מלאה)

### איך זה עובד:

```
1. משתמש נרשם ל-Compakt
   ↓
2. בוחר Premium Trial
   ↓
3. ממלא פרטי כרטיס אשראי ב-Compakt
   ↓
4. Compakt שולח ל-Morning API
   ↓
5. Morning מחזיר אישור
   ↓
6. Compakt מעדכן את המשתמש ל-Premium
```

### יתרונות:
- ✅ **חוויה חלקה** - המשתמש נשאר באתר
- ✅ **שליטה מלאה** - עיצוב משלך
- ✅ **UX טוב יותר** - ללא redirect

### חסרונות:
- ❌ **דורש פיתוח** - צריך לבנות UI
- ❌ **PCI compliance** - צריך להיות זהיר
- ❌ **יותר מורכב** - יותר קוד

---

## 💡 המלצה שלי: **אופציה 1** (דף תשלום של Morning)

**למה?**
1. **מהיר ליישום** - שבוע לכל היותר
2. **בטוח** - Morning מטפל בכל האבטחה
3. **אמין** - Morning עושה את זה כבר לאלפי עסקים
4. **פחות תחזוקה** - אין צורך לטפל בבאגים

**אחר כך:** אם תרצה, אפשר לעבור לאופציה 2 כשיהיה יותר זמן.

---

## 🔧 איך מיישמים את זה (אופציה 1):

### שלב 1: הגדרה ב-Morning

1. **התחבר ל-Morning**
2. **הגדרות → API & Webhooks**
3. **צור API Key**
4. **הגדר Webhook URL:** `https://compakt-453296955394.us-central1.run.app/api/webhooks/morning`

### שלב 2: צור "מוצר" ב-Morning

```
שם: Compakt Premium - מנוי חודשי
מחיר: ₪149/חודש
סוג: מנוי חוזר
תקופת ניסיון: 14 יום
```

### שלב 3: קבל Payment Page URL

Morning ייצור לך URL כמו:
```
https://www.greeninvoice.co.il/pay/ABC123
```

### שלב 4: שלב ב-Compakt

```typescript
// src/app/api/payment/create-session/route.ts
export async function POST(req: Request) {
  const { userId, email, plan } = await req.json();
  
  // יצירת קישור תשלום ב-Morning
  const paymentUrl = await createMorningPaymentLink({
    userId,
    email,
    plan,
    amount: 149,
    trial: 14
  });
  
  return Response.json({ paymentUrl });
}
```

### שלב 5: טיפול ב-Webhook

```typescript
// src/app/api/webhooks/morning/route.ts
export async function POST(req: Request) {
  const event = await req.json();
  
  if (event.type === 'payment.success') {
    // עדכן משתמש ל-Premium
    await updateUserToPremium(event.userId);
  }
  
  if (event.type === 'subscription.cancelled') {
    // החזר משתמש ל-Starter
    await downgradeUser(event.userId);
  }
  
  return Response.json({ received: true });
}
```

---

## 📊 זרימת המידע המלאה:

```
┌─────────────────────────────────────────────────────────────┐
│                    1. משתמש נרשם                            │
│                    ↓                                         │
│              Compakt → Supabase                              │
│              (user_id, email, plan: starter)                 │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│              2. משתמש בוחר Premium Trial                     │
│                    ↓                                         │
│         Compakt API → Morning API                            │
│         (create payment link)                                │
│                    ↓                                         │
│         Morning → Payment URL                                │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│           3. משתמש מועבר לדף תשלום של Morning               │
│                    ↓                                         │
│              Morning Payment Page                            │
│              (user enters card details)                      │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                4. משתמש משלם בהצלחה                         │
│                    ↓                                         │
│         Morning → Webhook → Compakt                          │
│         (payment.success event)                              │
│                    ↓                                         │
│         Compakt → Supabase                                   │
│         (update plan: premium, trial_ends: +14 days)         │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│              5. משתמש מועבר חזרה ל-Compakt                  │
│                    ↓                                         │
│              Welcome to Premium! 🎉                          │
└─────────────────────────────────────────────────────────────┘
```

---

## 🗄️ שינויים נדרשים ב-DB:

```sql
-- הוספת עמודות למעקב אחרי מנויים
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS
  morning_customer_id TEXT,
  morning_subscription_id TEXT,
  subscription_status TEXT DEFAULT 'none',
  trial_ends_at TIMESTAMP,
  next_billing_date TIMESTAMP,
  payment_method_last4 TEXT;

-- אינדקס למציאת מנויים פעילים
CREATE INDEX idx_active_subscriptions 
ON profiles(subscription_status) 
WHERE subscription_status = 'active';
```

---

## 📝 דוגמת קוד מלאה:

### 1. יצירת קישור תשלום

```typescript
// src/lib/morning.ts
import { supabase } from './supabase';

interface CreatePaymentLinkParams {
  userId: string;
  email: string;
  plan: 'premium';
  amount: number;
  trial: number;
}

export async function createMorningPaymentLink(params: CreatePaymentLinkParams) {
  const { userId, email, plan, amount, trial } = params;
  
  // קריאה ל-Morning API
  const response = await fetch('https://api.greeninvoice.co.il/api/v1/payments/links', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.MORNING_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      amount,
      currency: 'ILS',
      description: `Compakt ${plan} - מנוי חודשי`,
      customer: {
        email,
        name: email.split('@')[0]
      },
      metadata: {
        userId,
        plan,
        source: 'compakt'
      },
      subscription: {
        interval: 'month',
        trial_period_days: trial
      },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/admin?payment=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/admin?payment=cancelled`
    })
  });
  
  const data = await response.json();
  
  // שמור את ה-session ID
  await supabase
    .from('profiles')
    .update({ 
      morning_session_id: data.id,
      subscription_status: 'pending'
    })
    .eq('user_id', userId);
  
  return data.url;
}
```

### 2. טיפול ב-Webhook

```typescript
// src/app/api/webhooks/morning/route.ts
import { supabase } from '@/lib/supabase';

export async function POST(req: Request) {
  const event = await req.json();
  
  // אימות Webhook (חשוב!)
  const signature = req.headers.get('morning-signature');
  if (!verifyWebhookSignature(event, signature)) {
    return Response.json({ error: 'Invalid signature' }, { status: 401 });
  }
  
  const { type, data } = event;
  const userId = data.metadata?.userId;
  
  switch (type) {
    case 'payment.success':
      await handlePaymentSuccess(userId, data);
      break;
      
    case 'subscription.created':
      await handleSubscriptionCreated(userId, data);
      break;
      
    case 'subscription.updated':
      await handleSubscriptionUpdated(userId, data);
      break;
      
    case 'subscription.cancelled':
      await handleSubscriptionCancelled(userId, data);
      break;
      
    case 'payment.failed':
      await handlePaymentFailed(userId, data);
      break;
  }
  
  return Response.json({ received: true });
}

async function handlePaymentSuccess(userId: string, data: any) {
  const trialEndsAt = new Date();
  trialEndsAt.setDate(trialEndsAt.getDate() + 14);
  
  await supabase
    .from('profiles')
    .update({
      plan: 'premium',
      subscription_status: 'trialing',
      trial_ends_at: trialEndsAt.toISOString(),
      morning_customer_id: data.customer_id,
      morning_subscription_id: data.subscription_id,
      payment_method_last4: data.payment_method?.last4
    })
    .eq('user_id', userId);
  
  // שלח email אישור
  await sendWelcomeEmail(userId);
}

async function handleSubscriptionCancelled(userId: string, data: any) {
  await supabase
    .from('profiles')
    .update({
      plan: 'starter',
      subscription_status: 'cancelled',
      trial_ends_at: null,
      next_billing_date: null
    })
    .eq('user_id', userId);
  
  // שלח email ביטול
  await sendCancellationEmail(userId);
}
```

### 3. שינוי ב-OnboardingStepPayment

```typescript
// src/components/onboarding-v2/steps/OnboardingStepPayment.tsx
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setIsLoading(true);
  
  try {
    // במקום לטפל בכרטיס אשראי כאן,
    // יוצרים קישור תשלום ב-Morning
    const response = await fetch('/api/payment/create-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: user.id,
        email: user.email,
        plan: 'premium'
      })
    });
    
    const { paymentUrl } = await response.json();
    
    // מעביר את המשתמש לדף התשלום של Morning
    window.location.href = paymentUrl;
    
  } catch (error) {
    console.error('Payment error:', error);
    setIsLoading(false);
  }
};
```

---

## ⏱️ לוח זמנים משוער:

### שבוע 1: הכנה
- [ ] פתיחת API Key ב-Morning
- [ ] הגדרת Webhooks
- [ ] יצירת מוצר "Compakt Premium"
- [ ] עדכון טבלת profiles

### שבוע 2: פיתוח
- [ ] יצירת `/api/payment/create-session`
- [ ] יצירת `/api/webhooks/morning`
- [ ] עדכון OnboardingStepPayment
- [ ] בדיקות ב-sandbox

### שבוע 3: בדיקות
- [ ] בדיקת תשלום מלא
- [ ] בדיקת webhooks
- [ ] בדיקת ביטול מנוי
- [ ] בדיקת חידוש אוטומטי

### שבוע 4: הפעלה
- [ ] העלאה לפרודקשן
- [ ] מעקב אחרי תשלומים ראשונים
- [ ] תיקון באגים

---

## 💰 עלויות:

**Morning:**
- מסלול Best: ₪99/חודש + 2.9% עמלת סליקה
- מסלול Extra: ₪149/חודש + 2.5% עמלת סליקה

**דוגמה:**
- 10 משתמשים × ₪149 = ₪1,490 הכנסה
- עמלת Morning (2.5%): ₪37
- **רווח נטו:** ₪1,453 - ₪149 (Morning) = **₪1,304**

---

## 🔐 אבטחה:

**חשוב מאוד:**
1. ✅ אחסן את ה-API Key ב-environment variables
2. ✅ אמת את ה-webhook signature
3. ✅ השתמש ב-HTTPS בלבד
4. ✅ לא לשמור פרטי כרטיס אשראי ב-DB שלך
5. ✅ Log כל פעולה לצורך audit

---

## 📞 תמיכה:

**Morning Support:**
- 📧 support@greeninvoice.co.il
- 📱 03-3748888
- 💬 צ'אט באתר

**תיעוד API:**
- https://www.greeninvoice.co.il/api-docs/

---

## ✅ סיכום:

**כן, אפשר לעשות הכל דרך Morning!**

1. ✅ סליקת אשראי
2. ✅ מנויים חוזרים
3. ✅ ניהול לקוחות
4. ✅ Webhooks לעדכונים
5. ✅ דפי תשלום מוכנים

**לא צריך אתר נוסף לסליקה.**

**הצעד הבא:** תתחיל עם אופציה 1 (דף תשלום של Morning), וזה יעבוד מצוין!
