"use client";

import { useState, useCallback } from "react";
import { useEventStore } from "@/stores/eventStore";
import { defaultQuestions } from "@/data/questions";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, ChevronLeft, SkipForward } from "lucide-react";
import type { Question } from "@/lib/types";

export function QuestionFlow() {
  const event = useEventStore((s) => s.event);
  const saveAnswer = useEventStore((s) => s.saveAnswer);
  const getAnswer = useEventStore((s) => s.getAnswer);
  const setStage = useEventStore((s) => s.setStage);
  const trackEvent = useEventStore((s) => s.trackEvent);

  const questions = defaultQuestions.filter(
    (q) => q.isActive && q.eventType === (event?.eventType || "wedding")
  );

  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(1);

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
      setStage(0);
    }
  }, [currentIndex, setStage]);

  const skip = useCallback(() => {
    trackEvent("question_skip", { questionId: question?.id });
    goNext();
  }, [goNext, trackEvent, question]);

  if (!question) return null;

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Progress */}
      <div className="flex items-center justify-center gap-1.5 mb-6">
        {questions.map((_, i) => (
          <div
            key={i}
            className={`progress-dot ${
              i === currentIndex ? "active" : i < currentIndex ? "done" : ""
            }`}
          />
        ))}
      </div>

      <div className="text-center text-xs text-muted mb-4">
        {currentIndex + 1} / {total}
      </div>

      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={question.id}
          custom={direction}
          initial={{ opacity: 0, x: direction * 100 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: direction * -100 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
          <QuestionCard
            question={question}
            existingValue={existingAnswer?.answerValue}
            onAnswer={(value) => {
              saveAnswer(question.id, value);
              if (question.questionType !== "text") {
                setTimeout(goNext, 400);
              }
            }}
            onSubmitText={() => goNext()}
          />
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex items-center justify-between mt-6 px-2">
        <button
          onClick={goBack}
          className="flex items-center gap-1 text-sm text-secondary hover:text-foreground transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
          הקודם
        </button>

        <button
          onClick={skip}
          className="flex items-center gap-1 text-sm text-muted hover:text-secondary transition-colors"
        >
          דלג
          <SkipForward className="w-4 h-4" />
        </button>

        {question.questionType === "text" && (
          <button
            onClick={goNext}
            className="flex items-center gap-1 text-sm text-brand-blue hover:text-brand-blue/80 transition-colors font-medium"
          >
            הבא
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}

function QuestionCard({
  question,
  existingValue,
  onAnswer,
  onSubmitText,
}: {
  question: Question;
  existingValue?: string | string[] | number;
  onAnswer: (value: string | string[] | number) => void;
  onSubmitText: () => void;
}) {
  const [multiSelected, setMultiSelected] = useState<string[]>(
    Array.isArray(existingValue) ? existingValue : []
  );
  const [textValue, setTextValue] = useState(
    typeof existingValue === "string" ? existingValue : ""
  );
  const [sliderValue, setSliderValue] = useState(
    typeof existingValue === "number" ? existingValue : 3
  );

  return (
    <div className="glass-card p-6 sm:p-8">
      <h2 className="text-xl font-bold text-center mb-6 leading-relaxed">
        {question.questionHe}
      </h2>

      {/* Single Select */}
      {question.questionType === "single_select" && question.options && (
        <div className="space-y-2">
          {question.options.map((opt) => (
            <motion.button
              key={opt.value}
              whileTap={{ scale: 0.97 }}
              onClick={() => onAnswer(opt.value)}
              className={`w-full text-right px-4 py-3 rounded-xl border transition-all ${
                existingValue === opt.value
                  ? "border-brand-blue bg-brand-blue/10 text-brand-blue font-medium"
                  : "border-glass text-secondary hover:border-brand-blue/50"
              }`}
            >
              {opt.label}
            </motion.button>
          ))}
        </div>
      )}

      {/* Multi Select */}
      {question.questionType === "multi_select" && question.options && (
        <div className="space-y-2">
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
                className={`w-full text-right px-4 py-3 rounded-xl border transition-all ${
                  isSelected
                    ? "border-brand-blue bg-brand-blue/10 text-brand-blue font-medium"
                    : "border-glass text-secondary hover:border-brand-blue/50"
                }`}
              >
                <span className="flex items-center gap-2">
                  <span
                    className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                      isSelected ? "border-brand-blue bg-brand-blue" : "border-glass"
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
                  {opt.label}
                </span>
              </motion.button>
            );
          })}
        </div>
      )}

      {/* Slider */}
      {question.questionType === "slider" && (
        <div className="space-y-4">
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
            <div className="flex justify-between text-xs text-muted">
              {question.sliderLabels.map((label, i) => (
                <span
                  key={i}
                  className={`transition-colors ${
                    i + (question.sliderMin || 1) === sliderValue
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

      {/* Text */}
      {question.questionType === "text" && (
        <div>
          <textarea
            value={textValue}
            onChange={(e) => {
              setTextValue(e.target.value);
              onAnswer(e.target.value);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                onSubmitText();
              }
            }}
            placeholder="...ספרו לנו"
            rows={3}
            className="w-full px-4 py-3 rounded-xl bg-transparent border border-glass text-foreground placeholder:text-muted text-sm focus:outline-none focus:border-brand-blue transition-colors resize-none"
          />
        </div>
      )}
    </div>
  );
}
