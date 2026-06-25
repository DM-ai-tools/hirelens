type JobLike = { title: string; department: string | null };
type AssessmentLike = { roleTag: string | null; active?: boolean };

function normalize(value: string): string {
  return value.toLowerCase().trim();
}

/** Match assessments to a job by role tag (title / department), or include global assessments with no tag. */
export function assessmentMatchesJob(assessment: AssessmentLike, job: JobLike): boolean {
  const tag = assessment.roleTag?.trim();
  if (!tag) return true;

  const needle = normalize(tag);
  const title = normalize(job.title);
  const department = normalize(job.department ?? "");

  return (
    title.includes(needle) ||
    needle.includes(title) ||
    (department.length > 0 && (department.includes(needle) || needle.includes(department)))
  );
}

export function filterAssessmentsForJob<T extends AssessmentLike>(
  assessments: T[],
  job: JobLike
): T[] {
  return assessments.filter((a) => a.active !== false && assessmentMatchesJob(a, job));
}
