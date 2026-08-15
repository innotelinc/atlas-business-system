import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import { FormationType } from "@prisma/client";

// ---- Palette (modern / official) ----
const NAVY = rgb(0.09, 0.12, 0.19); // deep navy for headings & bands
const GOLD = rgb(0.95, 0.76, 0.22); // brand gold accent
const GRAY = rgb(0.42, 0.46, 0.54); // muted labels
const LINE = rgb(0.86, 0.88, 0.91); // hairlines
const FAINT = rgb(0.965, 0.97, 0.975); // field background
const WHITE = rgb(1, 1, 1);

const PAGE_W = 612; // US Letter
const PAGE_H = 792;
const MARGIN = 54;

function titleCase(s: string) {
  return s.toLowerCase().replace(/(^|\s)([a-z])/g, (_m, p1, p2) => p1 + p2.toUpperCase());
}

function usd(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

type DocData = Record<string, unknown>;

/**
 * Shared canvas: manages pages, y-cursor, page breaks, masthead, headings,
 * labeled fields, signature block, and page footers.
 */
class Doc {
  pdf: PDFDocument;
  page: PDFPage;
  font: PDFFont;
  bold: PDFFont;
  italic: PDFFont;
  y: number;
  runningTitle: string;

  constructor(pdf: PDFDocument, font: PDFFont, bold: PDFFont, italic: PDFFont, runningTitle: string) {
    this.pdf = pdf;
    this.font = font;
    this.bold = bold;
    this.italic = italic;
    this.runningTitle = runningTitle;
    this.page = pdf.addPage([PAGE_W, PAGE_H]);
    this.y = PAGE_H - MARGIN;
  }

  get width() {
    return PAGE_W;
  }

  /** Start a new page and draw the slim running header. */
  newPage() {
    this.page = this.pdf.addPage([PAGE_W, PAGE_H]);
    this.y = PAGE_H - MARGIN;
    this.page.drawText(this.runningTitle, {
      x: PAGE_W - MARGIN - this.font.widthOfTextAtSize(this.runningTitle, 7),
      y: PAGE_H - 26,
      size: 7,
      font: this.font,
      color: GRAY,
    });
    this.page.drawRectangle({ x: 0, y: PAGE_H - 30, width: PAGE_W, height: 0.8, color: LINE });
  }

  /** Reserve vertical space, breaking to a new page if needed. */
  ensure(h: number) {
    if (this.y - h < MARGIN + 16) this.newPage();
  }

  private center(text: string, size: number, color: ReturnType<typeof rgb>, font: PDFFont) {
    const w = font.widthOfTextAtSize(text, size);
    this.page.drawText(text, { x: (PAGE_W - w) / 2, y: this.y, size, font, color });
  }

  /** Filled navy band + gold rules + centered title — the document masthead. */
  masthead(opts: { jurisdiction: string; title: string; subtitle: string; tag: string }) {
    const page = this.page;
    // gold top bar
    page.drawRectangle({ x: 0, y: PAGE_H - 5, width: PAGE_W, height: 5, color: GOLD });
    this.y = PAGE_H - 34;
    this.center(`STATE OF ${opts.jurisdiction.toUpperCase()}`, 8.5, GRAY, this.bold);
    this.y -= 15;

    const bandH = 50;
    page.drawRectangle({ x: 0, y: this.y - bandH, width: PAGE_W, height: bandH, color: NAVY });
    const title = opts.title;
    const subtitle = opts.subtitle.length > 78 ? `${opts.subtitle.slice(0, 75)}…` : opts.subtitle;
    this.center(title, 17, WHITE, this.bold);
    this.y -= 20;
    this.center(subtitle, 9.5, rgb(0.82, 0.86, 0.93), this.font);
    this.y -= bandH - 20;

    // gold rule under the band
    page.drawRectangle({ x: 0, y: this.y, width: PAGE_W, height: 2, color: GOLD });
    this.y -= 15;
    this.center(opts.tag, 7.5, GRAY, this.font);
    this.y -= 14;
  }

  /** ARTICLE I — … heading with a short gold underline. */
  heading(text: string) {
    this.ensure(38);
    this.y -= 16;
    this.page.drawText(text, { x: MARGIN, y: this.y, size: 10.5, font: this.bold, color: NAVY });
    this.y -= 4;
    this.page.drawRectangle({ x: MARGIN, y: this.y, width: 46, height: 1.6, color: GOLD });
    this.y -= 12;
  }

  /** Labeled, ruled field row. */
  field(label: string, value: string) {
    const lines = this.wrap(value || "—", 10.5, PAGE_W - MARGIN * 2);
    this.ensure(22 + lines.length * 13);
    this.y -= 12;
    this.page.drawText(label.toUpperCase(), { x: MARGIN, y: this.y, size: 7.5, font: this.bold, color: GRAY });
    this.y -= 12;
    for (const l of lines) {
      this.page.drawText(l, { x: MARGIN, y: this.y, size: 10.5, font: this.font, color: NAVY });
      this.y -= 13;
    }
    this.y -= 7;
    this.page.drawLine({
      start: { x: MARGIN, y: this.y },
      end: { x: PAGE_W - MARGIN, y: this.y },
      thickness: 0.6,
      color: LINE,
    });
    this.y -= 10;
  }

  /** Boxed execution block with signature + date lines. */
  signatureBlock(opts: { signature?: string | null; signedAt?: Date | null; party: string; ack: string }) {
    const boxH = 112;
    this.ensure(boxH + 60);
    this.y -= 18;
    this.page.drawText("EXECUTION", { x: MARGIN, y: this.y, size: 11, font: this.bold, color: NAVY });
    this.y -= 4;
    this.page.drawRectangle({ x: MARGIN, y: this.y, width: 46, height: 1.6, color: GOLD });
    this.y -= 14;

    const boxTop = this.y;
    this.page.drawRectangle({
      x: MARGIN,
      y: boxTop - boxH,
      width: PAGE_W - MARGIN * 2,
      height: boxH,
      color: FAINT,
      borderColor: LINE,
      borderWidth: 1,
    });
    this.y = boxTop - 24;
    this.page.drawText(`SIGNATURE OF ${opts.party.toUpperCase()}`, { x: MARGIN + 14, y: this.y, size: 7.5, font: this.bold, color: GRAY });
    this.y -= 16;
    this.page.drawText(opts.signature || "_________________________________________", { x: MARGIN + 14, y: this.y, size: 11, font: this.font, color: NAVY });
    this.y -= 22;
    this.page.drawText("DATE", { x: MARGIN + 14, y: this.y, size: 7.5, font: this.bold, color: GRAY });
    this.y -= 16;
    this.page.drawText(opts.signedAt ? opts.signedAt.toLocaleDateString("en-US") : "____________________", { x: MARGIN + 14, y: this.y, size: 11, font: this.font, color: NAVY });
    this.y = boxTop - boxH - 14;
    const ackLines = this.wrap(opts.ack, 8.5, PAGE_W - MARGIN * 2);
    for (const l of ackLines) {
      this.page.drawText(l, { x: MARGIN, y: this.y, size: 8.5, font: this.font, color: GRAY });
      this.y -= 11;
    }
    this.y -= 4;
  }

  /** Draw the footer (brand left, page number right) on every page. */
  footer(jurisdiction: string) {
    const pages = this.pdf.getPages();
    pages.forEach((p, i) => {
      p.drawLine({ start: { x: MARGIN, y: 40 }, end: { x: PAGE_W - MARGIN, y: 40 }, thickness: 0.6, color: LINE });
      const left = `Atlas Business System · Prepared for ${jurisdiction} filing`;
      p.drawText(left, { x: MARGIN, y: 27, size: 7, font: this.font, color: GRAY });
      const right = `Page ${i + 1} of ${pages.length}`;
      p.drawText(right, { x: PAGE_W - MARGIN - this.font.widthOfTextAtSize(right, 7), y: 27, size: 7, font: this.font, color: GRAY });
    });
  }

  private wrap(text: string, size: number, maxWidth: number): string[] {
    const words = text.split(/\s+/);
    const lines: string[] = [];
    let line = "";
    for (const w of words) {
      const test = line ? `${line} ${w}` : w;
      if (this.font.widthOfTextAtSize(test, size) > maxWidth) {
        if (line) lines.push(line);
        line = w;
      } else {
        line = test;
      }
    }
    if (line) lines.push(line);
    return lines;
  }
}

/** Official-looking Articles of Organization / Incorporation. */
export async function buildFormationPdf(opts: {
  type: FormationType;
  stateName: string;
  stateCode: string;
  data: DocData;
  signature?: string | null;
  signedAt?: Date | null;
}): Promise<Uint8Array> {
  const { type, stateName, stateCode, data, signature, signedAt } = opts;
  const businessName = (data.businessName as string) || "[Business Name]";
  const principalAddress = (data.principalAddress as string) || "";
  const registeredAgent = (data.registeredAgent as { name?: string; address?: string }) || {};
  const purpose = (data.purpose as string) || "";
  const members = ((data.members as { name?: string; title?: string; address?: string }[]) || []).filter((m) => m?.name);
  const directors = ((data.directors as { name?: string }[]) || []).filter((d) => d?.name);
  const incorporator = (data.incorporator as string) || "";
  const shares = (data.shares as string) || "";
  const management = (data.management as string) || "";
  const c501c3 = Boolean(data.c501c3);

  const docTitle = type === "LLC" ? "ARTICLES OF ORGANIZATION" : "ARTICLES OF INCORPORATION";
  const entityWord = type === "LLC" ? "limited liability company" : "corporation";
  const typeLabel =
    type === "LLC"
      ? "Limited Liability Company"
      : type === "FOR_PROFIT"
        ? "For-Profit Corporation"
        : "Non-Profit Corporation";

  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const italic = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

  const doc = new Doc(pdfDoc, font, bold, italic, `${docTitle} — ${businessName}`);
  doc.masthead({
    jurisdiction: stateName,
    title: docTitle,
    subtitle: `of ${businessName}`,
    tag: `FILING DOCUMENT · FOR SUBMISSION TO THE ${stateName.toUpperCase()} SECRETARY OF STATE (${stateCode})`,
  });

  doc.heading("ARTICLE I — NAME");
  doc.field("Name of the entity", businessName);

  doc.heading("ARTICLE II — TYPE");
  doc.field("Entity type", typeLabel);

  doc.heading("ARTICLE III — PRINCIPAL OFFICE");
  doc.field("Principal office address", principalAddress);

  doc.heading("ARTICLE IV — REGISTERED AGENT");
  doc.field(
    "Registered agent",
    registeredAgent?.name ? `${registeredAgent.name}${registeredAgent.address ? ` — ${registeredAgent.address}` : ""}` : "",
  );

  if (type === "LLC") {
    doc.heading("ARTICLE V — MANAGEMENT");
    doc.field("Management structure", management ? titleCase(management) : "");
    doc.field(
      "Members",
      members.map((m) => `${m.name}${m.title ? ` — ${m.title}` : ""}`).join(", "),
    );

    doc.heading("ARTICLE VI — PURPOSE");
    doc.field("Purpose", purpose);
  } else {
    doc.heading("ARTICLE V — DIRECTORS");
    doc.field("Directors", directors.map((d) => d.name).join(", "));
    doc.field("Incorporator", incorporator);
    if (type === "FOR_PROFIT") {
      doc.field("Authorized shares", shares || "—");
    }

    doc.heading("ARTICLE VI — PURPOSE");
    doc.field("Purpose", purpose);
    if (c501c3) {
      doc.field(
        "Tax-exempt intent",
        "The corporation intends to apply for recognition of exemption under Section 501(c)(3) of the Internal Revenue Code.",
      );
    }
  }

  doc.signatureBlock({
    signature,
    signedAt,
    party: type === "LLC" ? "Organizer / Authorized Member" : "Incorporator / Authorized Officer",
    ack: `The undersigned acknowledges that this ${entityWord} will not be formed until the ${stateName} Secretary of State approves this filing, and that the information above is true and correct to the best of their knowledge.`,
  });

  doc.footer(stateName);

  return pdfDoc.save();
}

/**
 * Ops-assisted filing package: an official-looking cover sheet with filing
 * details, an operator checklist and portal links, followed by the signed
 * Articles of Organization / Incorporation.
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
  const { type, stateName, stateCode, data, signature, signedAt, businessName, principalAddress, registeredAgentName, stateFeeCents, filingProvider, sosSiteUrl, nameSearchUrl } = opts;
  const typeLabel =
    type === "LLC"
      ? "Limited Liability Company"
      : type === "FOR_PROFIT"
        ? "For-Profit Corporation"
        : "Non-Profit Corporation";

  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const italic = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

  const doc = new Doc(pdfDoc, font, bold, italic, "FILING SUBMISSION PACKAGE");
  doc.masthead({
    jurisdiction: stateName,
    title: "FILING SUBMISSION PACKAGE",
    subtitle: `${businessName} · ${typeLabel} (${stateCode})`,
    tag: `INTERNAL PACKAGE · PREPARED BY ATLAS BUSINESS SYSTEM FOR ${stateName.toUpperCase()} FILING`,
  });

  doc.heading("FILING DETAILS");
  doc.field("Business name", businessName);
  doc.field("Principal office address", principalAddress);
  doc.field("Registered agent", registeredAgentName);
  doc.field("State filing fee", usd(stateFeeCents));
  doc.field("Submission mode", filingProvider === "ops" ? "Operations team — submit via state portal" : filingProvider);
  doc.field("Signed by", signature ?? "—");
  doc.field("Signed on", signedAt ? signedAt.toLocaleDateString("en-US") : "—");

  doc.heading("OPERATOR CHECKLIST");
  const steps = [
    "1.  Open the state portal and re-check the business name is still available (see links below).",
    "2.  Log in or create the filing account for the state portal.",
    "3.  Submit the attached Articles document (following pages).",
    "4.  Pay the state filing fee with the company card.",
    "5.  Copy the confirmation / reference number into Atlas and mark the filing as FILED.",
    "6.  If the state rejects the filing, record the reason in Atlas and correct / refile.",
  ];
  for (const s of steps) {
    doc.ensure(24);
    doc.y -= 16;
    // checkbox square
    doc.page.drawRectangle({ x: MARGIN, y: doc.y - 8, width: 9, height: 9, borderColor: GRAY, borderWidth: 1 });
    doc.page.drawText(s, { x: MARGIN + 16, y: doc.y, size: 10, font, color: NAVY });
    doc.y -= 12;
  }

  doc.heading("PORTAL LINKS");
  doc.field("State SOS site", sosSiteUrl);
  doc.field("Business name search", nameSearchUrl ?? "(see SOS site)");

  doc.footer(stateName);

  // Append the signed Articles of Organization / Incorporation.
  const articles = await buildFormationPdf({
    type,
    stateName,
    stateCode,
    data,
    signature,
    signedAt,
  });
  const articlesDoc = await PDFDocument.load(articles);
  const copied = await pdfDoc.copyPages(articlesDoc, articlesDoc.getPageIndices());
  copied.forEach((p) => pdfDoc.addPage(p));

  return pdfDoc.save();
}
