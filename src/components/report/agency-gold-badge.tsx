export function AgencyGoldBadge({
  label,
  compact = false,
  className = "",
}: {
  label: string;
  compact?: boolean;
  className?: string;
}) {
  return (
    <span
      className={`ei-agency-gold${compact ? " ei-agency-gold--sm" : ""}${className ? ` ${className}` : ""}`}
      title={label}
    >
      ★ {label}
    </span>
  );
}

export function getAgencyBadgeLabel(
  ei: { hasAgencyExperience?: boolean; agencyBadgeType?: string | null } | null | undefined
): string | null {
  if (!ei?.agencyBadgeType) return null;
  if (!ei.hasAgencyExperience && !ei.agencyBadgeType) return null;
  return ei.agencyBadgeType;
}
