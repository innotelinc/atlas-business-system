"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Check,
  CheckCircle2,
  CreditCard,
  Download,
  ExternalLink,
  FileSignature,
  Landmark,
  LayoutDashboard,
  ShieldCheck,
  HeartHandshake,
} from "lucide-react";
import { Badge, Button, Card, Checkbox, Input, Label, Spinner } from "@/components/ui";
import { DocumentBuilder, type DocData } from "./DocumentBuilder";
import { usd, formatType } from "@/lib/format";

type WizardState = {
  formation: {
    id: string;
    type: "LLC" | "FOR_PROFIT" | "NON_PROFIT";
    stateCode: string | null;
    businessName: string | null;
    status: string;
    paymentStatus: string;
    contractSignedAt: string | null;
    signature: string | null;
    analystReview: string;
    portalAccess: boolean;
    nameCheck: {
      sosSearched: boolean;
      sosResults: string | null;
      claimedAvailable: boolean;
      similarNames: string | null;
    } | null;
    document: { data: DocData } | null;
  } | null;
  state: {
    code: string;
    name: string;
    sosSiteUrl: string;
    nameSearchUrl: string | null;
    notes: string | null;
    fee: { stateFeeCents: number; filingTime: string | null; documentUrl: string | null; verified: boolean } | null;
  } | null;
  pricing: { serviceFeeCents: number; competitorRetailCents: number; competitorName: string } | null;
  services: {
    id: string;
    key: string;
    name: string;
    priceCents: number;
    recurring: boolean;
    interval: string | null;
    selected: boolean;
  }[];
  totals: {
    stateFeeCents: number;
    serviceFeeCents: number;
    oneTimeServices: number;
    recurringServices: number;
    totalCents: number;
  };
};

const STEP_LABELS = [
  "Entity type",
  "State",
  "Fees & services",
  "Name check",
  "Documents",
  "Review & sign",
  "Payment",
  "Your portal",
];

const TYPE_ICONS = {
  LLC: Building2,
  FOR_PROFIT: Landmark,
  NON_PROFIT: HeartHandshake,
};

