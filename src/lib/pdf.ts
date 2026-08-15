import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { FormationType } from "@prisma/client";

const DARK = rgb(0.13, 0.16, 0.22);
const GRAY = rgb(0.38, 0.42, 0.5);
const LINE = rgb(0.85, 0.87, 0.9);

function titleCase(s: string) {
  return s.toLowerCase().replace(/(^|\s)([a-z])/g, (_m, p1, p2) => p1 + p2.toUpperCase());
}

type DocData = Record<string, unknown>;

export async function buildFormationPdf(opts: {
  type: FormationType;
  stateName: string;
  stateCode: string;
  data: DocData;
  signature?: string | null;
  signedAt?: Date | null;
}): Promise<Uint8Array> {
  const { type, stateName, stateCode, data, signature, signedAt } = opts;
  const businessName = (data.businessName as string) || "";
  const principalAddress = (data.principalAddress as string) || "";
  const registeredAgent = (data.registeredAgent as { name?: string; address?: string }) || {};
  const purpose = (data.purpose as string) || "";
  const members = ((data.members as { name?: string; title?: string; address?: string }[]) || []).filter(
    (m) => m?.name,
  );
  const directors = ((data.directors as { name?: string }[]) || []).filter((d) => d?.name);
  const incorporator = (data.incorporator as string) || "";
  const shares = (data.shares as string) || "";
  const management = (data.management as string) || "";
  const c501c3 = Boolean(data.c501c3);

  const docTitle =
    type === "LLC" ? "ARTICLES OF ORGANIZATION" : "ARTICLES OF INCORPORATION";
  const entityWord = type === "LLC" ? "limited liability company" : "corporation";

  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const page = pdfDoc.addPage([612, 792]); // US Letter
  const { width, height } = page.getSize();
  const margin = 56;
  let y = height - margin;

  const wrap = (text: string, size: number, maxWidth: number) => {
    const words = text.split(/\s+/);
    const lines: string[] = [];
    let line = "";
    for (const w of words) {
      const test = line ? `${line} ${w}` : w;
      if (font.widthOfTextAtSize(test, size) > maxWidth) {
        if (line) lines.push(line);
        line = w;
      } else {
        line = test;
      }
    }
    if (line) lines.push(line);
    return lines;
  };

  const heading = (text: string) => {
    y -= 22;
    page.drawText(text.toUpperCase(), { x: margin, y, size: 11, font: bold, color: DARK });
    y -= 6;
    page.drawLine({ start: { x: margin, y }, end: { x: width - margin, y }, thickness: 1, color: LINE });
    y -= 14;
  };

  const field = (label: string, value: string) => {
    y -= 16;
    page.drawText(label.toUpperCase(), { x: margin, y, size: 8, font: bold, color: GRAY });
    const lines = wrap(value || "—", 11, width - margin * 2);
    y -= 14;
    for (const l of lines) {
      page.drawText(l, { x: margin, y, size: 11, font, color: DARK });
      y -= 14;
    }
    y -= 4;
  };

  // Header
  page.drawText("ATLAS BUSINESS SYSTEM", { x: margin, y: y, size: 10, font: bold, color: GRAY });
  y -= 22;
  page.drawText(docTitle, { x: margin, y, size: 20, font: bold, color: DARK });
  y -= 18;
  page.drawText(
    `of ${businessName || "[Business Name]"}`,
    { x: margin, y, size: 13, font, color: DARK },
  );
  y -= 16;
  page.drawText(
    `State of ${stateName} (${stateCode})`,
    { x: margin, y, size: 10, font, color: GRAY },
  );
  y -= 30;

  heading("Entity Information");
  field("1. Name of Entity", businessName);
  field("2. Type", type === "LLC" ? "Limited Liability Company" : type === "FOR_PROFIT" ? "For-Profit Corporation" : "Non-Profit Corporation");
  field("3. Principal Office Address", principalAddress);
  if (registeredAgent?.name) {
    field("4. Registered Agent", `${registeredAgent.name} — ${registeredAgent.address || ""}`);
  } else {
    field("4. Registered Agent", "");
  }

  if (type === "LLC") {
    heading("Members & Management");
    field("5. Management", management ? `${titleCase(management)}` : "");
    field("6. Members", members.map((m) => `${m.name}${m.title ? ` (${m.title})` : ""}`).join(", "));
    heading("Purpose");
    field("7. Purpose", purpose);
  } else {
    heading("Directors & Shares");
    field("5. Directors", directors.map((d) => d.name).join(", "));
    if (type === "FOR_PROFIT") {
      field("6. Incorporator", incorporator);
      field("7. Authorized Shares", shares || "—");
      heading("Purpose");
      field("8. Purpose", purpose);
    } else {
      field("6. Incorporator", incorporator);
      heading("Purpose");
      field("7. Purpose", purpose);
      if (c501c3) {
        field("8. Tax-Exempt Intent", "The corporation intends to apply for recognition of exemption under Section 501(c)(3) of the Internal Revenue Code.");
      }
    }
  }

  // Signature block
  y -= 20;
  heading("Execution");
  y -= 10;
  page.drawText(`Signed: ${signature || "[Signature]"}`, { x: margin, y, size: 11, font, color: DARK });
  y -= 22;
  page.drawText(
    `Date: ${signedAt ? signedAt.toLocaleDateString("en-US") : "___________"}`,
    { x: margin, y, size: 11, font, color: DARK },
  );
  y -= 30;
  page.drawText(
    `The undersigned acknowledges that this ${entityWord} will not be formed until the ${stateName} Secretary of State approves this filing.`,
    { x: margin, y, size: 9, font, color: GRAY },
  );

  return pdfDoc.save();
}

