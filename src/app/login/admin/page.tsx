import { Suspense } from "react";
import type { Metadata } from "next";
import { Role } from "@prisma/client";
import { RoleLoginForm } from "@/components/auth/role-login-form";
import { getLoginPageConfig } from "@/lib/login-content";

export async function generateMetadata(): Promise<Metadata> {
  const { brand, content } = await getLoginPageConfig(Role.ADMIN);
  return {
    title: `${content.cardTitle} — ${brand.productName}`,
    description: content.cardSubtitle,
  };
}

export default async function AdminLoginPage() {
  const config = await getLoginPageConfig(Role.ADMIN);

  return (
    <Suspense>
      <RoleLoginForm role="ADMIN" config={config} />
    </Suspense>
  );
}
