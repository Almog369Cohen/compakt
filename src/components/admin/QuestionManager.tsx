"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowDown,
  ArrowUp,
  Copy,
  Edit3,
  Eye,
  EyeOff,
  GripVertical,
  HelpCircle,
  LayoutPanelTop,
  Plus,
  Save,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { useAdminStore } from "@/stores/adminStore";
import type { EventType, Question, QuestionType } from "@/lib/types";
import { useTranslation } from "@/lib/i18n";
import {
  GUEST_CALCULATOR_QUESTION_ID,
  guestCalculatorDefaultQuestion,
} from "@/data/questions";



type EditorOption = {
  id: string;
  label: string;
  value: string;
};

type EditorState = {
  questionHe: string;
  questionType: QuestionType;
  eventTypes: EventType[];
  options: EditorOption[];
  sliderMin: number;
  sliderMax: number;
  sliderLabels: string[];
  isActive: boolean;
};

function createOption(label = "", value = ""): EditorOption {
  return {
    id: crypto.randomUUID(),
    label,
    value,
  };
}

function slugifyValue(input: string) {
  const normalized = input
    .trim()
    .toLowerCase()
    .replace(/['"]/g, "")
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_\u0590-\u05ff-]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");

  return normalized || `option_${Math.random().toString(36).slice(2, 8)}`;
}

function createDefaultState(eventType: EventType): EditorState {
  return {
    questionHe: "",
    questionType: "single_select",
    eventTypes: [eventType],
    options: [createOption("", ""), createOption("", "")],
    sliderMin: 1,
    sliderMax: 5,
    sliderLabels: ["calm", "flowing", "bouncy", "fire", "festival"],
    isActive: true,
  };
}

function mapQuestionToState(question: Question): EditorState {
  return {
    questionHe: question.questionHe,
    questionType: question.questionType,
    eventTypes: question.eventTypes?.length ? question.eventTypes : [question.eventType],
    options: question.options?.length
      ? question.options.map((option) => createOption(option.label, option.value))
      : [createOption("", ""), createOption("", "")],
    sliderMin: question.sliderMin ?? 1,
    sliderMax: question.sliderMax ?? 5,
    sliderLabels: question.sliderLabels?.length ? question.sliderLabels : ["calm", "flowing", "bouncy", "fire", "festival"],
    isActive: question.isActive,
  };
}

function mapStateToQuestion(state: EditorState): Omit<Question, "id" | "sortOrder"> {
  const normalizedQuestionType = state.questionType === "guest_calculator" ? "single_select" : state.questionType;
  const normalizedOptions =
    normalizedQuestionType === "single_select" || normalizedQuestionType === "multi_select"
      ? state.options
        .map((option) => ({
          label: option.label.trim(),
          value: option.value.trim() || slugifyValue(option.label),
        }))
        .filter((option) => option.label.length > 0)
      : undefined;

  return {
    questionHe: state.questionHe.trim(),
    questionType: normalizedQuestionType,
    eventType: state.eventTypes[0] ?? "wedding",
    eventTypes: state.eventTypes,
    options: normalizedOptions,
    sliderMin: normalizedQuestionType === "slider" ? Math.min(state.sliderMin, state.sliderMax) : undefined,
    sliderMax: normalizedQuestionType === "slider" ? Math.max(state.sliderMin, state.sliderMax) : undefined,
    sliderLabels:
      normalizedQuestionType === "slider"
        ? state.sliderLabels.map((label) => label.trim()).filter(Boolean)
        : undefined,
    isActive: state.isActive,
  };
}


export function QuestionManager() {
  const { t } = useTranslation("admin");
  const questions = useAdminStore((s) => s.questions);
  const addQuestion = useAdminStore((s) => s.addQuestion);
  const updateQuestion = useAdminStore((s) => s.updateQuestion);
  const deleteQuestion = useAdminStore((s) => s.deleteQuestion);
  const reorderQuestions = useAdminStore((s) => s.reorderQuestions);

  const [filterType, setFilterType] = useState<EventType>("wedding");
  const [editorMode, setEditorMode] = useState<"create" | "edit" | null>(null);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [questionMutationError, setQuestionMutationError] = useState<string | null>(null);

  const questionTypes = useMemo(() => [
    { value: "single_select" as QuestionType, label: t("questions.types.single_select"), description: t("questions.types.single_select_desc") },
    { value: "multi_select" as QuestionType, label: t("questions.types.multi_select"), description: t("questions.types.multi_select_desc") },
    { value: "slider" as QuestionType, label: t("questions.types.slider"), description: t("questions.types.slider_desc") },
    { value: "text" as QuestionType, label: t("questions.types.text"), description: t("questions.types.text_desc") },
  ], [t]);

  const eventTypes = useMemo(() => [
    { value: "wedding" as EventType, label: t("questions.eventTypes.wedding") },
    { value: "bar_mitzvah" as EventType, label: t("questions.eventTypes.bar_mitzvah") },
    { value: "private" as EventType, label: t("questions.eventTypes.private") },
    { value: "corporate" as EventType, label: t("questions.eventTypes.corporate") },
  ], [t]);

  const getQuestionTypeMeta = useMemo(() => (value: QuestionType) => {
    if (value === "guest_calculator") {
      return {
        value,
        label: t("questions.types.guest_calculator"),
        description: t("questions.types.guest_calculator_desc"),
      };
    }
    return questionTypes.find((type) => type.value === value) ?? questionTypes[0];
  }, [t, questionTypes]);

  const filtered = useMemo(
    () =>
      questions
        .filter((question) =>
          (question.eventTypes?.length ? question.eventTypes : [question.eventType]).includes(filterType)
        )
        .sort((a, b) => a.sortOrder - b.sortOrder),
    [filterType, questions]
  );

  const moveQuestion = (questionId: string, direction: "up" | "down") => {
    const index = filtered.findIndex((question) => question.id === questionId);
    if (index === -1) return;

    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= filtered.length) return;

    const reorderedCurrentType = [...filtered];
    const [movedItem] = reorderedCurrentType.splice(index, 1);
    reorderedCurrentType.splice(targetIndex, 0, movedItem);

    const otherIds = questions
      .filter(
        (question) =>
          !(question.eventTypes?.length ? question.eventTypes : [question.eventType]).includes(filterType)
      )
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((question) => question.id);

    reorderQuestions([...reorderedCurrentType.map((question) => question.id), ...otherIds]);
  };

  const duplicateQuestion = (question: Question) => {
    setQuestionMutationError(null);
    void addQuestion({
      ...mapStateToQuestion(mapQuestionToState(question)),
      questionHe: `${question.questionHe}${t("questions.duplicateSuffix")}`,
    }).catch((error) => {
      setQuestionMutationError(
        error instanceof Error ? error.message : t("questions.errors.duplicateFailed")
      );
    });
  };

  return (
    <div className="space-y-4">
      <div className="rounded-[24px] border border-white/10 bg-[rgba(12,16,24,0.72)] backdrop-blur-xl shadow-[0_16px_36px_rgba(0,0,0,0.16)] p-4 md:p-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[11px] text-secondary">
              <HelpCircle className="w-3.5 h-3.5 text-brand-blue" />
              {t("questions.title")}
            </div>
            <div>
              <h2 className="text-xl font-bold">{t("questions.subtitle")}</h2>
              <p className="text-sm text-secondary mt-1 max-w-3xl leading-6">
                {t("questions.description")}
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              setEditorMode("create");
              setEditingQuestion(null);
            }}
            className="btn-primary text-sm flex items-center gap-1.5 py-2 px-4"
          >
            <Plus className="w-4 h-4" />
            {t("questions.actions.addQuestion")}
          </button>
        </div>
      </div>

      <div className="flex gap-1 flex-wrap">
        {eventTypes.map((eventType) => (
          <button
            key={eventType.value}
            onClick={() => setFilterType(eventType.value)}
            className={`chip text-xs ${filterType === eventType.value ? "active" : ""}`}
          >
            {eventType.label}
          </button>
        ))}
      </div>

      {questionMutationError && (
        <div className="glass-card p-3 text-sm" style={{ color: "var(--accent-danger)" }}>
          {questionMutationError}
        </div>
      )}

      <div className="space-y-2">
        {filtered.map((question, index) => {
          const typeMeta = getQuestionTypeMeta(question.questionType);
          const questionTargets = question.eventTypes?.length ? question.eventTypes : [question.eventType];
          const isPinnedGuestCalculator =
            question.questionType === "guest_calculator" || question.id === GUEST_CALCULATOR_QUESTION_ID;

          return (
            <motion.div key={question.id} layout className="glass-card p-4">
              <div className="flex items-start gap-3">
                <div className="text-muted mt-1">
                  <GripVertical className="w-4 h-4" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-xs text-brand-blue font-bold">{index + 1}.</span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${question.isActive ? "bg-brand-green/10 text-brand-green" : "bg-accent-danger/10 text-accent-danger"
                        }`}
                    >
                      {question.isActive ? t("questions.status.active") : t("questions.status.hidden")}
                    </span>
                    <span className="text-xs text-muted px-2 py-0.5 rounded-full border border-glass">
                      {typeMeta.label}
                    </span>
                    {isPinnedGuestCalculator && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-brand-blue/10 text-brand-blue">
                        {t("questions.status.pinned")}
                      </span>
                    )}
                  </div>

                  <p className="font-medium text-sm leading-6">{question.questionHe}</p>

                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {questionTargets.map((target) => (
                      <span
                        key={`${question.id}-${target}`}
                        className="text-xs px-2 py-1 rounded-full border border-glass text-muted"
                      >
                        {eventTypes.find((eventType) => eventType.value === target)?.label ?? target}
                      </span>
                    ))}
                  </div>

                  {question.options && question.options.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {question.options.slice(0, 4).map((option) => (
                        <span key={option.value} className="text-xs px-2 py-1 rounded-full border border-glass text-muted">
                          {option.label}
                        </span>
                      ))}
                      {question.options.length > 4 && (
                        <span className="text-xs px-2 py-1 rounded-full border border-glass text-muted">
                          {t("questions.moreOptions", { count: String(question.options.length - 4) })}
                        </span>
                      )}
                    </div>
                  )}

                  {question.sliderLabels && question.sliderLabels.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2 text-xs text-muted">
                      {question.sliderLabels.map((label, sliderIndex) => (
                        <span key={`${label}-${sliderIndex}`}>{label}</span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => moveQuestion(question.id, "up")}
                    className="p-1.5 rounded-lg text-muted hover:text-foreground transition-colors"
                    aria-label={t("questions.actions.moveUp")}
                  >
                    <ArrowUp className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveQuestion(question.id, "down")}
                    className="p-1.5 rounded-lg text-muted hover:text-foreground transition-colors"
                    aria-label={t("questions.actions.moveDown")}
                  >
                    <ArrowDown className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      setQuestionMutationError(null);
                      try {
                        await updateQuestion(question.id, { isActive: !question.isActive });
                      } catch (error) {
                        setQuestionMutationError(
                          error instanceof Error ? error.message : t("questions.errors.updateFailed")
                        );
                      }
                    }}
                    className="p-1.5 rounded-lg text-muted hover:text-foreground transition-colors"
                    aria-label={question.isActive ? t("questions.actions.hide") : t("questions.actions.show")}
                  >
                    {question.isActive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => duplicateQuestion(question)}
                    className="p-1.5 rounded-lg text-muted hover:text-brand-blue transition-colors"
                    aria-label={t("questions.actions.duplicate")}
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingQuestion(question);
                      setEditorMode("edit");
                    }}
                    className="p-1.5 rounded-lg text-muted hover:text-brand-blue transition-colors"
                    aria-label={t("questions.actions.edit")}
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      if (isPinnedGuestCalculator) {
                        return;
                      }
                      if (confirm(t("questions.actions.deleteConfirm"))) {
                        setQuestionMutationError(null);
                        try {
                          await deleteQuestion(question.id);
                        } catch (error) {
                          setQuestionMutationError(
                            error instanceof Error ? error.message : t("questions.errors.deleteFailed")
                          );
                        }
                      }
                    }}
                    disabled={isPinnedGuestCalculator}
                    className={`p-1.5 rounded-lg transition-colors ${isPinnedGuestCalculator ? "text-muted/40 cursor-not-allowed" : "text-muted hover:text-accent-danger"}`}
                    aria-label={isPinnedGuestCalculator ? t("questions.actions.cannotDeletePinned") : t("questions.actions.delete")}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          );
        })}

        {filtered.length === 0 && (
          <div className="glass-card p-8 text-center text-muted text-sm">
            <p>{t("questions.empty.noQuestions")}</p>
            <p className="text-xs text-secondary mt-2">
              {t("questions.empty.noQuestionsDetail")}
            </p>
          </div>
        )}
      </div>

      <AnimatePresence>
        {editorMode && (
          <QuestionEditorModal
            key={editorMode === "edit" ? editingQuestion?.id ?? "edit" : "create"}
            mode={editorMode}
            question={editingQuestion}
            defaultEventType={filterType}
            onClose={() => {
              setEditorMode(null);
              setEditingQuestion(null);
            }}
            onSave={(payload) => {
              setQuestionMutationError(null);
              if (editorMode === "edit" && editingQuestion) {
                void updateQuestion(editingQuestion.id, payload).catch((error) => {
                  setQuestionMutationError(
                    error instanceof Error ? error.message : t("questions.errors.updateFailed")
                  );
                });
              } else {
                void addQuestion(payload as Omit<Question, "id" | "sortOrder">).catch((error) => {
                  setQuestionMutationError(
                    error instanceof Error ? error.message : t("questions.errors.createFailed")
                  );
                });
              }
              setEditorMode(null);
              setEditingQuestion(null);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function QuestionEditorModal({
  mode,
  question,
  defaultEventType,
  onClose,
  onSave,
}: {
  mode: "create" | "edit";
  question: Question | null;
  defaultEventType: EventType;
  onClose: () => void;
  onSave: (payload: Partial<Question>) => void;
}) {
  const isPinnedGuestCalculator =
    question?.questionType === "guest_calculator" || question?.id === GUEST_CALCULATOR_QUESTION_ID;
  const [draft, setDraft] = useState<EditorState>(() =>
    question ? mapQuestionToState(question) : createDefaultState(defaultEventType)
  );
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [validationMessage, setValidationMessage] = useState<string | null>(null);

  const previewQuestion = useMemo<Question>(
    () => ({
      id: question?.id ?? guestCalculatorDefaultQuestion.id,
      sortOrder: question?.sortOrder ?? 0,
      ...mapStateToQuestion(draft),
    }),
    [draft, question]
  );

  const updateOption = (optionId: string, nextLabel: string) => {
    setDraft((current) => ({
      ...current,
      options: current.options.map((option) =>
        option.id === optionId
          ? {
            ...option,
            label: nextLabel,
            value: option.value || slugifyValue(nextLabel),
          }
          : option
      ),
    }));
  };

  const saveDraft = () => {
    const payload = mapStateToQuestion(draft);

    if (!payload.questionHe) {
      setValidationMessage("צריך לכתוב את נוסח השאלה לפני ששומרים");
      return;
    }

    if (
      (payload.questionType === "single_select" || payload.questionType === "multi_select") &&
      (!payload.options || payload.options.length < 2)
    ) {
      setValidationMessage("כדאי להוסיף לפחות 2 אפשרויות כדי שהשאלה תהיה ברורה לזוג");
      return;
    }

    if (payload.questionType === "slider" && (payload.sliderMin ?? 0) >= (payload.sliderMax ?? 0)) {
      setValidationMessage("בסקאלה, הערך המקסימלי חייב להיות גדול מהמינימום");
      return;
    }

    onSave(payload);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/70 p-4 overflow-y-auto"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.98, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.98, y: 12 }}
        transition={{ duration: 0.18 }}
        onClick={(event) => event.stopPropagation()}
        className="mx-auto w-full max-w-6xl"
      >
        <div className="glass-card p-4 md:p-6">
          <div className="flex items-start justify-between gap-3 mb-5">
            <div>
              <h3 className="font-bold text-lg">{mode === "edit" ? "עריכת שאלה" : "הוספת שאלה"}</h3>
              <p className="text-sm text-muted mt-1">בצד אחד אתה עורך, ובצד השני אתה רואה איך זה ייראה לזוג.</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-muted hover:text-foreground transition-colors"
              aria-label="סגור"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {validationMessage && (
            <div className="glass-card px-4 py-3 text-sm text-brand-blue mb-4">
              {validationMessage}
            </div>
          )}

          <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
            <div className="space-y-5">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="md:col-span-2">
                  <label className="block text-xs text-muted mb-1">נוסח השאלה</label>
                  <input
                    type="text"
                    value={draft.questionHe}
                    onChange={(event) => setDraft((current) => ({ ...current, questionHe: event.target.value }))}
                    placeholder="?מה האווירה שאתם חולמים עליה"
                    className="w-full px-4 py-3 rounded-xl bg-transparent border border-glass text-sm focus:outline-none focus:border-brand-blue transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs text-muted mb-1">סוג שאלה</label>
                  <select
                    value={draft.questionType}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        questionType: event.target.value as QuestionType,
                      }))
                    }
                    disabled={isPinnedGuestCalculator}
                    className="w-full px-4 py-3 rounded-xl bg-transparent border border-glass text-sm focus:outline-none focus:border-brand-blue transition-colors"
                  >
                    {isPinnedGuestCalculator && (
                      <option value="guest_calculator">מחשבון אורחים</option>
                    )}
                    {questionTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-muted mt-2">{getQuestionTypeMeta(draft.questionType).description}</p>
                </div>

                <div>
                  <label className="block text-xs text-muted mb-1">איפה השאלה תופיע</label>
                  <div className="space-y-2 rounded-2xl border border-glass p-3">
                    {eventTypes.map((eventType) => {
                      const checked = draft.eventTypes.includes(eventType.value);
                      return (
                        <label key={eventType.value} className="flex items-center gap-2 text-sm cursor-pointer">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() =>
                              setDraft((current) => {
                                const nextEventTypes = checked
                                  ? current.eventTypes.filter((value) => value !== eventType.value)
                                  : [...current.eventTypes, eventType.value];
                                return {
                                  ...current,
                                  eventTypes: nextEventTypes.length > 0 ? nextEventTypes : [eventType.value],
                                };
                              })
                            }
                            className="accent-brand-blue"
                          />
                          <span>{eventType.label}</span>
                        </label>
                      );
                    })}
                  </div>
                  <p className="text-xs text-muted mt-2">אפשר לבחור כמה סוגי אירועים במקביל.</p>
                </div>
              </div>

              {(draft.questionType === "single_select" || draft.questionType === "multi_select") && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div>
                      <label className="block text-xs text-muted mb-1">אפשרויות תשובה</label>
                      <p className="text-xs text-muted">כתוב כל תשובה בדיוק כמו שאתה רוצה שהזוג יראה.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setDraft((current) => ({
                          ...current,
                          options: [...current.options, createOption("", "")],
                        }))
                      }
                      className="btn-secondary text-xs px-3 py-2 flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      הוסף אפשרות
                    </button>
                  </div>

                  <div className="space-y-2">
                    {draft.options.map((option, index) => (
                      <div key={option.id} className="rounded-2xl border border-glass p-3">
                        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto] items-start">
                          <div>
                            <label className="block text-[11px] text-muted mb-1">טקסט שמופיע לזוג</label>
                            <input
                              type="text"
                              value={option.label}
                              onChange={(event) => updateOption(option.id, event.target.value)}
                              placeholder={`אפשרות ${index + 1}`}
                              className="w-full px-3 py-2 rounded-xl bg-transparent border border-glass text-sm focus:outline-none focus:border-brand-blue transition-colors"
                            />
                          </div>
                          <div className="flex items-end h-full">
                            <button
                              type="button"
                              onClick={() =>
                                setDraft((current) => ({
                                  ...current,
                                  options:
                                    current.options.length > 2
                                      ? current.options.filter((item) => item.id !== option.id)
                                      : current.options,
                                }))
                              }
                              className="p-2 rounded-xl text-muted hover:text-accent-danger transition-colors"
                              aria-label="מחק אפשרות"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {draft.questionType === "slider" && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs text-muted mb-1">הגדרת סקאלה</label>
                    <p className="text-xs text-muted">בחר טווח ותן לכל שלב שם קצר וברור.</p>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    <div>
                      <label className="block text-[11px] text-muted mb-1">מינימום</label>
                      <input
                        type="number"
                        value={draft.sliderMin}
                        onChange={(event) => setDraft((current) => ({ ...current, sliderMin: Number(event.target.value) }))}
                        className="w-full px-3 py-2 rounded-xl bg-transparent border border-glass text-sm focus:outline-none focus:border-brand-blue transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-muted mb-1">מקסימום</label>
                      <input
                        type="number"
                        value={draft.sliderMax}
                        onChange={(event) => setDraft((current) => ({ ...current, sliderMax: Number(event.target.value) }))}
                        className="w-full px-3 py-2 rounded-xl bg-transparent border border-glass text-sm focus:outline-none focus:border-brand-blue transition-colors"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    {Array.from({ length: Math.max(2, draft.sliderMax - draft.sliderMin + 1) }, (_, index) => index).map((index) => (
                      <div key={index} className="grid gap-2 md:grid-cols-[92px_minmax(0,1fr)] items-center">
                        <div className="text-xs text-muted">שלב {draft.sliderMin + index}</div>
                        <input
                          type="text"
                          value={draft.sliderLabels[index] || ""}
                          onChange={(event) =>
                            setDraft((current) => {
                              const sliderLabels = [...current.sliderLabels];
                              sliderLabels[index] = event.target.value;
                              return { ...current, sliderLabels };
                            })
                          }
                          placeholder="לדוגמה: רגוע"
                          className="w-full px-3 py-2 rounded-xl bg-transparent border border-glass text-sm focus:outline-none focus:border-brand-blue transition-colors"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {draft.questionType === "text" && (
                <div className="rounded-2xl border border-dashed border-glass p-4">
                  <p className="text-sm font-medium">תשובה פתוחה</p>
                  <p className="text-xs text-muted mt-1">לא צריך להוסיף אפשרויות. הזוג יקבל שדה כתיבה חופשי.</p>
                </div>
              )}

              {draft.questionType === "guest_calculator" && (
                <div className="rounded-2xl border border-dashed border-glass p-4">
                  <p className="text-sm font-medium">מחשבון אורחים מובנה</p>
                  <p className="text-xs text-muted mt-1">השאלה הזו נעוצה כברירת מחדל. אפשר להסתיר אותה, אבל לא למחוק.</p>
                </div>
              )}

              <div className="rounded-2xl border border-glass p-4 space-y-3">
                <button
                  type="button"
                  onClick={() => setShowAdvanced((current) => !current)}
                  className="w-full flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <Sparkles className="w-4 h-4 text-brand-blue" />
                    הגדרות מתקדמות
                  </div>
                  <span className="text-xs text-muted">{showAdvanced ? "הסתר" : "הצג"}</span>
                </button>

                {showAdvanced && (
                  <div className="space-y-3">
                    <div>
                      <button
                        type="button"
                        onClick={() => setDraft((current) => ({ ...current, isActive: !current.isActive }))}
                        className={`text-xs px-3 py-2 rounded-full transition-colors ${draft.isActive ? "bg-brand-green/10 text-brand-green" : "bg-accent-danger/10 text-accent-danger"
                          }`}
                      >
                        {draft.isActive ? "השאלה פעילה" : "השאלה מוסתרת"}
                      </button>
                    </div>

                    <p className="text-[11px] text-muted">
                      אין צורך למלא מזהים טכניים. המערכת מייצרת אותם לבד מאחורי הקלעים.
                    </p>
                  </div>
                )}
              </div>

              <div className="flex flex-col-reverse md:flex-row gap-2">
                <button type="button" onClick={onClose} className="btn-secondary flex-1">
                  ביטול
                </button>
                <button
                  type="button"
                  onClick={saveDraft}
                  className="btn-primary flex-1 flex items-center justify-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  {mode === "edit" ? "שמור שינויים" : "הוסף שאלה"}
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <LayoutPanelTop className="w-4 h-4 text-brand-blue" />
                    תצוגה מקדימה
                  </div>
                  <p className="text-xs text-muted mt-1">כך זה ייראה לזוג במובייל.</p>
                </div>
                <span className="text-xs text-muted px-2 py-1 rounded-full border border-glass">
                  {getQuestionTypeMeta(previewQuestion.questionType).label}
                </span>
              </div>

              <QuestionPreviewCard question={previewQuestion} />
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function QuestionPreviewCard({ question }: { question: Question }) {
  return (
    <div className="mx-auto w-full max-w-sm rounded-[32px] border border-white/10 bg-black/20 p-3 shadow-2xl">
      <div className="rounded-[26px] border border-white/10 bg-[radial-gradient(circle_at_top,rgba(52,152,219,0.18),transparent_40%),rgba(255,255,255,0.03)] p-5 min-h-[520px] flex flex-col">
        <div className="flex items-center justify-center gap-1.5 mb-4">
          <span className="h-1.5 w-12 rounded-full bg-white/20" />
          <span className="h-1.5 w-7 rounded-full bg-brand-blue/70" />
          <span className="h-1.5 w-7 rounded-full bg-white/10" />
        </div>

        <div className="mb-5 min-h-[72px] flex items-center justify-center">
          <h3 className="text-xl font-bold text-center leading-relaxed text-balance">
            {question.questionHe || "כאן תופיע השאלה שלך"}
          </h3>
        </div>

        <div className="flex-1 flex flex-col">
          {question.questionType === "single_select" && (
            <div className="space-y-2.5">
              {(question.options?.length ? question.options : [{ label: "אפשרות לדוגמה", value: "example" }]).map((option) => (
                <div
                  key={option.value}
                  className="w-full text-right px-4 py-3 min-h-[52px] rounded-xl border border-glass text-secondary"
                >
                  {option.label}
                </div>
              ))}
            </div>
          )}

          {question.questionType === "multi_select" && (
            <div className="space-y-2.5">
              <p className="text-xs text-center text-muted">אפשר לבחור כמה אפשרויות</p>
              {(question.options?.length ? question.options : [{ label: "אפשרות לדוגמה", value: "example" }]).map((option, index) => (
                <div
                  key={`${option.value}-${index}`}
                  className={`w-full text-right px-4 py-3 min-h-[52px] rounded-xl border transition-all ${index === 0 ? "border-brand-blue bg-brand-blue/10 text-brand-blue font-medium" : "border-glass text-secondary"
                    }`}
                >
                  <span className="flex items-center gap-2">
                    <span
                      className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all flex-shrink-0 ${index === 0 ? "border-brand-blue bg-brand-blue" : "border-glass"
                        }`}
                    >
                      {index === 0 ? <span className="text-white text-xs">✓</span> : null}
                    </span>
                    <span className="flex-1 min-w-0 break-words">{option.label}</span>
                  </span>
                </div>
              ))}
            </div>
          )}

          {question.questionType === "slider" && (
            <div className="flex-1 flex flex-col justify-center space-y-5 px-1">
              <input
                type="range"
                min={question.sliderMin || 1}
                max={question.sliderMax || 5}
                value={Math.round(((question.sliderMin || 1) + (question.sliderMax || 5)) / 2)}
                readOnly
                className="w-full accent-brand-blue"
              />
              <div className="flex justify-between text-xs text-muted gap-2">
                {(question.sliderLabels?.length ? question.sliderLabels : ["רגוע", "זורם", "מקפיץ", "אש", "פסטיבל"]).map((label, index) => (
                  <span
                    key={`${label}-${index}`}
                    className={`transition-colors text-center flex-1 ${index === Math.floor(((question.sliderLabels?.length || 5) - 1) / 2) ? "text-brand-blue font-bold text-sm" : ""
                      }`}
                  >
                    {label}
                  </span>
                ))}
              </div>
            </div>
          )}

          {question.questionType === "text" && (
            <div className="flex-1 flex items-center">
              <textarea
                value=""
                readOnly
                placeholder="...ספרו לנו"
                rows={6}
                className="w-full h-[180px] px-4 py-3 rounded-xl bg-transparent border border-glass text-foreground placeholder:text-muted text-sm resize-none"
              />
            </div>
          )}

          {question.questionType === "guest_calculator" && (
            <div className="space-y-3">
              {["סה\"כ אורחים", "מבוגרים", "צעירים", "ילדים"].map((label) => (
                <div
                  key={label}
                  className="rounded-xl border border-glass px-4 py-3 text-sm text-secondary"
                >
                  {label}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
