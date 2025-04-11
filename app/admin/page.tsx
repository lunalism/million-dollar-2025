// app/admin/page.tsx

"use client";

// 필요한 모듈 임포트
import { useState, useEffect } from "react"; // React 훅
import { useRouter } from "next/navigation"; // 라우팅을 위한 훅
import { getPixels, savePixels, getContent, saveContent } from "@/lib/api"; // API 함수
import { Button } from "@/components/ui/button"; // 버튼 컴포넌트
import { Input } from "@/components/ui/input"; // 입력 필드 컴포넌트
import { Textarea } from "@/components/ui/textarea"; // 텍스트 영역 컴포넌트
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"; // 테이블 컴포넌트
import { Pixel, AboutContent, FAQItem, Content } from "@/lib/types"; // 타입 정의

// Admin 페이지 컴포넌트
export default function Admin() {
  // 라우터 객체 생성
  const router = useRouter();

  // 상태 정의
  const [isAuthenticated, setIsAuthenticated] = useState(false); // 인증 여부 상태
  const [password, setPassword] = useState(""); // 비밀번호 입력 상태
  const [pixels, setPixels] = useState<Pixel[]>([]); // 픽셀 데이터 상태
  const [content, setContent] = useState<Content | null>(null); // 콘텐츠 데이터 상태
  const [editPixel, setEditPixel] = useState<Pixel | null>(null); // 수정 중인 픽셀 상태
  const [editAbout, setEditAbout] = useState<AboutContent>({
    whyStarted: "",
    vision: "",
    howHelp: "",
  }); // 수정 중인 About 콘텐츠 상태
  const [editFAQ, setEditFAQ] = useState<FAQItem[]>([]); // 수정 중인 FAQ 상태

  // 데이터 로드
  useEffect(() => {
    const loadData = async () => {
      // API에서 픽셀 데이터 가져오기
      const pixelData: Pixel[] = await getPixels();
      // API에서 콘텐츠 데이터 가져오기
      const contentData = await getContent();
      // API 응답이 string일 경우 Content 타입으로 캐스팅 (임시 해결)
      // TODO: /api/content 엔드포인트가 실제로 Content 타입 데이터를 반환하도록 수정 필요
      const parsedContentData = typeof contentData === "string" ? JSON.parse(contentData) as Content : contentData;
      // 상태 업데이트
      setPixels(pixelData);
      setContent(parsedContentData);
      setEditAbout(parsedContentData.about);
      setEditFAQ(parsedContentData.faq);
    };
    loadData();
  }, []); // 컴포넌트 마운트 시 실행

  // 비밀번호 인증 핸들러
  const handleAuth = () => {
    // 비밀번호가 올바른지 확인
    if (password === "Chlqudwls1379!@") {
      setIsAuthenticated(true); // 인증 성공
    } else {
      alert("Incorrect password"); // 인증 실패 시 알림
    }
  };

  // 픽셀 수정 핸들러
  const handleEditPixel = (pixel: Pixel) => {
    // 수정할 픽셀 설정
    setEditPixel({ ...pixel });
  };

  // 픽셀 저장 핸들러
  const handleSavePixel = async () => {
    if (!editPixel) return; // 수정 중인 픽셀이 없으면 종료
    // 수정된 픽셀로 픽셀 리스트 업데이트
    const updatedPixels = pixels.map((p) =>
      p.x === editPixel.x && p.y === editPixel.y ? editPixel : p
    );
    // API에 저장
    await savePixels(updatedPixels);
    // 상태 업데이트
    setPixels(updatedPixels);
    setEditPixel(null); // 수정 완료 후 초기화
  };

  // 픽셀 삭제 핸들러
  const handleDeletePixel = async (x: number, y: number) => {
    // 지정된 좌표의 픽셀 제거
    const updatedPixels = pixels.filter((p) => !(p.x === x && p.y === y));
    // API에 저장
    await savePixels(updatedPixels);
    // 상태 업데이트
    setPixels(updatedPixels);
  };

  // About 내용 저장 핸들러
  const handleSaveAbout = async () => {
    if (!content) return; // 콘텐츠 데이터가 없으면 종료
    // 수정된 About 콘텐츠로 콘텐츠 데이터 업데이트
    const updatedContent: Content = { ...content, about: editAbout };
    // API에 저장 (수정: saveContent가 Content 타입 인자를 처리하도록 변경됨)
    await saveContent(updatedContent);
    // 상태 업데이트
    setContent(updatedContent);
    alert("About content updated!"); // 저장 완료 알림
  };

  // FAQ 저장 핸들러
  const handleSaveFAQ = async () => {
    if (!content) return; // 콘텐츠 데이터가 없으면 종료
    // 수정된 FAQ로 콘텐츠 데이터 업데이트
    const updatedContent: Content = { ...content, faq: editFAQ };
    // API에 저장 (수정: saveContent가 Content 타입 인자를 처리하도록 변경됨)
    await saveContent(updatedContent);
    // 상태 업데이트
    setContent(updatedContent);
    alert("FAQ updated!"); // 저장 완료 알림
  };

  // 인증되지 않은 경우 로그인 화면 표시
  if (!isAuthenticated) {
    return (
      // 로그인 화면 레이아웃: 화면 중앙 정렬
      <div className="min-h-screen bg-white flex items-center justify-center">
        {/* 로그인 폼 컨테이너: 최대 너비 md, 패딩 6, 테두리, 그림자 */}
        <div className="max-w-md w-full p-6 border rounded-lg shadow-lg">
          {/* 제목 */}
          <h2 className="text-2xl font-semibold text-gray-800 mb-4 text-center">
            Admin Login
          </h2>
          {/* 비밀번호 입력 필드 */}
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)} // 비밀번호 입력값 업데이트
            placeholder="Enter password"
            className="mb-4"
          />
          {/* 로그인 버튼 */}
          <Button onClick={handleAuth} className="w-full bg-blue-600 hover:bg-blue-700">
            Login
          </Button>
        </div>
      </div>
    );
  }

  // 인증된 경우 관리자 대시보드 표시
  return (
    // 메인 레이아웃: 최소 높이 화면 전체, 배경 흰색, 세로 방향 플렉스, 상하 패딩 8
    <div className="min-h-screen bg-white flex flex-col py-8">
      {/* 콘텐츠 컨테이너: 최대 너비 7xl, 중앙 정렬, 좌우 패딩 4 */}
      <div className="max-w-7xl mx-auto px-4">
        {/* 페이지 제목 */}
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Admin Dashboard</h1>

        {/* 픽셀 관리 섹션 */}
        <section className="mb-12">
          {/* 섹션 제목 */}
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Manage Pixels</h2>
          {/* 픽셀 데이터 테이블 */}
          <Table>
            {/* 테이블 헤더 */}
            <TableHeader>
              <TableRow>
                <TableHead>Position</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Content</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            {/* 테이블 본문 */}
            <TableBody>
              {pixels.map((pixel) => (
                <TableRow key={`${pixel.x}-${pixel.y}`}>
                  <TableCell>({pixel.x}, {pixel.y})</TableCell>
                  <TableCell>{pixel.owner}</TableCell>
                  <TableCell>{pixel.content || "N/A"}</TableCell>
                  <TableCell>{pixel.purchaseType}</TableCell>
                  <TableCell>
                    {/* 수정 버튼 */}
                    <Button
                      variant="outline"
                      className="mr-2"
                      onClick={() => handleEditPixel(pixel)}
                    >
                      Edit
                    </Button>
                    {/* 삭제 버튼 */}
                    <Button
                      variant="destructive"
                      onClick={() => handleDeletePixel(pixel.x, pixel.y)}
                    >
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </section>

        {/* 픽셀 수정 폼 */}
        {editPixel && (
          <section className="mb-12 p-6 border rounded-lg">
            {/* 섹션 제목 */}
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Edit Pixel</h2>
            {/* 수정 폼 */}
            <div className="space-y-4">
              {/* 소유자 입력 필드 */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Owner</label>
                <Input
                  value={editPixel.owner}
                  onChange={(e) => setEditPixel({ ...editPixel, owner: e.target.value })} // 소유자 업데이트
                />
              </div>
              {/* 콘텐츠 URL 입력 필드 */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Content URL</label>
                <Input
                  value={editPixel.content}
                  onChange={(e) => setEditPixel({ ...editPixel, content: e.target.value })} // 콘텐츠 URL 업데이트
                />
              </div>
              {/* 구매 타입 입력 필드 */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Type</label>
                <Input
                  value={editPixel.purchaseType}
                  onChange={(e) =>
                    setEditPixel({
                      ...editPixel,
                      purchaseType: e.target.value as "basic" | "premium", // 구매 타입 업데이트
                    })
                  }
                />
              </div>
              {/* 저장 버튼 */}
              <Button onClick={handleSavePixel} className="bg-blue-600 hover:bg-blue-700">
                Save Changes
              </Button>
            </div>
          </section>
        )}

        {/* About 내용 수정 섹션 */}
        <section className="mb-12 p-6 border rounded-lg">
          {/* 섹션 제목 */}
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Edit About Page</h2>
          {/* 수정 폼 */}
          <div className="space-y-4">
            {/* Why We Started This 입력 필드 */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Why We Started This</label>
              <Textarea
                value={editAbout.whyStarted}
                onChange={(e) => setEditAbout({ ...editAbout, whyStarted: e.target.value })} // Why We Started This 업데이트
                rows={4}
              />
            </div>
            {/* Our Vision 입력 필드 */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Our Vision</label>
              <Textarea
                value={editAbout.vision}
                onChange={(e) => setEditAbout({ ...editAbout, vision: e.target.value })} // Our Vision 업데이트
                rows={4}
              />
            </div>
            {/* How You Can Help 입력 필드 */}
            <div>
              <label className="block text-sm font-medium text-gray-700">How You Can Help</label>
              <Textarea
                value={editAbout.howHelp}
                onChange={(e) => setEditAbout({ ...editAbout, howHelp: e.target.value })} // How You Can Help 업데이트
                rows={4}
              />
            </div>
            {/* 저장 버튼 */}
            <Button onClick={handleSaveAbout} className="bg-blue-600 hover:bg-blue-700">
              Save About Changes
            </Button>
          </div>
        </section>

        {/* FAQ 수정 섹션 */}
        <section className="mb-12 p-6 border rounded-lg">
          {/* 섹션 제목 */}
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Edit FAQ</h2>
          {/* FAQ 항목 수정 폼 */}
          {editFAQ.map((item, index) => (
            <div key={index} className="space-y-4 mb-4 p-4 border rounded-lg">
              {/* 질문 입력 필드 */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Question</label>
                <Input
                  value={item.question}
                  onChange={(e) => {
                    const newFAQ = [...editFAQ];
                    newFAQ[index] = { ...newFAQ[index], question: e.target.value }; // 질문 업데이트
                    setEditFAQ(newFAQ);
                  }}
                />
              </div>
              {/* 답변 입력 필드 */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Answer</label>
                <Textarea
                  value={item.answer}
                  onChange={(e) => {
                    const newFAQ = [...editFAQ];
                    newFAQ[index] = { ...newFAQ[index], answer: e.target.value }; // 답변 업데이트
                    setEditFAQ(newFAQ);
                  }}
                  rows={3}
                />
              </div>
            </div>
          ))}
          {/* 저장 버튼 */}
          <Button onClick={handleSaveFAQ} className="bg-blue-600 hover:bg-blue-700">
            Save FAQ Changes
          </Button>
        </section>
      </div>
    </div>
  );
}