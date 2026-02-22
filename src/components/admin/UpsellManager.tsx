"use client";

import { useState } from "react";
import { useAdminStore } from "@/stores/adminStore";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Edit3,
  Trash2,
  X,
  Eye,
  EyeOff,
  Sparkles,
} from "lucide-react";
import type { Upsell } from "@/lib/types";

const placements: { value: Upsell["placement"]; label: string }[] = [
  { value: "stage_4", label: "שלב בקשות" },
  { value: "post_brief", label: "אחרי סיכום" },
  { value: "inline", label: "בתוך הפלואו" },
];

export function UpsellManager() {
  const upsells = useAdminStore((s) => s.upsells);
  const addUpsell = useAdminStore((s) => s.addUpsell);
  const updateUpsell = useAdminStore((s) => s.updateUpsell);
  const deleteUpsell = useAdminStore((s) => s.deleteUpsell);

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUpsell, setEditingUpsell] = useState<Upsell | null>(null);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-brand-blue" />
          שדרוגים / Upsells ({upsells.length})
        </h2>
        <button
          onClick={() => setShowAddModal(true)}
          className="btn-primary text-sm flex items-center gap-1.5 py-2 px-4"
        >
          <Plus className="w-4 h-4" />
          הוסף שדרוג
        </button>
      </div>

      {/* Upsell Cards */}
      <div className="grid gap-3 sm:grid-cols-2">
        {upsells.map((upsell) => (
          <motion.div
            key={upsell.id}
            layout
            className="glass-card p-5 relative"
            style={{
              borderImage: upsell.isActive
                ? "linear-gradient(135deg, #059cc0, #03b28c) 1"
                : undefined,
              borderWidth: "1px",
              borderStyle: "solid",
            }}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-brand-blue" />
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${
                    upsell.isActive
                      ? "bg-brand-green/10 text-brand-green"
                      : "bg-accent-danger/10 text-accent-danger"
                  }`}
                >
                  {upsell.isActive ? "פעיל" : "מוסתר"}
                </span>
                <span className="text-xs text-muted px-2 py-0.5 rounded-full border border-glass">
                  {placements.find((p) => p.value === upsell.placement)?.label}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() =>
                    updateUpsell(upsell.id, { isActive: !upsell.isActive })
                  }
                  className="p-1 text-muted hover:text-foreground transition-colors"
                  aria-label={upsell.isActive ? "הסתר" : "הצג"}
                >
                  {upsell.isActive ? (
                    <Eye className="w-3.5 h-3.5" />
                  ) : (
                    <EyeOff className="w-3.5 h-3.5" />
                  )}
                </button>
                <button
                  onClick={() => setEditingUpsell(upsell)}
                  className="p-1 text-muted hover:text-brand-blue transition-colors"
                  aria-label="ערוך"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => {
                    if (confirm("למחוק את השדרוג?")) deleteUpsell(upsell.id);
                  }}
                  className="p-1 text-muted hover:text-accent-danger transition-colors"
                  aria-label="מחק"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <h4 className="font-bold text-sm mb-1">{upsell.titleHe}</h4>
            <p className="text-xs text-secondary mb-2">{upsell.descriptionHe}</p>
            {upsell.priceHint && (
              <p className="text-xs text-muted mb-2">{upsell.priceHint}</p>
            )}
            <div className="btn-secondary text-xs py-1 px-3 inline-block">
              {upsell.ctaTextHe} →
            </div>
          </motion.div>
        ))}
      </div>

      {upsells.length === 0 && (
        <div className="glass-card p-8 text-center text-muted text-sm">
          אין שדרוגים עדיין
        </div>
      )}

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {(showAddModal || editingUpsell) && (
          <UpsellModal
            upsell={editingUpsell}
            onSave={(data) => {
              if (editingUpsell) {
                updateUpsell(editingUpsell.id, data);
              } else {
                addUpsell(data as Omit<Upsell, "id" | "sortOrder">);
              }
              setShowAddModal(false);
              setEditingUpsell(null);
            }}
            onClose={() => {
              setShowAddModal(false);
              setEditingUpsell(null);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function UpsellModal({
  upsell,
  onSave,
  onClose,
}: {
  upsell: Upsell | null;
  onSave: (data: Partial<Upsell>) => void;
  onClose: () => void;
}) {
  const [titleHe, setTitleHe] = useState(upsell?.titleHe || "");
  const [descriptionHe, setDescriptionHe] = useState(upsell?.descriptionHe || "");
  const [priceHint, setPriceHint] = useState(upsell?.priceHint || "");
  const [ctaTextHe, setCtaTextHe] = useState(upsell?.ctaTextHe || "לפרטים");
  const [placement, setPlacement] = useState<Upsell["placement"]>(
    upsell?.placement || "stage_4"
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      titleHe,
      descriptionHe,
      priceHint: priceHint || undefined,
      ctaTextHe,
      placement,
      isActive: true,
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <motion.form
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
        className="glass-card p-6 w-full max-w-lg space-y-4"
      >
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-lg">
            {upsell ? "עריכת שדרוג" : "הוספת שדרוג"}
          </h3>
          <button type="button" onClick={onClose} className="p-1 text-muted hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div>
          <label className="block text-xs text-muted mb-1">כותרת *</label>
          <input
            type="text"
            value={titleHe}
            onChange={(e) => setTitleHe(e.target.value)}
            required
            placeholder="?רוצים רגע כניסה מדויק"
            className="w-full px-3 py-2 rounded-xl bg-transparent border border-glass text-sm focus:outline-none focus:border-brand-blue transition-colors"
          />
        </div>

        <div>
          <label className="block text-xs text-muted mb-1">תיאור</label>
          <textarea
            value={descriptionHe}
            onChange={(e) => setDescriptionHe(e.target.value)}
            placeholder="עיבוד אישי לשיר הכניסה שלכם..."
            rows={3}
            className="w-full px-3 py-2 rounded-xl bg-transparent border border-glass text-sm focus:outline-none focus:border-brand-blue transition-colors resize-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-muted mb-1">רמז מחיר</label>
            <input
              type="text"
              value={priceHint}
              onChange={(e) => setPriceHint(e.target.value)}
              placeholder="החל מ-₪500"
              className="w-full px-3 py-2 rounded-xl bg-transparent border border-glass text-sm focus:outline-none focus:border-brand-blue transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs text-muted mb-1">טקסט כפתור</label>
            <input
              type="text"
              value={ctaTextHe}
              onChange={(e) => setCtaTextHe(e.target.value)}
              placeholder="לפרטים"
              className="w-full px-3 py-2 rounded-xl bg-transparent border border-glass text-sm focus:outline-none focus:border-brand-blue transition-colors"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs text-muted mb-1">מיקום הצגה</label>
          <select
            value={placement}
            onChange={(e) => setPlacement(e.target.value as Upsell["placement"])}
            className="w-full px-3 py-2 rounded-xl bg-transparent border border-glass text-sm focus:outline-none focus:border-brand-blue transition-colors"
          >
            {placements.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex gap-2 pt-2">
          <button type="submit" className="btn-primary flex-1">
            {upsell ? "שמור שינויים" : "הוסף שדרוג"}
          </button>
          <button type="button" onClick={onClose} className="btn-secondary flex-1">
            ביטול
          </button>
        </div>
      </motion.form>
    </motion.div>
  );
}
