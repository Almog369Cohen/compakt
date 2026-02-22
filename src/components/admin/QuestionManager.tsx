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
  GripVertical,
  HelpCircle,
} from "lucide-react";
import type { Question, QuestionType, EventType } from "@/lib/types";

const questionTypes: { value: QuestionType; label: string }[] = [
  { value: "single_select", label: "בחירה יחידה" },
  { value: "multi_select", label: "בחירה מרובה" },
  { value: "slider", label: "סליידר" },
  { value: "text", label: "טקסט חופשי" },
];

const eventTypes: { value: EventType; label: string }[] = [
  { value: "wedding", label: "חתונה" },
  { value: "bar_mitzvah", label: "בר/בת מצווה" },
  { value: "private", label: "אירוע פרטי" },
  { value: "corporate", label: "עסקי" },
];

export function QuestionManager() {
  const questions = useAdminStore((s) => s.questions);
  const addQuestion = useAdminStore((s) => s.addQuestion);
  const updateQuestion = useAdminStore((s) => s.updateQuestion);
  const deleteQuestion = useAdminStore((s) => s.deleteQuestion);

  const [filterType, setFilterType] = useState<string>("wedding");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);

  const filtered = questions
    .filter((q) => q.eventType === filterType)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-brand-blue" />
          ניהול שאלות ({filtered.length})
        </h2>
        <button
          onClick={() => setShowAddModal(true)}
          className="btn-primary text-sm flex items-center gap-1.5 py-2 px-4"
        >
          <Plus className="w-4 h-4" />
          הוסף שאלה
        </button>
      </div>

      {/* Event Type Filter */}
      <div className="flex gap-1">
        {eventTypes.map((et) => (
          <button
            key={et.value}
            onClick={() => setFilterType(et.value)}
            className={`chip text-xs ${filterType === et.value ? "active" : ""}`}
          >
            {et.label}
          </button>
        ))}
      </div>

      {/* Questions List */}
      <div className="space-y-2">
        {filtered.map((q, i) => (
          <motion.div
            key={q.id}
            layout
            className="glass-card p-4 flex items-start gap-3"
          >
            <div className="text-muted cursor-grab mt-1">
              <GripVertical className="w-4 h-4" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs text-brand-blue font-bold">
                  {i + 1}.
                </span>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${
                    q.isActive
                      ? "bg-brand-green/10 text-brand-green"
                      : "bg-accent-danger/10 text-accent-danger"
                  }`}
                >
                  {q.isActive ? "פעיל" : "מוסתר"}
                </span>
                <span className="text-xs text-muted px-2 py-0.5 rounded-full border border-glass">
                  {questionTypes.find((t) => t.value === q.questionType)?.label}
                </span>
              </div>
              <p className="font-medium text-sm">{q.questionHe}</p>
              {q.options && (
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {q.options.map((opt) => (
                    <span key={opt.value} className="text-xs text-muted">
                      {opt.label}
                    </span>
                  ))}
                </div>
              )}
              {q.sliderLabels && (
                <div className="flex gap-2 mt-1.5 text-xs text-muted">
                  {q.sliderLabels.map((l, i) => (
                    <span key={i}>{l}</span>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center gap-1 flex-shrink-0">
              <button
                onClick={() => updateQuestion(q.id, { isActive: !q.isActive })}
                className="p-1.5 rounded-lg text-muted hover:text-foreground transition-colors"
                aria-label={q.isActive ? "הסתר" : "הצג"}
              >
                {q.isActive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              </button>
              <button
                onClick={() => setEditingQuestion(q)}
                className="p-1.5 rounded-lg text-muted hover:text-brand-blue transition-colors"
                aria-label="ערוך"
              >
                <Edit3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  if (confirm("למחוק את השאלה?")) deleteQuestion(q.id);
                }}
                className="p-1.5 rounded-lg text-muted hover:text-accent-danger transition-colors"
                aria-label="מחק"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        ))}
        {filtered.length === 0 && (
          <div className="glass-card p-8 text-center text-muted text-sm">
            אין שאלות לסוג אירוע זה
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {(showAddModal || editingQuestion) && (
          <QuestionModal
            question={editingQuestion}
            defaultEventType={filterType as EventType}
            onSave={(data) => {
              if (editingQuestion) {
                updateQuestion(editingQuestion.id, data);
              } else {
                addQuestion(data as Omit<Question, "id" | "sortOrder">);
              }
              setShowAddModal(false);
              setEditingQuestion(null);
            }}
            onClose={() => {
              setShowAddModal(false);
              setEditingQuestion(null);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function QuestionModal({
  question,
  defaultEventType,
  onSave,
  onClose,
}: {
  question: Question | null;
  defaultEventType: EventType;
  onSave: (data: Partial<Question>) => void;
  onClose: () => void;
}) {
  const [questionHe, setQuestionHe] = useState(question?.questionHe || "");
  const [questionType, setQuestionType] = useState<QuestionType>(
    question?.questionType || "single_select"
  );
  const [eventType, setEventType] = useState<EventType>(
    question?.eventType || defaultEventType
  );
  const [optionsText, setOptionsText] = useState(
    question?.options?.map((o) => `${o.label}|${o.value}`).join("\n") || ""
  );
  const [sliderMin, setSliderMin] = useState(question?.sliderMin || 1);
  const [sliderMax, setSliderMax] = useState(question?.sliderMax || 5);
  const [sliderLabels, setSliderLabels] = useState(
    question?.sliderLabels?.join(", ") || ""
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const options =
      questionType === "single_select" || questionType === "multi_select"
        ? optionsText
            .split("\n")
            .filter(Boolean)
            .map((line) => {
              const [label, value] = line.split("|");
              return { label: label.trim(), value: (value || label).trim() };
            })
        : undefined;

    onSave({
      questionHe,
      questionType,
      eventType,
      options,
      sliderMin: questionType === "slider" ? sliderMin : undefined,
      sliderMax: questionType === "slider" ? sliderMax : undefined,
      sliderLabels:
        questionType === "slider" && sliderLabels
          ? sliderLabels.split(",").map((l) => l.trim())
          : undefined,
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
        className="glass-card p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto space-y-4"
      >
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-lg">
            {question ? "עריכת שאלה" : "הוספת שאלה"}
          </h3>
          <button type="button" onClick={onClose} className="p-1 text-muted hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div>
          <label className="block text-xs text-muted mb-1">טקסט השאלה (עברית) *</label>
          <input
            type="text"
            value={questionHe}
            onChange={(e) => setQuestionHe(e.target.value)}
            required
            placeholder="?מה האווירה שאתם חולמים עליה"
            className="w-full px-3 py-2 rounded-xl bg-transparent border border-glass text-sm focus:outline-none focus:border-brand-blue transition-colors"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-muted mb-1">סוג שאלה</label>
            <select
              value={questionType}
              onChange={(e) => setQuestionType(e.target.value as QuestionType)}
              className="w-full px-3 py-2 rounded-xl bg-transparent border border-glass text-sm focus:outline-none focus:border-brand-blue transition-colors"
            >
              {questionTypes.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-muted mb-1">סוג אירוע</label>
            <select
              value={eventType}
              onChange={(e) => setEventType(e.target.value as EventType)}
              className="w-full px-3 py-2 rounded-xl bg-transparent border border-glass text-sm focus:outline-none focus:border-brand-blue transition-colors"
            >
              {eventTypes.map((et) => (
                <option key={et.value} value={et.value}>
                  {et.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Options for select types */}
        {(questionType === "single_select" || questionType === "multi_select") && (
          <div>
            <label className="block text-xs text-muted mb-1">
              אפשרויות (שורה לכל אפשרות, פורמט: תווית|ערך)
            </label>
            <textarea
              value={optionsText}
              onChange={(e) => setOptionsText(e.target.value)}
              placeholder={"מסיבה פרועה 🔥|party\nאלגנטית ✨|elegant"}
              rows={5}
              className="w-full px-3 py-2 rounded-xl bg-transparent border border-glass text-sm focus:outline-none focus:border-brand-blue transition-colors resize-none font-mono"
              dir="ltr"
            />
          </div>
        )}

        {/* Slider settings */}
        {questionType === "slider" && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-muted mb-1">מינימום</label>
                <input
                  type="number"
                  value={sliderMin}
                  onChange={(e) => setSliderMin(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-transparent border border-glass text-sm focus:outline-none focus:border-brand-blue transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs text-muted mb-1">מקסימום</label>
                <input
                  type="number"
                  value={sliderMax}
                  onChange={(e) => setSliderMax(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-transparent border border-glass text-sm focus:outline-none focus:border-brand-blue transition-colors"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs text-muted mb-1">
                תוויות (מופרדות בפסיק, לפי סדר)
              </label>
              <input
                type="text"
                value={sliderLabels}
                onChange={(e) => setSliderLabels(e.target.value)}
                placeholder="רגוע, קליל, אנרגטי, פרוע, מטורף"
                className="w-full px-3 py-2 rounded-xl bg-transparent border border-glass text-sm focus:outline-none focus:border-brand-blue transition-colors"
              />
            </div>
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <button type="submit" className="btn-primary flex-1">
            {question ? "שמור שינויים" : "הוסף שאלה"}
          </button>
          <button type="button" onClick={onClose} className="btn-secondary flex-1">
            ביטול
          </button>
        </div>
      </motion.form>
    </motion.div>
  );
}
