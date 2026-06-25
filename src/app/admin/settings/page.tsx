import { prisma } from "@/lib/prisma";
import SettingsClient from "./settings-client";

export default async function SettingsPage() {
  const settings = await prisma.settings.findUnique({ where: { id: "default" } });
  return <SettingsClient settings={settings} />;
}
