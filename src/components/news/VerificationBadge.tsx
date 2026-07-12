interface Props {
  status: "verified" | "unconfirmed" | "contradicted" | null;
  sourcesCount?: number;
}

export function VerificationBadge({ status, sourcesCount }: Props) {
  if (!status) return null;

  switch (status) {
    case "verified":
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-green-500/10 px-2 py-0.5 text-[10px] font-medium text-green-600">
          ✓ Verified
          {sourcesCount && sourcesCount > 1 ? ` by ${sourcesCount} sources` : ""}
        </span>
      );
    case "unconfirmed":
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-yellow-500/10 px-2 py-0.5 text-[10px] font-medium text-yellow-600">
          ⚠ Unconfirmed
        </span>
      );
    case "contradicted":
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 px-2 py-0.5 text-[10px] font-medium text-red-600">
          ✗ Contradicted
        </span>
      );
    default:
      return null;
  }
}
