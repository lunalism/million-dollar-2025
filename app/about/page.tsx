"use client";

import { usePathname } from "next/navigation";
import Header from "@/components/main/Header";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function About() {
    const pathname = usePathname();

    return (
        <div className="min-h-screen bg-white flex flex-col py-8">
            <Header activePath={pathname} />
            <section className="max-w-2xl mx-auto text-center">
                <h2 className="text-3xl font-semibold text-gray-800 mb-4">
                    Why We Started This
                </h2>
                <p className="text-gray-600 mb-6">
                    I’m an aspiring entrepreneur working on an iOS app startup to create innovative solutions that make people’s lives easier. However, starting a tech company requires significant funding for development, marketing, and scaling. Inspired by the original Million Dollar Homepage, I launched this 2025 version to raise initial funds for my startup by selling pixels at $1 each.
                </p>

                <h2 className="text-3xl font-semibold text-gray-800 mb-4">
                    Our Vision
                </h2>
                <p className="text-gray-600 mb-6">
                    With the funds raised, I plan to build an iOS app that revolutionizes how people interact with technology in their daily lives. The app will focus on [insert app idea or focus, e.g., productivity, education, or social impact], aiming to deliver real value to users worldwide. By purchasing pixels, you’re not just buying a piece of this page—you’re supporting a dream to create something meaningful.
                </p>

                <h2 className="text-3xl font-semibold text-gray-800 mb-4">
                    How You Can Help
                </h2>
                <p className="text-gray-600 mb-6">
                    Every pixel you buy directly contributes to the development of this iOS app. For just $1 per pixel (minimum 10x10 for $100), you can claim a spot on this page, add your own image or video (with Premium), and be part of this journey. Let’s build something amazing together!
                </p>

                <Link href="/">
                    <Button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg">
                        Buy Pixels Now
                    </Button>
                </Link>
            </section>
        </div>
    );
}