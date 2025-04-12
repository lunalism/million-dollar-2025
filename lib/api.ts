// lib/api.ts

// Supabase와 관련된 API 함수들을 정의하는 파일입니다.
// 이 파일은 Supabase Storage와 데이터베이스(`pixels` 테이블)와의 상호작용을 처리합니다.

import { createClient } from "@supabase/supabase-js"; // Supabase 클라이언트 라이브러리
import { Pixel } from "@/lib/types"; // 타입 정의

// 환경 변수에서 Supabase URL과 Anon Key를 가져옵니다.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_KEY || "";

// Supabase URL과 Anon Key가 정의되지 않았을 경우 에러를 발생시킵니다.
// 이는 환경 변수가 누락되었을 때 개발자가 문제를 빠르게 파악할 수 있도록 돕습니다.
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Supabase URL and Anon Key must be defined in environment variables.");
}

// Supabase 클라이언트를 생성합니다.
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Supabase 데이터베이스에서 모든 픽셀 데이터를 가져오는 함수입니다.
// @returns {Promise<Pixel[]>} 픽셀 데이터 배열을 반환합니다. 에러 발생 시 빈 배열을 반환합니다.
export const getPixels = async (): Promise<Pixel[]> => {
  const { data, error } = await supabase.from("pixels").select("*");
  if (error) {
    // 에러 발생 시 콘솔에 에러 메시지를 출력하고 빈 배열을 반환합니다.
    console.error("Error fetching pixels:", error);
    return [];
  }
  return data || [];
};

// 주어진 픽셀 데이터를 Supabase 데이터베이스에 저장하는 함수입니다.
// @param {Pixel[]} pixels - 저장할 픽셀 데이터 배열
// @returns {Promise<void>} 성공 시 아무 값도 반환하지 않으며, 에러 발생 시 예외를 던집니다.
export const savePixels = async (pixels: Pixel[]): Promise<void> => {
  const { error } = await supabase.from("pixels").insert(pixels);
  if (error) {
    // 에러 발생 시 콘솔에 에러 메시지를 출력하고 예외를 던집니다.
    console.error("Error saving pixels:", error);
    throw error;
  }
};

// 파일을 Supabase Storage에 업로드하고 공개 URL을 반환하는 함수입니다.
// @param {File} file - 업로드할 파일 객체
// @returns {Promise<string>} 업로드된 파일의 공개 URL을 반환합니다.
// @throws {Error} 파일 업로드 또는 공개 URL 생성에 실패할 경우 에러를 던집니다.
export const uploadFile = async (file: File): Promise<string> => {
  // 고유한 파일 이름을 생성하기 위해 현재 타임스탬프와 파일 이름을 결합합니다.
  const fileName = `${Date.now()}-${file.name}`;
  
  // Supabase Storage의 `pixel-content` 버킷에 파일을 업로드합니다.
  const { error } = await supabase.storage.from("pixel-content").upload(fileName, file);
  if (error) {
    // 업로드 실패 시 에러 메시지를 콘솔에 출력하고 예외를 던집니다.
    console.error("Error uploading file to Supabase Storage:", error.message);
    throw new Error(`Failed to upload file: ${error.message}`);
  }

  // 업로드된 파일의 공개 URL을 가져옵니다.
  const { data } = supabase.storage.from("pixel-content").getPublicUrl(fileName);
  if (!data.publicUrl) {
    // 공개 URL 생성 실패 시 예외를 던집니다.
    throw new Error("Failed to get public URL for the uploaded file.");
  }
  
  return data.publicUrl;
};