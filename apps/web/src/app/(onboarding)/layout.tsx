import Image from "next/image";

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex min-h-screen items-center justify-center bg-[rgb(var(--surface-subtle))]">
            <div className="w-full max-w-2xl px-4 py-12">
                <div className="mb-8 text-center">
                    <div className="mx-auto flex items-center justify-center gap-3">
                        <Image
                            src="/logo.svg"
                            alt="ScopeIQ"
                            width={180}
                            height={180}
                            className="h-12 w-auto"
                            priority
                        />
                        <span className="text-2xl font-bold text-[#0F6E56]">ScopeIQ</span>
                    </div>
                    <p className="mt-2 text-sm text-[rgb(var(--text-muted))]">
                        Let&apos;s get your workspace set up
                    </p>
                </div>
                {children}
            </div>
        </div>
    );
}
