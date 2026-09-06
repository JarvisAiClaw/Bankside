import { qrSvg } from "@/lib/qr-svg";

/** Optional QR for email-less invite share. Renders inline SVG when encode succeeds. */
export function InviteQr({ url, size = 160 }: { url: string; size?: number }) {
  const svg = qrSvg(url, size);
  if (!svg) {
    return (
      <p className="text-meta text-muted">QR unavailable for this link length — copy the URL instead.</p>
    );
  }
  return (
    <div className="inline-block border border-border bg-white p-2" dangerouslySetInnerHTML={{ __html: svg }} />
  );
}
