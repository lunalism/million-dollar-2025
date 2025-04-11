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

// About 콘텐츠를 업데이트하는 함수
export async function updateAboutContent(category: string, title: string, content: string) {
  // about_content 테이블에서 해당 카테고리의 데이터 업데이트
  const { data, error } = await supabase
    .from("about_content")
    .update({ title, content })
    .eq("category", category)
    .select();

  // 에러 처리
  if (error) {
    console.error("Error updating about content:", error);
    throw new Error("Failed to update about content");
  }

  // 업데이트된 데이터 반환
  return data;
}

// FAQ 항목을 가져오는 함수
export async function getFAQItems(filterQuestion?: string) {
  // faq 테이블에서 데이터 가져오기
  let query = supabase.from("faq").select("*").order("id", { ascending: true });

  // 필터링 조건 추가 (필요한 경우)
  if (filterQuestion) {
    query = query.ilike("question", filterQuestion);
  }

  const { data, error } = await query;

  // 에러 처리
  if (error) {
    console.error("Error fetching FAQ items:", error);
    throw new Error("Failed to fetch FAQ items");
  }

  // 데이터 반환
  return data;
}

// FAQ 항목을 추가/수정하는 함수
export async function upsertFAQItem(id: number | null, question: string, answer: string) {
  // id가 있으면 업데이트, 없으면 삽입
  const { data, error } = await supabase
    .from("faq")
    .upsert({ id, question, answer })
    .select();

  // 에러 처리
  if (error) {
    console.error("Error upserting FAQ item:", error);
    throw new Error("Failed to upsert FAQ item");
  }

  // 업데이트된 데이터 반환
  return data;
}

// FAQ 항목을 삭제하는 함수
export async function deleteFAQItem(id: number) {
  // faq 테이블에서 해당 ID의 데이터 삭제
  const { error } = await supabase
    .from("faq")
    .delete()
    .eq("id", id);

  // 에러 처리
  if (error) {
    console.error("Error deleting FAQ item:", error);
    throw new Error("Failed to delete FAQ item");
  }
}