export default function FormationWizard({ states }: { states: { code: string; name: string }[] }) {
  const searchParams = useSearchParams();
  const [data, setData] = useState<WizardState | null>(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/formation/current");
    const json = await res.json();
    setData(json);
    return json as WizardState;
  }, []);

  useEffect(() => {
    (async () => {
      const json = await load();
      setStep(initialStep(json));
      setLoading(false);
    })();
  }, [load]);

  const formation = data?.formation;
  const id = formation?.id;

  const patch = useCallback(
    async (body: Record<string, unknown>) => {
      if (!id) throw new Error("No formation");
      const res = await fetch(`/api/formation/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? "Something went wrong");
      }
      await load();
    },
    [id, load],
  );

  const goto = (s: number) => {
    setError(null);
    setStep(s);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const pickType = async (type: "LLC" | "FOR_PROFIT" | "NON_PROFIT") => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/formation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      });
      if (!res.ok) throw new Error("Could not start formation");
      await load();
      goto(1);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const pickState = async (code: string) => {
    setBusy(true);
    setError(null);
    try {
      await patch({ stateCode: code });
      goto(2);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const saveServices = async () => {
    if (!data) return;
    setBusy(true);
    setError(null);
    try {
      await patch({ selectedServices: data.services.filter((s) => s.selected).map((s) => s.id) });
      goto(3);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const saveNameCheck = async () => {
    if (!data?.formation) return;
    const nc = data.formation.nameCheck;
    if (!data.formation.businessName?.trim()) {
      setError("Enter a business name first.");
      return;
    }
    if (!nc?.sosSearched || !nc?.claimedAvailable) {
      setError(
        "Please search the state database and confirm the name appears available before continuing.",
      );
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await patch({ status: "NAME_CHECK" });
      goto(4);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const saveDocument = async (doc: DocData) => {
    setBusy(true);
    setError(null);
    try {
      await patch({ document: doc, status: "DOCUMENT_BUILD" });
      goto(5);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const sign = async () => {
    if (!data?.formation) return;
    if (!data.formation.signature?.trim()) {
      setError("Please type your signature.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await patch({
        signature: data.formation.signature.trim(),
        contractSignedAt: new Date().toISOString(),
        status: "SIGNED",
      });
      goto(6);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const checkout = async () => {
    if (!id) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/formation/${id}/checkout`, { method: "POST" });
      const json = await res.json();
      if (json.demo) {
        await load();
        goto(6); // show demo payment panel
      } else if (json.url) {
        window.location.href = json.url;
      } else {
        throw new Error(json.error ?? "Checkout failed");
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const demoPay = async () => {
    if (!id) return;
    setBusy(true);
    setError(null);
    try {
      await fetch(`/api/formation/${id}/demo-pay`, { method: "POST" });
      await load();
      goto(7);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const claim = async () => {
    if (!id) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/formation/${id}/claim`, { method: "POST" });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? "Could not link your formation");
      }
      await load();
      goto(7);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  // Stripe return — mark paid and jump to portal signup
  useEffect(() => {
    if (searchParams.get("paid") === "1" && data?.formation?.paymentStatus === "paid") {
      goto(7);
    }
  }, [searchParams, data]);

  const totals = data?.totals;
  const savings = useMemo(() => {
    if (!data?.pricing || !totals) return 0;
    return Math.max(0, data.pricing.competitorRetailCents + (totals.stateFeeCents ?? 0) - totals.totalCents);
  }, [data, totals]);

  if (loading) {
    return (
      <div className="mx-auto flex max-w-3xl flex-col items-center gap-4 px-4 py-24">
        <Spinner />
        <p className="text-sm text-slate-500">Loading your formation…</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      {/* Stepper */}
      <div className="mb-10 hidden items-center justify-center gap-2 md:flex">
        {STEP_LABELS.map((label, i) => (
          <div key={label} className="flex items-center gap-2">
            <button
              onClick={() => i < step && goto(i)}
              className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                i === step
                  ? "bg-brand-950 text-white"
                  : i < step
                    ? "bg-brand-100 text-brand-800 hover:bg-brand-200"
                    : "bg-slate-100 text-slate-400"
              }`}
            >
              {i < step ? <Check className="h-3 w-3" /> : <span>{i + 1}</span>}
              {label}
            </button>
            {i < STEP_LABELS.length - 1 && <span className="h-px w-4 bg-slate-300" />}
          </div>
        ))}
      </div>

      <div className="mb-8 md:hidden">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Step {step + 1} of {STEP_LABELS.length}
        </p>
        <h2 className="mt-1 text-xl font-bold text-brand-950">{STEP_LABELS[step]}</h2>
      </div>

      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </div>
      )}

      {/* STEP 0 — type */}
      {step === 0 && (
        <StepShell title="What kind of business are you forming?" subtitle="Choose one to begin.">
          <div className="grid gap-4 sm:grid-cols-3">
            {(["LLC", "FOR_PROFIT", "NON_PROFIT"] as const).map((t) => {
              const Icon = TYPE_ICONS[t];
              return (
                <button
                  key={t}
                  onClick={() => pickType(t)}
                  disabled={busy}
                  className="group rounded-2xl border-2 border-slate-200 bg-white p-6 text-left transition hover:border-brand-700 hover:shadow-md disabled:opacity-60"
                >
                  <Icon className="h-8 w-8 text-brand-700" />
                  <h3 className="mt-4 text-lg font-bold text-brand-950">
                    {t === "LLC" ? "LLC" : t === "FOR_PROFIT" ? "For-Profit" : "Non-Profit"}
                  </h3>
                  <p className="mt-1 text-sm text-slate-600">
                    {t === "LLC"
                      ? "Limited Liability Company"
                      : t === "FOR_PROFIT"
                        ? "Corporation"
                        : "Corporation"}
                  </p>
                  <p className="mt-3 text-xs text-slate-500">
                    {t === "LLC"
                      ? "Flexible, popular, pass-through taxation."
                      : t === "FOR_PROFIT"
                        ? "Shareholders, directors, investor-ready."
                        : "Tax-exempt mission-driven structure."}
                  </p>
                </button>
              );
            })}
          </div>
        </StepShell>
      )}

      {/* STEP 1 — state */}
      {step === 1 && (
        <StepShell
          title="Where will your business be formed?"
          subtitle="Choose the state of formation. We cover all 50 states."
          onBack={formation ? () => goto(0) : undefined}
        >
          <StatePicker states={states} onPick={pickState} busy={busy} />
        </StepShell>
      )}

      {/* STEP 2 — fees & services */}
      {step === 2 && data?.state && (
        <StepShell
          title={`Filing in ${data.state.name}`}
          subtitle="Here's exactly what it costs — state fees, our fee, and optional services."
          onBack={() => goto(1)}
        >
          {/* 2a — state filing fee */}
          <Card>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                  {data.state.name} Secretary of State filing fee
                </p>
                <p className="mt-1 text-3xl font-bold text-brand-950">
                  {usd(data.state.fee?.stateFeeCents ?? 0)}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Typical turnaround: {data.state.fee?.filingTime ?? "varies"} ·{" "}
                  {data.state.fee?.verified ? "Verified fee" : "Fee shown is a starting estimate — we confirm before filing"}
                </p>
              </div>
              {data.state.fee?.documentUrl && (
                <a
                  href={data.state.fee.documentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-300 px-4 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Official form (PDF) <ExternalLink className="h-4 w-4" />
                </a>
              )}
            </div>
          </Card>

          {/* 2b — our fees + retail comparison */}
          <Card className="mt-4">
            <h3 className="font-bold text-brand-950">Atlas fees vs. retail</h3>
            <div className="mt-4 grid gap-6 sm:grid-cols-2">
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2 text-sm">
                  <span className="text-slate-600">State filing fee</span>
                  <span className="font-semibold">{usd(totals?.stateFeeCents ?? 0)}</span>
                </div>
                <div className="flex items-center justify-between border-b border-slate-100 pb-2 text-sm">
                  <span className="text-slate-600">Atlas formation service fee</span>
                  <span className="font-semibold">{usd(totals?.serviceFeeCents ?? 0)}</span>
                </div>
                <div className="flex items-center justify-between text-sm font-bold text-brand-950">
                  <span>Your total with Atlas</span>
                  <span>{usd(totals?.totalCents ?? 0)}</span>
                </div>
              </div>
              <div className="rounded-xl bg-brand-50 p-4">
                <p className="text-sm font-medium text-slate-600">
                  Retail comparison: {data.pricing?.competitorName ?? "online formation services"}
                </p>
                <p className="mt-2 text-2xl font-bold text-brand-900">
                  {usd((data.pricing?.competitorRetailCents ?? 0) + (totals?.stateFeeCents ?? 0))}
                </p>
                <p className="mt-2 text-sm font-semibold text-emerald-700">
                  You save ~{usd(savings)} with Atlas
                </p>
              </div>
            </div>
            {data.state.notes && (
              <p className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
                {data.state.notes}
              </p>
            )}
          </Card>

          {/* Value-added services */}
          <Card className="mt-4">
            <h3 className="font-bold text-brand-950">Optional value-added services</h3>
            <p className="mt-1 text-sm text-slate-500">
              Skip these and pay only the state fee plus our flat formation fee.
            </p>
            <div className="mt-4 space-y-3">
              {data.services.map((s) => (
                <div
                  key={s.id}
                  className="flex items-start justify-between gap-4 rounded-xl border border-slate-200 p-4"
                >
                  <Checkbox
                    checked={s.selected}
                    onChange={(c) =>
                      setData((d) =>
                        d
                          ? {
                              ...d,
                              services: d.services.map((x) =>
                                x.id === s.id ? { ...x, selected: c } : x,
                              ),
                            }
                          : d,
                      )
                    }
                    label={s.name}
                    description={s.recurring ? "Recurring subscription" : "One-time fee"}
                  />
                  <span className="shrink-0 text-sm font-bold text-brand-700">
                    {usd(s.priceCents)}
                    {s.recurring && (
                      <span className="font-medium text-slate-500"> / {s.interval}</span>
                    )}
                  </span>
                </div>
              ))}
            </div>
          </Card>

          <div className="mt-6 flex justify-end">
            <Button onClick={saveServices} loading={busy}>
              Continue to name check <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </StepShell>
      )}

      {/* STEP 3 — name check */}
      {step === 3 && formation && data?.state && (
        <StepShell
          title="Make sure your name is available"
          subtitle={`Check the ${data.state.name} Secretary of State business database for duplicate or similar names.`}
          onBack={() => goto(2)}
        >
          <Card className="space-y-5">
            <div>
              <Label>Desired business name *</Label>
              <Input
                value={formation.businessName ?? ""}
                onChange={(e) =>
                  setData((d) =>
                    d
                      ? {
                          ...d,
                          formation: { ...d.formation!, businessName: e.target.value },
                        }
                      : d,
                  )
                }
                placeholder={`e.g. Your Name ${formation.type === "LLC" ? "LLC" : "Inc."}`}
              />
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-medium text-slate-700">
                1. Search the official state business database
              </p>
              {data.state.nameSearchUrl ? (
                <a
                  href={data.state.nameSearchUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex h-10 items-center gap-2 rounded-lg bg-brand-950 px-4 text-sm font-semibold text-white hover:bg-brand-800"
                >
                  Search {data.state.name} business names <ExternalLink className="h-4 w-4" />
                </a>
              ) : (
                <a
                  href={data.state.sosSiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex h-10 items-center gap-2 rounded-lg bg-brand-950 px-4 text-sm font-semibold text-white hover:bg-brand-800"
                >
                  Open {data.state.name} SOS site <ExternalLink className="h-4 w-4" />
                </a>
              )}
              <p className="mt-2 text-xs text-slate-500">
                Tip: search exact and similar spellings (e.g. “Acme LLC”, “Acme Co”, “Acme
                Corporation”). Exact duplicates and confusingly similar names are rejected.
              </p>
            </div>

            <Checkbox
              checked={formation.nameCheck?.sosSearched ?? false}
              onChange={(c) =>
                setData((d) =>
                  d
                    ? {
                        ...d,
                        formation: {
                          ...d.formation!,
                          nameCheck: {
                            sosSearched: c,
                            sosResults: d.formation?.nameCheck?.sosResults ?? null,
                            claimedAvailable: d.formation?.nameCheck?.claimedAvailable ?? false,
                            similarNames: d.formation?.nameCheck?.similarNames ?? null,
                          },
                        },
                      }
                    : d,
                )
              }
              label="I searched the state database and found no conflicting names"
            />
            <div>
              <Label>Search notes (optional)</Label>
              <Input
                value={formation.nameCheck?.sosResults ?? ""}
                onChange={(e) =>
                  setData((d) =>
                    d
                      ? {
                          ...d,
                          formation: {
                            ...d.formation!,
                            nameCheck: {
                              sosSearched: d.formation?.nameCheck?.sosSearched ?? false,
                              sosResults: e.target.value,
                              claimedAvailable: d.formation?.nameCheck?.claimedAvailable ?? false,
                              similarNames: d.formation?.nameCheck?.similarNames ?? null,
                            },
                          },
                        }
                      : d,
                  )
                }
                placeholder="What did the search show? Any similar names you found?"
              />
            </div>
            <Checkbox
              checked={formation.nameCheck?.claimedAvailable ?? false}
              onChange={(c) =>
                setData((d) =>
                  d
                    ? {
                        ...d,
                        formation: {
                          ...d.formation!,
                          nameCheck: {
                            sosSearched: d.formation?.nameCheck?.sosSearched ?? false,
                            sosResults: d.formation?.nameCheck?.sosResults ?? null,
                            claimedAvailable: c,
                            similarNames: d.formation?.nameCheck?.similarNames ?? null,
                          },
                        },
                      }
                    : d,
                )
              }
              label="I believe this name is available to register"
              description="Our analyst re-verifies availability during review."
            />
          </Card>

          <div className="mt-6 flex justify-end">
            <Button
              onClick={async () => {
                setBusy(true);
                try {
                  await patch({
                    businessName: formation.businessName,
                    nameCheck: {
                      sosSearched: formation.nameCheck?.sosSearched ?? false,
                      sosResults: formation.nameCheck?.sosResults ?? null,
                      claimedAvailable: formation.nameCheck?.claimedAvailable ?? false,
                      similarNames: formation.nameCheck?.similarNames ?? null,
                    },
                  });
                  await saveNameCheck();
                } catch (e) {
                  setError((e as Error).message);
                  setBusy(false);
                }
              }}
              loading={busy}
            >
              Continue to documents <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </StepShell>
      )}

      {/* STEP 4 — document builder */}
      {step === 4 && formation && (
        <StepShell
          title="Build your incorporation document"
          subtitle="Fill in the details below — we generate your Articles of Organization / Incorporation from them."
          onBack={() => goto(3)}
        >
          <Card>
            <DocumentBuilder
              type={formation.type}
              businessName={formation.businessName ?? ""}
              initial={formation.document?.data ?? {}}
              onSave={saveDocument}
              saving={busy}
            />
          </Card>
          {formation.document && (
            <div className="mt-4">
              <a
                href={`/api/formation/${id}/pdf`}
                target="_blank"
                className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                <Download className="h-4 w-4" /> Preview current PDF
              </a>
            </div>
          )}
        </StepShell>
      )}

      {/* STEP 5 — review & sign */}
      {step === 5 && formation && data?.state && (
        <StepShell
          title="Review your filing and sign"
          subtitle="Everything is summarized below. Download the document, review it, then sign."
          onBack={() => goto(4)}
        >
          <Card>
            <dl className="grid gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-xs font-semibold uppercase text-slate-500">Entity type</dt>
                <dd className="mt-1 font-semibold text-brand-950">{formatType(formation.type)}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase text-slate-500">State</dt>
                <dd className="mt-1 font-semibold text-brand-950">{data.state.name}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase text-slate-500">Business name</dt>
                <dd className="mt-1 font-semibold text-brand-950">
                  {formation.businessName ?? "—"}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase text-slate-500">Name check</dt>
                <dd className="mt-1">
                  {formation.nameCheck?.claimedAvailable ? (
                    <Badge tone="green">Claimed available</Badge>
                  ) : (
                    <Badge tone="amber">Not confirmed</Badge>
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase text-slate-500">Selected services</dt>
                <dd className="mt-1 text-sm text-slate-700">
                  {data.services.filter((s) => s.selected).length > 0
                    ? data.services
                        .filter((s) => s.selected)
                        .map((s) => s.name)
                        .join(", ")
                    : "None"}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase text-slate-500">Total due</dt>
                <dd className="mt-1 text-lg font-bold text-brand-950">{usd(totals?.totalCents ?? 0)}</dd>
              </div>
            </dl>
            <div className="mt-6 flex flex-wrap gap-3">
              <a
                href={`/api/formation/${id}/pdf`}
                target="_blank"
                className="inline-flex h-10 items-center gap-2 rounded-lg bg-brand-950 px-4 text-sm font-semibold text-white hover:bg-brand-800"
              >
                <Download className="h-4 w-4" /> Download your document (PDF)
              </a>
            </div>
          </Card>

          <Card className="mt-4">
            <h3 className="font-bold text-brand-950">Client contract</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              By signing below, you authorize Atlas Business System to prepare and submit the above
              incorporation documents to the {data.state.name} Secretary of State, to pay the state
              filing fee on your behalf, and to provide the selected services. You confirm that the
              information provided is accurate, that you have verified the availability of the
              business name, and that you understand state approval is at the discretion of the{" "}
              {data.state.name} Secretary of State. Our analyst reviews your filing within 24 hours;
              this review does not delay your formation or portal access.
            </p>
            <div className="mt-4 space-y-4">
              <div>
                <Label>Type your full legal signature *</Label>
                <Input
                  value={formation.signature ?? ""}
                  onChange={(e) =>
                    setData((d) =>
                      d ? { ...d, formation: { ...d.formation!, signature: e.target.value } } : d,
                    )
                  }
                  placeholder="e.g. Jane A. Smith"
                />
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="font-serif text-2xl italic text-brand-900">
                  {formation.signature || "Signature"}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {formation.contractSignedAt
                    ? new Date(formation.contractSignedAt).toLocaleString()
                    : "Not yet signed"}
                </p>
              </div>
            </div>
          </Card>

          <div className="mt-6 flex justify-end">
            <Button onClick={sign} loading={busy}>
              <FileSignature className="h-4 w-4" /> Sign & continue to payment
            </Button>
          </div>
        </StepShell>
      )}

      {/* STEP 6 — payment */}
      {step === 6 && (
        <StepShell
          title="Contract & payment"
          subtitle="Pay the state filing fee, our service fee, and any services you selected — securely via Stripe."
          onBack={() => goto(5)}
        >
          <Card>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600">State filing fee ({data?.state?.name})</span>
                <span className="font-semibold">{usd(totals?.stateFeeCents ?? 0)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600">Atlas formation service fee</span>
                <span className="font-semibold">{usd(totals?.serviceFeeCents ?? 0)}</span>
              </div>
              {totals && totals.oneTimeServices > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">One-time services</span>
                  <span className="font-semibold">{usd(totals.oneTimeServices)}</span>
                </div>
              )}
              {totals && totals.recurringServices > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">Subscription services (first year)</span>
                  <span className="font-semibold">{usd(totals.recurringServices)}</span>
                </div>
              )}
              <div className="flex items-center justify-between border-t border-slate-200 pt-3 text-base font-bold text-brand-950">
                <span>Total today</span>
                <span>{usd(totals?.totalCents ?? 0)}</span>
              </div>
            </div>

            <div className="mt-6">
              <Button onClick={checkout} loading={busy} className="w-full">
                <CreditCard className="h-4 w-4" /> Pay securely with Stripe
              </Button>
              <p className="mt-2 text-center text-xs text-slate-500">
                Recurring services are billed annually and can be managed in your portal. Cancellation
                anytime.
              </p>
            </div>
          </Card>

          {formation?.paymentStatus === "unpaid" && formation?.status === "PAYMENT_PENDING" && (
            <Card className="mt-4 border-amber-200 bg-amber-50">
              <p className="text-sm font-medium text-amber-800">
                Demo mode: Stripe isn&apos;t configured in this environment, so no real payment is
                taken. Complete the demo payment to continue.
              </p>
              <Button variant="secondary" onClick={demoPay} loading={busy} className="mt-3">
                Complete demo payment
              </Button>
            </Card>
          )}
        </StepShell>
      )}

      {/* STEP 7 — portal signup / done */}
      {step === 7 && (
        <StepShell title="You're almost there — set up your client portal">
          <PortalSignup
            formation={formation ?? null}
            claim={claim}
            busy={busy}
            paid={formation?.paymentStatus === "paid"}
          />
        </StepShell>
      )}
    </div>
  );
}

function initialStep(data: WizardState): number {
  const f = data.formation;
  if (!f) return 0;
  if (!f.stateCode) return 1;
  if (f.portalAccess) return 7;
  if (f.paymentStatus === "paid") return 7;
  if (f.status === "PAYMENT_PENDING" || f.status === "PAID") return 6;
  if (f.status === "SIGNED") return 5;
  if (f.status === "DOCUMENT_BUILD") return 4;
  if (f.status === "NAME_CHECK") return 3;
  return 2;
}

function StepShell({
  title,
  subtitle,
  onBack,
  children,
}: {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  children: React.ReactNode;
}) {
  return (
    <div>
      {onBack && (
        <button
          onClick={onBack}
          className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-brand-700"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
      )}
      <h1 className="text-3xl font-bold tracking-tight text-brand-950">{title}</h1>
      {subtitle && <p className="mt-2 text-slate-600">{subtitle}</p>}
      <div className="mt-8">{children}</div>
    </div>
  );
}

function StatePicker({
  states,
  onPick,
  busy,
}: {
  states: { code: string; name: string }[];
  onPick: (code: string) => void;
  busy: boolean;
}) {
  const [q, setQ] = useState("");
  const filtered = states.filter(
    (s) => s.name.toLowerCase().includes(q.toLowerCase()) || s.code.toLowerCase().includes(q.toLowerCase()),
  );
  return (
    <div>
      <div className="mb-4">
        <Input
          placeholder="Search 50 states… (e.g. Texas, DE)"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>
      <div className="grid max-h-[480px] grid-cols-2 gap-2 overflow-y-auto pr-1 sm:grid-cols-3 lg:grid-cols-4">
        {filtered.map((s) => (
          <button
            key={s.code}
            onClick={() => onPick(s.code)}
            disabled={busy}
            className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-left text-sm font-medium text-slate-700 transition hover:border-brand-700 hover:bg-brand-50 hover:text-brand-800 disabled:opacity-60"
          >
            <span className="truncate">{s.name}</span>
            <span className="ml-2 shrink-0 text-xs font-bold text-slate-400">{s.code}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function PortalSignup({
  formation,
  claim,
  busy,
  paid,
}: {
  formation: WizardState["formation"];
  claim: () => Promise<void>;
  busy: boolean;
  paid: boolean;
}) {
  const [mode, setMode] = useState<"register" | "login" | "claim">("register");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(mode === "register" ? { name, email, password } : { email, password }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Something went wrong");
      await claim();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6">
        <div className="flex items-center gap-3">
          <CheckCircle2 className="h-8 w-8 text-emerald-600" />
          <div>
            <p className="text-lg font-bold text-emerald-800">
              {paid ? "Payment confirmed" : "Formation underway"}
            </p>
            <p className="text-sm text-emerald-700">
              Our analyst reviews your filing within 24 hours — this never delays your formation or
              portal access. Create your portal account to track everything.
            </p>
          </div>
        </div>
      </div>

      <Card>
        <div className="mb-4 flex gap-2">
          <button
            onClick={() => setMode("register")}
            className={`rounded-lg px-4 py-2 text-sm font-semibold ${
              mode === "register" ? "bg-brand-950 text-white" : "bg-slate-100 text-slate-600"
            }`}
          >
            Create account
          </button>
          <button
            onClick={() => setMode("login")}
            className={`rounded-lg px-4 py-2 text-sm font-semibold ${
              mode === "login" ? "bg-brand-950 text-white" : "bg-slate-100 text-slate-600"
            }`}
          >
            I already have one
          </button>
        </div>
        <form onSubmit={submit} className="space-y-4">
          {mode === "register" && (
            <div>
              <Label>Your name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Jane Smith" required />
            </div>
          )}
          <div>
            <Label>Email</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
          </div>
          <div>
            <Label>Password</Label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={mode === "register" ? "At least 8 characters" : "Your password"}
              required
              minLength={mode === "register" ? 8 : 1}
            />
          </div>
          {error && <p className="text-sm font-medium text-red-600">{error}</p>}
          <Button type="submit" loading={submitting} className="w-full">
            {mode === "register" ? "Create portal account" : "Sign in"}
          </Button>
        </form>
      </Card>

      {formation?.portalAccess && (
        <div className="flex justify-center">
          <Link
            href="/portal"
            className="inline-flex h-12 items-center gap-2 rounded-xl bg-gold-400 px-8 font-bold text-brand-950 hover:bg-gold-500"
          >
            <LayoutDashboard className="h-5 w-5" /> Open your client portal
          </Link>
        </div>
      )}
      <p className="text-center text-xs text-slate-500">
        <ShieldCheck className="mr-1 inline h-3 w-3" />
        Your data is used only to prepare and file your formation documents.
      </p>
    </div>
  );
}
