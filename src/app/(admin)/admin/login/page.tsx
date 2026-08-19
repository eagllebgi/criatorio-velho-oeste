import { LoginForm } from "@/components/admin/LoginForm";
import { siteConfig } from "@/lib/config/site";

export default async function AdminLoginPage(
  props: PageProps<"/admin/login">,
) {
  const searchParams = await props.searchParams;
  const redirectParam = searchParams.redirect;
  const redirectTo = Array.isArray(redirectParam)
    ? redirectParam[0]
    : (redirectParam ?? "/admin");

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-2xl border border-brand-sand/70 bg-white p-8 shadow-sm">
        <div className="mb-6 text-center">
          <span className="font-serif text-xl font-semibold text-brand-green">
            {siteConfig.name}
          </span>
          <p className="mt-1 text-sm text-brand-ink/60">Painel administrativo</p>
        </div>
        <LoginForm redirectTo={redirectTo} />
      </div>
    </div>
  );
}
