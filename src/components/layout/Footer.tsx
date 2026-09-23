import Link from "next/link";
import { MapPin, MessageCircle } from "lucide-react";
import { siteConfig } from "@/lib/config/site";

function InstagramIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" {...props}>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.2" cy="6.8" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function FacebookIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" {...props}>
      <path d="M15 4h-2a4 4 0 0 0-4 4v3H7v4h2v6h4v-6h2.5l.5-4H13V8a1 1 0 0 1 1-1h2Z" strokeLinejoin="round" />
    </svg>
  );
}

export function Footer() {
  return (
    <footer className="mt-24 border-t border-brand-sand/70 bg-brand-green text-brand-cream">
      <div className="container-site grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <span className="font-serif text-xl font-semibold text-brand-cream">
            {siteConfig.name}
          </span>
          <p className="mt-3 max-w-xs text-sm text-brand-cream/70">
            Aves ornamentais e ovos férteis para incubação, direto do
            criatório para você.
          </p>
        </div>

        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-brand-gold-light">
            Navegação
          </h3>
          <ul className="mt-4 space-y-2 text-sm text-brand-cream/80">
            {siteConfig.nav.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="hover:text-brand-cream">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-brand-gold-light">
            Contato
          </h3>
          <ul className="mt-4 space-y-2 text-sm text-brand-cream/80">
            <li className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
              <a
                href={`https://wa.me/${siteConfig.whatsapp.number}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-brand-cream"
              >
                {siteConfig.whatsapp.display}
              </a>
            </li>
            {(siteConfig.location.city || siteConfig.location.state) && (
              <li className="flex items-center gap-2">
                <MapPin className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>
                  {siteConfig.location.city}
                  {siteConfig.location.city && siteConfig.location.state ? " - " : ""}
                  {siteConfig.location.state}
                </span>
              </li>
            )}
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-brand-gold-light">
            Redes sociais
          </h3>
          <div className="mt-4 flex gap-3">
            <a
              href={siteConfig.social.instagram || "#"}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram do Criatório Velho Oeste"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-cream/10 hover:bg-brand-cream/20"
            >
              <InstagramIcon className="h-4 w-4" aria-hidden="true" />
            </a>
            <a
              href={siteConfig.social.facebook || "#"}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook do Criatório Velho Oeste"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-cream/10 hover:bg-brand-cream/20"
            >
              <FacebookIcon className="h-4 w-4" aria-hidden="true" />
            </a>
          </div>
        </div>
      </div>

      <div className="border-t border-brand-cream/10 py-6">
        <div className="container-site flex flex-col gap-3 text-xs text-brand-cream/60 sm:flex-row sm:items-center sm:justify-between">
          <span>
            © {new Date().getFullYear()} {siteConfig.name}. Todos os direitos
            reservados.
          </span>
          <span className="flex flex-wrap items-center gap-x-4 gap-y-2">
            {siteConfig.legal.privacyPolicyUrl ? (
              <Link href={siteConfig.legal.privacyPolicyUrl}>
                Política de Privacidade
              </Link>
            ) : (
              <span>Política de Privacidade (em breve)</span>
            )}
            {siteConfig.legal.termsUrl ? (
              <Link href={siteConfig.legal.termsUrl}>Termos de Uso</Link>
            ) : (
              <span>Termos de Uso (em breve)</span>
            )}
          </span>
        </div>
        {/* Crédito do responsável pelo design/desenvolvimento do site, a
            pedido do Gabriel — link direto pro Instagram dele. */}
        <div className="container-site mt-3 border-t border-brand-cream/10 pt-3">
          <p className="text-xs text-brand-cream/50">
            Design e desenvolvimento:{" "}
            <a
              href="https://instagram.com/gabrielbucalon"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-brand-cream/70 hover:text-brand-cream"
            >
              @gabrielbucalon
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
