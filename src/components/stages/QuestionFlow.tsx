"use client";

import { useState, useCallback } from "react";
import { useEventStore } from "@/stores/eventStore";
import { useAdminStore } from "@/stores/adminStore";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, ChevronLeft, Home, Minus, Plus, Users } from "lucide-react";
import type { GuestCalculatorAnswer, Question } from "@/lib/types";
import {
  guestCalculatorDefaultQuestion,
  GUEST_CALCULATOR_QUESTION_ID,
} from "@/data/questions";

const GUEST_CALCULATOR_Q_ID = GUEST_CALCULATOR_QUESTION_ID;
const ETHNIC_MUSIC_Q_ID = "ethnic_music";
const ETHNIC_MUSIC_TEXT_ID = "ethnic_music_edah";

export function QuestionFlow() {
  const event = useEventStore((s) => s.event);
  const saveAnswer = useEventStore((s) => s.saveAnswer);
  const getAnswer = useEventStore((s) => s.getAnswer);
  const setStage = useEventStore((s) => s.setStage);
  const trackEvent = useEventStore((s) => s.trackEvent);

  const adminQuestions = useAdminStore((s) => s.questions);
  const currentEventType = event?.eventType || "wedding";
  const baseQuestions = adminQuestions
    .filter((q) => {
      if (!q.isActive) return false;
      const targets = q.eventTypes?.length ? q.eventTypes : [q.eventType];
      return targets.includes(currentEventType);
    })
    .sort((a, b) => a.sortOrder - b.sortOrder);

  const ethnicMusicQuestion: Question = {
    id: ETHNIC_MUSIC_Q_ID,
    eventType: event?.eventType || "wedding",
    sortOrder: 10_000,
    questionHe: "רוצים לשלב גם מוזיקת עדות?",
    questionType: "single_select",
    options: [
      { label: "כן", value: "yes" },
      { label: "לא", value: "no" },
    ],
    isActive: true,
  };

  const guestCalculatorQuestion =
    baseQuestions.find(
      (question) =>
        question.questionType === "guest_calculator" ||
        question.id === GUEST_CALCULATOR_Q_ID
    ) ?? {
      ...guestCalculatorDefaultQuestion,
      eventType: currentEventType,
      eventTypes: [currentEventType],
    };

  const otherQuestions = baseQuestions.filter(
    (question) =>
      question.id !== guestCalculatorQuestion.id &&
      question.questionType !== "guest_calculator"
  );

  const questions = guestCalculatorQuestion.isActive
    ? [guestCalculatorQuestion, ...otherQuestions, ethnicMusicQuestion]
    : [...otherQuestions, ethnicMusicQuestion];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [showEthnicModal, setShowEthnicModal] = useState(false);
  const [ethnicText, setEthnicText] = useState(
    typeof getAnswer(ETHNIC_MUSIC_TEXT_ID)?.answerValue === "string"
      ? (getAnswer(ETHNIC_MUSIC_TEXT_ID)?.answerValue as string)
      : ""
  );

  const question = questions[currentIndex];
  const total = questions.length;
  const existingAnswer = question ? getAnswer(question.id) : undefined;

  const goNext = useCallback(() => {
    if (currentIndex < total - 1) {
      setDirection(1);
      setCurrentIndex((i) => i + 1);
    } else {
      trackEvent("stage_complete", { stage: 1 });
      setStage(2);
    }
  }, [currentIndex, total, setStage, trackEvent]);

  const goBack = useCallback(() => {
    if (currentIndex > 0) {
      setDirection(-1);
      setCurrentIndex((i) => i - 1);
    } else {
      const ok = confirm("לחזור להגדרות האירוע? אפשר תמיד לחזור אחר כך");
      if (ok) setStage(0);
    }
  }, [currentIndex, setStage]);

  if (!question) return null;

  return (
    <div className="w-full max-w-md mx-auto min-h-[calc(100dvh-7.5rem)] sm:min-h-0 flex flex-col">
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              trackEvent("navigate_home", { from: "questions" });
              setStage(0);
            }}
            className="glass-card p-2 rounded-full transition-all hover:scale-110 active:scale-95"
            aria-label="חזרה למסך הבית"
            title="בית"
          >
            <Home className="w-4 h-4 text-muted" />
          </button>
        </div>
        <div className="text-xs text-muted" />
      </div>

      <div className="flex items-center justify-center gap-1.5 mb-4">
        {questions.map((_, i) => (
          <div
            key={i}
            className={`progress-dot ${i === currentIndex ? "active" : i < currentIndex ? "done" : ""
              }`}
          />
        ))}
      </div>

      <div className="text-center text-xs text-muted mb-3">
        {currentIndex + 1} / {total}
      </div>

      <div className="flex-1 flex flex-col min-h-0">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={question.id}
            custom={direction}
            initial={{ opacity: 0, x: direction * 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction * -100 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="flex-1 min-h-0"
          >
            <QuestionCard
              question={question}
              existingValue={existingAnswer?.answerValue}
              onAnswer={(value) => {
                if (question.id === ETHNIC_MUSIC_Q_ID) {
                  if (value === "yes") {
                    saveAnswer(ETHNIC_MUSIC_Q_ID, "yes");
                    setShowEthnicModal(true);
                    trackEvent("ethnic_music_yes", {});
                    return;
                  }
                  saveAnswer(ETHNIC_MUSIC_Q_ID, "no");
                  saveAnswer(ETHNIC_MUSIC_TEXT_ID, "");
                  trackEvent("ethnic_music_no", {});
                  return;
                }

                saveAnswer(question.id, value);
              }}
              onSubmitText={() => goNext()}
            />
          </motion.div>
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {showEthnicModal && (
          <EthnicMusicModal
            value={ethnicText}
            onChange={setEthnicText}
            onClose={() => setShowEthnicModal(false)}
            onSave={() => {
              saveAnswer(ETHNIC_MUSIC_TEXT_ID, ethnicText.trim());
              setShowEthnicModal(false);
            }}
          />
        )}
      </AnimatePresence>

      <div className="flex items-center justify-between mt-4 px-2 py-2">
        <button
          onClick={goBack}
          className="flex items-center gap-1 text-sm text-secondary hover:text-foreground transition-colors h-10"
        >
          <ChevronRight className="w-4 h-4" />
          הקודם
        </button>

        <button
          onClick={goNext}
          className="flex items-center gap-1 text-sm text-brand-blue hover:text-brand-blue/80 transition-colors font-medium h-10"
        >
          המשך
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

function EthnicMusicModal({
  value,
  onChange,
  onClose,
  onSave,
}: {
  value: string;
  onChange: (v: string) => void;
  onClose: () => void;
  onSave: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="glass-card p-6 w-full max-w-md space-y-4"
      >
        <div>
          <h3 className="font-bold text-lg">מה העדה שלכם?</h3>
          <p className="text-xs text-muted">אפשר לכתוב חופשי (למשל: מרוקאי/תימני/בוכרי/רוסי/מעורב וכו׳)</p>
        </div>

        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
          placeholder="...כתבו כאן"
          className="w-full px-4 py-3 rounded-xl bg-transparent border border-glass text-foreground placeholder:text-muted text-sm focus:outline-none focus:border-brand-blue transition-colors resize-none"
        />

        <div className="flex gap-2">
          <button type="button" onClick={onSave} className="btn-primary flex-1">
            שמור
          </button>
          <button type="button" onClick={onClose} className="btn-secondary flex-1">
            ביטול
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function QuestionCard({
  question,
  existingValue,
  onAnswer,
}: {
  question: Question;
  existingValue?: string | string[] | number | GuestCalculatorAnswer;
  onAnswer: (value: string | string[] | number | GuestCalculatorAnswer) => void;
  onSubmitText?: () => void;
}) {
  const [multiSelected, setMultiSelected] = useState<string[]>(
    Array.isArray(existingValue) ? existingValue : typeof existingValue === "string" ? [existingValue] : []
  );
  const [textValue, setTextValue] = useState(
    typeof existingValue === "string" ? existingValue : ""
  );
  const [sliderValue, setSliderValue] = useState(
    typeof existingValue === "number" ? existingValue : 3
  );

  return (
    <div className="glass-card px-5 py-5 sm:px-7 sm:py-7 h-[calc(100dvh-16rem)] min-h-[440px] max-h-[560px] sm:h-[540px] flex flex-col">
      <div className="mb-5 min-h-[72px] flex items-center justify-center">
        <h2 className="text-xl font-bold text-center leading-relaxed text-balance">
          {question.questionHe}
        </h2>
      </div>

      <div className="flex-1 min-h-0 flex flex-col">
        {question.questionType === "single_select" && question.options && (
          <div className="flex-1 min-h-0 overflow-y-auto pr-1 space-y-2.5 scrollbar-hide">
            {question.options.map((opt) => (
              <motion.button
                key={opt.value}
                whileTap={{ scale: 0.97 }}
                onClick={() => onAnswer(opt.value)}
                className={`w-full text-right px-4 py-3 min-h-[52px] rounded-xl border transition-all ${existingValue === opt.value
                  ? "border-brand-blue bg-brand-blue/10 text-brand-blue font-medium"
                  : "border-glass text-secondary hover:border-brand-blue/50"
                  }`}
              >
                {opt.label}
              </motion.button>
            ))}
          </div>
        )}

        {question.questionType === "multi_select" && question.options && (
          <div className="flex-1 min-h-0 flex flex-col">
            <p className="text-xs text-center text-muted mb-2 flex-shrink-0">אפשר לבחור כמה אפשרויות</p>
            <div className="flex-1 min-h-0 overflow-y-auto pr-1 space-y-2.5 scrollbar-hide">
              {question.options.map((opt) => {
                const isSelected = multiSelected.includes(opt.value);
                return (
                  <motion.button
                    key={opt.value}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => {
                      const updated = isSelected
                        ? multiSelected.filter((v) => v !== opt.value)
                        : [...multiSelected, opt.value];
                      setMultiSelected(updated);
                      onAnswer(updated);
                    }}
                    className={`w-full text-right px-4 py-3 min-h-[52px] rounded-xl border transition-all ${isSelected
                      ? "border-brand-blue bg-brand-blue/10 text-brand-blue font-medium"
                      : "border-glass text-secondary hover:border-brand-blue/50"
                      }`}
                  >
                    <span className="flex items-center gap-2">
                      <span
                        className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all flex-shrink-0 ${isSelected ? "border-brand-blue bg-brand-blue" : "border-glass"
                          }`}
                      >
                        {isSelected && (
                          <motion.span
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="text-white text-xs"
                          >
                            ✓
                          </motion.span>
                        )}
                      </span>
                      <span className="flex-1 min-w-0 break-words">{opt.label}</span>
                    </span>
                  </motion.button>
                );
              })}
            </div>
          </div>
        )}

        {question.questionType === "slider" && (
          <div className="flex-1 flex flex-col justify-center space-y-5 px-1">
            <input
              type="range"
              min={question.sliderMin || 1}
              max={question.sliderMax || 5}
              value={sliderValue}
              onChange={(e) => {
                const v = Number(e.target.value);
                setSliderValue(v);
                onAnswer(v);
              }}
              className="w-full accent-brand-blue"
            />
            {question.sliderLabels && (
              <div className="flex justify-between text-xs text-muted gap-2">
                {question.sliderLabels.map((label, i) => (
                  <span
                    key={i}
                    className={`transition-colors text-center flex-1 ${i + (question.sliderMin || 1) === sliderValue
                      ? "text-brand-blue font-bold text-sm"
                      : ""
                      }`}
                  >
                    {label}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {question.questionType === "text" && (
          <div className="flex-1 flex items-center">
            <textarea
              value={textValue}
              onChange={(e) => {
                setTextValue(e.target.value);
                onAnswer(e.target.value);
              }}
              placeholder="...ספרו לנו"
              rows={6}
              className="w-full h-[180px] px-4 py-3 rounded-xl bg-transparent border border-glass text-foreground placeholder:text-muted text-sm focus:outline-none focus:border-brand-blue transition-colors resize-none"
            />
          </div>
        )}

        {question.questionType === "guest_calculator" && (
          <GuestCalculatorCard
            existingValue={typeof existingValue === "object" && existingValue !== null && !Array.isArray(existingValue) ? existingValue as GuestCalculatorAnswer : undefined}
            onChange={onAnswer}
          />
        )}
      </div>
    </div>
  );
}

function GuestCalculatorCard({
  existingValue,
  onChange,
}: {
  existingValue?: GuestCalculatorAnswer;
  onChange: (value: GuestCalculatorAnswer) => void;
}) {
  const initialTotal = existingValue?.totalGuests && existingValue.totalGuests > 0 ? existingValue.totalGuests : 300;
  const initialAdults = existingValue?.adults ?? Math.max(0, Math.round(initialTotal * 0.55));
  const initialYoungAdults = existingValue?.youngAdults ?? Math.max(0, Math.round(initialTotal * 0.3));
  const initialChildren = existingValue?.children ?? Math.max(0, initialTotal - initialAdults - initialYoungAdults);

  const [totalGuests, setTotalGuests] = useState(initialTotal);
  const [adults, setAdults] = useState(initialAdults);
  const [youngAdults, setYoungAdults] = useState(initialYoungAdults);
  const [children, setChildren] = useState(initialChildren);

  const clamp = (value: number) => Math.max(0, Math.min(totalGuests, value));

  const syncAnswer = (nextTotal: number, nextAdults: number, nextYoungAdults: number, nextChildren: number) => {
    const normalizedTotal = Math.max(0, nextTotal);
    const answer: GuestCalculatorAnswer = {
      totalGuests: normalizedTotal,
      adults: Math.max(0, nextAdults),
      youngAdults: Math.max(0, nextYoungAdults),
      children: Math.max(0, nextChildren),
    };
    onChange(answer);
  };

  const distributeFromTotal = (nextTotal: number) => {
    const normalizedTotal = Math.max(0, nextTotal);
    const nextAdults = Math.round(normalizedTotal * 0.55);
    const nextYoungAdults = Math.round(normalizedTotal * 0.3);
    const nextChildren = Math.max(0, normalizedTotal - nextAdults - nextYoungAdults);
    setTotalGuests(normalizedTotal);
    setAdults(nextAdults);
    setYoungAdults(nextYoungAdults);
    setChildren(nextChildren);
    syncAnswer(normalizedTotal, nextAdults, nextYoungAdults, nextChildren);
  };

  const adjustSegment = (segment: "adults" | "youngAdults" | "children", delta: number) => {
    const values = { adults, youngAdults, children };
    const nextValue = clamp(values[segment] + delta);
    const updated = { ...values, [segment]: nextValue };
    const nextTotal = updated.adults + updated.youngAdults + updated.children;
    setAdults(updated.adults);
    setYoungAdults(updated.youngAdults);
    setChildren(updated.children);
    setTotalGuests(nextTotal);
    syncAnswer(nextTotal, updated.adults, updated.youngAdults, updated.children);
  };

  const segments = [
    {
      key: "adults" as const,
      label: "מבוגרים ומשפחה",
      hint: "הורים, דודים, מבוגרים ומשפחה מורחבת",
      value: adults,
    },
    {
      key: "youngAdults" as const,
      label: "חברים וצעירים",
      hint: "החבר׳ה, צעירים ורחבה פעילה",
      value: youngAdults,
    },
    {
      key: "children" as const,
      label: "ילדים ונוער",
      hint: "ילדים, אחים קטנים ובני נוער",
      value: children,
    },
  ];

  return (
    <div className="flex flex-1 flex-col justify-center">
      <div className="rounded-[26px] border border-white/10 bg-white/[0.03] p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold">מחשבון אורחים חכם</p>
            <p className="mt-1 text-xs leading-5 text-muted">הכניסו כמות כוללת, וקבלו חלוקה התחלתית שאפשר לדייק.</p>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.04]">
            <Users className="h-5 w-5 text-brand-blue" />
          </div>
        </div>

        <div className="mt-5 rounded-[22px] border border-white/10 bg-black/15 p-4 text-center">
          <p className="text-xs text-muted">סה״כ אורחים</p>
          <div className="mt-2 flex items-center justify-center gap-3">
            <button
              onClick={() => distributeFromTotal(totalGuests - 10)}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-secondary transition-colors hover:text-white"
              type="button"
            >
              <Minus className="h-4 w-4" />
            </button>
            <div className="min-w-[110px] text-center">
              <p className="text-[34px] font-black leading-none tracking-[-0.05em] tabular-nums">{totalGuests}</p>
              <p className="mt-1 text-[11px] text-secondary">אורחים משוערים</p>
            </div>
            <button
              onClick={() => distributeFromTotal(totalGuests + 10)}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-secondary transition-colors hover:text-white"
              type="button"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
          <input
            type="range"
            min={50}
            max={1200}
            step={10}
            value={totalGuests}
            onChange={(e) => distributeFromTotal(Number(e.target.value))}
            className="mt-4 w-full accent-brand-blue"
          />
        </div>

        <div className="mt-4 space-y-2.5">
          {segments.map((segment) => (
            <div key={segment.key} className="rounded-[20px] border border-white/10 bg-black/15 px-3 py-3">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium">{segment.label}</p>
                  <p className="mt-0.5 text-[11px] text-muted">{segment.hint}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => adjustSegment(segment.key, -5)}
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-secondary transition-colors hover:text-white"
                    type="button"
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                  <div className="min-w-[44px] text-center text-sm font-bold tabular-nums">{segment.value}</div>
                  <button
                    onClick={() => adjustSegment(segment.key, 5)}
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-secondary transition-colors hover:text-white"
                    type="button"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 rounded-[18px] border border-brand-blue/20 bg-brand-blue/10 px-3 py-2 text-center text-xs text-brand-blue">
          ביחד כרגע: {adults + youngAdults + children} אורחים
        </div>
      </div>
    </div>
  );
}
