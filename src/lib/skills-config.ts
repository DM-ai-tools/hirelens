export type ProposedSkillsConfig = {
  proposedMustHave: string[];
  proposedNiceToHave: string[];
  skillsConfirmed: boolean;
};

export function parseProposedSkills(scoringConfig: unknown): ProposedSkillsConfig | null {
  if (!scoringConfig || typeof scoringConfig !== "object") return null;
  const cfg = scoringConfig as Record<string, unknown>;
  const proposedMustHave = Array.isArray(cfg.proposedMustHave)
    ? cfg.proposedMustHave.filter((s): s is string => typeof s === "string")
    : [];
  const proposedNiceToHave = Array.isArray(cfg.proposedNiceToHave)
    ? cfg.proposedNiceToHave.filter((s): s is string => typeof s === "string")
    : [];
  if (proposedMustHave.length === 0 && proposedNiceToHave.length === 0) return null;
  return {
    proposedMustHave,
    proposedNiceToHave,
    skillsConfirmed: cfg.skillsConfirmed === true,
  };
}
