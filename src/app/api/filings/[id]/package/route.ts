import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { buildFilingPackagePdf } from "@/lib/pdf";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return new Response("Unauthorized", { status: 403 });
  }

  const { id } = await params;
  const filing = await prisma.filing.findUnique({
    where: { id },
    include: { formation: { include: { state: true, document: true } }, state: true },
  });
  if (!filing) return new Response("Not found", { status: 404 });
  if (!filing.formation.document) return new Response("Document not built yet", { status: 400 });

  const data = (filing.formation.document.data as Record<string, unknown>) ?? {};
  const registeredAgent = (data.registeredAgent as { name?: string }) ?? {};

  const pdf = await buildFilingPackagePdf({
    type: filing.type,
    stateName: filing.state.name,
    stateCode: filing.state.code,
    data,
    signature: filing.formation.signature,
    signedAt: filing.formation.contractSignedAt,
    businessName: filing.formation.businessName ?? "",
    principalAddress: (data.principalAddress as string) ?? "",
    registeredAgentName: registeredAgent.name ?? "",
    stateFeeCents: filing.formation.stateFeeCents,
    filingProvider: filing.provider,
    sosSiteUrl: filing.state.sosSiteUrl,
    nameSearchUrl: filing.state.nameSearchUrl,
  });

  const safeName = (filing.formation.businessName ?? "formation")
    .replace(/[^a-zA-Z0-9-_ ]/g, "")
    .replace(/\s+/g, "-");
  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${safeName}-filing-package.pdf"`,
    },
  });
}
