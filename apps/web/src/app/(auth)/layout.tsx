export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[rgb(var(--surface-subtle))]">
      <div className="w-full max-w-md rounded-lg border border-[rgb(var(--border-default))] bg-white p-8 shadow-sm">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-[rgb(var(--text-primary))]">ScopeIQ</h1>
          <p className="mt-1 text-sm text-[rgb(var(--text-secondary))]">
            Protect your agency revenue
          </p>
        </div>
        {children}
      </div>
    </div>
  );
}
