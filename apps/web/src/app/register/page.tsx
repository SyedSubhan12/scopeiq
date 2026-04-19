"use client";

import React, { useState, useEffect, useRef, Suspense } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, User, Building2, Loader2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { GoogleAuthButton } from "@/components/google-auth-button";

// Abstract art background component (shared with Login)
const AbstractArtBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const shapes: Array<{
      x: number;
      y: number;
      size: number;
      color: string;
      type: 'circle' | 'rect' | 'line';
      angle: number;
      speed: number;
    }> = [];

    const colors = [
      'rgba(20, 184, 166, 0.3)', // teal
      'rgba(14, 165, 233, 0.3)', // blue
      'rgba(168, 85, 247, 0.3)', // purple
      'rgba(251, 146, 60, 0.3)', // orange
      'rgba(34, 197, 94, 0.3)', // green
      'rgba(156, 163, 175, 0.2)', // gray
    ];

    for (let i = 0; i < 15; i++) {
      shapes.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 200 + 100,
        color: colors[Math.floor(Math.random() * colors.length)] || "#000",
        type: ['circle', 'rect', 'line'][Math.floor(Math.random() * 3)] as 'circle' | 'rect' | 'line',
        angle: Math.random() * Math.PI * 2,
        speed: Math.random() * 0.0005 + 0.0002,
      });
    }

    let animationId: number;
    const animate = () => {
      ctx.fillStyle = 'rgba(17, 24, 39, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      shapes.forEach((shape) => {
        shape.angle += shape.speed;
        const offsetX = Math.cos(shape.angle) * 20;
        const offsetY = Math.sin(shape.angle) * 20;

        ctx.save();
        ctx.translate(shape.x + offsetX, shape.y + offsetY);

        if (shape.type === 'circle') {
          ctx.beginPath();
          ctx.arc(0, 0, shape.size, 0, Math.PI * 2);
          ctx.fillStyle = shape.color;
          ctx.fill();
        } else if (shape.type === 'rect') {
          ctx.rotate(shape.angle);
          ctx.fillStyle = shape.color;
          ctx.fillRect(-shape.size / 2, -shape.size / 2, shape.size, shape.size);
        } else {
          ctx.beginPath();
          ctx.moveTo(-shape.size, 0);
          ctx.lineTo(shape.size, 0);
          ctx.strokeStyle = shape.color;
          ctx.lineWidth = 4;
          ctx.stroke();
        }

        ctx.restore();
      });

      animationId = requestAnimationFrame(animate);
    };

    animate();
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      style={{ background: 'linear-gradient(135deg, #111827 0%, #1f2937 100%)' }}
    />
  );
};

function RegisterForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [workspaceName, setWorkspaceName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, fullName, workspaceName }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Registration failed");
      }

      router.push("/login?registered=true");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900 overflow-hidden">
      <AbstractArtBackground />

      <div className="relative z-10 w-full max-w-xl p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="rounded-3xl bg-white/95 backdrop-blur-md p-10 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)] border border-white/20">
            {/* Header */}
            <div className="mb-8 text-center">
              <h1 className="text-3xl font-bold text-gray-900 mb-2 tracking-tight">
                Create your workspace
              </h1>
              <p className="text-sm font-medium text-gray-500">
                Join 500+ teams using ScopeIQ to scale their operations.
              </p>
            </div>

            {/* Error Message */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mb-6 overflow-hidden"
                >
                  <div className="p-4 rounded-xl bg-red-50 border border-red-100 text-sm font-bold text-red-600 flex items-center gap-3">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-red-100 flex items-center justify-center text-[10px] font-black underline">!</span>
                    {error}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Form */}
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-sm font-bold text-gray-700 ml-1">Full Name</Label>
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-teal-600 transition-colors" />
                  <Input
                    id="fullName"
                    placeholder="John Doe"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="pl-12 h-14 rounded-2xl border-gray-200 bg-gray-50/50 focus:bg-white focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 transition-all font-medium"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="workspaceName" className="text-sm font-bold text-gray-700 ml-1">Company Name</Label>
                <div className="relative group">
                  <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-teal-600 transition-colors" />
                  <Input
                    id="workspaceName"
                    placeholder="Acme Inc."
                    value={workspaceName}
                    onChange={(e) => setWorkspaceName(e.target.value)}
                    className="pl-12 h-14 rounded-2xl border-gray-200 bg-gray-50/50 focus:bg-white focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 transition-all font-medium"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-bold text-gray-700 ml-1">Email</Label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-teal-600 transition-colors" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-12 h-14 rounded-2xl border-gray-200 bg-gray-50/50 focus:bg-white focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 transition-all font-medium"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-bold text-gray-700 ml-1">Password</Label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-teal-600 transition-colors" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-12 h-14 rounded-2xl border-gray-200 bg-gray-50/50 focus:bg-white focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 transition-all font-medium"
                    required
                  />
                </div>
              </div>

              <div className="md:col-span-2 pt-2">
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-14 bg-gray-900 hover:bg-black text-white rounded-2xl font-bold text-base shadow-lg shadow-gray-200 transition-all active:scale-[0.99] disabled:opacity-50"
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Creating account...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      Start your 14-day free trial
                      <ArrowRight className="h-5 w-5" />
                    </span>
                  )}
                </Button>
              </div>
            </form>

            {/* Footer */}
            <div className="mt-8 pt-8 border-t border-gray-100 text-center">
              <p className="text-sm font-medium text-gray-500">
                By signing up, you agree to our{' '}
                <Link href="/terms" className="text-gray-900 hover:underline font-bold">Terms</Link>
                {' '}and{' '}
                <Link href="/privacy" className="text-gray-900 hover:underline font-bold">Privacy Policy</Link>.
              </p>
              <p className="mt-4 text-sm font-medium text-gray-500">
                Already have an account?{' '}
                <Link href="/login" className="text-teal-600 hover:text-teal-700 font-bold transition-colors">
                  Sign in
                </Link>
              </p>
            </div>
          </div>

          {/* Social Divider */}
          <div className="mt-8 flex items-center justify-center gap-4">
            <div className="w-12 h-px bg-white/20"></div>
            <span className="text-[10px] uppercase tracking-widest font-black text-white/40">Or register with</span>
            <div className="w-12 h-px bg-white/20"></div>
          </div>

          <div className="mt-4 flex justify-center">
            <div className="w-full max-w-xs">
              <GoogleAuthButton label="Continue with Google" />
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="fixed inset-0 bg-gray-900 flex items-center justify-center text-white">Loading...</div>}>
      <RegisterForm />
    </Suspense>
  );
}
