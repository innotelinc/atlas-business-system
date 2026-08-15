import { prisma } from "@/lib/prisma";
import FormationWizard from "@/components/formation/FormationWizard";

export const dynamic = "force-dynamic";

export default async function FormationPage() {
  const states = await prisma.state.findMany({ orderBy: { name: "asc" } });
  return (
    <FormationWizard
      states={states.map((s) => ({ code: s.code, name: s.name }))}
    />
  );
}
