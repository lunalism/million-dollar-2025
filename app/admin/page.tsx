// app/admin/page.tsx
"use client";

// React와 상태 관리 훅 임포트
import { useState, useEffect } from "react";
// Next.js 라우터 훅 임포트 (페이지 이동 및 리다이렉션을 위해 사용)
import { useRouter } from "next/navigation";
// UI 컴포넌트 임포트 (탭 버튼 렌더링에 사용)
import { Button } from "@/components/ui/button";
// Supabase 관련 함수와 클라이언트 임포트 (데이터베이스 작업에 사용)
import { supabase, getAboutContent, updateAboutContent, getFAQItems, upsertFAQItem, deleteFAQItem } from "@/lib/supabase";
// API 함수 임포트 (픽셀 데이터 작업에 사용)
import { getPixels, savePixels } from "@/lib/api";
// 타입 정의 임포트 (데이터 구조 정의)
import { Pixel, AboutItem, FAQItem } from "@/lib/types";
// 관리자 페이지의 하위 컴포넌트 임포트
import AdminLogin from "./components/AdminLogin";
import ManagePixels from "./components/ManagePixels";
import ManageAbout from "./components/ManageAbout";
import ManageFAQ from "./components/ManageFAQ";

// Admin 페이지 컴포넌트: 관리자 대시보드를 렌더링하고 인증 및 데이터 로드를 관리
export default function Admin() {
  const router = useRouter();
  // 인증 상태 (관리자 로그인 여부)
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  // 로딩 상태 (데이터 로드 중인지 여부)
  const [isLoading, setIsLoading] = useState(true);
  // 로그인 이메일 입력 상태
  const [email, setEmail] = useState("");
  // 로그인 비밀번호 입력 상태
  const [password, setPassword] = useState("");
  // 픽셀 데이터 배열 상태
  const [pixels, setPixels] = useState<Pixel[]>([]);
  // 편집 중인 픽셀 상태 (없으면 null)
  const [editPixel, setEditPixel] = useState<Pixel | null>(null);
  // About 항목 배열 상태
  const [editAboutItems, setEditAboutItems] = useState<AboutItem[]>([]);
  // FAQ 항목 배열 상태
  const [faqItems, setFaqItems] = useState<FAQItem[]>([]);
  // 활성화된 탭 상태 (Manage Pixels, Manage About, Manage FAQ 중 하나)
  const [activeTab, setActiveTab] = useState("Manage Pixels");
  // 데이터 로드 에러 메시지 상태
  const [loadError, setLoadError] = useState<string | null>(null);

  // 데이터 로드 함수: 픽셀, About, FAQ 데이터를 가져와 상태에 저장
  const loadData = async () => {
    setIsLoading(true);
    try {
      const pixelData = await getPixels(); // 픽셀 데이터 가져오기
      const contentData = await getAboutContent(); // About 데이터 가져오기
      const faqData = await getFAQItems(); // FAQ 데이터 가져오기
      console.log("Loaded pixels:", pixelData);
      console.log("Loaded about content:", contentData);
      console.log("Loaded FAQ items:", faqData);
      setPixels(pixelData); // 픽셀 상태 업데이트
      setEditAboutItems(contentData); // About 상태 업데이트
      // FAQ 데이터의 answer를 content로 매핑
      const mappedFAQItems = faqData.map(item => ({
        id: item.id,
        question: item.question,
        content: item.content || item.answer || "", // answer를 content로 통일
      }));
      setFaqItems(mappedFAQItems); // FAQ 상태 업데이트
      if (contentData.length === 0 && faqData.length === 0) {
        setLoadError("No data found in About or FAQ tables."); // 데이터가 없으면 에러 메시지 설정
      }
    } catch (error: unknown) {
      // 에러 처리: 데이터 로드 실패 시 사용자에게 알림
      if (error instanceof Error) {
        console.error("Error loading data:", error);
        setLoadError("Failed to load data: " + error.message);
      } else {
        console.error("Unknown error:", error);
        setLoadError("Failed to load data: Unknown error");
      }
    } finally {
      setIsLoading(false); // 로딩 상태 해제
    }
  };

  // 로그인 상태 확인: Supabase 세션을 확인하여 관리자 권한 확인
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', session.user.id)
          .single();

        if (error) {
          console.error("Error fetching user role:", error.message);
          router.push('/'); // 에러 발생 시 홈페이지로 리다이렉트
          return;
        }

        const userRole = data?.role;
        if (userRole === 'admin') {
          setIsAuthenticated(true); // 관리자 권한 확인 시 인증 상태 설정
        } else {
          router.push('/'); // 관리자가 아니면 홈페이지로 리다이렉트
        }
      } else {
        setIsLoading(false); // 세션이 없으면 로딩 종료
      }
    };

    checkSession();
  }, [router]);

  // isAuthenticated가 true일 때 데이터 로드
  useEffect(() => {
    if (isAuthenticated) {
      loadData();
    }
  }, [isAuthenticated]);

  // 로그인 핸들러: Supabase를 통해 관리자 로그인 처리
  const handleLogin = async () => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      alert("Login failed: " + error.message); // 로그인 실패 시 사용자에게 알림
    } else {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert("Failed to retrieve user information.");
        await supabase.auth.signOut();
        return;
      }

      const { data, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      if (roleError) {
        console.error("Error fetching user role:", roleError.message);
        alert("Access denied: Unable to verify user role.");
        await supabase.auth.signOut();
        return;
      }

      const userRole = data?.role;
      if (userRole === 'admin') {
        setIsAuthenticated(true); // 관리자 권한 확인 시 인증 상태 설정
      } else {
        alert("Access denied: You are not an admin.");
        await supabase.auth.signOut();
      }
    }
  };

  // 인증되지 않은 경우 로그인 화면 표시
  if (!isAuthenticated && !isLoading) {
    return (
      <AdminLogin
        email={email}
        password={password}
        setEmail={setEmail}
        setPassword={setPassword}
        handleLogin={handleLogin}
      />
    );
  }

  // 로딩 중일 때 표시
  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-lg text-gray-600">Loading...</p>
      </div>
    );
  }

  // 인증된 경우 관리자 대시보드 표시
  return (
    <div className="min-h-screen bg-white flex flex-col py-8">
      <div className="max-w-7xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Admin Dashboard</h1>

        {/* 탭 네비게이션: Manage Pixels, Manage About, Manage FAQ 탭 */}
        <div className="flex space-x-4 mb-8 overflow-x-auto">
          {["Manage Pixels", "Manage About", "Manage FAQ"].map((tab) => (
            <Button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg font-semibold transition-all duration-200 ${
                activeTab === tab
                  ? "bg-[#0F4C81] text-white"
                  : "bg-gray-200 text-gray-600 hover:bg-gray-300"
              }`}
            >
              {tab}
            </Button>
          ))}
        </div>

        {/* 데이터 로드 에러 메시지 표시 */}
        {loadError && (
          <div className="mb-4 p-4 border rounded-lg bg-red-50 text-red-600">
            {loadError}
          </div>
        )}

        <div className="w-full">
          {/* Manage Pixels 탭: 픽셀 관리 섹션 표시 */}
          {activeTab === "Manage Pixels" && (
            <ManagePixels
              pixels={pixels}
              setPixels={setPixels}
              editPixel={editPixel}
              setEditPixel={setEditPixel}
              savePixels={savePixels}
              getPixels={getPixels}
              supabase={supabase}
            />
          )}

          {/* Manage About 탭: About 항목 관리 섹션 표시 */}
          {activeTab === "Manage About" && (
            <ManageAbout
              editAboutItems={editAboutItems}
              setEditAboutItems={setEditAboutItems}
              updateAboutContent={updateAboutContent}
              supabase={supabase}
            />
          )}

          {/* Manage FAQ 탭: FAQ 항목 관리 섹션 표시 */}
          {activeTab === "Manage FAQ" && (
            <ManageFAQ
              faqItems={faqItems}
              setFaqItems={setFaqItems}
              upsertFAQItem={upsertFAQItem}
              deleteFAQItem={deleteFAQItem}
              getFAQItems={getFAQItems}
            />
          )}
        </div>
      </div>
    </div>
  );
}