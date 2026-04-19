"use client";

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from "next/navigation";
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Eye, EyeOff, Loader2, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from "@/lib/supabase";
import { GoogleAuthButton } from "@/components/google-auth-button";

// Abstract art background component
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

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isRegistered = searchParams.get('registered') === 'true';

  const [authMode, setAuthMode] = useState<'magic' | 'password'>('magic');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [magicLinkSent, setMagicLinkSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      if (authMode === 'password') {
        const { error: authError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (authError) {
          setError(authError.message);
          setIsLoading(false);
          return;
        }
        router.push("/dashboard");
      } else {
        const { error: authError } = await supabase.auth.signInWithOtp({
          email,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          }
        });
        if (authError) {
          setError(authError.message);
          setIsLoading(false);
          return;
        }
        setMagicLinkSent(true);
        setIsLoading(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed");
      setIsLoading(false);
    }
  };

  if (magicLinkSent) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900 px-4">
        <AbstractArtBackground />
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative z-10 w-full max-w-md rounded-2xl bg-white/95 backdrop-blur-sm p-10 shadow-2xl text-center"
        >
          <div className="mb-6 flex justify-center">
            <div className="rounded-full bg-teal-100 p-4">
              <Mail className="h-10 w-10 text-teal-600" />
            </div>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Check your email</h2>
          <p className="text-gray-600 mb-10 leading-relaxed">
            We've sent a magic link to <span className="font-bold text-gray-900">{email}</span>.
            Click the link in the email to sign in instantly.
          </p>
          <Button
            variant="outline"
            className="w-full h-12 rounded-xl border-gray-200 hover:bg-gray-50"
            onClick={() => setMagicLinkSent(false)}
          >
            Back to login
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900 overflow-hidden">
      <AbstractArtBackground />

      <div className="relative z-10 w-full max-w-md p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="rounded-3xl bg-white/95 backdrop-blur-md p-10 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)] border border-white/20">
            {/* Header */}
            <div className="mb-10 text-center">
              <h1 className="text-3xl font-bold text-gray-900 mb-3 tracking-tight">
                Welcome back
              </h1>
              <p className="text-sm font-medium text-gray-500">
                New to ScopeIQ?{' '}
                <Link href="/register" className="text-teal-600 hover:text-teal-700 font-bold transition-colors">
                  Create account
                </Link>
              </p>
            </div>

            {/* Auth Mode Toggle */}
            <div className="mb-8">
              <div className="flex rounded-2xl bg-gray-100/80 p-1.5 backdrop-blur-sm">
                <button
                  type="button"
                  onClick={() => setAuthMode('magic')}
                  className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-bold transition-all duration-200 ${authMode === 'magic'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-800'
                    }`}
                >
                  Magic link
                </button>
                <button
                  type="button"
                  onClick={() => setAuthMode('password')}
                  className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-bold transition-all duration-200 ${authMode === 'password'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-800'
                    }`}
                >
                  Password
                </button>
              </div>
            </div>

            {/* Success Message for Registration */}
            <AnimatePresence>
              {isRegistered && !error && (
                <motion.div
                  initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                  animate={{ opacity: 1, height: 'auto', marginBottom: 20 }}
                  className="overflow-hidden"
                >
                  <div className="p-4 rounded-xl bg-teal-50 border border-teal-100 text-sm font-bold text-teal-700 flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-teal-600" />
                    Account created successfully! Please sign in.
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Error Message */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                  animate={{ opacity: 1, height: 'auto', marginBottom: 20 }}
                  exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                  className="overflow-hidden"
                >
                  <div className="p-4 rounded-xl bg-red-50 border border-red-100 text-sm font-bold text-red-600 flex items-center gap-3">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-red-100 flex items-center justify-center text-[10px] font-black underline decoration-red-600">!</span>
                    {error}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-bold text-gray-700 ml-1">
                  Email
                </Label>
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

              <AnimatePresence mode="wait">
                {authMode === 'password' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-2"
                  >
                    <Label htmlFor="password" className="text-sm font-bold text-gray-700 ml-1">
                      Password
                    </Label>
                    <div className="relative group">
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pr-12 h-14 rounded-2xl border-gray-200 bg-gray-50/50 focus:bg-white focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 transition-all font-medium"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-teal-600 transition-colors"
                      >
                        {showPassword ? (
                          <EyeOff className="h-5 w-5" />
                        ) : (
                          <Eye className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-14 bg-gray-900 hover:bg-black text-white rounded-2xl font-bold text-base shadow-lg shadow-gray-200 transition-all active:scale-[0.98] disabled:opacity-50"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    {authMode === 'magic' ? 'Sending Link...' : 'Signing in...'}
                  </span>
                ) : authMode === 'magic' ? (
                  'Send magic link'
                ) : (
                  'Sign in'
                )}
              </Button>
            </form>

            {/* Divider */}
            <div className="my-8 flex items-center">
              <div className="flex-1 border-t border-gray-100"></div>
              <span className="px-4 text-[10px] uppercase tracking-widest font-black text-gray-400">Secure Auth</span>
              <div className="flex-1 border-t border-gray-100"></div>
            </div>

            {/* Social Login */}
            <GoogleAuthButton label="Continue with Google" />
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="fixed inset-0 bg-gray-900 flex items-center justify-center text-white">Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}
