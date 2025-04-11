// lib/types.ts

// 픽셀 데이터를 나타내는 타입
export type Pixel = {
    x: number; // 픽셀의 x 좌표
    y: number; // 픽셀의 y 좌표
    size: number; // 픽셀 블록의 크기 (예: 10은 10×10 블록)
    owner: string; // 픽셀 블록의 소유자 이름
    content: string; // 픽셀 블록에 표시할 콘텐츠 URL (이미지 또는 비디오)
    purchaseType: "basic" | "premium"; // 구매 타입: Basic 또는 Premium
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