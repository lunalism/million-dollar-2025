// lib/supabase.ts

// Supabase와 관련된 데이터베이스 작업을 처리하는 파일입니다.

import { createClient } from "@supabase/supabase-js";

// Supabase 클라이언트 생성
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_KEY || "";

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Supabase URL and Anon Key must be defined in environment variables.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// About 항목 타입 정의
interface AboutItem {
  category: string;
  content: string;
}

// About 데이터 가져오기 함수입니다.
// @returns {Promise<AboutItem[]>} About 항목 배열을 반환합니다. 에러 발생 시 빈 배열을 반환합니다.
export const getAboutContent = async (): Promise<AboutItem[]> => {
  const { data, error } = await supabase.from("about").select("*");
  if (error) {
    console.error("Error fetching about content:", error);
    return [];
  }
  return data || [];
};

// About 데이터를 업데이트하는 함수입니다.
// @param {string} id - 업데이트할 항목의 ID (사용하지 않음, Supabase에서 category로 대체)
// @param {string} category - About 항목의 카테고리
// @param {string} content - About 항목의 내용
// @returns {Promise<void>} 성공 시 아무 값도 반환하지 않으며, 에러 발생 시 예외를 던집니다.
export const updateAboutContent = async (
  id: string,
  category: string,
  content: string
): Promise<void> => {
  const { error } = await supabase
    .from("about")
    .upsert({ category, content }, { onConflict: "category" });
  if (error) {
    console.error("Error updating about content:", error);
    throw error;
  }
};

// FAQ 데이터를 가져오는 함수입니다.
// @returns {Promise<FAQItem[]>} FAQ 항목 배열을 반환합니다. 에러 발생 시 빈 배열을 반환합니다.
export const getFAQItems = async () => {
  const { data, error } = await supabase.from("faq").select("*").order("id");
  if (error) {
    console.error("Error fetching FAQ items:", error);
    return [];
  }
  return data || [];
};

// FAQ 항목을 추가하거나 업데이트하는 함수입니다.
// @param {number | null} id - FAQ 항목의 ID (null이면 새 항목 추가)
// @param {string} question - FAQ 질문
// @param {string} answer - FAQ 답변
// @returns {Promise<FAQItem[]>} 업데이트된 FAQ 항목 배열을 반환합니다.
export const upsertFAQItem = async (id: number | null, question: string, answer: string) => {
  const { data, error } = await supabase
    .from("faq")
    .upsert({ id, question, answer })
    .select();
  if (error) {
    console.error("Error upserting FAQ item:", error);
    throw error;
  }
  return data;
};

// FAQ 항목을 삭제하는 함수입니다.
// @param {number} id - 삭제할 FAQ 항목의 ID
// @returns {Promise<void>} 성공 시 아무 값도 반환하지 않으며, 에러 발생 시 예외를 던집니다.
export const deleteFAQItem = async (id: number) => {
  const { error } = await supabase.from("faq").delete().eq("id", id);
  if (error) {
    console.error("Error deleting FAQ item:", error);
    throw error;
  }
};