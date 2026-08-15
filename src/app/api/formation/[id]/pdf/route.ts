import { prisma } from "@/lib/prisma";
import { buildFormationPdf } from "@/lib/pdf";
import { getFormFields } from "@/lib/form-templates";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const formation = await prisma.formation.findUnique({
    where: { id },
    include: { state: { include: { fees: true } }, document: true },
  });
  if (!formation) return new Response("Not found", { status: 404 });
  if (!formation.document) return new Response("Document not built yet", { status: 400 });

  const fee = formation.state?.fees.find((f) => f.type === formation.type);
  const fields =
    (fee?.formFields as unknown[] | null) ??
    (formation.stateCode ? getFormFields(formation.stateCode, formation.type) : null);

  const pdf = await buildFormationPdf({
    type: formation.type,
    stateName: formation.state?.name ?? "",
    stateCode: formation.state?.code ?? "",
    data: (formation.document.data as Record<string, unknown>) ?? {},
    signature: formation.signature,
    signedAt: formation.contractSignedAt,
    fields: fields as never,
  });

  const safeName = (formation.businessName ?? "formation").replace(/[^a-zA-Z0-9-_ ]/g, "").replace(/\s+/g, "-");
  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${safeName}-articles.pdf"`,
    },
  });
}
