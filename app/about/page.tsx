// app/about/page.tsx
"use client";

// 필요한 모듈 임포트
import { useState, useEffect } from "react"; // React 훅
import { usePathname } from "next/navigation"; // 현재 경로를 가져오기 위한 훅
import Header from "@/components/main/Header"; // 상단 헤더 컴포넌트
import Link from "next/link"; // 페이지 간 이동을 위한 링크 컴포넌트
import { Button } from "@/components/ui/button"; // 버튼 컴포넌트
import { getAboutContent, getFAQItems } from "@/lib/supabase"; // Supabase에서 데이터 가져오기
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"; // 아코디언 컴포넌트

// FAQ 항목 타입 정의 (faq 테이블 구조에 맞춤)
interface FAQItem {
  id: number;
  question: string;
  content: string;
}

// About 페이지 컴포넌트
export default function About() {
  const pathname = usePathname();
  const [contentItems, setContentItems] = useState<
    { category: string; title: string; content: string }[]
  >([]);
  const [faqItems, setFaqItems] = useState<FAQItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  // Supabase에서 데이터 로드
  useEffect(() => {
    const loadContent = async () => {
      setIsLoading(true);
      try {
        const contentData = await getAboutContent();
        const filteredContentData = contentData.filter(
          (item) => item.category !== "How to Buy Pixels"
        );
        setContentItems(filteredContentData);
        if (filteredContentData.length > 0) {
          setSelectedCategory(filteredContentData[0].category);
        }

        const faqData = await getFAQItems();
        setFaqItems(faqData);
      } catch (error) {
        console.error("Failed to load about content:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadContent();
  }, []);

  const selectedContent = contentItems.find((item) => item.category === selectedCategory);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center">
        <p className="text-lg text-gray-600">Loading...</p>
      </div>
    );
  }

  if (contentItems.length === 0) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center">
        <p className="text-lg text-gray-600">No content available.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col py-8">
      <Header activePath={pathname} />
      <section className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row gap-8">
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
                        {item.title}
                      </Button>
                    ))}
                    <Button
                      variant="ghost"
                      className={`w-full text-left justify-start relative transition-all duration-300 ${
                        selectedCategory === "FAQ"
                          ? "text-[#0F4C81] font-semibold bg-[#0F4C81]/10"
                          : "text-gray-600 hover:text-[#0F4C81] hover:bg-[#0F4C81]/5"
                      }`}
                      onClick={() => setSelectedCategory("FAQ")}
                    >
                      {selectedCategory === "FAQ" && (
                        <span className="absolute left-0 top-0 h-full w-1 bg-[#0F4C81]"></span>
                      )}
                      FAQ
                    </Button>
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
                {item.title}
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