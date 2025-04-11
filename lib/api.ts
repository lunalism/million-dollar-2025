// lib/api.ts

// 필요한 타입 임포트
import { Pixel } from "./types"; // 픽셀 타입 정의

// 픽셀 데이터를 가져오는 함수
export async function getPixels(): Promise<Pixel[]> {
    // /api/pixels 엔드포인트에서 픽셀 데이터 가져오기
    const res = await fetch("/api/pixels");

    // 응답이 실패하면 에러 발생
    if (!res.ok) throw new Error("Failed to fetch pixels");

    // JSON 응답을 파싱하여 반환
    return res.json();
}

// 픽셀 데이터를 저장하는 함수
export async function savePixels(pixels: Pixel[]): Promise<Pixel[]> {
    // /api/pixels 엔드포인트에 POST 요청으로 픽셀 데이터 저장
    const res = await fetch("/api/pixels", {
        method: "POST", // POST 메서드 사용
        headers: { "Content-Type": "application/json" }, // JSON 형식 헤더 설정
        body: JSON.stringify(pixels), // 픽셀 데이터를 JSON 문자열로 변환
    });

    // 응답이 실패하면 에러 발생
    if (!res.ok) throw new Error("Failed to save pixels");

    // JSON 응답을 파싱하여 저장된 픽셀 데이터 반환
    return res.json();
}

// 콘텐츠 데이터를 가져오는 함수
export async function getContent(): Promise<string> {
    // /api/content 엔드포인트에서 콘텐츠 데이터 가져오기
    const res = await fetch("/api/content");

    // 응답이 실패하면 에러 발생
    if (!res.ok) throw new Error("Failed to fetch content");

    // JSON 응답을 파싱하여 반환
    return res.json();
}

// 콘텐츠 데이터를 저장하는 함수
export async function saveContent(content: string): Promise<string> {
    // /api/content 엔드포인트에 POST 요청으로 콘텐츠 데이터 저장
    const res = await fetch("/api/content", {
        method: "POST", // POST 메서드 사용
        headers: { "Content-Type": "application/json" }, // JSON 형식 헤더 설정
        body: JSON.stringify(content), // 콘텐츠 데이터를 JSON 문자열로 변환
    });

    // 응답이 실패하면 에러 발생
    if (!res.ok) throw new Error("Failed to save content");
    
    // JSON 응답을 파싱하여 저장된 콘텐츠 데이터 반환
    return res.json();
}