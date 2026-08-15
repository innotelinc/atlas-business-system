import Link from "next/link";
import { Card } from "@/components/ui";
import { LoginForm } from "./LoginForm";

export const dynamic = "force-dynamic";

export default function LoginPage() {
  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-brand-950">Welcome back</h1>
        <p className="mt-2 text-slate-600">Sign in to your client portal or admin console.</p>
      </div>
      <Card>
        <LoginForm />
      </Card>
      <p className="mt-6 text-center text-sm text-slate-600">
        New here?{" "}
        <Link href="/register" className="font-semibold text-brand-700 hover:text-brand-800">
          Create a client portal account
        </Link>
      </p>
    </div>
  );
}
