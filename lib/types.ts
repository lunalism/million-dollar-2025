// lib/types.ts

// 픽셀 데이터를 나타내는 타입
export type Pixel = {
    x: number;
    y: number;
    width: number;
    height: number;
    owner: string;
    content: string | null;
    purchaseType: "basic" | "premium";
    content_width?: number; // 이미지 너비 (픽셀 단위)
    content_height?: number; // 이미지 높이 (픽셀 단위)
};

// purchasedPixels 상태를 해시맵으로 관리하기 위한 타입
export type PixelMap = {
    [key: string]: Pixel;
};

// 그리드에서 렌더링할 픽셀 데이터를 나타내는 타입
export type GridPixel = {
    x: number; // 픽셀의 x 좌표
    y: number; // 픽셀의 y 좌표
    purchased: boolean; // 픽셀이 구매되었는지 여부
    owner?: string; // 픽셀 블록의 소유자 이름 (구매된 경우)
    content?: string; // 픽셀 블록에 표시할 콘텐츠 URL (구매된 경우)
    purchaseType?: "basic" | "premium"; // 구매 타입: Basic 또는 Premium (구매된 경우)
};

// About 항목 타입 정의 (export 키워드 확인)
export interface AboutItem {
    id: string; // About 항목의 고유 ID
    category: string; // 카테고리 이름
    title: string; // 제목
    content: string; // 내용 (HTML 형식 가능)
}

// FAQ 항목을 나타내는 타입
export type FAQItem = {
    id: number; // FAQ 항목의 고유 ID
    question: string; // FAQ 질문
    content: string; // FAQ 답변
};

// Contact 페이지의 콘텐츠를 나타내는 타입
export type Content = {
    faq: FAQItem[]; // FAQ 항목 리스트
};