"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Input, Label, Textarea, Button } from "@/components/ui";

export type DocData = Record<string, unknown>;

export type FormFieldDef =
  | {
      key: string;
      label: string;
      type: "text" | "textarea";
      required: boolean;
      placeholder?: string;
    }
  | { key: string; label: string; type: "select"; required: boolean; options: string[] }
  | { key: string; label: string; type: "people"; required: boolean; roleLabel?: string | null }
  | { key: string; label: string; type: "checkbox"; required: boolean };

// Read a nested key like "registeredAgent.name" out of the data object.
function read(data: DocData, key: string): unknown {
  const parts = key.split(".");
  let cur: unknown = data;
  for (const p of parts) {
    if (cur && typeof cur === "object") cur = (cur as Record<string, unknown>)[p];
    else return undefined;
  }
  return cur;
}

// Write a nested key like "registeredAgent.name" into the data object.
function write(data: DocData, key: string, value: unknown): DocData {
  const parts = key.split(".");
  const next: DocData = { ...data };
  let cur = next;
  for (let i = 0; i < parts.length - 1; i++) {
    const prev = (cur[parts[i]] as DocData | undefined) ?? {};
    cur[parts[i]] = { ...prev };
    cur = cur[parts[i]] as DocData;
  }
  cur[parts[parts.length - 1]] = value;
  return next;
}

