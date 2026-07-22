const PLAUSIBLE_URL = process.env.NEXT_PUBLIC_PLAUSIBLE_URL;
const PLAUSIBLE_DOMAIN = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN || "thinkflow.ro";

export default function PlausibleAnalytics() {
  if (!PLAUSIBLE_URL) return null;

  return (
    <script
      defer
      data-domain={PLAUSIBLE_DOMAIN}
      src={`${PLAUSIBLE_URL}/js/script.js`}
    />
  );
}
