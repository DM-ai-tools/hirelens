import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  rememberMe: z.boolean().optional(),
});

export const signupSchema = z
  .object({
    name: z.string().min(2, "Name is required"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(8, "Confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const jobSchema = z.object({
  title: z.string().min(2, "Job title is required"),
  department: z.string().optional(),
  location: z.string().optional(),
  employmentType: z.string().optional(),
  minExperience: z.number().min(0),
  mustHaveSkills: z.array(z.string()).min(1, "At least one must-have skill required"),
  niceToHaveSkills: z.array(z.string()).default([]),
  jdText: z.string().min(50, "Job description must be at least 50 characters"),
  scoreThreshold: z.number().min(0).max(100).default(70),
});

export const userSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8).optional(),
  role: z.enum(["ADMIN", "RECRUITER"]),
  active: z.boolean().default(true),
});

export const assessmentSchema = z
  .object({
    name: z.string().min(2),
    type: z.enum(["LINK", "ATTACHMENT"]),
    url: z.string().url().optional().or(z.literal("")),
    roleTag: z.string().optional(),
    description: z.string().optional(),
    active: z.boolean().default(true),
  })
  .superRefine((data, ctx) => {
    if (data.type === "LINK" && !data.url) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "URL is required for link assessments",
        path: ["url"],
      });
    }
  });

export const sendAssessmentSchema = z.object({
  candidateIds: z.array(z.string()).min(1),
  assessmentId: z.string(),
  deadline: z.string().optional(),
});

export const settingsSchema = z.object({
  companyName: z.string().min(1),
  companyLogo: z.string().optional(),
  primaryColor: z.string(),
  anthropicApiKey: z.string().optional(),
  resendApiKey: z.string().optional(),
  defaultAssessmentDays: z.coerce.number().min(1).max(90),
  contactEmail: z.string().email(),
  contactPhone: z.string(),
});

export const emailTemplateSchema = z.object({
  name: z.string().min(2),
  subject: z.string().min(2),
  bodyHtml: z.string().min(10),
  active: z.boolean().default(true),
});

export const screeningFormSchema = z.object({
  title: z.string().min(2),
  jdText: z.string().min(50),
  minExperience: z.coerce.number().min(0),
  scoreThreshold: z.coerce.number().min(0).max(100).default(70),
  mustHaveSkills: z.array(z.string()).default([]),
  niceToHaveSkills: z.array(z.string()).default([]),
});
