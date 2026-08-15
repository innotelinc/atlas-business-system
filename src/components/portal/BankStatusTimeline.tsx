import { Check } from "lucide-react";

const STEPS = [
  { key: "received", label: "Received", desc: "We received your application." },
  { key: "in_review", label: "In review", desc: "Our team is reviewing your details." },
  { key: "approved", label: "Approved", desc: "Account setup is in progress with our backend office." },
  { key: "completed", label: "Account set up", desc: "Your business bank account is ready." },
] as const;

export function BankStatusTimeline({ status }: { status: string }) {
  if (status === "rejected") {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4">
        <p className="text-sm font-semibold text-red-800">Application needs attention</p>
        <p className="mt-1 text-xs text-red-700">
          We couldn&apos;t process your application as submitted. Contact us or resubmit with
          corrected details and we&apos;ll pick it right back up.
        </p>
      </div>
    );
  }

  const current = Math.max(
    0,
    STEPS.findIndex((s) => s.key === status),
  );

  return (
    <ol>
      {STEPS.map((s, i) => {
        const done = i < current || status === "completed";
        const active = i === current && status !== "completed";
        return (
          <li key={s.key} className="relative flex gap-4 pb-8 last:pb-0">
            {i < STEPS.length - 1 && (
              <span
                className={`absolute bottom-8 left-[13px] top-8 w-0.5 ${
                  done ? "bg-emerald-400" : "bg-slate-200"
                }`}
              />
            )}
            <span
              className={`z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 ${
                done
                  ? "border-emerald-500 bg-emerald-500 text-white"
                  : active
                    ? "border-brand-900 bg-brand-900 text-white ring-4 ring-brand-900/15"
                    : "border-slate-300 bg-white text-slate-300"
              }`}
            >
              {done ? (
                <Check className="h-4 w-4" />
              ) : (
                <span className="h-2 w-2 rounded-full bg-current" />
              )}
            </span>
            <div className="pt-0.5">
              <p
                className={`text-sm font-semibold ${
                  active ? "text-brand-950" : done ? "text-slate-700" : "text-slate-400"
                }`}
              >
                {s.label}
                {active && (
                  <span className="ml-2 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-800">
                    In progress
                  </span>
                )}
              </p>
              <p className="mt-0.5 text-xs text-slate-500">{s.desc}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
