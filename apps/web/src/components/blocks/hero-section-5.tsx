'use client'
import React, { useLayoutEffect, useRef } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { InfiniteSlider } from '@/components/ui/infinite-slider'
import { ProgressiveBlur } from '@/components/ui/progressive-blur'
import { cn } from '@/lib/utils'
import { ChevronRight, Menu, PlayCircle, X } from 'lucide-react'
import { motion, useScroll, useTransform } from 'framer-motion'
import gsap from '@/lib/gsap-setup'
import { Navbar } from '@/components/landing/v2/Navbar'

export function HeroSection() {
    const { scrollY } = useScroll();
    const y1 = useTransform(scrollY, [0, 500], [0, 200]);
    const opacity = useTransform(scrollY, [0, 300], [1, 0]);
    const h1Ref = useRef<HTMLHeadingElement>(null);

    useLayoutEffect(() => {
        if (!h1Ref.current) return;

        const words = h1Ref.current.innerText.split(' ');
        h1Ref.current.innerHTML = words
            .map(word => `<span class="inline-block overflow-hidden py-2"><span class="inline-block will-change-transform">${word}</span></span>`)
            .join(' ');

        const spans = h1Ref.current.querySelectorAll('span span');

        const ctx = gsap.context(() => {
            gsap.fromTo(spans,
                {
                    y: 100,
                    opacity: 0,
                    filter: 'blur(10px)'
                },
                {
                    y: 0,
                    opacity: 1,
                    filter: 'blur(0px)',
                    duration: 1.2,
                    stagger: 0.1,
                    ease: "expo.out",
                    delay: 0.5
                }
            );
        });

        return () => ctx.revert();
    }, []);

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.15,
                delayChildren: 0.2,
            },
        },
    }

    const itemVariants = {
        hidden: { opacity: 0, y: 30, filter: 'blur(10px)' },
        visible: {
            opacity: 1,
            y: 0,
            filter: 'blur(0px)',
            transition: {
                duration: 1,
                ease: [0.16, 1, 0.3, 1],
            },
        },
    }

    return (
        <>
            <Navbar />
            <main className="overflow-x-hidden">
                <section className="relative">
                    <div className="relative min-h-[90vh] flex items-center py-24 md:pb-32 lg:pb-36 lg:pt-20">
                        <motion.div
                            variants={containerVariants}
                            initial="hidden"
                            animate="visible"
                            className="relative z-10 mx-auto flex max-w-7xl flex-col px-6 lg:block lg:px-12">
                            <div className="mx-auto max-w-3xl text-center lg:ml-0 lg:max-w-full lg:text-left">
                                <motion.div
                                    variants={itemVariants}
                                    className="inline-flex items-center gap-2 rounded-full border border-[#0F6E56]/20 bg-[#0F6E56]/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-[#0F6E56] backdrop-blur-sm">
                                    <span className="relative flex h-2 w-2">
                                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#0F6E56] opacity-75"></span>
                                        <span className="relative inline-flex h-2 w-2 rounded-full bg-[#0F6E56]"></span>
                                    </span>
                                    The new standard for agencies
                                </motion.div>

                                <h1
                                    ref={h1Ref}
                                    className="mt-8 max-w-4xl text-balance text-6xl font-extrabold tracking-tight md:text-7xl lg:mt-12 xl:text-9xl text-black">
                                    Bill what you <span className="text-[#0F6E56]">build.</span>
                                </h1>

                                <motion.p
                                    variants={itemVariants}
                                    className="mt-8 max-w-2xl text-balance text-lg text-black/80 md:text-xl leading-relaxed">
                                    ScopeIQ automates scope enforcement for creative teams.
                                    Catch vague briefs, automate approvals, and recover lost revenue automatically.
                                </motion.p>

                                <motion.div
                                    variants={itemVariants}
                                    className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row lg:justify-start">
                                    <Button
                                        asChild
                                        size="lg"
                                        className="group h-14 rounded-full bg-[#0F6E56] pl-8 pr-6 text-lg font-semibold transition-all duration-500 hover:scale-105 hover:bg-[#0b5f49] hover:shadow-[0_20px_40px_rgba(15,110,86,0.3)]">
                                        <Link href="/register">
                                            <span className="text-nowrap">Start Free Trial</span>
                                            <ChevronRight className="ml-2 transition-transform duration-500 group-hover:translate-x-1" />
                                        </Link>
                                    </Button>
                                    <Button
                                        asChild
                                        size="lg"
                                        variant="outline"
                                        className="h-14 rounded-full border-black/10 px-8 text-lg font-semibold transition-all duration-300 hover:bg-black/5 hover:border-black/20 text-black">
                                        <Link href="#demo" className="flex items-center gap-2">
                                            <PlayCircle className="h-5 w-5 text-[#0F6E56]" />
                                            <span className="text-nowrap">Watch Demo</span>
                                        </Link>
                                    </Button>
                                </motion.div>

                                <motion.div
                                    variants={itemVariants}
                                    className="mt-16 flex items-center justify-center gap-8 lg:justify-start">
                                    <div className="flex -space-x-3">
                                        {[1, 2, 3, 4].map((i) => (
                                            <div key={i} className="h-10 w-10 rounded-full border-2 border-white bg-black/5 shadow-sm overflow-hidden">
                                                <img src={`https://i.pravatar.cc/100?img=${i + 10}`} alt="User" />
                                            </div>
                                        ))}
                                    </div>
                                    <div className="text-sm text-black/60 font-medium">
                                        Joined by <span className="text-black font-bold">500+</span> creative studios
                                    </div>
                                </motion.div>

                            </div>
                        </motion.div>

                        <motion.div
                            style={{ y: y1, opacity }}
                            className="aspect-[2/3] absolute inset-0 -z-10 overflow-hidden rounded-b-[3rem] border-b border-black/5 sm:aspect-video lg:rounded-b-[5rem]">
                            <video
                                autoPlay
                                loop
                                muted
                                playsInline
                                className="size-full object-cover opacity-20 invert dark:opacity-15 dark:invert-0"
                                src="https://ik.imagekit.io/lrigu76hy/tailark/dna-video.mp4?updatedAt=1745736251477"></video>
                            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/50 to-white"></div>
                        </motion.div>
                    </div>
                </section>

                <section className="bg-white py-12">
                    <div className="group relative m-auto max-w-7xl px-6">
                        <div className="flex flex-col items-center md:flex-row gap-8">
                            <div className="md:max-w-44 md:border-r md:pr-10 border-zinc-100">
                                <p className="text-center md:text-left text-sm font-semibold uppercase tracking-widest text-zinc-400">
                                    Trusted by leaders
                                </p>
                            </div>
                            <div className="relative py-2 md:w-[calc(100%-11rem)]">
                                <InfiniteSlider
                                    speedOnHover={20}
                                    speed={40}
                                    gap={112}>
                                    <div className="flex opacity-50 grayscale transition-all hover:opacity-100 hover:grayscale-0">
                                        <img
                                            className="mx-auto h-6 w-fit"
                                            src="https://html.tailus.io/blocks/customers/nvidia.svg"
                                            alt="Nvidia Logo"
                                        />
                                    </div>
                                    <div className="flex opacity-50 grayscale transition-all hover:opacity-100 hover:grayscale-0">
                                        <img
                                            className="mx-auto h-5 w-fit"
                                            src="https://html.tailus.io/blocks/customers/github.svg"
                                            alt="GitHub Logo"
                                        />
                                    </div>
                                    <div className="flex opacity-50 grayscale transition-all hover:opacity-100 hover:grayscale-0">
                                        <img
                                            className="mx-auto h-6 w-fit"
                                            src="https://html.tailus.io/blocks/customers/nike.svg"
                                            alt="Nike Logo"
                                        />
                                    </div>
                                    <div className="flex opacity-50 grayscale transition-all hover:opacity-100 hover:grayscale-0">
                                        <img
                                            className="mx-auto h-6 w-fit"
                                            src="https://html.tailus.io/blocks/customers/lemonsqueezy.svg"
                                            alt="Lemon Squeezy Logo"
                                        />
                                    </div>
                                    <div className="flex opacity-50 grayscale transition-all hover:opacity-100 hover:grayscale-0">
                                        <img
                                            className="mx-auto h-5 w-fit"
                                            src="https://html.tailus.io/blocks/customers/openai.svg"
                                            alt="OpenAI Logo"
                                        />
                                    </div>
                                </InfiniteSlider>

                                <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-white to-transparent z-10"></div>
                                <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-white to-transparent z-10"></div>
                            </div>
                        </div>
                    </div>
                </section>
            </main>
        </>
    )
}

