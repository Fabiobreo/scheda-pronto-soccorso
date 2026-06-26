import LoginPageClient from "./LoginPageClient";

type Props = { searchParams: Promise<{ callbackUrl?: string }> };

export default async function LoginPage({ searchParams }: Props) {
  const { callbackUrl: raw = "/" } = await searchParams;
  const callbackUrl = raw.startsWith("/") && !raw.startsWith("//") ? raw : "/";
  return <LoginPageClient callbackUrl={callbackUrl} />;
}
