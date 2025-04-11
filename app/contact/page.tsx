// app/contact/page.tsx

"use client";

// 필요한 모듈 임포트
import { useState, useEffect } from "react"; // React 훅
import { usePathname } from "next/navigation"; // 현재 경로를 가져오기 위한 훅
import Header from "@/components/main/Header"; // 상단 헤더 컴포넌트
import { Button } from "@/components/ui/button"; // 버튼 컴포넌트
import { Input } from "@/components/ui/input"; // 입력 필드 컴포넌트
import { Textarea } from "@/components/ui/textarea"; // 텍스트 영역 컴포넌트
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"; // 아코디언 컴포넌트
import { getContent } from "@/lib/api"; // 콘텐츠 데이터를 가져오는 API 함수
import { Content, FAQItem } from "@/lib/types"; // 콘텐츠 및 FAQ 타입 정의

// Contact 페이지 컴포넌트
export default function Contact() {
  // 현재 경로 가져오기
  const pathname = usePathname();

  // 상태 정의
  const [name, setName] = useState(""); // 이름 입력 상태
  const [email, setEmail] = useState(""); // 이메일 입력 상태
  const [message, setMessage] = useState(""); // 메시지 입력 상태
  const [content, setContent] = useState<Content | null>(null); // 콘텐츠 데이터 상태

  // 콘텐츠 데이터 로드
  useEffect(() => {
    const loadContent = async () => {
      // API에서 콘텐츠 데이터 가져오기
      const data = await getContent();
      // API 응답이 string일 경우 Content 타입으로 캐스팅 (임시 해결)
      // TODO: /api/content 엔드포인트가 실제로 Content 타입 데이터를 반환하도록 수정 필요
      const parsedData = typeof data === "string" ? JSON.parse(data) as Content : data;
      // 콘텐츠 상태 업데이트
      setContent(parsedData);
    };
    loadContent();
  }, []); // 컴포넌트 마운트 시 실행

  // 폼 제출 핸들러
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault(); // 기본 폼 제출 동작 방지
    // 폼 데이터 콘솔 출력
    console.log("Form submitted:", { name, email, message });
    // 폼 입력값 초기화
    setName("");
    setEmail("");
    setMessage("");
  };

  // 콘텐츠 데이터가 로드되지 않았을 때 로딩 표시
  if (!content) return <div>Loading...</div>;

  return (
    // 메인 레이아웃: 최소 높이 화면 전체, 배경 흰색, 세로 방향 플렉스, 상하 패딩 8
    <div className="min-h-screen bg-white flex flex-col py-8">
      {/* 헤더 컴포넌트 */}
      <Header activePath={pathname} />
      {/* 메인 섹션: 중앙 정렬, 상하 패딩 8 */}
      <section className="flex-1 flex items-center justify-center py-8">
        {/* 콘텐츠 컨테이너: 최대 너비 7xl, 전체 너비, 좌우 패딩 4, 플렉스 레이아웃, 중간 크기 이상에서 가로 방향 */}
        <div className="max-w-7xl w-full px-4 flex flex-col md:flex-row gap-8">
          {/* 폼 영역: 플렉스 1 */}
          <div className="flex-1">
            {/* 연락 폼 */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* 이름 입력 필드 */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Your Name
                </label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)} // 이름 입력값 업데이트
                  placeholder=""
                  className="mt-1 border-t-0 border-l-0 border-r-0 border-b-2 border-gray-300 focus:ring-0 focus:border-blue-500 rounded-none"
                />
              </div>
              {/* 이메일 입력 필드 */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Your Email
                </label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)} // 이메일 입력값 업데이트
                  placeholder=""
                  className="mt-1 border-t-0 border-l-0 border-r-0 border-b-2 border-gray-300 focus:ring-0 focus:border-blue-500 rounded-none"
                />
              </div>
              {/* 메시지 입력 필드 */}
              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700">
                  Share your thoughts
                </label>
                <Textarea
                  id="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)} // 메시지 입력값 업데이트
                  placeholder=""
                  className="mt-1 h-50 border-t-0 border-l-0 border-r-0 border-b-2 border-gray-300 focus:ring-0 focus:border-blue-500 rounded-none"
                  rows={4}
                />
              </div>
              {/* 제출 버튼 */}
              <div>
                <Button
                  type="submit"
                  className="w-full bg-white text-gray-900 border-2 border-blue-500 hover:bg-blue-50 hover:border-blue-600 rounded-lg py-3 font-semibold shadow-md"
                >
                  SHARE YOUR FEEDBACK
                </Button>
              </div>
            </form>
          </div>

          {/* 콘텐츠 영역: 플렉스 1 */}
          <div className="flex-1">
            {/* 섹션 제목 */}
            <h2 className="text-5xl font-bold text-gray-900 mb-2">
              Contact <span className="text-blue-500">Us</span>
            </h2>
            {/* 구분선 */}
            <div className="w-16 h-1 bg-blue-500 mb-6"></div>
            {/* 안내 문구 */}
            <p className="text-gray-600 mb-8">
              It is very important for us to keep in touch with you, so we are always ready to answer any question that interests you. Shoot!
            </p>

            {/* FAQ 섹션 제목 */}
            <h3 className="text-2xl font-semibold text-gray-800 mb-4">
              Frequently Asked Questions
            </h3>
            {/* FAQ 아코디언 */}
            <Accordion type="single" collapsible className="w-full">
              {content.faq.map((item: FAQItem, index: number) => (
                <AccordionItem key={index} value={`item-${index}`}>
                  <AccordionTrigger>{item.question}</AccordionTrigger>
                  <AccordionContent>{item.answer}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </section>
    </div>
  );
}