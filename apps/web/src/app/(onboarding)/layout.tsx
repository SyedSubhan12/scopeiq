import { ReducedMotionProvider } from "@/animations/context/ReducedMotionProvider";

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
    return (
        <ReducedMotionProvider>
            <div
                className="onboarding-root"
                style={{
                    minHeight: "100svh",
                    background: "#080B0A",
                    position: "relative",
                    overflow: "hidden",
                    color: "#F4F1EC",
                }}
            >
                {/* Gradient mesh — teal top-right glow */}
                <div
                    aria-hidden="true"
                    style={{
                        position: "absolute",
                        top: "-20%",
                        right: "-10%",
                        width: "600px",
                        height: "600px",
                        borderRadius: "50%",
                        background: "radial-gradient(circle, rgba(15,110,86,0.18) 0%, transparent 65%)",
                        pointerEvents: "none",
                        zIndex: 0,
                    }}
                />
                {/* Gradient mesh — dark bottom-left */}
                <div
                    aria-hidden="true"
                    style={{
                        position: "absolute",
                        bottom: "-15%",
                        left: "-15%",
                        width: "500px",
                        height: "500px",
                        borderRadius: "50%",
                        background: "radial-gradient(circle, rgba(29,155,138,0.07) 0%, transparent 65%)",
                        pointerEvents: "none",
                        zIndex: 0,
                    }}
                />
                {/* Noise grain overlay */}
                <div
                    aria-hidden="true"
                    style={{
                        position: "absolute",
                        inset: 0,
                        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E")`,
                        backgroundRepeat: "repeat",
                        backgroundSize: "200px 200px",
                        pointerEvents: "none",
                        zIndex: 0,
                        opacity: 0.4,
                    }}
                />
                <div style={{ position: "relative", zIndex: 1 }}>
                    {children}
                </div>
            </div>
        </ReducedMotionProvider>
    );
}
