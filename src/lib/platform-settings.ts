import { prisma } from "@/lib/prisma";
import { BRAND } from "@/lib/constants";

export type PlatformSettings = {
  companyName: string;
  contactEmail: string;
  contactPhone: string;
  companyLogo: string | null;
  primaryColor: string;
};

export async function getPlatformSettings(): Promise<PlatformSettings> {
  const settings = await prisma.settings.findUnique({ where: { id: "default" } });

  return {
    companyName: settings?.companyName?.trim() || BRAND.company,
    contactEmail: settings?.contactEmail?.trim() || BRAND.email,
    contactPhone: settings?.contactPhone?.trim() || BRAND.phone,
    companyLogo: settings?.companyLogo?.trim() || null,
    primaryColor: settings?.primaryColor?.trim() || "#C8202A",
  };
}
