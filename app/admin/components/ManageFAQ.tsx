// app/admin/components/ManageFAQ.tsx

// React와 상태 관리 훅 임포트
import { useState } from "react";
// React Quill을 동적 임포트 (SSR 비활성화, 성능 최적화를 위해)
import dynamic from "next/dynamic";
// UI 컴포넌트 임포트 (버튼과 입력 필드 렌더링에 사용)
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
// FAQItem 타입 정의 임포트 (FAQ 데이터 구조 정의)
import { FAQItem } from "@/lib/types";
// 상태 업데이트를 지연시키기 위한 디바운싱 유틸리티 임포트
import debounce from "lodash/debounce";

// React Quill을 동적 임포트 (서버사이드 렌더링 비활성화)
const ReactQuill = dynamic(() => import("react-quill"), { ssr: false });
import "react-quill/dist/quill.snow.css";

// React Quill 에디터의 툴바 설정 (텍스트 스타일링 옵션 정의)
const quillModules = {
  toolbar: [
    [{ header: [1, 2, false] }],
    ["bold", "italic", "underline", "strike"],
    [{ list: "ordered" }, { list: "bullet" }],
    ["link"],
    ["clean"],
  ],
};

// ManageFAQ 컴포넌트의 Props 타입 정의
interface ManageFAQProps {
  faqItems: FAQItem[]; // 현재 FAQ 항목 배열
  setFaqItems: (items: FAQItem[]) => void; // FAQ 항목 배열을 업데이트하는 함수
  upsertFAQItem: (id: number | null, question: string, content: string) => Promise<FAQItem[]>; // FAQ 항목을 추가하거나 업데이트하는 함수
  deleteFAQItem: (id: number) => Promise<void>; // FAQ 항목을 삭제하는 함수
  getFAQItems: () => Promise<FAQItem[]>; // FAQ 항목을 가져오는 함수
}

