import { FormationType } from "@prisma/client";

/**
 * Field templates for the state's official formation form (per entity type).
 *
 * The client-facing document builder renders the replica document from these
 * fields, so the client fills out the same required fields as the state's own
 * form. Defaults below cover what essentially every state requires; STATE_EXTRA
 * adds the notable state-specific fields (drawn from each SOS's official form).
 * Admins can override per state/type from the States & fees editor.
 */

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

const T = FormationType;

const text = (key: string, label: string, required: boolean, placeholder?: string): FormFieldDef => ({
  key,
  label,
  type: "text",
  required,
  placeholder,
});
const area = (key: string, label: string, required: boolean, placeholder?: string): FormFieldDef => ({
  key,
  label,
  type: "textarea",
  required,
  placeholder,
});
const select = (key: string, label: string, options: string[], required: boolean): FormFieldDef => ({
  key,
  label,
  type: "select",
  options,
  required,
});
const people = (key: string, label: string, roleLabel?: string | null): FormFieldDef => ({
  key,
  label,
  type: "people",
  roleLabel: roleLabel ?? null,
  required: true,
});
const check = (key: string, label: string): FormFieldDef => ({
  key,
  label,
  type: "checkbox",
  required: false,
});

/** Fields present on essentially every state's form for that entity type. */
export const DEFAULT_FIELDS: Record<FormationType, FormFieldDef[]> = {
  [T.LLC]: [
    text("businessName", "Name of the limited liability company", true, "e.g. Atlas Ventures LLC"),
    text("principalAddress", "Principal office / mailing address", false, "Street, City, State ZIP"),
    text("registeredAgent.name", "Registered agent name", true, "Agent name"),
    text("registeredAgent.address", "Registered agent street address", true, "Street, City, State ZIP"),
    select("management", "Management structure", ["Member-managed", "Manager-managed"], true),
    people("organizers", "Organizer(s) — name and address", "Address (optional)"),
    area("purpose", "Statement of purpose", false, "e.g. General business purposes."),
    text("duration", "Duration", false, "Perpetual (unless otherwise stated)"),
  ],
  [T.FOR_PROFIT]: [
    text("businessName", "Name of the corporation", true, "e.g. Atlas Ventures, Inc."),
    text("principalAddress", "Principal office address", true, "Street, City, State ZIP"),
    text("registeredAgent.name", "Registered agent name", true, "Agent name"),
    text("registeredAgent.address", "Registered agent street address", true, "Street, City, State ZIP"),
    text("incorporator", "Incorporator name", true, "Full legal name"),
    people("directors", "Initial directors"),
    text("shares", "Authorized shares", true, "e.g. 1,000,000 shares of $0.001 par value common stock"),
    area("purpose", "Purpose statement", false, "The purpose for which the corporation is formed."),
    text("duration", "Duration", false, "Perpetual (unless otherwise stated)"),
  ],
  [T.NON_PROFIT]: [
    text("businessName", "Name of the corporation", true, "e.g. Atlas Foundation, Inc."),
    text("principalAddress", "Principal office address", true, "Street, City, State ZIP"),
    text("registeredAgent.name", "Registered agent name", true, "Agent name"),
    text("registeredAgent.address", "Registered agent street address", true, "Street, City, State ZIP"),
    text("incorporator", "Incorporator name", true, "Full legal name"),
    people("directors", "Initial directors (board)"),
    area("purpose", "Purpose statement", true, "Describe the charitable, religious, educational, or scientific purpose."),
    check("c501c3", "501(c)(3) intent — this non-profit intends to apply for tax-exempt status under Section 501(c)(3) of the Internal Revenue Code."),
    text("duration", "Duration", false, "Perpetual (unless otherwise stated)"),
  ],
};

const extra = (...fields: FormFieldDef[]): FormFieldDef[] => fields;

/**
 * State-specific fields beyond the common set, from each SOS's official form.
 * Keys are matched against FormationType; unknown types fall back to defaults.
 */
export const STATE_EXTRA_FIELDS: Record<string, Partial<Record<FormationType, FormFieldDef[]>>> = {
  // California: every domestic entity files a Statement of Information and the
  // articles ask for a mailing address distinct from the street address.
  CA: {
    [T.LLC]: extra(text("mailingAddress", "Mailing address (if different)", false, "P.O. Box or mailing address")),
    [T.FOR_PROFIT]: extra(text("mailingAddress", "Mailing address (if different)", false, "P.O. Box or mailing address")),
    [T.NON_PROFIT]: extra(text("mailingAddress", "Mailing address (if different)", false, "P.O. Box or mailing address")),
  },
  // Georgia, Illinois, Minnesota, Oregon LLC forms ask for a mailing address.
  GA: { [T.LLC]: extra(text("mailingAddress", "Mailing address (if different)", false, "P.O. Box or mailing address")) },
  IL: { [T.LLC]: extra(text("mailingAddress", "Mailing address (if different)", false, "P.O. Box or mailing address")) },
  MN: { [T.LLC]: extra(text("mailingAddress", "Mailing address (if different)", false, "P.O. Box or mailing address")) },
  OR: { [T.LLC]: extra(text("mailingAddress", "Mailing address (if different)", false, "P.O. Box or mailing address")) },
  // New York: the filing must state the street address of the person filing.
  NY: {
    [T.LLC]: extra(text("filerAddress", "Street address of the person filing", true, "Street, City, State ZIP")),
    [T.FOR_PROFIT]: extra(text("filerAddress", "Street address of the person filing", true, "Street, City, State ZIP")),
    [T.NON_PROFIT]: extra(text("filerAddress", "Street address of the person filing", true, "Street, City, State ZIP")),
  },
  // Texas LLC Form 205 asks for each organizer's name and address.
  TX: {
    [T.LLC]: extra(text("organizerAddress", "Organizer street address", true, "Street, City, State ZIP")),
  },
};

export function getFormFields(stateCode: string, type: FormationType): FormFieldDef[] {
  const defaults = DEFAULT_FIELDS[type] ?? [];
  const stateSpecific = STATE_EXTRA_FIELDS[stateCode]?.[type];
  if (!stateSpecific) return defaults;
  const existing = new Set(defaults.map((f) => f.key));
  return [...defaults, ...stateSpecific.filter((f) => !existing.has(f.key))];
}

export function fieldLabel(field: FormFieldDef): string {
  return field.label;
}
