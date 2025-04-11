// components/main/Header.tsx

'use client'; // 클라이언트 컴포넌트로 설정

// 필요한 모듈 임포트
import Link from "next/link"; // 페이지 간 이동을 위한 링크 컴포넌트
import { Button } from "@/components/ui/button"; // 버튼 컴포넌트

// Header 컴포넌트의 props 타입 정의
type HeaderProps = {
  activePath: string; // 현재 활성화된 경로 (예: "/", "/about")
};

// Header 컴포넌트: 상단 네비게이션 바를 렌더링
export default function Header({ activePath }: HeaderProps) {
    return (
        // 헤더 레이아웃: 전체 너비, 최대 너비 7xl, 중앙 정렬, 좌우 패딩 4, 플렉스 레이아웃, 하단 마진 8
        <header className="w-full max-w-7xl mx-auto px-4 flex justify-between items-center mb-8">
            {/* 로고: 홈 페이지로 이동하는 링크 */}
            <Link href="/">
                {/* 로고 텍스트: 2025 Million Dollar Homepage */}
                <h1 className="text-3xl font-extrabold text-gray-900">
                    2025 Million Dollar Homepage
                </h1>
            </Link>
            {/* 네비게이션 메뉴: 플렉스 레이아웃, 항목 간 간격 4 */}
            <nav className="flex space-x-4">
                {/* 홈 링크 */}
                <Link href="/">
                <Button
                    variant="ghost" // 고스트 스타일 버튼
                    className={`text-gray-600 hover:text-gray-900 ${
                    activePath === "/" ? "font-semibold text-blue-600" : "" // 현재 경로가 "/"이면 활성화 스타일 적용
                    }`}
                >
                    HOME
                </Button>
                </Link>
                {/* About 링크 */}
                <Link href="/about">
                <Button
                    variant="ghost" // 고스트 스타일 버튼
                    className={`text-gray-600 hover:text-gray-900 ${
                    activePath === "/about" ? "font-semibold text-blue-600" : "" // 현재 경로가 "/about"이면 활성화 스타일 적용
                    }`}
                >
                    ABOUT
                </Button>
                </Link>
                {/* Contact 링크 */}
                <Link href="/contact">
                <Button
                    variant="ghost" // 고스트 스타일 버튼
                    className={`text-gray-600 hover:text-gray-900 ${
                    activePath === "/contact" ? "font-semibold text-blue-600" : "" // 현재 경로가 "/contact"이면 활성화 스타일 적용
                    }`}
                >
                    CONTACT
                </Button>
                </Link>
            </nav>
        </header>
    );
}