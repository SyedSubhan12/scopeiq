export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex min-h-screen items-center justify-center bg-[rgb(var(--surface-subtle))]">
            <div className="w-full max-w-2xl px-4 py-12">
                <div className="mb-8 text-center">
                    <h1 className="text-3xl font-bold text-primary">ScopeIQ</h1>
                    <p className="mt-2 text-sm text-[rgb(var(--text-muted))]">
                        Let&apos;s get your workspace set up
                    </p>
                </div>
                {children}
            </div>
        </div>
    );
}
