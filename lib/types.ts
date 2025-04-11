export type Pixel = {
    x: number;
    y: number;
    size: number;
    owner: string;
    content: string;
    purchaseType: "basic" | "premium";
};

export type AboutContent = {
    whyStarted: string;
    vision: string;
    howHelp: string;
};

export type FAQItem = {
    question: string;
    answer: string;
};

export type Content = {
    about: AboutContent;
    faq: FAQItem[];
};