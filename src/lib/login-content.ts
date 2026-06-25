import { Role } from "@prisma/client";
import { getAdminLoginFeatures } from "@/features/admin/config/nav-items";
import { BRAND } from "@/lib/constants";
import { getPlatformSettings, type PlatformSettings } from "@/lib/platform-settings";
import { prisma } from "@/lib/prisma";

export type LoginBrandContext = {
  productName: string;
  productMark: string;
  portalLabel: string;
  companyName: string;
  contactEmail: string;
  contactPhone: string;
  companyLogo: string | null;
  primaryColor: string;
  tagline: string;
};

export type LoginRoleContent = {
  headline: string;
  headlineAccent: string;
  description: string;
  features: string[];
  cardTitle: string;
  cardSubtitle: string;
  demoEmail: string | null;
  demoPasswordHint: string | null;
  supportMessage: string;
};

export type LoginPageConfig = {
  brand: LoginBrandContext;
  content: LoginRoleContent;
};

function buildBrandContext(
  platform: PlatformSettings,
  portalLabel: string
): LoginBrandContext {
  return {
    productName: BRAND.name,
    productMark: "HL",
    portalLabel,
    companyName: platform.companyName,
    contactEmail: platform.contactEmail,
    contactPhone: platform.contactPhone,
    companyLogo: platform.companyLogo,
    primaryColor: platform.primaryColor,
    tagline: BRAND.tagline,
  };
}

async function getDemoAccount(role: Role): Promise<{ email: string; passwordHint: string | null } | null> {
  const user = await prisma.user.findFirst({
    where: { role, active: true },
    select: { email: true },
    orderBy: { createdAt: "asc" },
  });
  if (!user?.email) return null;

  const showPassword =
    process.env.NODE_ENV !== "production" || process.env.SHOW_DEMO_CREDENTIALS === "true";

  const passwordHint = showPassword
    ? role === Role.ADMIN
      ? process.env.DEMO_ADMIN_PASSWORD?.trim() || "admin123"
      : process.env.DEMO_RECRUITER_PASSWORD?.trim() || "recruiter123"
    : null;

  return { email: user.email, passwordHint };
}

function adminContent(
  platform: PlatformSettings,
  demo: Awaited<ReturnType<typeof getDemoAccount>>
): LoginRoleContent {
  return {
    headline: "Manage screening",
    headlineAccent: "operations",
    description: `Configure ${platform.companyName}'s recruiters, assessments, templates, and platform settings from one console.`,
    features: getAdminLoginFeatures(),
    cardTitle: "Admin sign in",
    cardSubtitle: `Access the ${BRAND.name} admin console for ${platform.companyName}.`,
    demoEmail: demo?.email ?? null,
    demoPasswordHint: demo?.passwordHint ?? null,
    supportMessage: `Contact ${platform.contactEmail} to reset your password.`,
  };
}

function recruiterContent(
  platform: PlatformSettings,
  demo: Awaited<ReturnType<typeof getDemoAccount>>
): LoginRoleContent {
  return {
    headline: "Screen resumes on the",
    headlineAccent: "landing page",
    description: `Sign in to ${BRAND.name}, upload JD + resumes on the landing page, then review processing and ranked reports.`,
    features: ["Landing → start screening", "Live processing view", "Downloadable report"],
    cardTitle: "Recruiter sign in",
    cardSubtitle: `Sign in to your ${platform.companyName} recruiter workspace.`,
    demoEmail: demo?.email ?? null,
    demoPasswordHint: demo?.passwordHint ?? null,
    supportMessage: `Contact ${platform.contactEmail} to reset your password.`,
  };
}

export async function getLoginPageConfig(role: Role): Promise<LoginPageConfig> {
  const platform = await getPlatformSettings();
  const demo = await getDemoAccount(role);

  if (role === Role.ADMIN) {
    return {
      brand: buildBrandContext(platform, "ADMIN CONSOLE"),
      content: adminContent(platform, demo),
    };
  }

  return {
    brand: buildBrandContext(platform, "RECRUITER WORKSPACE"),
    content: recruiterContent(platform, demo),
  };
}