/**
 * Ops-assisted filing package: a cover sheet with the submission checklist and
 * portal links, followed by the signed Articles of Organization / Incorporation.
 */
export async function buildFilingPackagePdf(opts: {
  type: FormationType;
  stateName: string;
  stateCode: string;
  data: DocData;
  signature?: string | null;
  signedAt?: Date | null;
  businessName: string;
  principalAddress: string;
  registeredAgentName: string;
  stateFeeCents: number;
  filingProvider: string;
  sosSiteUrl: string;
  nameSearchUrl: string | null;
}): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const page = pdfDoc.addPage([612, 792]);
  const { width, height } = page.getSize();
  const margin = 56;
  let y = height - margin;

  const drawLine = (yy: number) => {
    page.drawLine({ start: { x: margin, y: yy }, end: { x: width - margin, y: yy }, thickness: 1, color: LINE });
  };

  page.drawText("ATLAS BUSINESS SYSTEM", { x: margin, y, size: 10, font: bold, color: GRAY });
  y -= 24;
  page.drawText("FILING SUBMISSION PACKAGE", { x: margin, y, size: 20, font: bold, color: DARK });
  y -= 18;
  page.drawText(`State of ${opts.stateName} (${opts.stateCode}) · ${opts.type === "LLC" ? "Limited Liability Company" : opts.type === "FOR_PROFIT" ? "For-Profit Corporation" : "Non-Profit Corporation"}`, { x: margin, y, size: 10, font, color: GRAY });
  y -= 34;

  const kv = (label: string, value: string) => {
    y -= 16;
    page.drawText(label.toUpperCase(), { x: margin, y, size: 8, font: bold, color: GRAY });
    y -= 14;
    page.drawText(value || "—", { x: margin, y, size: 11, font, color: DARK });
    y -= 18;
  };

  kv("Business name", opts.businessName);
  kv("Principal office address", opts.principalAddress);
  kv("Registered agent", opts.registeredAgentName);
  kv("State filing fee", usd(opts.stateFeeCents));
  kv("Submission mode", opts.filingProvider === "ops" ? "Operations team — submit via state portal" : opts.filingProvider);
  kv("Signed by", opts.signature ?? "—");
  kv("Signed on", opts.signedAt ? opts.signedAt.toLocaleDateString("en-US") : "—");

  y -= 16;
  drawLine(y);
  y -= 20;
  page.drawText("OPERATOR CHECKLIST", { x: margin, y, size: 11, font: bold, color: DARK });
  y -= 22;
  const steps = [
    "1. Open the state portal and re-check the business name is still available (see links below).",
    "2. Log in or create the filing account for the state portal.",
    "3. Submit the attached Articles document (pages 2+).",
    "4. Pay the state filing fee with the company card.",
    "5. Copy the confirmation/reference number into Atlas and mark the filing as FILED.",
    "6. If the state rejects the filing, record the reason in Atlas and correct/refile.",
  ];
  for (const s of steps) {
    page.drawText(s, { x: margin, y, size: 10, font, color: DARK });
    y -= 16;
  }

  y -= 12;
  drawLine(y);
  y -= 20;
  page.drawText("PORTAL LINKS", { x: margin, y, size: 11, font: bold, color: DARK });
  y -= 22;
  page.drawText(`State SOS site: ${opts.sosSiteUrl}`, { x: margin, y, size: 9, font, color: GRAY });
  y -= 14;
  page.drawText(`Name search: ${opts.nameSearchUrl ?? "(see SOS site)"}`, { x: margin, y, size: 9, font, color: GRAY });

  // Append the signed Articles of Organization / Incorporation.
  const articles = await buildFormationPdf({
    type: opts.type,
    stateName: opts.stateName,
    stateCode: opts.stateCode,
    data: opts.data,
    signature: opts.signature,
    signedAt: opts.signedAt,
  });
  const articlesDoc = await PDFDocument.load(articles);
  const copied = await pdfDoc.copyPages(articlesDoc, articlesDoc.getPageIndices());
  copied.forEach((p) => pdfDoc.addPage(p));

  return pdfDoc.save();
}

function usd(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}
