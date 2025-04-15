// app/about/page.tsx (필터링 로직 제거)
"use client";

// 필요한 모듈 임포트
import { useState, useEffect } from "react"; // React 훅
import { usePathname } from "next/navigation"; // 현재 경로를 가져오기 위한 훅
import Header from "@/components/main/Header"; // 상단 헤더 컴포넌트
import Link from "next/link"; // 페이지 간 이동을 위한 링크 컴포넌트
import { Button } from "@/components/ui/button"; // 버튼 컴포넌트
import { getAboutContent } from "@/lib/supabase"; // Supabase에서 데이터 가져오기
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"; // 아코디언 컴포넌트

// About 항목 타입 정의
interface AboutItem {
  id: string;
  category: string;
  title: string;
  content: string;
}

// About 페이지 컴포넌트
export default function About() {
  const pathname = usePathname();
  const [contentItems, setContentItems] = useState<AboutItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null); // 에러 상태 추가

  // Supabase에서 데이터 로드
  useEffect(() => {
    const loadContent = async () => {
      setIsLoading(true);
      setError(null); // 에러 초기화
      try {
        const contentData = await getAboutContent();
        console.log("Loaded contentData:", contentData); // 디버깅 로그
        if (!contentData || contentData.length === 0) {
          console.log("No content data returned from Supabase.");
          setError("No content available in the database.");
          setContentItems([]);
          return;
        }
        setContentItems(contentData); // 필터링 제거
        if (contentData.length > 0) {
          setSelectedCategory(contentData[0].category);
        }
      } catch (error: unknown) {
        console.error("Failed to load about content:", error);
        setError("Failed to load content. Please try again later.");
        setContentItems([]);
      } finally {
        setIsLoading(false);
      }
    };
    loadContent();
  }, []);

  const selectedContent = contentItems.find((item) => item.category === selectedCategory);

  // UI 렌더링
  return (
    <div className="min-h-screen bg-white flex flex-col py-8">
      {/* Header 컴포넌트: 항상 표시 */}
      <Header activePath={pathname} />
      <div className="max-w-7xl mx-auto px-4 flex-1">
        {/* 로딩 중일 때 */}
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-lg text-gray-600">Loading...</p>
          </div>
        ) : (
          // 데이터가 없거나 에러가 발생한 경우
          error || contentItems.length === 0 ? (
            <div className="flex items-center justify-center h-full flex-col">
              <p className="text-lg text-gray-600">
                {error || "No content available."}
              </p>
              <p className="text-gray-500 mt-2">
                Please check back later or contact support if the issue persists.
              </p>
            </div>
          ) : (
            // 데이터가 있을 경우 콘텐츠 표시
            <section className="flex flex-col md:flex-row gap-8">
              {/* 카테고리 리스트 */}
              <div className="md:w-1/4">
                <h2 className="text-3xl font-bold text-[#0F4C81] mb-4">Categories</h2>
                {/* 모바일: 아코디언 스타일 */}
                <div className="block md:hidden">
                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="categories">
                      <AccordionTrigger className="text-xl font-semibold text-gray-800">
                        Select a Category
                      </AccordionTrigger>
                      <AccordionContent>
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
                              {selectedCategory === item.category && (
                                <span className="absolute left-0 top-0 h-full w-1 bg-[#0F4C81]"></span>
                              )}
                              {item.category}
                            </Button>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </div>
                {/* 데스크톱: 기존 리스트 스타일 */}
                <div className="hidden md:block space-y-2">
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
                      {selectedCategory === item.category && (
                        <span className="absolute left-0 top-0 h-full w-1 bg-[#0F4C81]"></span>
                      )}
                      {item.category}
                    </Button>
                  ))}
                </div>
              </div>

              {/* 선택된 카테고리 콘텐츠 */}
              <div className="md:w-3/4">
                <div
                  className="p-6 border rounded-lg shadow-md bg-gray-50 transition-opacity duration-300 ease-in-out"
                  key={selectedCategory}
                >
                  <h2 className="text-3xl font-semibold text-[#0F4C81] mb-4">
                    {selectedContent?.category || "Select a category"}
                  </h2>
                  <div
                    className="text-gray-600"
                    dangerouslySetInnerHTML={{ __html: selectedContent?.content || "No content available." }}
                  />
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
          )
        )}
      </div>
    </div>
  );
}