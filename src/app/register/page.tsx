import Link from "next/link";
import { Card } from "@/components/ui";
import { RegisterForm } from "./RegisterForm";

export default function RegisterPage() {
  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-brand-950">Create your portal account</h1>
        <p className="mt-2 text-slate-600">
          Access your business credentials, startup checklist, and credit-building tools.
        </p>
      </div>
      <Card>
        <RegisterForm />
      </Card>
      <p className="mt-6 text-center text-sm text-slate-600">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-brand-700 hover:text-brand-800">
          Sign in
        </Link>
      </p>
    </div>
  );
}
