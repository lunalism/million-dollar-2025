// lib/types.ts

// 픽셀 데이터를 나타내는 타입
export type Pixel = {
    x: number;
    y: number;
    width: number;
    height: number;
    owner: string;
    content: string;
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

// About 페이지의 콘텐츠를 나타내는 타입
export type AboutContent = {
    whyStarted: string; // "Why We Started This" 섹션의 내용
    vision: string; // "Our Vision" 섹션의 내용
    howHelp: string; // "How You Can Help" 섹션의 내용
};

// FAQ 항목을 나타내는 타입
export type FAQItem = {
    question: string; // FAQ 질문
    answer: string; // FAQ 답변
};

// Contact 페이지의 콘텐츠를 나타내는 타입
export type Content = {
    about: AboutContent; // About 페이지 콘텐츠
    faq: FAQItem[]; // FAQ 항목 리스트
};