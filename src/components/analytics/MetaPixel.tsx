"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import Script from "next/script";
import { siteConfig } from "@/lib/config/site";

/**
 * Pixel da Meta (Facebook/Instagram Ads). Registra "PageView" em cada página
 * visitada — inclusive nas trocas de página feitas sem recarregar o site.
 * Os demais eventos (ex.: "Lead" no botão do grupo) saem de
 * lib/analytics/events.ts.
 */
export function MetaPixel() {
  const pixelId = siteConfig.metaPixelId;
  const pathname = usePathname();
  const firstRender = useRef(true);

  useEffect(() => {
    // A primeira visualização já é enviada pelo script de inicialização.
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    window.fbq?.("track", "PageView");
  }, [pathname]);

  if (!pixelId) return null;

  return (
    <>
      <Script id="meta-pixel" strategy="afterInteractive">
        {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
document,'script','https://connect.facebook.net/en_US/fbevents.js');
fbq('init','${pixelId}');fbq('track','PageView');`}
      </Script>
      <noscript>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          height="1"
          width="1"
          style={{ display: "none" }}
          alt=""
          src={`https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1`}
        />
      </noscript>
    </>
  );
}
