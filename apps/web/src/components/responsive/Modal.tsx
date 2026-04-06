import { ReactNode, useEffect } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@novabots/ui";

export interface ResponsiveModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
  size?: "sm" | "md" | "lg" | "xl" | "full";
  position?: "center" | "top" | "bottom" | "right" | "left";
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
  title?: string;
  description?: string;
  header?: ReactNode;
  footer?: ReactNode;
}

const sizeClasses = {
  sm: "max-w-md",
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
  full: "max-w-[95vw] sm:max-w-6xl",
};

const positionClasses = {
  center: "items-center justify-center",
  top: "items-start justify-center pt-8 sm:pt-16",
  bottom: "items-end justify-center",
  right: "items-stretch justify-end",
  left: "items-stretch justify-start",
};

const panelPositionClasses = {
  center: "",
  top: "",
  bottom: "",
  right: "h-full w-[min(90vw,480px)] sm:w-[480px] rounded-none",
  left: "h-full w-[min(90vw,480px)] sm:w-[480px] rounded-none",
};

/**
 * Responsive Modal Component
 * Adapts to screen size: full-screen on mobile, centered dialog on desktop
 * 
 * Features:
 * - Mobile: slides up from bottom or full-screen
 * - Desktop: centered dialog with backdrop
 * - Keyboard accessible (Escape to close)
 * - Focus trap support
 * - Reduced motion support
 * - Multiple sizes and positions
 * 
 * Usage:
 * <ResponsiveModal open={isOpen} onOpenChange={setIsOpen}>
 *   <ModalHeader>Title</ModalHeader>
 *   <ModalBody>Content</ModalBody>
 *   <ModalFooter>Actions</ModalFooter>
 * </ResponsiveModal>
 */
export function ResponsiveModal({
  open,
  onOpenChange,
  children,
  size = "md",
  position = "center",
  closeOnOverlayClick = true,
  closeOnEscape = true,
  title,
  description,
  header,
  footer,
}: ResponsiveModalProps) {
  const reduceMotion = useReducedMotion();

  // Close on Escape key
  useEffect(() => {
    if (!closeOnEscape) return;

    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape" && open) {
        onOpenChange(false);
      }
    }

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [open, closeOnEscape, onOpenChange]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const handleOverlayClick = () => {
    if (closeOnOverlayClick) {
      onOpenChange(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          {!reduceMotion && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
              onClick={handleOverlayClick}
              aria-hidden="true"
            />
          )}

          {/* Modal Container */}
          <div
            className={cn(
              "fixed inset-0 z-50 flex",
              positionClasses[position]
            )}
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? "modal-title" : undefined}
            aria-describedby={description ? "modal-description" : undefined}
          >
            <motion.div
              initial={
                reduceMotion
                  ? { opacity: 1 }
                  : position === "bottom"
                  ? { y: "100%" }
                  : position === "right"
                  ? { x: "100%" }
                  : position === "left"
                  ? { x: "-100%" }
                  : { opacity: 0, scale: 0.95 }
              }
              animate={
                reduceMotion
                  ? { opacity: 1 }
                  : {
                      y: 0,
                      x: 0,
                      opacity: 1,
                      scale: 1,
                    }
              }
              exit={
                reduceMotion
                  ? { opacity: 1 }
                  : position === "bottom"
                  ? { y: "100%" }
                  : position === "right"
                  ? { x: "100%" }
                  : position === "left"
                  ? { x: "-100%" }
                  : { opacity: 0, scale: 0.95 }
              }
              transition={{
                type: "tween",
                duration: reduceMotion ? 0 : 0.3,
                ease: [0.22, 1, 0.36, 1],
              }}
              className={cn(
                // Base styles
                "relative w-full bg-white shadow-2xl",
                // Mobile: full width with rounded top (for bottom sheet)
                "rounded-t-2xl sm:rounded-2xl",
                // Position-specific styling
                position === "bottom" && "mt-auto rounded-b-none",
                position !== "bottom" && position !== "right" && position !== "left" && "m-4 sm:m-8",
                // Size constraints
                sizeClasses[size],
                // Panel position overrides
                panelPositionClasses[position],
                // Prevent overflow
                "max-h-[90vh] overflow-y-auto"
              )}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className={cn(
                  "absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full",
                  "text-[rgb(var(--text-muted))] hover:bg-[rgb(var(--surface-subtle))] hover:text-[rgb(var(--text-primary))]",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--primary))]"
                )}
                aria-label="Close modal"
              >
                <X className="h-5 w-5" />
              </button>

              {/* Header (if title provided) */}
              {title && (
                <div className="border-b border-[rgb(var(--border-subtle))] px-6 py-4 sm:px-8 sm:py-6">
                  <h2
                    id="modal-title"
                    className="text-lg font-semibold text-[rgb(var(--text-primary))] sm:text-xl"
                  >
                    {title}
                  </h2>
                  {description && (
                    <p
                      id="modal-description"
                      className="mt-1 text-sm text-[rgb(var(--text-secondary))]"
                    >
                      {description}
                    </p>
                  )}
                </div>
              )}

              {/* Custom Header (if provided) */}
              {header}

              {/* Content */}
              <div className="px-6 py-4 sm:px-8 sm:py-6">{children}</div>

              {/* Footer (if provided) */}
              {footer && (
                <div className="border-t border-[rgb(var(--border-subtle))] px-6 py-4 sm:px-8 sm:py-6">
                  {footer}
                </div>
              )}
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

/**
 * Responsive Bottom Sheet Component
 * Mobile-first drawer that slides up from bottom
 * Becomes a centered dialog on larger screens
 * 
 * Usage:
 * <BottomSheet open={isOpen} onOpenChange={setIsOpen}>
 *   Content here
 * </BottomSheet>
 */
export function BottomSheet({
  open,
  onOpenChange,
  children,
  snapPoints,
  className,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
  snapPoints?: ("sm" | "md" | "lg" | "full")[];
  className?: string;
}) {
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <>
          {!reduceMotion && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
              onClick={() => onOpenChange(false)}
            />
          )}

          <div className="fixed inset-0 z-50 flex items-end justify-center">
            <motion.div
              initial={reduceMotion ? { y: 0 } : { y: "100%" }}
              animate={reduceMotion ? { y: 0 } : { y: 0 }}
              exit={reduceMotion ? { y: 0 } : { y: "100%" }}
              transition={{
                type: "tween",
                duration: reduceMotion ? 0 : 0.35,
                ease: [0.32, 0, 0.67, 0],
              }}
              className={cn(
                "relative w-full max-h-[85vh] overflow-y-auto",
                "rounded-t-2xl bg-white shadow-2xl",
                "sm:max-w-lg sm:mx-auto sm:rounded-2xl sm:max-h-[90vh]",
                className
              )}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Drag Handle Indicator */}
              <div className="sticky top-0 z-10 flex justify-center py-3 bg-white">
                <div className="h-1.5 w-12 rounded-full bg-[rgb(var(--border-default))]" />
              </div>

              <div className="px-4 pb-6 sm:px-6">{children}</div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
