import { prisma } from "@/lib/prisma";
import TemplatesClient from "./templates-client";

export default async function TemplatesPage() {
  const templates = await prisma.emailTemplate.findMany({ orderBy: { name: "asc" } });
  return <TemplatesClient templates={templates} />;
}
