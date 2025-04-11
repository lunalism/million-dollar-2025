// app/about/page.tsx
"use client";

// 필요한 모듈 임포트
import { useState, useEffect } from "react"; // React 훅
import { usePathname } from "next/navigation"; // 현재 경로를 가져오기 위한 훅
import Header from "@/components/main/Header"; // 상단 헤더 컴포넌트
import Link from "next/link"; // 페이지 간 이동을 위한 링크 컴포넌트
import { Button } from "@/components/ui/button"; // 버튼 컴포넌트
import { getAboutContent, getFAQItems } from "@/lib/supabase"; // Supabase에서 데이터 가져오기

// FAQ 항목 타입 정의 (faq 테이블 구조에 맞춤)
interface FAQItem {
  id: number;
  question: string;
  content: string;
}

// About 페이지 컴포넌트
export default function About() {
  // 현재 경로 가져오기
  const pathname = usePathname();

  // 상태 정의
  const [contentItems, setContentItems] = useState<
    { category: string; title: string; content: string }[]
  >([]); // About 콘텐츠 데이터
  const [faqItems, setFaqItems] = useState<FAQItem[]>([]); // FAQ 데이터 상태
  const [selectedCategory, setSelectedCategory] = useState<string>(""); // 선택된 카테고리
  const [isLoading, setIsLoading] = useState(true); // 로딩 상태

  // Supabase에서 데이터 로드
  useEffect(() => {
    const loadContent = async () => {
      setIsLoading(true); // 로딩 시작
      try {
        // Supabase에서 About 콘텐츠 가져오기
        const contentData = await getAboutContent();
        // "How to Buy Pixels" 카테고리 제외
        const filteredContentData = contentData.filter(
          (item) => item.category !== "How to Buy Pixels"
        );
        setContentItems(filteredContentData);
        // 첫 번째 카테고리를 기본 선택
        if (filteredContentData.length > 0) {
          setSelectedCategory(filteredContentData[0].category);
        }

        // Supabase에서 모든 FAQ 데이터 가져오기
        const faqData = await getFAQItems();
        setFaqItems(faqData);
      } catch (error) {
        console.error("Failed to load about content:", error);
      } finally {
        setIsLoading(false); // 로딩 종료
      }
    };
    loadContent();
  }, []); // 컴포넌트 마운트 시 실행

  // 선택된 카테고리의 콘텐츠 찾기
  const selectedContent = contentItems.find((item) => item.category === selectedCategory);

  // 로딩 중일 때 표시
  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center">
        <p className="text-lg text-gray-600">Loading...</p>
      </div>
    );
  }

  // 콘텐츠가 없을 때 표시
  if (contentItems.length === 0) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center">
        <p className="text-lg text-gray-600">No content available.</p>
      </div>
    );
  }

  return (
    // 메인 레이아웃: 최소 높이 화면 전체, 배경 흰색, 세로 방향 플렉스, 상하 패딩 8
    <div className="min-h-screen bg-white flex flex-col py-8">
      {/* 헤더 컴포넌트: 현재 경로를 props로 전달 */}
      <Header activePath={pathname} />
      {/* 메인 콘텐츠 섹션: 최대 너비 7xl, 중앙 정렬, 플렉스 레이아웃, 모바일에서는 세로, 중간 크기 이상에서 가로 */}
      <section className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row gap-8">
        {/* 1열: 대제목(카테고리) 리스트, 너비 조정 (md:w-1/4) */}
        <div className="md:w-1/4">
          <h2 className="text-3xl font-bold text-[#0F4C81] mb-4">Categories</h2>
          <div className="space-y-2">
            {contentItems.map((item) => (
              <Button
                key={item.category}
                variant="ghost"
                className={`w-full text-left justify-start relative transition-all duration-300 ${
                  selectedCategory === item.category
                    ? "text-[#0F4C81] font-semibold bg-[#0F4C81]/10"
                    : "text-gray-600 hover:text-[#0F4C81] hover:bg-[#0F4C81]/5"
                }`}
                onClick={() => setSelectedCategory(item.category)}
              >
                {/* 선택된 카테고리에 왼쪽 세로 바 표시 */}
                {selectedCategory === item.category && (
                  <span className="absolute left-0 top-0 h-full w-1 bg-[#0F4C81]"></span>
                )}
                {item.title}
              </Button>
            ))}
            
          </div>
        </div>

        {/* 2열: 선택된 카테고리의 내용, 너비 조정 (md:w-3/4) */}
        <div className="md:w-3/4">
          {/* 카드 스타일 콘텐츠 영역: 테두리, 그림자, 약간의 배경색, 패딩 */}
          <div
            className="p-6 border rounded-lg shadow-md bg-gray-50 transition-opacity duration-300 ease-in-out"
            key={selectedCategory} // key를 변경하여 애니메이션 트리거
          >
            <h2 className="text-3xl font-semibold text-[#0F4C81] mb-4">
              {selectedCategory === "FAQ" ? "FAQ" : selectedContent?.title || "Select a category"}
            </h2>
            {selectedCategory === "FAQ" ? (
              <div className="space-y-4">
                {faqItems.length > 0 ? (
                  faqItems.map((item) => (
                    <div key={item.id}>
                      <h3 className="text-xl font-semibold text-gray-800">{item.question}</h3>
                      <div
                        className="text-gray-600 mt-2"
                        dangerouslySetInnerHTML={{ __html: item.content }}
                      />
                    </div>
                  ))
                ) : (
                  <p className="text-gray-600">No FAQ available.</p>
                )}
              </div>
            ) : (
              <div
                className="text-gray-600"
                dangerouslySetInnerHTML={{ __html: selectedContent?.content || "No content available." }}
              />
            )}
            {/* Buy Pixels Now 버튼: 2열 하단에 배치, 크기 증가 및 호버 애니메이션 */}
            <div className="mt-6">
              <Link href="/">
                <Button
                  className="bg-[#0F4C81] hover:bg-[#1A5A96] text-white px-8 py-4 rounded-lg text-lg font-semibold transform hover:scale-105 transition-transform duration-200"
                >
                  Buy Pixels Now
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}