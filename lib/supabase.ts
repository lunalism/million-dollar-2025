// lib/supabase.ts

// 필요한 모듈 임포트
import { createClient } from "@supabase/supabase-js"; // Supabase 클라이언트

// Supabase URL과 API 키 (환경 변수로 관리 권장)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "your-supabase-url";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_KEY || "your-supabase-key";

// Supabase 클라이언트 초기화
export const supabase = createClient(supabaseUrl, supabaseKey);

// About 페이지 콘텐츠를 가져오는 함수
export async function getAboutContent() {
    // about_content 테이블에서 데이터 가져오기
    const { data, error } = await supabase
        .from("about_content")
        .select("*")
        .order("id", { ascending: true });

    // 에러 처리
    if (error) {
        console.error("Error fetching about content:", error);
        throw new Error("Failed to fetch about content");
    }

    // 데이터 반환
    return data;
}