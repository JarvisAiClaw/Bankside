import Link from "next/link";
import { login } from "../actions";
import { Notice } from "@/components/ui";

export const metadata = { title: "Log in" };

export default async function Login({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return (
    <div className="shell flex justify-center py-10">
      <div className="w-full max-w-[400px] border border-border bg-surface p-5 sm:p-6">
        <h1 className="text-title text-ink">Log in</h1>
        <p className="mt-2 text-ui text-muted">Sign in to your feed and groups.</p>
        <Notice message={error} />
        <form action={login} className="mt-5 space-y-4">
          <div>
            <label className="label" htmlFor="email">
              Email
            </label>
            <input className="field" id="email" name="email" type="email" required autoComplete="email" />
          </div>
          <div>
            <label className="label" htmlFor="password">
              Password
            </label>
            <input
              className="field"
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
            />
          </div>
          <button className="btn w-full" type="submit">
            Log in
          </button>
        </form>
        <p className="mt-5 text-center text-ui text-muted">
          New here?{" "}
          <Link className="font-semibold text-brand hover:underline" href="/register">
            Join free
          </Link>
        </p>
      </div>
    </div>
  );
}
