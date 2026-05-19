"use client";

import { useEffect, useState } from "react";
import { useSaveWizardAnswers, useSubmitWizard } from "@/hooks/useBrain";
import { useLanguage } from "@/lib/i18n";

// ── Tooltip ──────────────────────────────────────────────────────────────────
function Tooltip({ text }: { text: string }) {
  return (
    <span className="relative inline-flex items-center group ml-1.5">
      <span
        className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full border border-muted-foreground/40 text-muted-foreground text-[10px] font-bold cursor-default leading-none select-none"
        aria-label="Help"
      >
        ?
      </span>
      <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 w-64 rounded-md bg-foreground text-background text-xs px-2.5 py-1.5 leading-snug shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-150 whitespace-normal">
        {text}
        <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-foreground" />
      </span>
    </span>
  );
}

const STEP_KEYS = ["company_info", "product", "audience", "differentiators"] as const;
type StepKey = typeof STEP_KEYS[number];

// Per-field shape used in wizard render
type WizardField = { label: string; placeholder: string; tooltip: string };

// Required fields (drives the asterisk indicator)
const REQUIRED_FIELDS = new Set(["company_name", "product_name", "product_description"]);
// Fields rendered as <textarea>
const TEXTAREA_FIELDS = new Set(["product_description", "pain_points", "differentiators"]);


interface WizardModalProps {
  open: boolean;
  onClose: () => void;
  /** "setup" = first-run (default); "review" = re-open with existing answers */
  mode?: "setup" | "review";
  /** Pre-filled answers for review mode */
  initialAnswers?: Record<string, string>;
}

export function WizardModal({ open, onClose, mode = "setup", initialAnswers }: WizardModalProps) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>(initialAnswers ?? {});
  const submitWizard = useSubmitWizard();
  const saveAnswers = useSaveWizardAnswers();
  const { t } = useLanguage();
  const w = t.aiBrain.wizard;

  // Sync initialAnswers when drawer opens in review mode
  useEffect(() => {
    if (open && mode === "review" && initialAnswers) {
      setAnswers(initialAnswers);
      setStep(0);
    }
    if (!open) {
      setStep(0);
      setAnswers({});
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;

  const currentStepKey: StepKey = STEP_KEYS[step];
  const currentStep = w.steps[currentStepKey];
  // Cast fields to a generic record to avoid TypeScript union-indexing narrowing to never
  const fields = currentStep.fields as Record<string, WizardField>;
  const fieldKeys = Object.keys(fields);
  const isLastStep = step === STEP_KEYS.length - 1;
  const isFirstStep = step === 0;

  function handleChange(name: string, value: string) {
    setAnswers((prev) => ({ ...prev, [name]: value }));
  }

  function handleNext() {
    if (!isLastStep) {
      setStep((s) => s + 1);
    }
  }

  function handleBack() {
    if (!isFirstStep) {
      setStep((s) => s - 1);
    }
  }

  async function handleSubmit() {
    await submitWizard.mutateAsync({ answers });
    onClose();
  }

  async function handleSaveOnly() {
    await saveAnswers.mutateAsync(answers);
    onClose();
  }

  async function handleSaveAndRegenerate() {
    await submitWizard.mutateAsync({ answers });
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="wizard-modal-title"
    >
      <div className="card w-full max-w-lg mx-4 p-6 space-y-6">
        {/* Header */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-muted-foreground font-medium">
              {w.stepOf.replace("{step}", String(step + 1)).replace("{total}", String(STEP_KEYS.length))}
            </span>
            <button
              type="button"
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground transition-colors"
              aria-label={w.close}
            >
              ✕
            </button>
          </div>
          {/* Progress bar */}
          <div className="w-full h-1 bg-border rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all"
              style={{ width: `${((step + 1) / STEP_KEYS.length) * 100}%` }}
            />
          </div>
        </div>

        <div>
          <h2 id="wizard-modal-title" className="text-lg font-semibold text-foreground">
            {currentStep.title}
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">{currentStep.description}</p>
        </div>

        {/* Fields */}
        <div className="space-y-4">
          {fieldKeys.map((fk) => {
            const field = fields[fk];
            const isRequired = REQUIRED_FIELDS.has(fk);
            const isTextarea = TEXTAREA_FIELDS.has(fk);
            return (
              <div key={fk} className="space-y-1.5">
                <label
                  htmlFor={fk}
                  className="text-sm font-medium text-foreground inline-flex items-center"
                >
                  {field.label}
                  {isRequired && <span className="text-destructive ml-0.5">*</span>}
                  <Tooltip text={field.tooltip} />
                </label>
                {isTextarea ? (
                  <textarea
                    id={fk}
                    name={fk}
                    rows={3}
                    value={answers[fk] ?? ""}
                    onChange={(e) => handleChange(fk, e.target.value)}
                    className="field-input resize-none"
                    placeholder={field.placeholder}
                    required={isRequired}
                  />
                ) : (
                  <input
                    id={fk}
                    name={fk}
                    type={fk === "website" ? "url" : "text"}
                    value={answers[fk] ?? ""}
                    onChange={(e) => handleChange(fk, e.target.value)}
                    className="field-input"
                    placeholder={field.placeholder}
                    required={isRequired}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Error */}
        {submitWizard.isError && (
          <p className="text-sm text-destructive">{w.error}</p>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            onClick={handleBack}
            disabled={isFirstStep}
            className="btn btn-secondary disabled:opacity-40"
          >
            {w.back}
          </button>
          {isLastStep ? (
            mode === "review" ? (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleSaveOnly}
                  disabled={saveAnswers.isPending || submitWizard.isPending}
                  className="btn btn-secondary disabled:opacity-60"
                >
                  {saveAnswers.isPending ? "Saving…" : "Save Only"}
                </button>
                <button
                  type="button"
                  onClick={handleSaveAndRegenerate}
                  disabled={submitWizard.isPending || saveAnswers.isPending}
                  className="btn btn-primary disabled:opacity-60"
                >
                  {submitWizard.isPending ? w.submitting : "Save + Regenerate"}
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitWizard.isPending}
                className="btn btn-primary disabled:opacity-60"
              >
                {submitWizard.isPending ? w.submitting : w.submit}
              </button>
            )
          ) : (
            <button
              type="button"
              onClick={handleNext}
              className="btn btn-primary"
            >
              {w.next}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
