import { redirect } from "next/navigation";

export default async function RecruiterLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const params = await searchParams;
  const q = params.callbackUrl
    ? `?callbackUrl=${encodeURIComponent(params.callbackUrl)}`
    : "?callbackUrl=/";
  redirect(`/login${q}`);
}
