"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

/**
 * Global tıklama/gezinme geri bildirimi.
 *
 * - İç bağlantılara veya form submit butonlarına tıklandığında üstte ince bir
 *   ilerleme çizgisi görünür ve tıklanan öğe hafifçe "beklemede" görünümüne geçer.
 * - Yol (pathname) değiştiğinde otomatik gizlenir. En fazla 8 sn sonra da güvenlik
 *   için sıfırlanır (aynı sayfaya tıklama vb. edge case).
 */
export function RouteProgress() {
  const [aktif, setAktif] = useState(false);
  const pathname = usePathname();
  const zamanlayici = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sonElement = useRef<HTMLElement | null>(null);

  useEffect(() => {
    function meshgul(el: HTMLElement) {
      el.setAttribute("data-mesgul", "true");
      sonElement.current = el;
    }

    function temizle() {
      if (sonElement.current) {
        sonElement.current.removeAttribute("data-mesgul");
        sonElement.current = null;
      }
    }

    function ilerlemeBaslat() {
      setAktif(true);
      if (zamanlayici.current) clearTimeout(zamanlayici.current);
      // Güvenlik: 8 sn içinde bitmezse zorla sıfırla
      zamanlayici.current = setTimeout(() => {
        setAktif(false);
        temizle();
      }, 8000);
    }

    function tikOlayi(e: MouseEvent) {
      // Meta/Ctrl/Shift ile açılan yeni sekmeleri sayma
      if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      if (e.button !== 0) return;

      const target = e.target as Element | null;
      if (!target) return;

      const anchor = target.closest("a[href]") as HTMLAnchorElement | null;
      if (anchor) {
        const href = anchor.getAttribute("href");
        if (!href) return;
        if (href.startsWith("#")) return;
        if (anchor.target && anchor.target !== "_self") return;
        // Sadece iç gezinme
        try {
          const url = new URL(href, window.location.href);
          if (url.origin !== window.location.origin) return;
          if (
            url.pathname === window.location.pathname &&
            url.search === window.location.search &&
            url.hash === window.location.hash
          ) {
            return; // Aynı yere tıklandı, gezinme olmaz
          }
        } catch {
          return;
        }
        ilerlemeBaslat();
        meshgul(anchor);
        return;
      }

      // Form submit butonu (input[type=submit], button[type=submit])
      const buton = target.closest(
        "button[type=submit], input[type=submit]",
      ) as HTMLButtonElement | null;
      if (buton && !buton.disabled) {
        ilerlemeBaslat();
        meshgul(buton);
      }
    }

    document.addEventListener("click", tikOlayi, true);
    return () => {
      document.removeEventListener("click", tikOlayi, true);
      if (zamanlayici.current) clearTimeout(zamanlayici.current);
      temizle();
    };
  }, []);

  // Pathname değiştiğinde ilerlemeyi bitir
  useEffect(() => {
    setAktif(false);
    if (sonElement.current) {
      sonElement.current.removeAttribute("data-mesgul");
      sonElement.current = null;
    }
    if (zamanlayici.current) {
      clearTimeout(zamanlayici.current);
      zamanlayici.current = null;
    }
  }, [pathname]);

  if (!aktif) return null;

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-x-0 top-0 z-[200] h-0.5 overflow-hidden bg-transparent"
    >
      <div className="route-progress-bar h-full w-full bg-primary" />
    </div>
  );
}
