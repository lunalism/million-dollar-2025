// lib/supabase.ts
import { createClient } from "@supabase/supabase-js";
import { Pixel } from "./types";

// Supabase 클라이언트 생성
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_KEY || "";

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Supabase URL and Key must be defined in environment variables.");
}

export const supabase = createClient(supabaseUrl, supabaseKey);

// About 항목 타입 정의
interface AboutItem {
  id: string;
  category: string;
  title: string;
  content: string;
}

// 픽셀 데이터를 가져오는 함수
export const getPixels = async (): Promise<Pixel[]> => {
  const { data, error } = await supabase.from("pixels").select("*");
  if (error) {
    console.error("Error fetching pixels:", error);
    return [];
  }
  return data || [];
};

// 픽셀 데이터를 저장하는 함수
export const savePixels = async (pixels: Pixel[]): Promise<void> => {
  const { error } = await supabase.from("pixels").upsert(pixels);
  if (error) {
    console.error("Error saving pixels:", error);
    throw error;
  }
};

// About 데이터 가져오기 함수입니다.
export const getAboutContent = async (): Promise<AboutItem[]> => {
  const { data, error } = await supabase.from("about").select("*");
  if (error) {
    console.error("Error fetching about content:", error);
    return [];
  }
  if (!data || data.length === 0) {
    console.log("No about content found in the database.");
  }
  return data || [];
};

// About 데이터를 업데이트하는 함수입니다.
export const updateAboutContent = async (
  oldCategory: string,
  newCategory: string,
  newTitle: string,
  content: string
): Promise<void> => {
  try {
    if (!newTitle) {
      throw new Error("Title cannot be empty");
    }

    const { error } = await supabase
      .from("about")
      .upsert(
        { category: newCategory, title: newTitle, content },
        { onConflict: "category" }
      );

    if (error) {
      console.error("Error upserting about content:", error);
      throw error;
    }
  } catch (error) {
    console.error("updateAboutContent error:", error);
    throw error;
  }
};

// FAQ 데이터를 가져오는 함수입니다.
export const getFAQItems = async () => {
  const { data, error } = await supabase.from("faq").select("*").order("id");
  if (error) {
    console.error("Error fetching FAQ items:", error);
    return [];
  }
  return data || [];
};

// FAQ 항목을 추가하거나 업데이트하는 함수입니다.
export const upsertFAQItem = async (id: number | null, question: string, content: string) => {
  const { data, error } = await supabase
    .from("faq")
    .upsert({ id, question, content })
    .select();
  if (error) {
    console.error("Error upserting FAQ item:", error);
    throw error;
  }
  return data;
};

// FAQ 항목을 삭제하는 함수입니다.
export const deleteFAQItem = async (id: number) => {
  const { error } = await supabase.from("faq").delete().eq("id", id);
  if (error) {
    console.error("Error deleting FAQ item:", error);
    throw error;
  }
};