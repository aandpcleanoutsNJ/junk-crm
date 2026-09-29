import { isAuthConfigured } from "@/lib/session";
import { getServerDict } from "@/lib/i18n-server";
import LoginForm from "./LoginForm";

export default async function LoginPage() {
  const configured = isAuthConfigured();
  const t = await getServerDict();

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-gray-50 px-4 py-8">
      <div className="w-full max-w-sm">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/brand/junk-helpers-navy-trimmed.png"
          alt="Junk Helpers"
          className="mx-auto mb-10 h-20 w-auto"
        />
        {configured ? (
          <LoginForm />
        ) : (
          <div className="banner banner-info text-center">
            {t.errors.authNotConnected}
          </div>
        )}
      </div>
    </main>
  );
}
