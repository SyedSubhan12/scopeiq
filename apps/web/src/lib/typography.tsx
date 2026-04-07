import { cn } from "@novabots/ui";

// ==========================================================================
// TYPOGRAPHY COMPONENTS — Local copy (transpiled alongside web app)
// These will move to @novabots/ui once the dev server is restarted
// ==========================================================================

// --- Headings ---
export interface HeadingProps extends React.HTMLAttributes<HTMLHeadingElement> {
    variant?: "display" | "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
    color?: "primary" | "secondary" | "muted" | "inherit";
    as?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
}

const headingClasses: Record<string, string> = {
    display: "text-5xl font-bold leading-tight tracking-tight",
    h1: "text-4xl font-bold leading-tight tracking-tight",
    h2: "text-3xl font-semibold leading-tight tracking-tight",
    h3: "text-2xl font-semibold leading-tight tracking-tight",
    h4: "text-xl font-semibold leading-tight",
    h5: "text-lg font-semibold leading-tight",
    h6: "text-base font-semibold leading-tight",
};

const colorClasses: Record<string, string> = {
    primary: "text-[rgb(var(--text-primary))]",
    secondary: "text-[rgb(var(--text-secondary))]",
    muted: "text-[rgb(var(--text-muted))]",
    inherit: "text-inherit",
};

const variantToElement: Record<string, "h1" | "h2" | "h3" | "h4" | "h5" | "h6"> = {
    display: "h1",
    h1: "h1",
    h2: "h2",
    h3: "h3",
    h4: "h4",
    h5: "h5",
    h6: "h6",
};

export function Heading({
    as,
    variant = "h3",
    color = "primary",
    className,
    children,
    ...props
}: HeadingProps) {
    const Component: React.ElementType = (as ?? variantToElement[variant]) as React.ElementType;

    return (
        <Component className={cn(headingClasses[variant], colorClasses[color], className)} {...props}>
            {children}
        </Component>
    );
}

export function H1(props: Omit<HeadingProps, "as" | "variant">) {
    return <Heading as="h1" variant="h1" {...props} />;
}

export function H2(props: Omit<HeadingProps, "as" | "variant">) {
    return <Heading as="h2" variant="h2" {...props} />;
}

export function H3(props: Omit<HeadingProps, "as" | "variant">) {
    return <Heading as="h3" variant="h3" {...props} />;
}

export function H4(props: Omit<HeadingProps, "as" | "variant">) {
    return <Heading as="h4" variant="h4" {...props} />;
}

// --- Body Text ---
export interface BodyProps extends React.HTMLAttributes<HTMLParagraphElement> {
    size?: "lg" | "base" | "sm" | "xs";
    color?: "primary" | "secondary" | "muted" | "inherit";
    weight?: "normal" | "medium";
}

const bodySizeClasses: Record<string, string> = {
    lg: "text-lg leading-relaxed",
    base: "text-base leading-relaxed",
    sm: "text-sm leading-normal",
    xs: "text-xs leading-normal",
};

const bodyWeightClasses: Record<string, string> = {
    normal: "font-normal",
    medium: "font-medium",
};

export function Body({ size = "base", color = "primary", weight = "normal", className, children, ...props }: BodyProps) {
    return (
        <p className={cn(bodySizeClasses[size], bodyWeightClasses[weight], colorClasses[color], className)} {...props}>
            {children}
        </p>
    );
}

// --- Label (uppercase metadata) ---
export interface LabelProps extends React.HTMLAttributes<HTMLSpanElement> {
    size?: "sm" | "base" | "lg";
    color?: "primary" | "secondary" | "muted" | "inherit";
    weight?: "normal" | "medium" | "semibold";
}

const labelSizeClasses: Record<string, string> = {
    sm: "text-xs tracking-wide",
    base: "text-xs tracking-wider",
    lg: "text-sm tracking-widest",
};

const labelWeightClasses: Record<string, string> = {
    normal: "font-normal",
    medium: "font-medium",
    semibold: "font-semibold",
};

export function Label({ size = "base", color = "muted", weight = "medium", className, children, ...props }: LabelProps) {
    return (
        <span className={cn("uppercase leading-none", labelSizeClasses[size], labelWeightClasses[weight], colorClasses[color], className)} {...props}>
            {children}
        </span>
    );
}

// --- Caption (helper text) ---
export interface CaptionProps extends React.HTMLAttributes<HTMLParagraphElement> {
    color?: "muted" | "secondary";
}

const captionColorClasses: Record<string, string> = {
    muted: "text-[rgb(var(--text-muted))]",
    secondary: "text-[rgb(var(--text-secondary))]",
};

export function Caption({ color = "muted", className, children, ...props }: CaptionProps) {
    return (
        <p className={cn("text-xs leading-normal", captionColorClasses[color], className)} {...props}>
            {children}
        </p>
    );
}

// --- Stat Numbers ---
export interface StatProps extends React.HTMLAttributes<HTMLSpanElement> {
    size?: "base" | "lg" | "xl";
    color?: "primary" | "inherit";
}

const statSizeClasses: Record<string, string> = {
    base: "text-2xl",
    lg: "text-3xl",
    xl: "text-4xl",
};

export function Stat({ size = "base", color = "primary", className, children, ...props }: StatProps) {
    return (
        <span className={cn("font-bold leading-none tabular-nums", statSizeClasses[size], colorClasses[color], className)} {...props}>
            {children}
        </span>
    );
}

// --- Code / Monospace ---
export interface CodeProps extends React.HTMLAttributes<HTMLElement> {
    color?: "primary" | "muted" | "inherit";
}

export function Code({ color = "primary", className, children, ...props }: CodeProps) {
    return (
        <code className={cn("font-mono text-xs leading-normal", colorClasses[color], className)} {...props}>
            {children}
        </code>
    );
}
