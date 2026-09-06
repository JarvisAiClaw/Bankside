import { redirect } from "next/navigation";
import { Role } from "@/generated/prisma/client";
import { getCurrentUser } from "@/lib/current-user";
import { createVenue } from "@/app/actions";
import { Notice } from "@/components/ui";

export const metadata = { title: "Register venue" };

export default async function NewVenue({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== Role.VENUE_OWNER && user.role !== Role.ADMIN) redirect("/discover");
  const { error } = await searchParams;
  return (
    <div className="shell max-w-[400px] py-8 md:max-w-xl">
      <div className="border border-border bg-surface p-5 sm:p-6">
        <h1 className="text-title text-ink">Register a venue</h1>
        <p className="mt-2 text-ui text-muted">
          Creates the official group and makes you the group owner. Clubs stay free forever on the core
          product.
        </p>
        <Notice message={error} />
        <form action={createVenue} className="mt-5 space-y-4">
          <fieldset>
            <legend className="label">Venue type</legend>
            <div className="grid gap-3">
              <label className="cursor-pointer border border-border bg-canvas p-3 has-[:checked]:border-brand has-[:checked]:bg-brand-subtle">
                <input
                  type="radio"
                  name="venueType"
                  value="CLUB"
                  defaultChecked
                  className="mr-2 accent-brand"
                />
                <strong className="text-ui">Club</strong>
                <span className="mt-1 block text-ui text-muted">
                  Free forever — social, noticeboard, members. No booking, no paywall on the core.
                </span>
              </label>
              <label className="cursor-pointer border border-border bg-canvas p-3 has-[:checked]:border-brand has-[:checked]:bg-brand-subtle">
                <input type="radio" name="venueType" value="FISHERY" className="mr-2 accent-brand" />
                <strong className="text-ui">Fishery / syndicate</strong>
                <span className="mt-1 block text-ui text-muted">
                  Same free core today. Optional nominal fee for extra reach may come later — never
                  required for clubs or anglers.
                </span>
              </label>
            </div>
          </fieldset>
          <div>
            <label className="label" htmlFor="name">
              Venue name
            </label>
            <input className="field" id="name" name="name" required autoComplete="organization" />
          </div>
          <div>
            <label className="label" htmlFor="location">
              Location
            </label>
            <input
              className="field"
              id="location"
              name="location"
              required
              placeholder="Town, county"
              autoComplete="address-level2"
            />
          </div>
          <div>
            <label className="label" htmlFor="description">
              Description
            </label>
            <textarea
              className="field min-h-32 py-2.5"
              id="description"
              name="description"
              minLength={10}
              required
              placeholder="Tell anglers about the water, species and atmosphere."
            />
          </div>
          <button className="btn w-full sm:w-auto" type="submit">
            Register venue
          </button>
        </form>
      </div>
    </div>
  );
}
