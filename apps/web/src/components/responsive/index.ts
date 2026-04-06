/**
 * Responsive Design System
 * Mobile-first components and utilities for production-grade responsive layouts
 * 
 * Usage:
 * import { Container, Grid, Card, ResponsiveImage } from "@/components/responsive";
 * import { useMediaQuery, useBreakpoint, useDeviceType } from "@/hooks/responsive";
 */

// Components
export { Container, Section } from "./Container";
export { Grid, GridAutoFill, GridAutoFit } from "./Grid";
export {
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  CardHorizontal,
  CardGridPreview,
} from "./Card";
export {
  ResponsiveImage,
  ResponsiveVideo,
  ResponsivePicture,
} from "./Image";
export { ResponsiveNavbar } from "./Navbar";
export { ResponsiveModal, BottomSheet } from "./Modal";

// Tokens
export {
  breakpoints,
  spacing,
  containerMaxWidths,
  typographyScale,
  gridColumns,
  gapScale,
  sectionPadding,
  sectionPaddingFull,
} from "@/lib/responsive/tokens";

// Types
export type { ContainerProps, ContainerSize } from "./Container";
export type { GridProps, GridCols, GapSize } from "./Grid";
export type { CardProps } from "./Card";
export type { ResponsiveImageProps } from "./Image";
export type { ResponsiveModalProps } from "./Modal";
