import { motion } from "framer-motion";
import { useRef, useState } from "react";
import { fadeUp } from "../lib/animations";
import { burialPlate } from "../data/plates";
import { supabase, isSupabaseConfigured } from "../lib/supabase";
import SectionIntro from "./SectionIntro";
import SectionPlate from "./SectionPlate";
import Turnstile, { type TurnstileHandle } from "./Turnstile";

const LIMITS = { name: 80, epitaph: 280, stack: 120, repo: 300 };

const EMPTY = {
  name: "",
  epitaph: "",
  stack: "",
  stars: "",
  commits: "",
  repo: "",
  website: "", // honeypot — real visitors never see or fill this
};

const fieldClass =
  "w-full rounded-lg bg-input/60 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/60 outline-none ring-1 ring-inset ring-border/60 transition focus:ring-ring";

const labelClass = "block text-xs uppercase tracking-[2px] text-muted-foreground";

type Status = "idle" | "submitting" | "success" | "error";

/** Mirrors the edge function's own checks, so most mistakes get caught before a round trip. */
function validate(form: typeof EMPTY) {
  const errors: Partial<Record<keyof typeof EMPTY, string>> = {};
  const name = form.name.trim();
  const epitaph = form.epitaph.trim();

  if (!name) errors.name = "Project name is required.";
  else if (name.length > LIMITS.name) errors.name = `Keep it under ${LIMITS.name} characters.`;

  if (!epitaph) errors.epitaph = "Give it an epitaph.";
  else if (epitaph.length > LIMITS.epitaph) errors.epitaph = `Keep it under ${LIMITS.epitaph} characters.`;

  if (form.stack.trim().length > LIMITS.stack) {
    errors.stack = `Keep it under ${LIMITS.stack} characters.`;
  }

  if (form.repo.trim()) {
    try {
      const u = new URL(form.repo.trim());
      if (u.protocol !== "http:" && u.protocol !== "https:") throw new Error("bad protocol");
    } catch {
      errors.repo = "That doesn't look like a valid http(s) URL.";
    }
  }

  return errors;
}

const ERROR_MESSAGES: Record<string, string> = {
  rate_limited: "Three burials a day is the limit here — try again tomorrow.",
  turnstile_failed: "Verification didn't go through. Try the checkbox again.",
  invalid_json: "Something went wrong sending that. Try again.",
  server_error: "The ground rejected it — something failed on our end. Try again shortly.",
  network: "Couldn't reach the server. Check your connection and try again.",
};

