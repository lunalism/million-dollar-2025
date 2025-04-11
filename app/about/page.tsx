// app/about/page.tsx
"use client";

// 필요한 모듈 임포트
import { usePathname } from "next/navigation"; // 현재 경로를 가져오기 위한 훅
import Header from "@/components/main/Header"; // 상단 헤더 컴포넌트
import Link from "next/link"; // 페이지 간 이동을 위한 링크 컴포넌트
import { Button } from "@/components/ui/button"; // 버튼 컴포넌트

export default function About() {
    // 현재 경로를 가져옴
    const pathname = usePathname();

    return (
        // 전체 페이지 레이아웃: 최소 높이 화면 전체, 배경 흰색, 세로 방향 플렉스, 상하 패딩 8
        <div className="min-h-screen bg-white flex flex-col py-8">
            {/* 헤더 컴포넌트: 현재 경로를 props로 전달 */}
            <Header activePath={pathname} />
            {/* 메인 콘텐츠 섹션: 최대 너비 2xl, 중앙 정렬, 텍스트 중앙 정렬 */}
            <section className="max-w-7xl mx-auto text-center items-center justify-center">
                {/* 섹션 제목: 왜 시작했는지 */}
                <h2 className="text-3xl font-semibold text-gray-800 mb-4">
                    Why We Started This
                </h2>
                {/* 섹션 내용: 프로젝트 시작 이유 설명 */}
                <p className="text-gray-600 mb-6">
                    I’m an aspiring entrepreneur working on an iOS app startup to create innovative solutions that make people’s lives easier. However, starting a tech company requires significant funding for development, marketing, and scaling. Inspired by the original Million Dollar Homepage, I launched this 2025 version to raise initial funds for my startup by selling pixels at $1 each.
                </p>

                {/* 섹션 제목: 비전 */}
                <h2 className="text-3xl font-semibold text-gray-800 mb-4">
                    Our Vision
                </h2>
                {/* 섹션 내용: 비전 설명 */}
                <p className="text-gray-600 mb-6">
                    With the funds raised, I plan to build an iOS app that revolutionizes how people interact with technology in their daily lives. The app will focus on [insert app idea or focus, e.g., productivity, education, or social impact], aiming to deliver real value to users worldwide. By purchasing pixels, you’re not just buying a piece of this page—you’re supporting a dream to create something meaningful.
                </p>

                {/* 섹션 제목: 도움 방법 */}
                <h2 className="text-3xl font-semibold text-gray-800 mb-4">
                    How You Can Help
                </h2>
                {/* 섹션 내용: 도움 방법 설명 */}
                <p className="text-gray-600 mb-6">
                    Every pixel you buy directly contributes to the development of this iOS app. For just $1 per pixel (minimum 10x10 for $100), you can claim a spot on this page, add your own image or video (with Premium), and be part of this journey. Let’s build something amazing together!
                </p>

                {/* 새로운 섹션: 픽셀 구매 방법 */}
                <h2 className="text-3xl font-semibold text-gray-800 mb-4">
                    How to Buy Pixels
                </h2>
                {/* 픽셀 구매 방법 설명 */}
                <div className="text-gray-600 mb-6">
                    {/* 구매란 설명 */}
                    <p className="mb-2">
                        Buying pixels is a great way to support our iOS app startup! Each pixel costs $1, and you can purchase a block of pixels to display your content.
                    </p>
                    {/* 구매 절차 목록 */}
                    <ul className="list-disc list-inside space-y-1">
                        <li>
                            <strong>Step 1: Select a Block</strong> - Click on the grid in the home page to select a starting position, or use the <b>Buy Pixel Now</b> button to start at (0, 0).
                        </li>
                        <li>
                            <strong>Step 2: Choose Size</strong> - Specify the size of the block you want to purchase (minimum 10×10 pixels, in increments of 10).
                        </li>
                        <li>
                            <strong>Step 3: Select Purchase Type</strong> - Choose between Basic ($100 for 10×10) or Premium ($150 for 10×10, includes GIF/Video support and social media highlights).
                        </li>
                        <li>
                            <strong>Step 4: Add Content</strong> - Optionally, provide an image or video URL to display on your purchased block.
                        </li>
                        <li>
                            <strong>Step 5: Confirm Purchase</strong> - Review your selection and confirm to complete the purchase.
                        </li>
                    </ul>
                    {/* 가격 정보 */}
                    <p className="mt-2">
                        The price scales with the size of the block (e.g., a 20×20 block costs $400 for Basic, $600 for Premium). Start supporting us today!
                    </p>
                </div>

                {/* 홈 화면으로 이동하는 Buy Pixels Now 버튼 */}
                <Link href="/">
                    <Button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg">
                        Buy Pixels Now
                    </Button>
                </Link>
            </section>
        </div>
    );
}