// ManageFAQ 컴포넌트: FAQ 항목을 관리하는 UI와 로직을 처리
export default function ManageFAQ({
  faqItems,
  setFaqItems,
  upsertFAQItem,
  deleteFAQItem,
  getFAQItems,
}: ManageFAQProps) {
  // 선택된 FAQ 질문 상태 (초기값: 첫 번째 FAQ 질문 또는 null)
  const [selectedQuestion, setSelectedQuestion] = useState<string | null>(faqItems[0]?.question || null);
  // 편집 중인 FAQ 항목 상태 (초기값: null)
  const [editFAQItem, setEditFAQItem] = useState<FAQItem | null>(null);
  // FAQ 추가 폼 표시 여부 상태
  const [showAddForm, setShowAddForm] = useState(false);
  // 새 FAQ 질문 입력 상태
  const [newQuestion, setNewQuestion] = useState("");
  // 새 FAQ 답변 입력 상태
  const [newAnswer, setNewAnswer] = useState("");

  // FAQ 항목 편집 상태를 디바운싱하여 업데이트 (입력 지연으로 성능 최적화)
  const debouncedSetEditFAQItem = debounce((newFAQItem: FAQItem) => {
    setEditFAQItem(newFAQItem);
  }, 300);

  // 새 FAQ 답변 상태를 디바운싱하여 업데이트 (입력 지연으로 성능 최적화)
  const debouncedSetNewAnswer = debounce((value: string) => {
    setNewAnswer(value);
  }, 300);

  // FAQ 항목 추가 핸들러: 새로운 FAQ 항목을 추가
  const handleAddFAQ = async () => {
    if (!newQuestion || !newAnswer) {
      alert("Please fill in both question and answer."); // 질문과 답변이 비어 있으면 경고
      return;
    }
    try {
      // Supabase에 새 FAQ 항목 추가 (id는 null로 설정하여 새 항목 생성)
      const newItem = await upsertFAQItem(null, newQuestion, newAnswer);
      setFaqItems([...faqItems, newItem[0]]); // 로컬 상태에 새 항목 추가
      setNewQuestion(""); // 질문 입력 초기화
      setNewAnswer(""); // 답변 입력 초기화
      setShowAddForm(false); // 추가 폼 닫기
      setSelectedQuestion(newQuestion); // 새로 추가된 질문을 선택
      alert("FAQ item added!"); // 성공 알림
      const faqData = await getFAQItems(); // 최신 FAQ 데이터 가져오기
      setFaqItems(faqData); // 로컬 상태 업데이트
    } catch (error: unknown) {
      // 에러 처리: 추가 실패 시 사용자에게 알림
      if (error && typeof error === "object" && "message" in error) {
        console.error("Failed to add FAQ item:", error);
        alert(`Failed to add FAQ item: ${(error as { message: string }).message}`);
      } else if (error instanceof Error) {
        console.error("Failed to add FAQ item:", error);
        alert("Failed to add FAQ item: " + error.message);
      } else {
        console.error("Unknown error:", error);
        alert("Failed to add FAQ item: Unknown error");
      }
      const faqData = await getFAQItems(); // 에러 발생 시에도 최신 데이터 동기화
      setFaqItems(faqData);
    }
  };

  // FAQ 항목 저장 핸들러: 편집된 FAQ 항목을 저장
  const handleSaveFAQ = async () => {
    if (!editFAQItem) return; // 편집 중인 FAQ 항목이 없으면 종료
    try {
      console.log("Saving FAQ item:", editFAQItem);
      // Supabase에 FAQ 항목 업데이트
      const updatedItem = await upsertFAQItem(
        editFAQItem.id,
        editFAQItem.question,
        editFAQItem.content
      );
      setFaqItems(
        faqItems.map((item) => (item.id === updatedItem[0].id ? updatedItem[0] : item))
      ); // 로컬 상태에서 해당 항목 업데이트
      setEditFAQItem(null); // 편집 상태 초기화
      alert("FAQ item updated!"); // 성공 알림
      const faqData = await getFAQItems(); // 최신 FAQ 데이터 가져오기
      setFaqItems(faqData); // 로컬 상태 업데이트
    } catch (error: unknown) {
      // 에러 처리: 저장 실패 시 사용자에게 알림
      if (error && typeof error === "object" && "message" in error) {
        console.error("Failed to update FAQ item:", error);
        alert(`Failed to update FAQ item: ${(error as { message: string }).message}`);
      } else if (error instanceof Error) {
        console.error("Failed to update FAQ item:", error);
        alert("Failed to update FAQ item: " + error.message);
      } else {
        console.error("Unknown error:", error);
        alert("Failed to update FAQ item: Unknown error");
      }
      const faqData = await getFAQItems(); // 에러 발생 시에도 최신 데이터 동기화
      setFaqItems(faqData);
    }
  };

  // FAQ 항목 삭제 핸들러: 특정 FAQ 항목을 삭제
  const handleDeleteFAQ = async (question: string) => {
    try {
      if (editFAQItem) return; // 편집 중에는 삭제 불가
      const itemToDelete = faqItems.find(item => item.question === question);
      if (!itemToDelete) return; // 삭제할 항목이 없으면 종료
      await deleteFAQItem(itemToDelete.id); // Supabase에서 FAQ 항목 삭제
      setFaqItems(faqItems.filter((item) => item.id !== itemToDelete.id)); // 로컬 상태에서 항목 제거
      setSelectedQuestion(null); // 선택된 질문 초기화
      alert("FAQ item deleted!"); // 성공 알림
      const faqData = await getFAQItems(); // 최신 FAQ 데이터 가져오기
      setFaqItems(faqData); // 로컬 상태 업데이트
      if (faqData.length > 0) {
        setSelectedQuestion(faqData[0].question); // 첫 번째 질문을 선택
      }
    } catch (error: unknown) {
      // 에러 처리: 삭제 실패 시 사용자에게 알림
      if (error && typeof error === "object" && "message" in error) {
        console.error("Failed to delete FAQ item:", error);
        alert(`Failed to delete FAQ item: ${(error as { message: string }).message}`);
      } else if (error instanceof Error) {
        console.error("Failed to delete FAQ item:", error);
        alert("Failed to delete FAQ item: " + error.message);
      } else {
        console.error("Unknown error:", error);
        alert("Failed to delete FAQ item: Unknown error");
      }
      const faqData = await getFAQItems(); // 에러 발생 시에도 최신 데이터 동기화
      setFaqItems(faqData);
    }
  };

  // UI 렌더링
  return (
    <section className="mb-12 p-6 border rounded-lg w-[1200px]">
      <h2 className="text-2xl font-semibold text-gray-800 mb-4">Manage FAQ</h2>
      <div className="flex space-x-6">
        {/* 1열: 질문 목록 */}
        <div className="w-1/4">
          {/* 새 FAQ 항목 추가 버튼 */}
          <Button
            onClick={() => {
              setShowAddForm(true);
              setEditFAQItem(null); // 편집 모드 해제
              setSelectedQuestion(null); // 선택된 질문 초기화
            }}
            className="bg-[#0F4C81] hover:bg-[#1A5A96] mb-4 w-full"
          >
            Add Content
          </Button>
          {faqItems.length > 0 ? (
            faqItems.map((item) => (
              <div
                key={item.id}
                className={`p-2 cursor-pointer rounded-lg ${
                  selectedQuestion === item.question
                    ? "bg-[#0F4C81] text-white"
                    : "bg-gray-200 text-gray-800 hover:bg-gray-300"
                } mb-2`}
                onClick={() => {
                  setSelectedQuestion(item.question);
                  setEditFAQItem(null);
                  setShowAddForm(false); // 추가 폼 닫기
                }}
              >
                {item.question}
              </div>
            ))
          ) : (
            <p className="text-gray-600">No FAQ items available.</p>
          )}
        </div>

        {/* 2열: 선택된 질문의 답변 또는 추가/편집 폼 */}
        <div className="w-3/4">
          {showAddForm ? (
            // 추가 폼 표시
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Add New FAQ</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Question</label>
                  <Input
                    value={newQuestion}
                    onChange={(e) => setNewQuestion(e.target.value)}
                    placeholder="Enter question"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Answer</label>
                  <ReactQuill
                    value={newAnswer}
                    onChange={(value) => debouncedSetNewAnswer(value)}
                    modules={quillModules}
                    className="bg-white"
                  />
                </div>
                <div className="space-x-2">
                  {/* 추가 버튼: 새 FAQ 항목 추가 */}
                  <Button onClick={handleAddFAQ} className="bg-[#0F4C81] hover:bg-[#1A5A96]">
                    Add FAQ
                  </Button>
                  {/* 취소 버튼: 추가 폼 닫기 */}
                  <Button variant="outline" onClick={() => setShowAddForm(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          ) : selectedQuestion && faqItems.find(item => item.question === selectedQuestion) ? (
            // 선택된 질문의 답변 또는 편집 폼 표시
            (() => {
              const selectedItem = faqItems.find(item => item.question === selectedQuestion)!;
              return (
                <div>
                  {editFAQItem ? (
                    <>
                      {/* 질문 편집 입력 */}
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700">Question</label>
                        <Input
                          value={editFAQItem.question}
                          onChange={(e) =>
                            setEditFAQItem({ ...editFAQItem, question: e.target.value })
                          }
                          className="mb-2"
                        />
                      </div>
                      {/* 답변 편집 (React Quill 에디터 사용) */}
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700">Answer</label>
                        <ReactQuill
                          value={editFAQItem.content}
                          onChange={(value) => debouncedSetEditFAQItem({ ...editFAQItem, content: value })}
                          modules={quillModules}
                          className="bg-white"
                        />
                      </div>
                      <div className="space-x-2">
                        {/* 저장 버튼: 변경사항 저장 */}
                        <Button onClick={handleSaveFAQ} className="bg-[#0F4C81] hover:bg-[#1A5A96]">
                          Save Changes
                        </Button>
                        {/* 취소 버튼: 편집 취소 */}
                        <Button variant="outline" onClick={() => setEditFAQItem(null)}>
                          Cancel
                        </Button>
                      </div>
                    </>
                  ) : (
                    <>
                      <h3 className="text-lg font-semibold text-gray-800">{selectedItem.question}</h3>
                      {/* 답변 표시 (HTML 콘텐츠로 렌더링) */}
                      <div
                        className="text-gray-600 mt-2"
                        dangerouslySetInnerHTML={{ __html: selectedItem.content }}
                      />
                      <div className="space-x-2 mt-4">
                        {/* 편집 버튼: 편집 모드로 전환 */}
                        <Button
                          variant="outline"
                          onClick={() => setEditFAQItem(selectedItem)}
                        >
                          Edit
                        </Button>
                        {/* 삭제 버튼: FAQ 항목 삭제 */}
                        <Button
                          variant="destructive"
                          onClick={() => handleDeleteFAQ(selectedItem.question)}
                        >
                          Delete
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              );
            })()
          ) : (
            <p className="text-gray-600">Select a question to view answer.</p>
          )}
        </div>
      </div>
    </section>
  );
}