export function DocumentBuilder({
  type,
  businessName,
  initial,
  fields,
  onSave,
  saving,
}: {
  type: "LLC" | "FOR_PROFIT" | "NON_PROFIT";
  businessName: string;
  initial: DocData;
  fields?: FormFieldDef[] | null;
  onSave: (data: DocData) => Promise<void>;
  saving: boolean;
}) {
  const [data, setData] = useState<DocData>({
    businessName: businessName || undefined,
    ...initial,
  });
  const set = (key: string, value: unknown) => setData((d) => write(d, key, value));

  const peopleValue = (key: string): { name: string; role: string }[] =>
    ((data[key] as { name?: string; role?: string }[]) ?? []).map((p) => ({
      name: p.name ?? "",
      role: p.role ?? "",
    }));

  // If the state form template is available, render exactly its fields.
  if (fields && fields.length > 0) {
    return (
      <div className="space-y-6">
        {fields.map((f) => (
          <Field
            key={f.key}
            field={f}
            value={read(data, f.key)}
            onChange={(v) => set(f.key, v)}
          />
        ))}
        <Button loading={saving} onClick={() => onSave(data)} className="w-full sm:w-auto">
          Save document details
        </Button>
      </div>
    );
  }

  // Fallback (no template): the generic field set.
  const members = peopleValue("members");
  const directors = peopleValue("directors");

  return (
    <div className="space-y-6">
      <div>
        <Label>Business name *</Label>
        <Input
          value={(data.businessName as string) ?? businessName ?? ""}
          onChange={(e) => set("businessName", e.target.value)}
          placeholder="e.g. Atlas Ventures LLC"
        />
      </div>
      <div>
        <Label>Principal office address *</Label>
        <Input
          value={(data.principalAddress as string) ?? ""}
          onChange={(e) => set("principalAddress", e.target.value)}
          placeholder="Street, City, State ZIP"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label>Registered agent name *</Label>
          <Input
            value={((data.registeredAgent as { name?: string })?.name) ?? ""}
            onChange={(e) =>
              set("registeredAgent.name", e.target.value)
            }
            placeholder="Agent name"
          />
        </div>
        <div>
          <Label>Registered agent address *</Label>
          <Input
            value={((data.registeredAgent as { address?: string })?.address) ?? ""}
            onChange={(e) =>
              set("registeredAgent.address", e.target.value)
            }
            placeholder="Street, City, State ZIP"
          />
        </div>
      </div>

      {type === "LLC" && (
        <>
          <div>
            <Label>Management structure</Label>
            <SelectOptions
              value={(data.management as string) ?? ""}
              options={["member-managed", "manager-managed"]}
              labels={{ "member-managed": "Member-managed", "manager-managed": "Manager-managed" }}
              onChange={(v) => set("management", v)}
            />
          </div>
          <PeopleList
            title="Members"
            people={members}
            roleLabel="Title (optional)"
            onChange={(list) => set("members", list.map((m) => ({ name: m.name, title: m.role })))}
          />
        </>
      )}

      {(type === "FOR_PROFIT" || type === "NON_PROFIT") && (
        <>
          <PeopleList
            title={type === "FOR_PROFIT" ? "Directors" : "Directors (board)"}
            people={directors}
            roleLabel={null}
            onChange={(list) => set("directors", list.map((d) => ({ name: d.name })))}
          />
          <div>
            <Label>Incorporator</Label>
            <Input
              value={(data.incorporator as string) ?? ""}
              onChange={(e) => set("incorporator", e.target.value)}
              placeholder="Full legal name"
            />
          </div>
          {type === "FOR_PROFIT" && (
            <div>
              <Label>Authorized shares</Label>
              <Input
                value={(data.shares as string) ?? ""}
                onChange={(e) => set("shares", e.target.value)}
                placeholder="e.g. 1,000,000 shares of $0.001 par value common stock"
              />
            </div>
          )}
          {type === "NON_PROFIT" && (
            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <input
                type="checkbox"
                checked={Boolean(data.c501c3)}
                onChange={(e) => set("c501c3", e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-brand-700"
              />
              <span className="text-sm text-slate-700">
                <span className="font-semibold">501(c)(3) intent</span> — This non-profit intends to
                apply for tax-exempt status under Section 501(c)(3) of the Internal Revenue Code.
              </span>
            </label>
          )}
        </>
      )}

      <div>
        <Label>{type === "LLC" ? "Statement of purpose" : "Purpose statement"}</Label>
        <Textarea
          rows={3}
          value={(data.purpose as string) ?? ""}
          onChange={(e) => set("purpose", e.target.value)}
          placeholder={
            type === "NON_PROFIT"
              ? "Describe the charitable, religious, educational, or scientific purpose of the organization."
              : "The purpose for which the business is formed (e.g. general business purposes)."
          }
        />
      </div>

      <Button loading={saving} onClick={() => onSave(data)} className="w-full sm:w-auto">
        Save document details
      </Button>
    </div>
  );
}

function Field({
  field,
  value,
  onChange,
}: {
  field: FormFieldDef;
  value: unknown;
  onChange: (value: unknown) => void;
}) {
  if (field.type === "textarea") {
    return (
      <div>
        <Label>
          {field.label}
          {field.required && " *"}
        </Label>
        <Textarea
          rows={3}
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
        />
      </div>
    );
  }
  if (field.type === "select") {
    return (
      <div>
        <Label>
          {field.label}
          {field.required && " *"}
        </Label>
        <SelectOptions
          value={(value as string) ?? ""}
          options={field.options}
          onChange={(v) => onChange(v)}
        />
      </div>
    );
  }
  if (field.type === "people") {
    const people = ((value as { name?: string; role?: string }[]) ?? []).map((p) => ({
      name: p.name ?? "",
      role: p.role ?? "",
    }));
    return (
      <PeopleList
        title={field.label}
        people={people}
        roleLabel={field.roleLabel ?? null}
        onChange={(list) =>
          onChange(list.map((p) => ({ name: p.name, role: p.role })))
        }
      />
    );
  }
  if (field.type === "checkbox") {
    return (
      <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
        <input
          type="checkbox"
          checked={Boolean(value)}
          onChange={(e) => onChange(e.target.checked)}
          className="mt-0.5 h-4 w-4 rounded border-slate-300 text-brand-700"
        />
        <span className="text-sm text-slate-700">{field.label}</span>
      </label>
    );
  }
  return (
    <div>
      <Label>
        {field.label}
        {field.required && " *"}
      </Label>
      <Input
        value={(value as string) ?? ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={field.placeholder}
      />
    </div>
  );
}

function SelectOptions({
  value,
  options,
  labels,
  onChange,
}: {
  value: string;
  options: string[];
  labels?: Record<string, string>;
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-3">
      {options.map((opt) => {
        const label = labels?.[opt] ?? opt;
        const selected = value.toLowerCase() === opt.toLowerCase();
        return (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(opt)}
            className={`rounded-lg border px-4 py-2 text-sm font-medium transition ${
              selected
                ? "border-brand-700 bg-brand-50 text-brand-800"
                : "border-slate-300 bg-white text-slate-600 hover:bg-slate-50"
            }`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

function PeopleList({
  title,
  people,
  roleLabel,
  onChange,
}: {
  title: string;
  people: { name: string; role: string }[];
  roleLabel: string | null;
  onChange: (people: { name: string; role: string }[]) => void;
}) {
  return (
    <div>
      <Label>{title}</Label>
      <div className="space-y-2">
        {people.map((p, i) => (
          <div key={i} className="flex gap-2">
            <Input
              value={p.name}
              placeholder="Full legal name"
              onChange={(e) =>
                onChange(people.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))
              }
            />
            {roleLabel && (
              <Input
                value={p.role}
                placeholder={roleLabel}
                className="w-48"
                onChange={(e) =>
                  onChange(people.map((x, j) => (j === i ? { ...x, role: e.target.value } : x)))
                }
              />
            )}
            <button
              type="button"
              onClick={() => onChange(people.filter((_, j) => j !== i))}
              className="shrink-0 rounded-lg border border-slate-300 p-2 text-slate-500 hover:bg-red-50 hover:text-red-600"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={() => onChange([...people, { name: "", role: "" }])}
        className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-brand-700 hover:text-brand-800"
      >
        <Plus className="h-4 w-4" /> Add{" "}
        {title.toLowerCase().replace(/\s*\(.*\)\s*$/, "").trim()}
      </button>
    </div>
  );
}
