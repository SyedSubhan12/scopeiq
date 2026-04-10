import Image from "next/image";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[rgb(var(--surface-subtle))]">
      <div className="w-full max-w-md rounded-lg border border-[rgb(var(--border-default))] bg-white p-8 shadow-sm">
        <div className="mb-6 text-center">
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
          <p className="mt-2 text-sm text-[rgb(var(--text-secondary))]">
            Protect your agency revenue
          </p>
        </div>
        {children}
      </div>
    </div>
  );
}
