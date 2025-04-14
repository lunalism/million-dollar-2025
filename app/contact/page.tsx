// app/contact/page.tsx
"use client";

// 필요한 모듈 임포트
import { useState, useEffect } from "react"; // React 훅
import { usePathname } from "next/navigation"; // 현재 경로를 가져오기 위한 훅
import Header from "@/components/main/Header"; // 상단 헤더 컴포넌트
import { Button } from "@/components/ui/button"; // 버튼 컴포넌트
import { Input } from "@/components/ui/input"; // 입력 필드 컴포넌트
import { Textarea } from "@/components/ui/textarea"; // 텍스트 영역 컴포넌트
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"; // 아코디언 컴포넌트
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"; // 다이얼로그 컴포넌트
import { getFAQItems } from "@/lib/supabase"; // Supabase에서 FAQ 데이터 가져오기
import { toast } from "sonner"; // sonner로 메시지 표시

// FAQ 항목 타입 정의 (faq 테이블 구조에 맞춤)
interface FAQItem {
  id: number;
  question: string;
  content: string;
}

// Contact 페이지 컴포넌트
export default function Contact() {
  // 현재 경로 가져오기
  const pathname = usePathname();

  // 상태 정의
  const [name, setName] = useState(""); // 이름 입력 상태
  const [email, setEmail] = useState(""); // 이메일 입력 상태
  const [message, setMessage] = useState(""); // 메시지 입력 상태
  const [faqItems, setFaqItems] = useState<FAQItem[]>([]); // FAQ 데이터 상태
  const [isLoading, setIsLoading] = useState(true); // FAQ 로딩 상태
  const [isSending, setIsSending] = useState(false); // 메일 전송 중 로딩 상태
  const [isSuccessDialogOpen, setIsSuccessDialogOpen] = useState(false); // 성공 다이얼로그 상태

  // Supabase에서 FAQ 데이터 로드
  useEffect(() => {
    const loadContent = async () => {
      setIsLoading(true); // 로딩 시작
      try {
        // Supabase에서 FAQ 데이터 가져오기
        const data = await getFAQItems();
        setFaqItems(data);
      } catch (error) {
        console.error("Failed to load FAQ content:", error);
      } finally {
        setIsLoading(false); // 로딩 종료
      }
    };
    loadContent();
  }, []); // 컴포넌트 마운트 시 실행

  // 폼 제출 핸들러
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); // 기본 폼 제출 동작 방지

    // 입력값 검증
    if (!name.trim() || !email.trim() || !message.trim()) {
      toast.error("Please fill in all fields.");
      return;
    }

    // 이메일 형식 검증 (간단한 정규식)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error("Please enter a valid email address.");
      return;
    }

    setIsSending(true); // 전송 시작
    try {
      // Web3Forms API로 피드백 전송
      const response = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          access_key: process.env.NEXT_PUBLIC_WEB3FORMS_ACCESS_KEY!,
          name: name,
          email: email,
          message: message,
          subject: `New Feedback from ${name}`,
          date: new Date().toLocaleString("en-US", {
            timeZone: "Asia/Seoul",
            dateStyle: "medium",
            timeStyle: "short",
          }),
        }),
      });

      const result = await response.json();
      if (result.success) {
        // 성공 시 다이얼로그 표시
        setIsSuccessDialogOpen(true);
      } else {
        throw new Error(result.message || "Failed to send feedback.");
      }
    } catch (error) {
      console.error("Failed to send feedback:", error);
      toast.error("Failed to send feedback. Please try again.");
    } finally {
      setIsSending(false); // 전송 종료
    }
  };

  // 성공 다이얼로그 닫기 및 폼 초기화
  const handleSuccessDialogClose = () => {
    setIsSuccessDialogOpen(false);
    // 폼 입력값 초기화
    setName("");
    setEmail("");
    setMessage("");
  };

  // 로딩 중일 때 표시
  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center">
        <p className="text-lg text-gray-600">Loading...</p>
      </div>
    );
  }

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
                  disabled={isSending}
                >
                  {isSending ? "Sending..." : "SHARE YOUR FEEDBACK"}
                </Button>
              </div>
            </form>
          </div>

          {/* 콘텐츠 영역: 플렉스 1 */}
          <div className="flex-1">
            {/* 섹션 제목 */}
            <h2 className="text-5xl font-bold text-gray-900 mb-2">
              Contact <span className="text-[#0F4C81]">Us</span>
            </h2>
            {/* 구분선 */}
            <div className="w-16 h-1 bg-[#0F4C81] mb-6"></div>
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
              {faqItems.map((item) => (
                <AccordionItem key={item.id} value={`item-${item.id}`}>
                  <AccordionTrigger>{item.question}</AccordionTrigger>
                  <AccordionContent>
                    <div dangerouslySetInnerHTML={{ __html: item.content }} />
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </section>

      {/* 성공 다이얼로그 */}
      <Dialog open={isSuccessDialogOpen} onOpenChange={setIsSuccessDialogOpen}>
        <DialogContent className="sm:max-w-[425px] rounded-lg shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-semibold text-gray-900">
              Thank You!
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-gray-600">
              Thank you for your feedback. We will get back to you shortly.
            </p>
          </div>
          <DialogFooter>
            <Button
              onClick={handleSuccessDialogClose}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}