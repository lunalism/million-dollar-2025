// app/admin/components/ManageAbout.tsx

// React와 상태 관리 훅 임포트
import { useState } from "react";
// Supabase 클라이언트 타입 임포트 (Supabase와의 통신을 위해 사용)
import { SupabaseClient } from "@supabase/supabase-js";
// React Quill을 동적 임포트 (SSR 비활성화, 성능 최적화를 위해)
import dynamic from "next/dynamic";
// UI 컴포넌트 임포트 (버튼과 입력 필드 렌더링에 사용)
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
// AboutItem 타입 정의 임포트 (About 데이터 구조 정의)
import { AboutItem } from "@/lib/types";
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

// ManageAbout 컴포넌트의 Props 타입 정의
interface ManageAboutProps {
  editAboutItems: AboutItem[]; // 현재 About 항목 배열
  setEditAboutItems: (items: AboutItem[]) => void; // About 항목 배열을 업데이트하는 함수
  updateAboutContent: (oldCategory: string, newCategory: string, newTitle: string, content: string) => Promise<void>; // About 항목을 업데이트하는 함수
  supabase: SupabaseClient; // Supabase 클라이언트 인스턴스 (데이터베이스 작업에 사용)
}

// ManageAbout 컴포넌트: About 항목을 관리하는 UI와 로직을 처리
export default function ManageAbout({
  editAboutItems,
  setEditAboutItems,
  updateAboutContent,
  supabase,
}: ManageAboutProps) {
  // 선택된 카테고리 상태 (초기값: 첫 번째 About 항목의 카테고리 또는 null)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(editAboutItems[0]?.category || null);
  // 편집 중인 About 항목 상태 (초기값: null)
  const [editAboutItem, setEditAboutItem] = useState<AboutItem | null>(null);
  // About 추가 폼 표시 여부 상태
  const [showAddForm, setShowAddForm] = useState(false);
  // 새 About 카테고리 입력 상태
  const [newCategory, setNewCategory] = useState("");
  // 새 About 제목 입력 상태
  const [newTitle, setNewTitle] = useState("");
  // 새 About 내용 입력 상태
  const [newContent, setNewContent] = useState("");

  // About 항목 편집 상태를 디바운싱하여 업데이트 (입력 지연으로 성능 최적화)
  const debouncedSetEditAboutItem = debounce((newAboutItem: AboutItem) => {
    setEditAboutItem(newAboutItem);
  }, 300);

  // 새 About 내용 상태를 디바운싱하여 업데이트 (입력 지연으로 성능 최적화)
  const debouncedSetNewContent = debounce((value: string) => {
    setNewContent(value);
  }, 300);

  // About 항목 저장 핸들러: 편집된 About 항목을 저장
  const handleSaveAbout = async () => {
    if (!editAboutItem) return; // 편집 중인 About 항목이 없으면 종료
    try {
      console.log("Saving About item:", editAboutItem);
      // Supabase에 About 항목 업데이트
      await updateAboutContent(
        editAboutItem.category,
        editAboutItem.category,
        editAboutItem.title,
        editAboutItem.content
      );
      setEditAboutItems(
        editAboutItems.map((item) =>
          item.id === editAboutItem.id ? editAboutItem : item
        )
      ); // 로컬 상태에서 해당 항목 업데이트
      setEditAboutItem(null); // 편집 상태 초기화
      alert("About item updated!"); // 성공 알림
      const contentData = await supabase.from("about").select("*"); // 최신 About 데이터 가져오기
      setEditAboutItems(contentData.data || []); // 로컬 상태 업데이트
    } catch (error: unknown) {
      // 에러 처리: 저장 실패 시 사용자에게 알림
      console.error("Failed to update About item:", error);
      if (error && typeof error === "object" && "message" in error) {
        alert(`Failed to update About item: ${(error as { message: string }).message}`);
      } else if (error instanceof Error) {
        alert(`Failed to update About item: ${error.message}`);
      } else {
        alert("Failed to update About item: An unexpected error occurred");
      }
      const contentData = await supabase.from("about").select("*"); // 에러 발생 시에도 최신 데이터 동기화
      setEditAboutItems(contentData.data || []);
    }
  };

  // About 항목 삭제 핸들러: 특정 About 항목을 삭제
  const handleDeleteAbout = async (category: string) => {
    try {
      await supabase.from("about").delete().eq("category", category); // Supabase에서 About 항목 삭제
      setEditAboutItems(editAboutItems.filter((item) => item.category !== category)); // 로컬 상태에서 항목 제거
      setSelectedCategory(null); // 선택된 카테고리 초기화
      alert("About item deleted!"); // 성공 알림
      const contentData = await supabase.from("about").select("*"); // 최신 About 데이터 가져오기
      setEditAboutItems(contentData.data || []); // 로컬 상태 업데이트
      if (contentData.data && contentData.data.length > 0) {
        setSelectedCategory(contentData.data[0].category); // 첫 번째 카테고리를 선택
      }
    } catch (error: unknown) {
      // 에러 처리: 삭제 실패 시 사용자에게 알림
      if (error && typeof error === "object" && "message" in error) {
        console.error("Failed to delete About item:", error);
        alert(`Failed to delete About item: ${(error as { message: string }).message}`);
      } else if (error instanceof Error) {
        console.error("Failed to delete About item:", error);
        alert("Failed to delete About item: " + error.message);
      } else {
        console.error("Unknown error:", error);
        alert("Failed to delete About item: Unknown error");
      }
      const contentData = await supabase.from("about").select("*"); // 에러 발생 시에도 최신 데이터 동기화
      setEditAboutItems(contentData.data || []);
    }
  };

  // About 항목 추가 핸들러: 새로운 About 항목을 추가
  const handleAddAbout = async () => {
    if (!newCategory || !newContent || !newTitle) {
      alert("Please fill in category, title, and content."); // 카테고리, 제목, 내용이 비어 있으면 경고
      return;
    }
    try {
      // Supabase에 새 About 항목 추가
      await updateAboutContent(newCategory, newCategory, newTitle, newContent);
      setEditAboutItems([...editAboutItems, { id: crypto.randomUUID(), category: newCategory, title: newTitle, content: newContent }]); // 로컬 상태에 새 항목 추가
      setNewCategory(""); // 카테고리 입력 초기화
      setNewTitle(""); // 제목 입력 초기화
      setNewContent(""); // 내용 입력 초기화
      setShowAddForm(false); // 추가 폼 닫기
      setSelectedCategory(newCategory); // 새로 추가된 카테고리를 선택
      alert("About item added!"); // 성공 알림
      const contentData = await supabase.from("about").select("*"); // 최신 About 데이터 가져오기
      setEditAboutItems(contentData.data || []); // 로컬 상태 업데이트
    } catch (error: unknown) {
      // 에러 처리: 추가 실패 시 사용자에게 알림
      if (error && typeof error === "object" && "message" in error) {
        console.error("Failed to add About item:", error);
        alert(`Failed to add About item: ${(error as { message: string }).message}`);
      } else if (error instanceof Error) {
        console.error("Failed to add About item:", error);
        alert("Failed to add About item: " + error.message);
      } else {
        console.error("Unknown error:", error);
        alert("Failed to add About item: Unknown error");
      }
      const contentData = await supabase.from("about").select("*"); // 에러 발생 시에도 최신 데이터 동기화
      setEditAboutItems(contentData.data || []);
    }
  };

  // UI 렌더링
  return (
    <section className="mb-12 p-6 border rounded-lg w-[1200px]">
      <h2 className="text-2xl font-semibold text-gray-800 mb-4">Manage About</h2>
      <div className="flex space-x-6">
        {/* 1열: 카테고리 목록 */}
        <div className="w-1/4">
          {/* 새 About 항목 추가 버튼 */}
          <Button
            onClick={() => {
              setShowAddForm(true);
              setEditAboutItem(null); // 편집 모드 해제
              setSelectedCategory(null); // 선택된 카테고리 초기화
            }}
            className="bg-[#0F4C81] hover:bg-[#1A5A96] mb-4 w-full"
          >
            Add Content
          </Button>
          {editAboutItems.length > 0 ? (
            editAboutItems.map((item) => (
              <div
                key={item.category}
                className={`p-2 cursor-pointer rounded-lg ${
                  selectedCategory === item.category
                    ? "bg-[#0F4C81] text-white"
                    : "bg-gray-200 text-gray-800 hover:bg-gray-300"
                } mb-2`}
                onClick={() => {
                  setSelectedCategory(item.category);
                  setEditAboutItem(null);
                  setShowAddForm(false); // 추가 폼 닫기
                }}
              >
                {item.category}
              </div>
            ))
          ) : (
            <p className="text-gray-600">No About items available.</p>
          )}
        </div>

        {/* 2열: 선택된 카테고리의 컨텐츠 또는 추가/편집 폼 */}
        <div className="w-3/4">
          {showAddForm ? (
            // 추가 폼 표시
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Add New About Item</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Category</label>
                  <Input
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    placeholder="Enter category"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Title</label>
                  <Input
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="Enter title"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Content</label>
                  <ReactQuill
                    value={newContent}
                    onChange={(value) => debouncedSetNewContent(value)}
                    modules={quillModules}
                    className="bg-white"
                  />
                </div>
                <div className="space-x-2">
                  {/* 추가 버튼: 새 About 항목 추가 */}
                  <Button onClick={handleAddAbout} className="bg-[#0F4C81] hover:bg-[#1A5A96]">
                    Add About Item
                  </Button>
                  {/* 취소 버튼: 추가 폼 닫기 */}
                  <Button variant="outline" onClick={() => setShowAddForm(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          ) : selectedCategory && editAboutItems.find(item => item.category === selectedCategory) ? (
            // 선택된 카테고리 컨텐츠 또는 편집 폼 표시
            (() => {
              const selectedItem = editAboutItems.find(item => item.category === selectedCategory)!;
              return (
                <div>
                  {editAboutItem ? (
                    <>
                      {/* 카테고리 편집 입력 */}
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700">Category</label>
                        <Input
                          value={editAboutItem.category}
                          onChange={(e) =>
                            setEditAboutItem({ ...editAboutItem, category: e.target.value })
                          }
                          className="mb-2"
                        />
                      </div>
                      {/* 제목 편집 입력 */}
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700">Title</label>
                        <Input
                          value={editAboutItem.title}
                          onChange={(e) =>
                            setEditAboutItem({ ...editAboutItem, title: e.target.value })
                          }
                          className="mb-2"
                        />
                      </div>
                      {/* 내용 편집 (React Quill 에디터 사용) */}
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700">Content</label>
                        <ReactQuill
                          value={editAboutItem.content}
                          onChange={(value) => debouncedSetEditAboutItem({ ...editAboutItem, content: value })}
                          modules={quillModules}
                          className="bg-white"
                        />
                      </div>
                      <div className="space-x-2">
                        {/* 저장 버튼: 변경사항 저장 */}
                        <Button onClick={handleSaveAbout} className="bg-[#0F4C81] hover:bg-[#1A5A96]">
                          Save Changes
                        </Button>
                        {/* 취소 버튼: 편집 취소 */}
                        <Button variant="outline" onClick={() => setEditAboutItem(null)}>
                          Cancel
                        </Button>
                      </div>
                    </>
                  ) : (
                    <>
                      <h3 className="text-lg font-semibold text-gray-800">{selectedItem.title}</h3>
                      <p className="text-gray-600 mt-1">Category: {selectedItem.category}</p>
                      {/* 내용 표시 (HTML 콘텐츠로 렌더링) */}
                      <div
                        className="text-gray-600 mt-2"
                        dangerouslySetInnerHTML={{ __html: selectedItem.content }}
                      />
                      <div className="space-x-2 mt-4">
                        {/* 편집 버튼: 편집 모드로 전환 */}
                        <Button
                          variant="outline"
                          onClick={() => setEditAboutItem(selectedItem)}
                        >
                          Edit
                        </Button>
                        {/* 삭제 버튼: About 항목 삭제 */}
                        <Button
                          variant="destructive"
                          onClick={() => handleDeleteAbout(selectedItem.category)}
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
            <p className="text-gray-600">Select a category to view content.</p>
          )}
        </div>
      </div>
    </section>
  );
}