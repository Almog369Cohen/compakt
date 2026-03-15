"use client";

import { motion } from "framer-motion";
import { Check, Sparkles, Heart, Music, Users, Building2 } from "lucide-react";

interface Template {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
  color: string;
  features: string[];
  questionsCount: number;
  songsCount: number;
}

const templates: Template[] = [
  {
    id: "wedding",
    name: "חתונה",
    icon: <Heart className="w-6 h-6" />,
    description: "תבנית מושלמת לחתונות עם כל מה שצריך",
    color: "from-pink-500 to-rose-500",
    features: [
      "15 שאלות מותאמות לחתונה",
      "30 שירים פופולריים לחתונות",
      "חישוב אורחים אוטומטי",
      "בקשות מיוחדות",
    ],
    questionsCount: 15,
    songsCount: 30,
  },
  {
    id: "bar-mitzvah",
    name: "בר/בת מצווה",
    icon: <Music className="w-6 h-6" />,
    description: "תבנית מיוחדת לאירועי בר ובת מצווה",
    color: "from-blue-500 to-cyan-500",
    features: [
      "12 שאלות מותאמות",
      "25 שירים לבני נוער",
      "העדפות מוזיקליות",
      "פעילויות מיוחדות",
    ],
    questionsCount: 12,
    songsCount: 25,
  },
  {
    id: "corporate",
    name: "אירוע קורפורטיבי",
    icon: <Building2 className="w-6 h-6" />,
    description: "תבנית מקצועית לאירועי חברה",
    color: "from-purple-500 to-indigo-500",
    features: [
      "10 שאלות עסקיות",
      "20 שירים מתאימים",
      "דרישות מיוחדות",
      "לוגו ומיתוג",
    ],
    questionsCount: 10,
    songsCount: 20,
  },
  {
    id: "general",
    name: "כללי",
    icon: <Users className="w-6 h-6" />,
    description: "תבנית בסיסית לכל סוג אירוע",
    color: "from-green-500 to-emerald-500",
    features: [
      "8 שאלות בסיסיות",
      "15 שירים פופולריים",
      "גמיש להתאמה",
      "מתאים לכולם",
    ],
    questionsCount: 8,
    songsCount: 15,
  },
];

interface QuickStartTemplatesProps {
  onSelectTemplate: (templateId: string) => void;
  onSkip: () => void;
}

export function QuickStartTemplates({ onSelectTemplate, onSkip }: QuickStartTemplatesProps) {
  return (
    <div className="min-h-dvh gradient-hero flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-6xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-blue/10 border border-brand-blue/20 mb-4">
            <Sparkles className="w-4 h-4 text-brand-blue" />
            <span className="text-sm font-medium text-brand-blue">התחל מהר עם תבנית מוכנה</span>
          </div>
          
          <h2 className="text-3xl md:text-4xl font-bold mb-3">
            בחר תבנית להתחלה מהירה
          </h2>
          <p className="text-secondary text-lg max-w-2xl mx-auto">
            חסוך זמן והתחל עם תבנית מוכנה שכוללת שאלות ושירים מותאמים לסוג האירוע שלך
          </p>
        </motion.div>

        {/* Templates Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {templates.map((template, index) => (
            <motion.button
              key={template.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => onSelectTemplate(template.id)}
              className="glass-card p-6 text-right hover:scale-105 transition-all duration-200 group"
            >
              {/* Icon */}
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${template.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                {template.icon}
              </div>

              {/* Title */}
              <h3 className="text-xl font-bold mb-2">{template.name}</h3>
              <p className="text-sm text-secondary mb-4">{template.description}</p>

              {/* Stats */}
              <div className="flex items-center gap-4 mb-4 text-xs text-muted">
                <div>📝 {template.questionsCount} שאלות</div>
                <div>🎵 {template.songsCount} שירים</div>
              </div>

              {/* Features */}
              <div className="space-y-2">
                {template.features.map((feature, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-xs">
                    <Check className="w-3 h-3 text-brand-green mt-0.5 flex-shrink-0" />
                    <span className="text-secondary">{feature}</span>
                  </div>
                ))}
              </div>

              {/* CTA */}
              <div className="mt-4 pt-4 border-t border-white/5">
                <span className="text-sm font-medium text-brand-blue group-hover:text-brand-green transition-colors">
                  בחר תבנית זו →
                </span>
              </div>
            </motion.button>
          ))}
        </div>

        {/* Skip Option */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center"
        >
          <button
            onClick={onSkip}
            className="text-secondary hover:text-foreground transition-colors text-sm"
          >
            דלג - אתחיל מאפס →
          </button>
          <p className="text-xs text-muted mt-2">
            תוכל תמיד להוסיף שאלות ושירים בעצמך
          </p>
        </motion.div>

        {/* Benefits */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="glass-card p-4 mt-6"
        >
          <div className="flex items-center justify-center gap-8 text-sm">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-brand-green" />
              <span className="text-secondary">חוסך 15+ דקות</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-brand-green" />
              <span className="text-secondary">מבוסס על best practices</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-brand-green" />
              <span className="text-secondary">ניתן להתאמה מלאה</span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
