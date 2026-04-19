import { ReducedMotionProvider } from "@/animations/context/ReducedMotionProvider";

/**
 * Onboarding layout — full-screen, no sidebar, no external chrome.
 * The OnboardingShell itself renders the header/progress/footer.
 * Background uses the ScopeIQ "natural paper" tone from CSS variables.
 */
export default function OnboardingLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <ReducedMotionProvider>
            <div
                className="onboarding-root"
                style={{
                    minHeight: "100svh",
                    background:
                        "radial-gradient(ellipse 120% 80% at 50% -10%, rgba(15,110,86,0.08) 0%, transparent 60%), rgb(var(--surface-subtle, 247 249 251))",
                    position: "relative",
                    overflow: "hidden",
                }}
            >
                {/* Subtle grid texture overlay */}
                <div
                    aria-hidden="true"
                    style={{
                        position: "absolute",
                        inset: 0,
                        backgroundImage:
                            "radial-gradient(circle, rgba(15,110,86,0.04) 1px, transparent 1px)",
                        backgroundSize: "32px 32px",
                        pointerEvents: "none",
                        zIndex: 0,
                    }}
                />
                <div style={{ position: "relative", zIndex: 1 }}>
                    {children}
                </div>
            </div>
        </ReducedMotionProvider>
    );
}
