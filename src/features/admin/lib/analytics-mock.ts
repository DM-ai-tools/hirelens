/** Chart placeholder data — deterministic values for SSR-safe rendering. */

export const HIRING_TREND_7D = [
  { date: "Mon", screened: 42, hired: 3, assessments: 18 },
  { date: "Tue", screened: 58, hired: 5, assessments: 24 },
  { date: "Wed", screened: 51, hired: 4, assessments: 21 },
  { date: "Thu", screened: 67, hired: 6, assessments: 29 },
  { date: "Fri", screened: 73, hired: 7, assessments: 32 },
  { date: "Sat", screened: 28, hired: 2, assessments: 9 },
  { date: "Sun", screened: 19, hired: 1, assessments: 6 },
];

export const HIRING_TREND_30D = Array.from({ length: 30 }, (_, i) => ({
  date: `D${i + 1}`,
  screened: 35 + Math.round(Math.sin(i / 3) * 20 + i * 1.2),
  hired: 2 + Math.round(i / 8),
  assessments: 12 + Math.round(i / 2),
}));

export const HIRING_TREND_90D = Array.from({ length: 12 }, (_, i) => ({
  date: `W${i + 1}`,
  screened: 180 + i * 24 + ((i * 17 + 11) % 40),
  hired: 12 + i * 2,
  assessments: 65 + i * 8,
}));

export const CANDIDATES_BY_DEPT = [
  { department: "Engineering", count: 248 },
  { department: "Marketing", count: 156 },
  { department: "Sales", count: 132 },
  { department: "Design", count: 89 },
  { department: "Operations", count: 67 },
  { department: "HR", count: 41 },
];

export const CANDIDATE_STATUS_PIE = [
  { name: "Good to Call", value: 34, fill: "#1E9E5A" },
  { name: "Maybe", value: 28, fill: "#E0A106" },
  { name: "Not Now", value: 22, fill: "#C8202A" },
  { name: "In Review", value: 16, fill: "#7A8798" },
];

export const TOP_SKILLS_RADAR = [
  { skill: "React", score: 88 },
  { skill: "Python", score: 82 },
  { skill: "SQL", score: 79 },
  { skill: "AWS", score: 71 },
  { skill: "Node.js", score: 76 },
  { skill: "Communication", score: 85 },
];

const HEATMAP_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;
const HEATMAP_SLOTS = ["6a", "9a", "12p", "3p", "6p", "9p"] as const;

function heatmapValue(day: (typeof HEATMAP_DAYS)[number], slot: (typeof HEATMAP_SLOTS)[number]) {
  const dayIndex = HEATMAP_DAYS.indexOf(day);
  const slotIndex = HEATMAP_SLOTS.indexOf(slot);
  return ((dayIndex + 1) * 13 + (slotIndex + 1) * 17) % 100;
}

export const HIRING_HEATMAP = HEATMAP_DAYS.flatMap((day) =>
  HEATMAP_SLOTS.map((slot) => ({
    day,
    slot,
    value: heatmapValue(day, slot),
  }))
);

export const AI_ANALYTICS = {
  avgAiScore: 72.4,
  avgExperienceIntelligence: 58.6,
  avgSkillMatch: 68.2,
  topMissingSkills: ["Kubernetes", "GraphQL", "Terraform", "CI/CD", "System Design"],
  topMatchingSkills: ["JavaScript", "React", "SQL", "REST APIs", "Git"],
  topTechnologies: ["React", "Node.js", "PostgreSQL", "AWS", "TypeScript", "Python"],
  hiringSuccessPrediction: 74,
  duplicateResumes: 3,
  fraudFlags: 1,
};