export default function BurialGround() {
  const [form, setForm] = useState(EMPTY);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof typeof EMPTY, string>>>({});
  const [status, setStatus] = useState<Status>("idle");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const turnstileRef = useRef<TurnstileHandle>(null);

  const siteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY;
  const turnstileEnabled = Boolean(siteKey);

  const set =
    (key: keyof typeof EMPTY) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Honeypot: a filled hidden field means a bot. Pretend it worked and
    // stop — never signal back that anything was detected.
    if (form.website.trim()) {
      setStatus("success");
      setStatusMessage("Your project has been laid to rest — pending review.");
      setForm(EMPTY);
      return;
    }

    const errors = validate(form);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    if (turnstileEnabled && !turnstileToken) {
      setStatus("error");
      setStatusMessage("Complete the verification check below before submitting.");
      return;
    }

    if (!supabase) {
      setStatus("error");
      setStatusMessage("Submissions aren't available right now — the backend isn't configured.");
      return;
    }

    setStatus("submitting");
    setStatusMessage(null);

    try {
      const { data, error } = await supabase.functions.invoke("submit-project", {
        body: {
          name: form.name.trim(),
          epitaph: form.epitaph.trim(),
          stack: form.stack.trim(),
          stars: form.stars,
          commits: form.commits,
          repo: form.repo.trim(),
          website: form.website,
          turnstileToken,
        },
      });

      if (error) throw error;

      if (!data?.ok) {
        const code = typeof data?.error === "string" ? data.error : "server_error";
        if (code === "validation_failed" && data.fields) {
          setFieldErrors(data.fields);
          setStatus("error");
          setStatusMessage("Fix the highlighted fields and try again.");
        } else {
          setStatus("error");
          setStatusMessage(ERROR_MESSAGES[code] ?? ERROR_MESSAGES.server_error);
        }
        turnstileRef.current?.reset();
        setTurnstileToken(null);
        return;
      }

      setStatus("success");
      setStatusMessage("Your project has been laid to rest — pending review.");
      setForm(EMPTY);
      setFieldErrors({});
      setTurnstileToken(null);
      turnstileRef.current?.reset();
    } catch (err) {
      console.error("submission failed", err);
      setStatus("error");
      setStatusMessage(ERROR_MESSAGES.network);
      turnstileRef.current?.reset();
      setTurnstileToken(null);
    }
  };

  const submitting = status === "submitting";

  return (
    <section id="burial-ground" className="relative overflow-hidden px-6 py-28 md:px-28 md:py-36">
      <SectionPlate {...burialPlate} />

      <div className="relative z-10">
        <SectionIntro
          eyebrow="The Burial Ground"
          heading={
            <>
              Lay one <span className="font-serif font-normal italic">to rest</span>
            </>
          }
          subtext={'Give it a proper burial instead of a folder called "final_final_v3."'}
        />

        <motion.div {...fadeUp(0.15)} className="mx-auto mt-16 max-w-xl">
          <form onSubmit={handleSubmit} noValidate className="liquid-glass rounded-2xl p-8 md:p-10">
            <h3 className="text-2xl font-medium tracking-[-0.5px]">Burial Record</h3>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Filled in by hand, entered into the ground. A moderator reviews it before it
              appears.
            </p>

            {!isSupabaseConfigured && (
              <p className="mt-4 rounded-lg bg-white/[0.05] px-4 py-3 text-xs text-muted-foreground ring-1 ring-inset ring-white/10">
                Submissions are offline — the site owner hasn't connected a backend yet.
              </p>
            )}

            <div className="mt-8 space-y-5">
              {/* Honeypot — off-screen, unreachable by tab, invisible to a real visitor. */}
              <div aria-hidden="true" className="absolute left-[-9999px] top-auto h-px w-px overflow-hidden">
                <label htmlFor="bury-website">Website</label>
                <input
                  id="bury-website"
                  name="website"
                  type="text"
                  tabIndex={-1}
                  autoComplete="off"
                  value={form.website}
                  onChange={set("website")}
                />
              </div>

              <Field
                id="bury-name"
                label="Project name"
                error={fieldErrors.name}
                required
                value={form.name}
                onChange={set("name")}
                placeholder="what it was called"
                maxLength={LIMITS.name}
                disabled={submitting}
              />

              <div className="space-y-2">
                <label className={labelClass} htmlFor="bury-epitaph">
                  Epitaph
                </label>
                <textarea
                  id="bury-epitaph"
                  className={`${fieldClass} min-h-[96px] resize-y`}
                  required
                  maxLength={LIMITS.epitaph}
                  value={form.epitaph}
                  onChange={set("epitaph")}
                  placeholder="the one honest sentence"
                  disabled={submitting}
                  aria-invalid={Boolean(fieldErrors.epitaph)}
                  aria-describedby={fieldErrors.epitaph ? "bury-epitaph-error" : undefined}
                />
                <div className="flex items-center justify-between">
                  {fieldErrors.epitaph ? (
                    <p id="bury-epitaph-error" role="alert" className="text-xs text-red-400/90">
                      {fieldErrors.epitaph}
                    </p>
                  ) : (
                    <span />
                  )}
                  <span className="text-[11px] text-muted-foreground">
                    {form.epitaph.length}/{LIMITS.epitaph}
                  </span>
                </div>
              </div>

              <Field
                id="bury-stack"
                label="Stack"
                error={fieldErrors.stack}
                value={form.stack}
                onChange={set("stack")}
                placeholder="React · Regret"
                maxLength={LIMITS.stack}
                disabled={submitting}
              />

              <div className="grid grid-cols-2 gap-5">
                <Field
                  id="bury-stars"
                  label="Stars"
                  type="number"
                  min={0}
                  value={form.stars}
                  onChange={set("stars")}
                  placeholder="0"
                  disabled={submitting}
                />
                <Field
                  id="bury-commits"
                  label="Commits"
                  type="number"
                  min={0}
                  value={form.commits}
                  onChange={set("commits")}
                  placeholder="0"
                  disabled={submitting}
                />
              </div>

              <Field
                id="bury-repo"
                label="Repo URL"
                type="url"
                error={fieldErrors.repo}
                value={form.repo}
                onChange={set("repo")}
                placeholder="https://github.com/you/project"
                maxLength={LIMITS.repo}
                disabled={submitting}
              />
            </div>

            {siteKey && (
              <div className="mt-6">
                <Turnstile
                  ref={turnstileRef}
                  siteKey={siteKey}
                  onToken={setTurnstileToken}
                  onExpire={() => setTurnstileToken(null)}
                  onError={() => setTurnstileToken(null)}
                />
              </div>
            )}

            <motion.button
              type="submit"
              whileHover={submitting ? undefined : { scale: 1.02 }}
              whileTap={submitting ? undefined : { scale: 0.98 }}
              disabled={submitting || !isSupabaseConfigured}
              className="mt-8 w-full rounded-full bg-foreground px-8 py-3.5 text-xs font-semibold tracking-[2px] text-background disabled:opacity-40"
            >
              {submitting ? "LOWERING IT IN…" : "BURY IT"}
            </motion.button>

            {statusMessage && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                role={status === "error" ? "alert" : "status"}
                className={`mt-4 text-center text-sm ${
                  status === "error" ? "text-red-400/90" : "text-muted-foreground"
                }`}
              >
                {statusMessage}
              </motion.p>
            )}
          </form>
        </motion.div>
      </div>
    </section>
  );
}

interface FieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

function Field({ label, error, id, ...rest }: FieldProps) {
  return (
    <div className="space-y-2">
      <label className={labelClass} htmlFor={id}>
        {label}
      </label>
      <input
        id={id}
        className={fieldClass}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        {...rest}
      />
      {error && (
        <p id={`${id}-error`} role="alert" className="text-xs text-red-400/90">
          {error}
        </p>
      )}
    </div>
  );
}
