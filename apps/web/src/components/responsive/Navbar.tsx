import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  Menu,
  X,
  ChevronDown,
  LayoutDashboard,
  ArrowRight,
} from "lucide-react";
import { cn } from "@novabots/ui";

export interface NavItem {
  label: string;
  href: string;
  children?: NavItem[];
}

export interface ResponsiveNavbarProps {
  brand: {
    name: string;
    href: string;
    logo?: React.ReactNode;
  };
  navItems: NavItem[];
  auth?: {
    loggedIn: boolean;
    checking: boolean;
    loginHref: string;
    registerHref: string;
    dashboardHref: string;
  };
  className?: string;
  transparent?: boolean;
}

/**
 * Responsive Navbar Component
 * Mobile-first navigation with hamburger menu on small screens
 * 
 * Features:
 * - Mobile: hamburger menu with slide-out drawer
 * - Tablet/Desktop: horizontal navigation
 * - Dropdown support for nested items
 * - Auth state awareness
 * - Reduced motion support
 * 
 * Usage:
 * <ResponsiveNavbar
 *   brand={{ name: "ScopeIQ", href: "/" }}
 *   navItems={[{ label: "Features", href: "#features" }]}
 *   auth={{ loggedIn: false, checking: false, ... }}
 * />
 */
export function ResponsiveNavbar({
  brand,
  navItems,
  auth,
  className,
  transparent = false,
}: ResponsiveNavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const reduceMotion = useReducedMotion();

  // Detect scroll for background opacity
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  // Close mobile menu on route change (if using client-side nav)
  useEffect(() => {
    setMobileMenuOpen(false);
  }, []);

  return (
    <header
      className={cn(
        // Position: sticky to top
        "sticky top-0 z-50 w-full",
        // Background: transparent initially, then opaque on scroll
        transparent && !scrolled
          ? "bg-transparent"
          : "bg-white/90 backdrop-blur-md border-b border-[rgb(var(--border-subtle))]",
        // Transition for smooth state change
        "transition-all duration-300",
        className
      )}
    >
      <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between sm:h-18 lg:h-20">
          {/* Brand / Logo */}
          <Link
            href={brand.href}
            className={cn(
              "flex items-center gap-2 shrink-0",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--primary))] focus-visible:ring-offset-2",
              transparent && !scrolled ? "text-white" : "text-[rgb(var(--text-primary))]"
            )}
          >
            {brand.logo || (
              <span className="text-xl font-bold tracking-tight sm:text-2xl">
                {brand.name}
              </span>
            )}
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden items-center gap-6 lg:flex">
            {navItems.map((item) =>
              item.children ? (
                <DropdownNavItem
                  key={item.label}
                  item={item}
                  scrolled={scrolled}
                  transparent={transparent}
                />
              ) : (
                <Link
                  key={item.label}
                  href={item.href}
                  className={cn(
                    "text-sm font-medium transition-colors",
                    transparent && !scrolled
                      ? "text-white/90 hover:text-white"
                      : "text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--text-primary))]"
                  )}
                >
                  {item.label}
                </Link>
              )
            )}
          </div>

          {/* Desktop Auth Buttons */}
          {auth && (
            <div className="hidden items-center gap-3 lg:flex">
              {auth.checking ? (
                <div className="h-9 w-24 animate-pulse rounded-full bg-[rgb(var(--surface-subtle))]" />
              ) : auth.loggedIn ? (
                <Link
                  href={auth.dashboardHref}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-all",
                    "hover:-translate-y-0.5 hover:shadow-md",
                    transparent && !scrolled
                      ? "bg-white text-[rgb(var(--text-primary))] hover:bg-white/95"
                      : "bg-[rgb(var(--primary-dark))] text-white hover:bg-[rgb(var(--primary))]"
                  )}
                >
                  <LayoutDashboard className="h-4 w-4" />
                  Dashboard
                </Link>
              ) : (
                <>
                  <Link
                    href={auth.loginHref}
                    className={cn(
                      "text-sm font-medium transition-colors",
                      transparent && !scrolled
                        ? "text-white/90 hover:text-white"
                        : "text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--text-primary))]"
                    )}
                  >
                    Log in
                  </Link>
                  <Link
                    href={auth.registerHref}
                    className={cn(
                      "inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-white transition-all",
                      "hover:-translate-y-0.5 hover:shadow-md",
                      transparent && !scrolled
                        ? "bg-white text-[rgb(var(--primary-dark))] hover:bg-white/95"
                        : "bg-[rgb(var(--primary-dark))] hover:bg-[rgb(var(--primary))]"
                    )}
                  >
                    Get started
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </>
              )}
            </div>
          )}

          {/* Mobile Menu Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-full lg:hidden",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--primary))]",
              transparent && !scrolled
                ? "text-white hover:bg-white/10"
                : "text-[rgb(var(--text-primary))] hover:bg-[rgb(var(--surface-subtle))]"
            )}
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>
      </nav>

      {/* Mobile Menu Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            {/* Backdrop */}
            {!reduceMotion && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
                onClick={() => setMobileMenuOpen(false)}
              />
            )}

            {/* Drawer */}
            <motion.div
              initial={
                reduceMotion
                  ? { opacity: 1, x: 0 }
                  : { opacity: 0, x: "100%" }
              }
              animate={
                reduceMotion
                  ? { opacity: 1, x: 0 }
                  : { opacity: 1, x: 0 }
              }
              exit={
                reduceMotion
                  ? { opacity: 1, x: 0 }
                  : { opacity: 0, x: "100%" }
              }
              transition={{
                type: "tween",
                duration: reduceMotion ? 0 : 0.3,
                ease: [0.22, 1, 0.36, 1],
              }}
              className={cn(
                "fixed right-0 top-0 z-50 h-full w-[min(85vw,360px)]",
                "overflow-y-auto bg-white shadow-2xl lg:hidden"
              )}
            >
              <div className="flex h-16 items-center justify-between border-b border-[rgb(var(--border-subtle))] px-4">
                <Link
                  href={brand.href}
                  className="text-xl font-bold text-[rgb(var(--primary-dark))]"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {brand.name}
                </Link>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex h-10 w-10 items-center justify-center rounded-full text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--surface-subtle))]"
                  aria-label="Close menu"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="px-4 py-6">
                {/* Nav Items */}
                <div className="space-y-1">
                  {navItems.map((item) =>
                    item.children ? (
                      <MobileDropdown
                        key={item.label}
                        item={item}
                        onClose={() => setMobileMenuOpen(false)}
                      />
                    ) : (
                      <Link
                        key={item.label}
                        href={item.href}
                        className={cn(
                          "block rounded-xl px-4 py-3 text-base font-medium transition-colors",
                          "text-[rgb(var(--text-primary))] hover:bg-[rgb(var(--surface-subtle))]"
                        )}
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        {item.label}
                      </Link>
                    )
                  )}
                </div>

                {/* Mobile Auth Buttons */}
                {auth && (
                  <div className="mt-6 space-y-3 border-t border-[rgb(var(--border-subtle))] pt-6">
                    {auth.checking ? (
                      <div className="h-12 w-full animate-pulse rounded-xl bg-[rgb(var(--surface-subtle))]" />
                    ) : auth.loggedIn ? (
                      <Link
                        href={auth.dashboardHref}
                        className={cn(
                          "flex items-center justify-center gap-2 rounded-xl bg-[rgb(var(--primary-dark))] px-5 py-3 text-base font-semibold text-white",
                          "hover:bg-[rgb(var(--primary))]"
                        )}
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <LayoutDashboard className="h-5 w-5" />
                        Go to Dashboard
                      </Link>
                    ) : (
                      <>
                        <Link
                          href={auth.loginHref}
                          className="block rounded-xl border border-[rgb(var(--border-default))] px-5 py-3 text-center text-base font-semibold text-[rgb(var(--text-primary))] hover:bg-[rgb(var(--surface-subtle))]"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          Log in
                        </Link>
                        <Link
                          href={auth.registerHref}
                          className="flex items-center justify-center gap-2 rounded-xl bg-[rgb(var(--primary-dark))] px-5 py-3 text-center text-base font-semibold text-white hover:bg-[rgb(var(--primary))]"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          Get started free
                          <ArrowRight className="h-5 w-5" />
                        </Link>
                      </>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  );
}

/* Desktop Dropdown Nav Item */
function DropdownNavItem({
  item,
  scrolled,
  transparent,
}: {
  item: NavItem;
  scrolled: boolean;
  transparent: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        className={cn(
          "flex items-center gap-1 text-sm font-medium transition-colors",
          transparent && !scrolled
            ? "text-white/90 hover:text-white"
            : "text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--text-primary))]"
        )}
      >
        {item.label}
        <ChevronDown
          className={cn(
            "h-4 w-4 transition-transform",
            open && "rotate-180"
          )}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 mt-2 w-48 rounded-xl border border-[rgb(var(--border-subtle))] bg-white p-2 shadow-lg"
          >
            {item.children!.map((child) => (
              <Link
                key={child.label}
                href={child.href}
                className="block rounded-lg px-3 py-2 text-sm text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--surface-subtle))] hover:text-[rgb(var(--text-primary))]"
              >
                {child.label}
              </Link>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* Mobile Dropdown */
function MobileDropdown({
  item,
  onClose,
}: {
  item: NavItem;
  onClose: () => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <button
        className={cn(
          "flex w-full items-center justify-between rounded-xl px-4 py-3 text-base font-medium",
          "text-[rgb(var(--text-primary))] hover:bg-[rgb(var(--surface-subtle))]"
        )}
        onClick={() => setOpen(!open)}
      >
        {item.label}
        <ChevronDown
          className={cn("h-5 w-5 transition-transform", open && "rotate-180")}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="ml-4 space-y-1 py-2">
              {item.children!.map((child) => (
                <Link
                  key={child.label}
                  href={child.href}
                  className="block rounded-lg px-4 py-2 text-sm text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--surface-subtle))] hover:text-[rgb(var(--text-primary))]"
                  onClick={() => {
                    onClose();
                    setOpen(false);
                  }}
                >
                  {child.label}
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
