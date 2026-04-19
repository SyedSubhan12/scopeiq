"use client";

import { motion } from "framer-motion";
import { Building2 } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden"
      style={{ background: "radial-gradient(circle at 20% 20%, rgba(15, 110, 86, 0.05) 0%, transparent 40%), radial-gradient(circle at 80% 80%, rgba(15, 110, 86, 0.05) 0%, transparent 40%), #fbfcfb" }}>

      {/* Dynamic background elements */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute -left-20 -top-20 h-96 w-96 rounded-full blur-3xl"
          style={{ background: "rgba(15, 110, 86, 0.08)" }}
        />
        <div
          className="absolute -right-20 -bottom-20 h-96 w-96 rounded-full blur-3xl"
          style={{ background: "rgba(15, 110, 86, 0.06)" }}
        />
      </div>

      {/* Card — single entrance, premium sharp shadow */}
      <motion.div
        className="relative z-10 w-full max-w-md rounded-[2.5rem] border-2 border-white bg-white p-12 shadow-[0_32px_64px_-16px_rgba(15,110,86,0.16)]"
        initial={{ opacity: 0, y: 40, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        style={{ willChange: "transform, opacity" }}
      >

        <div className="mb-10 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#0F6E56]/10">
            <Building2 className="h-8 w-8 text-[#0F6E56]" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-[#0F6E56]">
            ScopeIQ
          </h1>
          <p className="mt-2 text-sm font-medium text-gray-500">
            Professional revenue protection for agencies
          </p>
        </div>

        {children}

        <div className="mt-8 text-center text-xs text-gray-400">
          © 2026 ScopeIQ Inc. · Secure connection verified
        </div>
      </motion.div>
    </div>
  );
}

