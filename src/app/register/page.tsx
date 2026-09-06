import Link from "next/link";
import { register } from "../actions";
import { Notice } from "@/components/ui";

export const metadata = { title: "Join" };

export default async function Register({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return (
    <div className="shell flex justify-center py-10">
      <div className="w-full max-w-[400px] border border-border bg-surface p-5 sm:p-6">
        <h1 className="text-title text-ink">Join Bankside</h1>
        <p className="mt-2 text-ui text-muted">Free forever. Choose the account that fits.</p>
        <Notice message={error} />
        <form action={register} className="mt-5 space-y-4">
          <div>
            <label className="label" htmlFor="name">
              Your name
            </label>
            <input className="field" id="name" name="name" required minLength={2} autoComplete="name" />
          </div>
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
              minLength={8}
              required
              autoComplete="new-password"
            />
            <p className="mt-1 text-meta text-muted">At least 8 characters</p>
          </div>
          <fieldset>
            <legend className="label">Account type</legend>
            <div className="grid gap-3">
              <label className="cursor-pointer border border-border bg-canvas p-3">
                <input type="radio" name="accountType" value="angler" defaultChecked className="mr-2 accent-brand" />
                <strong className="text-ui">Angler</strong>
                <span className="mt-1 block text-ui text-muted">Join groups and share posts.</span>
              </label>
              <label className="cursor-pointer border border-border bg-canvas p-3">
                <input type="radio" name="accountType" value="venue_owner" className="mr-2 accent-brand" />
                <strong className="text-ui">Venue owner</strong>
                <span className="mt-1 block text-ui text-muted">Create club or fishery groups. Clubs stay free forever.</span>
              </label>
            </div>
          </fieldset>
          <button className="btn w-full" type="submit">
            Create free account
          </button>
        </form>
        <p className="mt-5 text-center text-ui text-muted">
          Already a member?{" "}
          <Link className="font-semibold text-brand hover:underline" href="/login">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
