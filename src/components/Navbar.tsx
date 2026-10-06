"use client";

import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Logo } from "./Logo";
import { PROJECT_LINKS, SITE, SOLUTION_LINKS } from "@/lib/site";
import SmartImage from "@/components/SmartImage";

export interface NavProduct {
  slug: string;
  name: string;
  category: string;
  shortDescription?: string;
  featured?: boolean;
  imageUrl?: string;
}

interface NavbarProps {
  products?: NavProduct[];
}

function Chevron({ open = false }: { open?: boolean }) {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`}
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function Dropdown({
  label,
  href,
  links,
  active,
}: {
  label: string;
  href: string;
  links: readonly (readonly [string, string])[];
  active?: boolean;
}) {
  return (
    <div className="group relative">
      <Link
        href={href}
        className={`flex items-center gap-1 rounded-md px-3 py-2 text-sm font-medium transition ${
          active ? "text-brand" : "text-slate-600 hover:text-brand"
        }`}
        aria-haspopup="true"
        aria-expanded="false"
      >
        {label}
        <Chevron />
      </Link>
      <div className="invisible absolute left-0 top-full z-50 w-72 pt-2 opacity-0 transition duration-200 group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white p-1.5 shadow-2xl shadow-slate-900/5">
          {links.map(([name, url]) => (
            <Link
              key={url}
              href={url}
              className="block rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-brand-light/70 hover:text-brand"
            >
              {name}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

function ProductsMegaMenu({ products, active }: { products: NavProduct[]; active?: boolean }) {
  const reduce = useReducedMotion();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const groups = useMemo(() => {
    const map = new Map<string, NavProduct[]>();
    for (const p of products) {
      const key = p.category || "Products";
      const arr = map.get(key) ?? [];
      arr.push(p);
      map.set(key, arr);
    }
    return [...map.entries()];
  }, [products]);

  const spotlight = products.find((p) => p.featured) ?? products[0];

  const openMenu = useCallback(() => {
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    setOpen(true);
  }, []);

  const closeMenu = useCallback(() => {
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    hoverTimer.current = setTimeout(() => setOpen(false), 120);
  }, []);

  // Close on outside interaction / Escape while open.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent | TouchEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("touchstart", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("touchstart", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div
      ref={rootRef}
      className="group relative"
      onMouseEnter={openMenu}
      onMouseLeave={closeMenu}
    >
      <Link
        href="/products"
        onClick={(e) => {
          if (!open) {
            // First tap on touch devices opens the menu; second tap navigates.
            e.preventDefault();
            setOpen(true);
          }
        }}
        onFocus={openMenu}
        onBlur={(e) => {
          if (hoverTimer.current) clearTimeout(hoverTimer.current);
          if (!rootRef.current?.contains(e.relatedTarget as Node)) setOpen(false);
        }}
        className={`inline-flex items-center gap-1 rounded-md px-3 py-2 text-sm font-medium transition ${
          active || open ? "text-brand" : "text-slate-600 hover:text-brand"
        }`}
        aria-haspopup="true"
        aria-expanded={open}
        aria-controls="products-megamenu"
      >
        Products
        <Chevron open={open} />
      </Link>

      <AnimatePresence>
        {open && (
          <motion.div
            id="products-megamenu"
            key="products-megamenu"
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 10, scale: 0.98 }}
            animate={reduce ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: 6, scale: 0.98 }}
            transition={{ duration: reduce ? 0.12 : 0.2, ease: [0.22, 1, 0.36, 1] }}
            onMouseEnter={openMenu}
            onMouseLeave={closeMenu}
            role="dialog"
            aria-label="MSNSS product range"
            className="absolute left-1/2 top-full z-50 w-[min(96vw,74rem)] -translate-x-1/2 pt-3"
          >
            <div className="max-h-[min(calc(100dvh-7rem),42rem)] overflow-y-auto overscroll-contain rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-950/10 ring-1 ring-slate-950/5">
              <div className="grid lg:grid-cols-[minmax(0,1fr)_19rem]">
                {/* Grouped product lists */}
                <div className="p-5 sm:p-7">
                  <div className="flex items-baseline justify-between gap-4 border-b border-slate-100 pb-4">
                    <p className="text-sm font-semibold text-ink">Product Range</p>
                    <span className="text-xs font-medium tabular-nums text-slate-400">
                      {products.length} products
                    </span>
                  </div>
                  <div
                    className={`grid gap-x-9 gap-y-5 pt-5 ${
                      groups.length > 1 ? "sm:grid-cols-2 xl:grid-cols-3" : "max-w-sm grid-cols-1"
                    }`}
                  >
                    {groups.map(([category, items]) => (
                      <div key={category}>
                        <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                          <span className="h-px w-3.5 bg-brand/50" aria-hidden="true" />
                          {category}
                        </p>
                        <ul className="mt-2.5 space-y-0.5">
                          {items.map((p) => (
                            <li key={p.slug}>
                              <Link
                                href={`/products/${p.slug}`}
                                onClick={closeMenu}
                                className="block rounded-md px-2.5 py-2 text-sm font-medium text-slate-600 transition hover:bg-brand-light/70 hover:text-brand"
                              >
                                {p.name}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>

                  {/* Compact footer */}
                  <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4 lg:hidden">
                    <Link
                      href="/products"
                      onClick={closeMenu}
                      className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand transition hover:underline"
                    >
                      View all products
                      <span aria-hidden="true">→</span>
                    </Link>
                    <span className="text-xs text-slate-400">{groups.length} categories</span>
                  </div>
                </div>

                {/* Featured product spotlight panel (desktop) */}
                {spotlight && (
                  <div className="hidden flex-col overflow-hidden border-l border-slate-200 lg:flex">
                    <div className="relative h-40 xl:h-44 overflow-hidden bg-slate-200">
                      <SmartImage
                        src={spotlight.imageUrl || "/images/hero-3.jpg"}
                        alt={spotlight.name}
                        fill
                        sizes="19rem"
                        className="object-cover"
                        priority={false}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/20 to-transparent" />
                      <span className="absolute left-4 top-4 rounded-md bg-brand px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white shadow-sm">
                        Featured
                      </span>
                    </div>
                    <div className="flex flex-1 flex-col bg-slate-900 p-5">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-300">
                        {spotlight.category}
                      </p>
                      <h3 className="mt-2 text-lg font-bold leading-snug text-white">
                        {spotlight.name}
                      </h3>
                      <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-300">
                        {spotlight.shortDescription ||
                          `Precision-fabricated ${spotlight.name.toLowerCase()} manufactured and installed to project specifications.`}
                      </p>
                      <Link
                        href={`/products/${spotlight.slug}`}
                        onClick={closeMenu}
                        className="mt-5 inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-brand px-5 text-sm font-semibold text-white transition hover:bg-brand-dark"
                      >
                        View product
                        <span aria-hidden="true">→</span>
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function CategoryGroupMobile({
  category,
  items,
  onNavigate,
  defaultOpen = false,
}: {
  category: string;
  items: NavProduct[];
  onNavigate: () => void;
  defaultOpen?: boolean;
}) {
  const reduce = useReducedMotion();
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="overflow-hidden rounded-lg border border-slate-100">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left"
      >
        <span className="text-sm font-semibold text-slate-800">{category}</span>
        <span className="flex items-center gap-2">
          <span className="rounded-full bg-brand-light px-2 py-0.5 text-[10px] font-bold tabular-nums text-brand">
            {items.length}
          </span>
          <Chevron open={open} />
        </span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key={`cat-${category}`}
            initial={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }}
            animate={reduce ? { opacity: 1 } : { height: "auto", opacity: 1 }}
            exit={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }}
            transition={{ duration: reduce ? 0.1 : 0.24, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden border-t border-slate-100"
          >
            <ul className="space-y-0.5 p-1.5">
              {items.map((p) => (
                <li key={p.slug}>
                  <Link
                    href={`/products/${p.slug}`}
                    onClick={onNavigate}
                    className="block rounded-md px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-brand-light/70 hover:text-brand"
                  >
                    {p.name}
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function MobileFeaturedProduct({
  spotlight,
  onNavigate,
}: {
  spotlight: NavProduct;
  onNavigate: () => void;
}) {
  return (
    <div className="overflow-hidden rounded-lg bg-slate-900">
      <div className="relative h-24 w-full">
        <SmartImage
          src={spotlight.imageUrl || "/images/hero-3.jpg"}
          alt={spotlight.name}
          fill
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/85 via-slate-900/25 to-slate-900/5" />
      </div>
      <div className="p-3">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-cyan-300">
          Featured Product
        </p>
        <p className="mt-0.5 text-sm font-bold leading-snug text-white">{spotlight.name}</p>
        <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-300">
          {spotlight.shortDescription ||
            `Precision-fabricated ${spotlight.name.toLowerCase()} manufactured and installed to project specifications.`}
        </p>
        <Link
          href={`/products/${spotlight.slug}`}
          onClick={onNavigate}
          className="mt-2.5 inline-flex h-8 items-center gap-1.5 rounded-md bg-brand px-3 text-xs font-semibold text-white transition hover:bg-brand-dark"
        >
          View product
          <span aria-hidden="true">→</span>
        </Link>
      </div>
    </div>
  );
}

function MobileProducts({
  products,
  onNavigate,
}: {
  products: NavProduct[];
  onNavigate: () => void;
}) {
  const reduce = useReducedMotion();
  const [open, setOpen] = useState(false);
  const groups = useMemo(() => {
    const map = new Map<string, NavProduct[]>();
    for (const p of products) {
      const key = p.category || "Products";
      const arr = map.get(key) ?? [];
      arr.push(p);
      map.set(key, arr);
    }
    return [...map.entries()];
  }, [products]);

  const spotlight = products.find((p) => p.featured) ?? products[0];

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-2 px-3 py-3"
      >
        <span className="text-sm font-semibold text-slate-800">Products</span>
        <span className="flex items-center gap-2">
          <span className="rounded-full bg-brand-light px-2 py-0.5 text-[10px] font-bold tabular-nums text-brand">
            {products.length}
          </span>
          <Chevron open={open} />
        </span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="mobile-products"
            initial={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }}
            animate={reduce ? { opacity: 1 } : { height: "auto", opacity: 1 }}
            exit={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }}
            transition={{ duration: reduce ? 0.1 : 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden border-t border-slate-100"
          >
            <div className="space-y-2 p-2.5">
              {groups.map(([category, items], i) => (
                <CategoryGroupMobile
                  key={category}
                  category={category}
                  items={items}
                  onNavigate={onNavigate}
                  defaultOpen={i === 0}
                />
              ))}
              {spotlight && (
                <MobileFeaturedProduct spotlight={spotlight} onNavigate={onNavigate} />
              )}
              <Link
                href="/products"
                onClick={onNavigate}
                className="block rounded-lg bg-brand px-3 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-brand-dark"
              >
                View all products
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function Navbar({ products = [] }: NavbarProps) {
  const [open, setOpen] = useState(false);
  const [navH, setNavH] = useState(69);
  const [scrolled, setScrolled] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  const pathname = usePathname();

  // Elevation + glass density increase once the page scrolls under the bar.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Keep the fixed mobile drawer aligned to the actual (responsive) header box.
  useEffect(() => {
    const el = headerRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver((entries) => {
      for (const e of entries) setNavH(e.contentRect.height);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);

  // Close the drawer whenever the route changes (deferred to avoid a
  // synchronous setState during the effect commit).
  useEffect(() => {
    const id = requestAnimationFrame(() => setOpen(false));
    return () => cancelAnimationFrame(id);
  }, [pathname]);

  // Lock body scroll + close on Escape while the drawer is open.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <header
      ref={headerRef}
      className={`sticky top-0 z-50 w-full border-b transition-[box-shadow,background-color,border-color] duration-300 ${
        scrolled
          ? "border-slate-200/80 bg-white shadow-premium"
          : "border-slate-200/70 bg-white/95 shadow-xs backdrop-blur"
      }`}
    >
      {/* Top utility bar (desktop only) */}
      <div className="hidden bg-slate-900 text-white lg:block">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-2 text-xs">
          <span className="tracking-wide text-slate-300">
            Ducting <span className="text-brand">•</span> Fabrication{" "}
            <span className="text-brand">•</span> Installation
          </span>
          <div className="flex items-center gap-5 text-slate-300">
            <a
              href={`https://wa.me/${SITE.whatsapp}`}
              target="_blank"
              rel="noreferrer"
              className="transition hover:text-white"
            >
              {SITE.phones[0]}
            </a>
            <a href={`mailto:${SITE.emails[0]}`} className="transition hover:text-white">
              {SITE.emails[0]}
            </a>
          </div>
        </div>
      </div>

      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 lg:px-6">
        <Link href="/" aria-label="MSNSS home" className="shrink-0">
          <Logo />
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 lg:flex" aria-label="Main navigation">
          <Link
            href="/"
            className={`rounded-md px-3 py-2 text-sm font-medium transition ${
              isActive("/") ? "text-brand" : "text-slate-600 hover:text-brand"
            }`}
          >
            Home
          </Link>
          <Link
            href="/about"
            className={`rounded-md px-3 py-2 text-sm font-medium transition ${
              isActive("/about") ? "text-brand" : "text-slate-600 hover:text-brand"
            }`}
          >
            About
          </Link>
          {products.length > 0 ? (
            <ProductsMegaMenu products={products} active={isActive("/products")} />
          ) : (
            <Link
              href="/products"
              className={`rounded-md px-3 py-2 text-sm font-medium transition ${
                isActive("/products") ? "text-brand" : "text-slate-600 hover:text-brand"
              }`}
            >
              Products
            </Link>
          )}
          <Dropdown
            label="Solutions"
            href="/solutions"
            links={SOLUTION_LINKS}
            active={isActive("/solutions")}
          />
          <Link
            href="/plant-and-machinery"
            className={`rounded-md px-3 py-2 text-sm font-medium transition ${
              isActive("/plant-and-machinery")
                ? "text-brand"
                : "text-slate-600 hover:text-brand"
            }`}
          >
            Plant &amp; Machinery
          </Link>
          <Dropdown
            label="Projects"
            href="/projects"
            links={PROJECT_LINKS}
            active={isActive("/projects")}
          />
          <Link
            href="/contact"
            className={`rounded-md px-3 py-2 text-sm font-medium transition ${
              isActive("/contact") ? "text-brand" : "text-slate-600 hover:text-brand"
            }`}
          >
            Contact
          </Link>
          <Link
            href="/contact"
            className="ml-2 rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-brand-dark"
          >
            Get a Quote
          </Link>
        </nav>

        {/* Mobile toggle */}
        <button
          onClick={() => setOpen(!open)}
          className="flex h-11 w-11 items-center justify-center rounded-lg border border-slate-300 text-slate-700 lg:hidden"
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label={open ? "Close menu" : "Open menu"}
        >
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            {open ? (
              <path d="M18 6 6 18M6 6l12 12" />
            ) : (
              <path d="M3 12h18M3 6h18M3 18h18" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile drawer */}
      {open && (
        <>
          <div
            className="fixed inset-x-0 z-40 bg-slate-950/40 lg:hidden"
            style={{ top: navH, bottom: 0 }}
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <div
            id="mobile-menu"
            className="fixed inset-x-0 z-40 overflow-y-auto overscroll-contain border-t border-slate-200 bg-white lg:hidden"
            style={{ top: navH, maxHeight: `calc(100dvh - ${navH}px)` }}
            role="dialog"
            aria-label="Mobile navigation"
          >
            <nav className="space-y-1 px-4 pb-6 pt-3" aria-label="Mobile navigation">
              <Link
                href="/"
                onClick={() => setOpen(false)}
                className="block rounded-lg px-3 py-3 text-sm font-semibold text-slate-800 hover:bg-brand-light hover:text-brand"
              >
                Home
              </Link>
              <Link
                href="/about"
                onClick={() => setOpen(false)}
                className="block rounded-lg px-3 py-3 text-sm font-semibold text-slate-800 hover:bg-brand-light hover:text-brand"
              >
                About
              </Link>

              <MobileProducts products={products} onNavigate={() => setOpen(false)} />

              <details className="rounded-lg border border-slate-200">
                <summary className="cursor-pointer list-none px-3 py-3 text-sm font-semibold text-slate-800">
                  Solutions
                </summary>
                <div className="border-t border-slate-100 p-1.5">
                  {SOLUTION_LINKS.map(([n, u]) => (
                    <Link
                      key={u}
                      href={u}
                      onClick={() => setOpen(false)}
                      className="block rounded-md px-3 py-2.5 text-sm text-slate-600 hover:bg-brand-light hover:text-brand"
                    >
                      {n}
                    </Link>
                  ))}
                </div>
              </details>

              <Link
                href="/plant-and-machinery"
                onClick={() => setOpen(false)}
                className="block rounded-lg px-3 py-3 text-sm font-semibold text-slate-800 hover:bg-brand-light hover:text-brand"
              >
                Plant &amp; Machinery
              </Link>

              <details className="rounded-lg border border-slate-200">
                <summary className="cursor-pointer list-none px-3 py-3 text-sm font-semibold text-slate-800">
                  Projects
                </summary>
                <div className="border-t border-slate-100 p-1.5">
                  {PROJECT_LINKS.map(([n, u]) => (
                    <Link
                      key={u}
                      href={u}
                      onClick={() => setOpen(false)}
                      className="block rounded-md px-3 py-2.5 text-sm text-slate-600 hover:bg-brand-light hover:text-brand"
                    >
                      {n}
                    </Link>
                  ))}
                </div>
              </details>

              <Link
                href="/catalogue"
                onClick={() => setOpen(false)}
                className="block rounded-lg px-3 py-3 text-sm font-semibold text-slate-800 hover:bg-brand-light hover:text-brand"
              >
                Catalogue
              </Link>
              <Link
                href="/contact"
                onClick={() => setOpen(false)}
                className="block rounded-lg px-3 py-3 text-sm font-semibold text-slate-800 hover:bg-brand-light hover:text-brand"
              >
                Contact
              </Link>

              <div className="grid grid-cols-2 gap-3 pt-3">
                <Link
                  href="/contact"
                  onClick={() => setOpen(false)}
                  className="rounded-lg bg-brand px-4 py-3 text-center text-sm font-semibold text-white"
                >
                  Get a Quote
                </Link>
                <a
                  href={`https://wa.me/${SITE.whatsapp}`}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-lg border border-slate-300 px-4 py-3 text-center text-sm font-semibold text-slate-700"
                >
                  WhatsApp
                </a>
              </div>
            </nav>
          </div>
        </>
      )}
    </header>
  );
}