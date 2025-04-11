'use client'

import Link from "next/link";
import { Button } from "@/components/ui/button";

type HeaderProps = {
    activePath: string;
};

export default function Header({ activePath }: HeaderProps) {
    return (
        <header className="w-full max-w-7xl mx-auto px-4 flex justify-between items-center mb-8 mt-10">
        <Link href="/">
            <h1 className="text-3xl font-extrabold text-gray-900">
                2025 Million Dollar Homepage
            </h1>
        </Link>
        <nav className="flex space-x-4">
            <Link href="/">
                <Button
                    variant="ghost"
                    className={`text-gray-600 hover:text-gray-900 ${
                    activePath === "/" ? "font-semibold text-blue-600" : ""
                    }`}
                >
                    HOME
                </Button>
            </Link>
            <Link href="/about">
            <Button
                variant="ghost"
                className={`text-gray-600 hover:text-gray-900 ${
                activePath === "/about" ? "font-semibold text-blue-600" : ""
                }`}
            >
                ABOUT
            </Button>
            </Link>
            <Link href="/contact">
            <Button
                variant="ghost"
                className={`text-gray-600 hover:text-gray-900 ${
                activePath === "/contact" ? "font-semibold text-blue-600" : ""
                }`}
            >
                CONTACT
            </Button>
            </Link>
        </nav>
        </header>
    );
}