import Link from "next/link";

export default function NotFound() {
  return (
    <div className="shell py-16">
      <h1 className="text-title text-ink">That spot is not here</h1>
      <p className="mt-2 text-ui text-muted">The page may have moved or no longer exists.</p>
      <Link href="/discover" className="btn mt-5">
        Browse groups
      </Link>
    </div>
  );
}