const menuItems = [
    { name: 'Features', href: '#features' },
    { name: 'How it works', href: '#how-it-works' },
    { name: 'Pricing', href: '#pricing' },
    { name: 'FAQ', href: '#faq' },
]


const HeroHeader = () => {
    const [menuState, setMenuState] = React.useState(false)
    const [scrolled, setScrolled] = React.useState(false)

    React.useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 20)
        onScroll()
        window.addEventListener('scroll', onScroll, { passive: true })
        return () => window.removeEventListener('scroll', onScroll)
    }, [])

    return (
        <header>
            <nav
                data-state={menuState && 'active'}
                className="group fixed z-50 w-full px-4 pt-6 transition-all duration-500">
                <div className={cn(
                    'mx-auto max-w-7xl rounded-full px-6 transition-all duration-500 lg:px-10 border border-transparent',
                    scrolled ? 'bg-white/80 shadow-[0_8px_32px_rgba(0,0,0,0.06)] backdrop-blur-xl py-2 border-white/50' : 'bg-transparent py-4'
                )}>
                    <div className={cn('relative flex flex-wrap items-center justify-between gap-6 duration-300 lg:gap-0')}>
                        <div className="flex w-full items-center justify-between gap-12 lg:w-auto">
                            <Link
                                href="/"
                                aria-label="home"
                                className="flex items-center space-x-2 transition-transform active:scale-95">
                                <Logo />
                            </Link>

                            <button
                                onClick={() => setMenuState(!menuState)}
                                aria-label={menuState == true ? 'Close Menu' : 'Open Menu'}
                                className="relative z-20 -m-2.5 -mr-4 block cursor-pointer p-2.5 lg:hidden">
                                <Menu className="group-data-[state=active]:rotate-180 group-data-[state=active]:scale-0 group-data-[state=active]:opacity-0 m-auto size-6 duration-200" />
                                <X className="group-data-[state=active]:rotate-0 group-data-[state=active]:scale-100 group-data-[state=active]:opacity-100 absolute inset-0 m-auto size-6 -rotate-180 scale-0 opacity-0 duration-200" />
                            </button>

                            <div className="hidden lg:block">
                                <ul className="flex gap-10 text-sm font-semibold uppercase tracking-wider">
                                    {menuItems.map((item, index) => (
                                        <li key={index}>
                                            <Link
                                                href={item.href}
                                                className="text-zinc-500 transition-all hover:text-[#0F6E56] hover:tracking-widest">
                                                <span>{item.name}</span>
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>

                        <div className="bg-white group-data-[state=active]:block lg:group-data-[state=active]:flex mb-6 hidden w-full flex-wrap items-center justify-end space-y-8 rounded-[2rem] border p-8 shadow-2xl shadow-zinc-300/20 md:flex-nowrap lg:m-0 lg:flex lg:w-fit lg:gap-6 lg:space-y-0 lg:border-transparent lg:bg-transparent lg:p-0 lg:shadow-none">
                            <div className="lg:hidden">
                                <ul className="space-y-6 text-xl font-bold">
                                    {menuItems.map((item, index) => (
                                        <li key={index}>
                                            <Link
                                                href={item.href}
                                                className="text-zinc-900 hover:text-[#0F6E56]">
                                                <span>{item.name}</span>
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div className="flex w-full flex-col space-y-4 sm:flex-row sm:gap-4 sm:space-y-0 md:w-fit">
                                <Button
                                    asChild
                                    variant="ghost"
                                    size="sm"
                                    className="rounded-full px-8 font-bold text-zinc-900">
                                    <Link href="/login">
                                        <span>Login</span>
                                    </Link>
                                </Button>
                                <Button
                                    asChild
                                    size="sm"
                                    className="rounded-full bg-[#0F6E56] px-8 font-bold text-white shadow-lg shadow-[#0F6E56]/20 transition-all hover:bg-[#0a5c47] hover:scale-105 active:scale-95">
                                    <Link href="/register">
                                        <span>Sign Up</span>
                                    </Link>
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </nav>
        </header>
    )
}

const Logo = ({ className }: { className?: string }) => {
    return (
        <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0F6E56] shadow-lg shadow-[#0F6E56]/20">
                <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 text-white">
                    <path
                        d="M12 4L4 8L12 12L20 8L12 4Z"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                    <path
                        d="M4 12L12 16L20 12"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                    <path
                        d="M4 16L12 20L20 16"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                </svg>
            </div>
            <span className="text-2xl font-black tracking-tighter text-zinc-900">ScopeIQ</span>
        </div>
    )
}
