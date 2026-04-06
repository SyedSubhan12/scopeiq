import Image, { ImageProps } from "next/image";
import { cn } from "@novabots/ui";

export interface ResponsiveImageProps extends Omit<ImageProps, "className"> {
  className?: string;
  containerClassName?: string;
  aspectRatio?: "auto" | "square" | "video" | "portrait" | "landscape" | "banner";
  objectFit?: "contain" | "cover" | "fill" | "none" | "scale-down";
  priority?: boolean;
  lazyLoading?: boolean;
}

const aspectRatioClasses = {
  auto: "h-auto",
  square: "aspect-square",
  video: "aspect-video",
  portrait: "aspect-[3/4]",
  landscape: "aspect-[4/3]",
  banner: "aspect-[21/9]",
};

/**
 * Responsive Image Component
 * Wraps Next.js Image with responsive utilities and aspect ratio controls
 * 
 * Features:
 * - Automatic responsive sizes via Next.js
 * - Aspect ratio preservation
 * - Lazy loading by default
 * - Reduced motion support for decorative images
 * 
 * Usage:
 * <ResponsiveImage
 *   src="/hero.jpg"
 *   alt="Hero image"
 *   aspectRatio="banner"
 *   priority
 * />
 */
export function ResponsiveImage({
  src,
  alt,
  className,
  containerClassName,
  aspectRatio = "auto",
  objectFit = "cover",
  priority = false,
  lazyLoading = true,
  width,
  height,
  ...rest
}: ResponsiveImageProps) {
  const objectFitClasses = {
    contain: "object-contain",
    cover: "object-cover",
    fill: "object-fill",
    none: "object-none",
    "scale-down": "object-scale-down",
  };

  // Default responsive sizes for Next.js Image optimization
  const defaultSizes = "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw";

  // If no width/height provided, use fill layout for responsive sizing
  const isFillLayout = !width && !height;

  return (
    <div
      className={cn(
        "relative w-full",
        // Aspect ratio container
        aspectRatio !== "auto" && aspectRatioClasses[aspectRatio],
        containerClassName
      )}
    >
      <Image
        src={src}
        alt={alt}
        width={width || 1200}
        height={height || 800}
        sizes={defaultSizes}
        priority={priority}
        loading={lazyLoading && !priority ? "lazy" : undefined}
        className={cn(
          // Responsive image basics
          "w-full",
          aspectRatio === "auto" && "h-auto",
          // Object fit
          objectFitClasses[objectFit],
          // Performance: prevent layout shift
          "transition-opacity duration-200",
          className
        )}
        style={{
          height: isFillLayout ? "100%" : undefined,
        }}
        {...rest}
      />
    </div>
  );
}

/**
 * Responsive Video Embed
 * Embeds videos with proper aspect ratio and responsive sizing
 * 
 * Usage:
 * <ResponsiveVideo src="https://youtube.com/embed/..." />
 */
export function ResponsiveVideo({
  src,
  className,
  aspectRatio = "video",
  title,
  allowFullScreen = true,
  frameBorder = 0,
  allow,
}: {
  src: string;
  className?: string;
  aspectRatio?: "video" | "square" | "portrait";
  title?: string;
  allowFullScreen?: boolean;
  frameBorder?: number;
  allow?: string;
}) {
  const aspectClasses = {
    video: "aspect-video",
    square: "aspect-square",
    portrait: "aspect-[3/4]",
  };

  return (
    <div
      className={cn(
        "relative w-full overflow-hidden rounded-2xl",
        aspectClasses[aspectRatio],
        className
      )}
    >
      <iframe
        src={src}
        title={title || "Embedded video"}
        allowFullScreen={allowFullScreen}
        frameBorder={frameBorder}
        allow={allow || "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"}
        className="absolute inset-0 h-full w-full"
      />
    </div>
  );
}

/**
 * Picture element for art direction
 * Serves different images based on screen size
 * 
 * Usage:
 * <ResponsivePicture
 *   mobile="/hero-mobile.jpg"
 *   desktop="/hero-desktop.jpg"
 *   alt="Hero"
 * />
 */
export function ResponsivePicture({
  mobile,
  tablet,
  desktop,
  alt,
  className,
  containerClassName,
  aspectRatio = "auto",
  objectFit = "cover",
  sizes = "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw",
  priority = false,
  mobileWidth,
  mobileHeight,
  tabletWidth,
  tabletHeight,
  desktopWidth,
  desktopHeight,
}: {
  mobile: string;
  tablet?: string;
  desktop?: string;
  alt: string;
  className?: string;
  containerClassName?: string;
  aspectRatio?: "auto" | "square" | "video" | "portrait" | "landscape" | "banner";
  objectFit?: "contain" | "cover" | "fill" | "none" | "scale-down";
  sizes?: string;
  priority?: boolean;
  mobileWidth: number;
  mobileHeight: number;
  tabletWidth?: number;
  tabletHeight?: number;
  desktopWidth?: number;
  desktopHeight?: number;
}) {
  const objectFitClasses = {
    contain: "object-contain",
    cover: "object-cover",
    fill: "object-fill",
    none: "object-none",
    "scale-down": "object-scale-down",
  };

  return (
    <div
      className={cn(
        "relative w-full",
        aspectRatio !== "auto" && aspectRatioClasses[aspectRatio],
        containerClassName
      )}
    >
      <picture>
        {/* Desktop image */}
        {desktop && (
          <source
            media="(min-width: 1024px)"
            srcSet={desktop}
          />
        )}
        {/* Tablet image */}
        {tablet && (
          <source
            media="(min-width: 768px)"
            srcSet={tablet}
          />
        )}
        {/* Mobile image (fallback) */}
        <Image
          src={mobile}
          alt={alt}
          width={desktopWidth || mobileWidth}
          height={desktopHeight || mobileHeight}
          sizes={sizes}
          priority={priority}
          className={cn(
            "w-full",
            aspectRatio === "auto" && "h-auto",
            objectFitClasses[objectFit],
            className
          )}
        />
      </picture>
    </div>
  );
}
