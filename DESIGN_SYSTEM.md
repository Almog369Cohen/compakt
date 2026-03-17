# Compakt Design System

## Overview
מערכת עיצוב מודרנית ופרמיום לפלטפורמת Compakt, מבוססת על Glassmorphism, אנימציות מתקדמות וטיפוגרפיה עם Rubik.

## Core Principles

### 1. Glassmorphism
- רקע שקוף: `bg-white/70`
- Backdrop blur: `backdrop-blur-xl`
- גבולות עדינים: `border border-white/60`
- צללים: `shadow-xl shadow-black/5`

### 2. Animations
- **Blob animations**: תנועת רקע רכה (7s infinite)
- **Gradient animations**: גרדיאנטים מונפשים (3s infinite)
- **Spring animations**: אנימציות קפיציות לכרטיסים
- **Staggered delays**: עיכובים מדורגים (0.1s, 0.15s, 0.2s)

### 3. Typography
- **Font**: Rubik (תמיכה מושלמת בעברית ואנגלית)
- **Weights**: 400, 500, 600, 700, 800
- **Sizes**:
  - Hero: `text-5xl md:text-7xl`
  - Section titles: `text-4xl md:text-5xl`
  - Card titles: `text-lg font-bold`
  - Body: `text-sm` or `text-base`

### 4. Colors
- **Primary gradient**: `from-[#059cc0] to-[#03b28c]`
- **Text**: `slate-900`, `slate-700`, `slate-600`
- **Backgrounds**: `white`, `slate-50`
- **Accents**: Brand colors per feature

## Components

### GlassCard
```tsx
import { GlassCard } from "@/components/ui/GlassCard";

<GlassCard 
  gradient="linear-gradient(135deg, #059cc008, #03b28c03)"
  hover={true}
  delay={0.1}
>
  {/* content */}
</GlassCard>
```

### SectionHeader
```tsx
import { SectionHeader } from "@/components/ui/SectionHeader";

<SectionHeader
  badge="למה Compakt?"
  title="הכל במקום אחד"
  subtitle="תקשורת, מוזיקה, בריפים ואנליטיקות"
/>
```

### PremiumButton
```tsx
import { PremiumButton } from "@/components/ui/PremiumButton";

<PremiumButton
  variant="primary" // or "secondary" or "ghost"
  size="lg" // or "md" or "sm"
  href="/admin"
  icon={<ArrowLeft />}
>
  התחילו בחינם
</PremiumButton>
```

### GradientBackground
```tsx
import { GradientBackground } from "@/components/ui/GradientBackground";

<section className="relative">
  <GradientBackground variant="hero" />
  {/* content */}
</section>
```

### PremiumInput
```tsx
import { PremiumInput } from "@/components/ui/PremiumInput";

<PremiumInput
  label="אימייל"
  placeholder="your@email.com"
  icon={<Mail />}
  error={errors.email}
/>
```

## Layout Patterns

### Section Spacing
```tsx
<section className="relative py-20 px-6 bg-gradient-to-b from-white via-slate-50/50 to-white overflow-hidden">
  <GradientBackground variant="default" />
  <div className="relative max-w-6xl mx-auto">
    {/* content */}
  </div>
</section>
```

### Card Grid
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {items.map((item, index) => (
    <GlassCard key={index} delay={index * 0.1}>
      {/* card content */}
    </GlassCard>
  ))}
</div>
```

## Responsive Design

### Breakpoints
- Mobile: default
- Tablet: `md:` (768px)
- Desktop: `lg:` (1024px)

### Mobile-First Approach
```tsx
className="text-4xl md:text-5xl lg:text-6xl"
className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
className="px-4 md:px-6 lg:px-8"
```

## Animation Guidelines

### Entry Animations
```tsx
initial={{ opacity: 0, y: 30, scale: 0.95 }}
whileInView={{ opacity: 1, y: 0, scale: 1 }}
viewport={{ once: true }}
transition={{ delay: 0.1, type: "spring", stiffness: 100 }}
```

### Hover States
```tsx
className="hover:shadow-2xl hover:shadow-black/10 hover:-translate-y-1 transition-all duration-300"
```

### Staggered Items
```tsx
{items.map((item, index) => (
  <motion.div
    key={index}
    transition={{ delay: index * 0.1 }}
  >
    {/* content */}
  </motion.div>
))}
```

## Best Practices

1. **Always use GlassCard** for content containers
2. **Use SectionHeader** for consistent section titles
3. **Apply GradientBackground** to sections for depth
4. **Use PremiumButton** for all CTAs
5. **Maintain consistent spacing**: py-20 for sections, gap-4 for grids
6. **Use Rubik font** for all text
7. **Apply spring animations** to cards and important elements
8. **Use gradient text** for headlines: `bg-gradient-to-br from-slate-900 to-slate-700 bg-clip-text text-transparent`

## Color Palette

### Primary
- Cyan: `#059cc0`
- Emerald: `#03b28c`

### Neutrals
- Slate 900: `#0f172a`
- Slate 700: `#334155`
- Slate 600: `#475569`
- Slate 50: `#f8fafc`
- White: `#ffffff`

### Gradients
```css
/* Primary gradient */
background: linear-gradient(to right, #059cc0, #03b28c);

/* Text gradient */
background: linear-gradient(to bottom right, #0f172a, #334155);
-webkit-background-clip: text;
-webkit-text-fill-color: transparent;
```

## Accessibility

- Maintain WCAG AA contrast ratios
- Use semantic HTML
- Include ARIA labels where needed
- Ensure keyboard navigation works
- Test with screen readers

## Performance

- Use `viewport={{ once: true }}` for animations
- Lazy load images
- Optimize animation durations (200-500ms)
- Use CSS transforms over position changes
- Minimize backdrop-blur usage on mobile

## Migration Guide

### Converting Old Components

**Before:**
```tsx
<div className="p-8 rounded-xl bg-white border">
  <h3>{title}</h3>
  <p>{description}</p>
</div>
```

**After:**
```tsx
<GlassCard className="p-6">
  <h3 className="text-lg font-bold text-slate-900">{title}</h3>
  <p className="text-sm text-slate-600">{description}</p>
</GlassCard>
```

## Examples

See `/src/components/marketing/` for full implementation examples:
- `Hero.tsx` - Hero section with animated background
- `Features.tsx` - Bento grid with glassmorphism
- `Problem.tsx` - Compact cards with hover effects
- `Solution.tsx` - Step-by-step with connection line
- `PricingPreview.tsx` - Pricing cards with highlights
- `FinalCTA.tsx` - CTA section with gradient mesh
