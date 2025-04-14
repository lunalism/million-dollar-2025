// app/admin/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { getPixels, savePixels } from "@/lib/api";
import {
  supabase,
  getAboutContent,
  updateAboutContent,
  getFAQItems,
  upsertFAQItem,
  deleteFAQItem,
} from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Pixel } from "@/lib/types";
import debounce from "lodash/debounce";

// React Quill을 동적 임포트 (SSR 비활성화)
const ReactQuill = dynamic(() => import("react-quill"), {
  ssr: false,
});
import "react-quill/dist/quill.snow.css";

// React Quill 에디터 설정
const quillModules = {
  toolbar: [
    [{ header: [1, 2, false] }],
    ["bold", "italic", "underline", "strike"],
    [{ list: "ordered" }, { list: "bullet" }],
    ["link"],
    ["clean"],
  ],
};

// FAQ 항목 타입 정의
interface FAQItem {
  id: number;
  question: string;
  content: string;
}

// About 항목 타입 정의
interface AboutItem {
  category: string;
  content: string;
}

// Admin 페이지 컴포넌트
export default function Admin() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pixels, setPixels] = useState<Pixel[]>([]);
  const [editPixel, setEditPixel] = useState<Pixel | null>(null);
  const [editAboutItems, setEditAboutItems] = useState<AboutItem[]>([]);
  const [newAboutCategory, setNewAboutCategory] = useState("");
  const [newAboutContent, setNewAboutContent] = useState("");
  const [faqItems, setFaqItems] = useState<FAQItem[]>([]);
  const [editFAQItem, setEditFAQItem] = useState<FAQItem | null>(null);
  const [newFAQQuestion, setNewFAQQuestion] = useState("");
  const [newFAQAnswer, setNewFAQAnswer] = useState("");
  const [activeTab, setActiveTab] = useState("Manage Pixels");
  const [showAddAboutForm, setShowAddAboutForm] = useState(false); // About 추가 폼 표시 상태
  const [showAddFAQForm, setShowAddFAQForm] = useState(false); // FAQ 추가 폼 표시 상태

  // 디바운싱된 상태 업데이트 함수
  const debouncedSetNewAboutContent = debounce((value: string) => {
    setNewAboutContent(value);
  }, 300);

  const debouncedSetEditFAQItem = debounce((newFAQItem: FAQItem) => {
    setEditFAQItem(newFAQItem);
  }, 300);

  const debouncedSetNewFAQAnswer = debounce((value: string) => {
    setNewFAQAnswer(value);
  }, 300);

  // 로그인 상태 확인 및 데이터 로드
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', session.user.id)
          .single();

        if (error) {
          console.error("Error fetching user role:", error.message);
          router.push('/'); // 에러 발생 시 홈으로 리다이렉트
          return;
        }

        const userRole = data?.role;
        if (userRole === 'admin') {
          setIsAuthenticated(true);
          loadData();
        } else {
          router.push('/'); // 관리자가 아닌 경우 홈으로 리다이렉트
        }
      }
    };

    const loadData = async () => {
      const pixelData: Pixel[] = await getPixels();
      const contentData = await getAboutContent();
      const faqData = await getFAQItems();
      console.log("Loaded pixels:", pixelData);
      console.log("Loaded about content:", contentData);
      console.log("Loaded FAQ items:", faqData);
      setPixels(pixelData);
      setEditAboutItems(contentData.map(item => ({ category: item.category, content: item.content })));
      setFaqItems(faqData.map(item => ({ id: item.id, question: item.question, content: item.content })));
    };

    checkSession();
  }, [router]);

  // 로그인 핸들러
  const handleLogin = async () => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      alert("Login failed: " + error.message);
    } else {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert("Failed to retrieve user information.");
        await supabase.auth.signOut();
        return;
      }

      const { data, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      if (roleError) {
        console.error("Error fetching user role:", roleError.message);
        alert("Access denied: Unable to verify user role.");
        await supabase.auth.signOut();
        return;
      }

      const userRole = data?.role;
      if (userRole === 'admin') {
        setIsAuthenticated(true);
      } else {
        alert("Access denied: You are not an admin.");
        await supabase.auth.signOut();
      }
    }
  };

  // 픽셀 수정 핸들러
  const handleEditPixel = (pixel: Pixel) => {
    setEditPixel({ ...pixel });
  };

  // 픽셀 저장 핸들러
  const handleSavePixel = async () => {
    if (!editPixel) return;
    const updatedPixels = pixels.map((p) =>
      p.x === editPixel.x && p.y === editPixel.y ? editPixel : p
    );
    await savePixels(updatedPixels);
    setPixels(updatedPixels);
    setEditPixel(null);
  };

  // 픽셀 삭제 핸들러
  const handleDeletePixel = async (x: number, y: number) => {
    const updatedPixels = pixels.filter((p) => !(p.x === x && p.y === y));
    await savePixels(updatedPixels);
    setPixels(updatedPixels);
  };

  // About 항목 수정 핸들러
  const handleEditAbout = (index: number, field: 'category' | 'content', value: string) => {
    const updatedItems = [...editAboutItems];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    setEditAboutItems(updatedItems);
  };

  // About 내용 저장 핸들러
  const handleSaveAbout = async () => {
    try {
      console.log("Saving About items:", editAboutItems); // 디버깅 로그 추가
      for (const item of editAboutItems) {
        await updateAboutContent(item.category, item.category, item.content);
      }
      alert("About content updated!");
      // 데이터 저장 후 최신 데이터 로드
      const contentData = await getAboutContent();
      setEditAboutItems(contentData.map(item => ({ category: item.category, content: item.content })));
    } catch (error) {
      console.error("Failed to save about content:", error);
      alert("Failed to save about content: " + error);
    }
  };

  // About 항목 추가 핸들러
  const handleAddAbout = async () => {
    if (!newAboutCategory || !newAboutContent) {
      alert("Please fill in both category and content.");
      return;
    }
    try {
      await updateAboutContent(newAboutCategory, newAboutCategory, newAboutContent);
      setEditAboutItems([...editAboutItems, { category: newAboutCategory, content: newAboutContent }]);
      setNewAboutCategory("");
      setNewAboutContent("");
      setShowAddAboutForm(false); // 폼 닫기
      alert("About item added!");
    } catch (error) {
      console.error("Failed to add about item:", error);
      alert("Failed to add about item: " + error);
    }
  };

  // FAQ 항목 추가 핸들러
  const handleAddFAQ = async () => {
    if (!newFAQQuestion || !newFAQAnswer) {
      alert("Please fill in both question and answer.");
      return;
    }
    try {
      const newItem = await upsertFAQItem(null, newFAQQuestion, newFAQAnswer);
      setFaqItems([...faqItems, newItem[0]]);
      setNewFAQQuestion("");
      setNewFAQAnswer("");
      setShowAddFAQForm(false); // 폼 닫기
      alert("FAQ item added!");
    } catch (error) {
      console.error("Failed to add FAQ item:", error);
      alert("Failed to add FAQ item: " + error);
    }
  };

  // FAQ 항목 수정 시작 핸들러
  const handleEditFAQ = (item: FAQItem) => {
    setEditFAQItem({ ...item });
  };

  // FAQ 항목 저장 핸들러
  const handleSaveFAQ = async () => {
    if (!editFAQItem) return;
    try {
      console.log("Saving FAQ item:", editFAQItem); // 디버깅 로그 추가
      const updatedItem = await upsertFAQItem(
        editFAQItem.id,
        editFAQItem.question,
        editFAQItem.content // answer 대신 content 사용
      );
      setFaqItems(
        faqItems.map((item) => (item.id === updatedItem[0].id ? updatedItem[0] : item))
      );
      setEditFAQItem(null);
      alert("FAQ item updated!");
    } catch (error) {
      console.error("Failed to update FAQ item:", error);
      alert("Failed to update FAQ item: " + error);
    }
  };

  // FAQ 항목 삭제 핸들러
  const handleDeleteFAQ = async (id: number) => {
    try {
      await deleteFAQItem(id);
      setFaqItems(faqItems.filter((item) => item.id !== id));
      alert("FAQ item deleted!");
    } catch (error) {
      console.error("Failed to delete FAQ item:", error);
      alert("Failed to delete FAQ item: " + error);
    }
  };

  // 인증되지 않은 경우 로그인 화면 표시
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="max-w-md w-full p-6 border rounded-lg shadow-lg">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4 text-center">
            Admin Login
          </h2>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter email"
            className="mb-4"
          />
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password"
            className="mb-4"
          />
          <Button onClick={handleLogin} className="w-full bg-[#0F4C81] hover:bg-[#1A5A96]">
            Login
          </Button>
        </div>
      </div>
    );
  }

  // 인증된 경우 관리자 대시보드 표시
  return (
    <div className="min-h-screen bg-white flex flex-col py-8">
      <div className="max-w-7xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Admin Dashboard</h1>

        <div className="flex space-x-4 mb-8 overflow-x-auto">
          {["Manage Pixels", "Manage About", "Manage FAQ"].map((tab) => (
            <Button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg font-semibold transition-all duration-200 ${
                activeTab === tab
                  ? "bg-[#0F4C81] text-white"
                  : "bg-gray-200 text-gray-600 hover:bg-gray-300"
              }`}
            >
              {tab}
            </Button>
          ))}
        </div>

        <div className="w-full">
          {activeTab === "Manage Pixels" && (
            <>
              <section className="mb-12 w-[1200px]">
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">Manage Pixels</h2>
                <div className="overflow-x-auto">
                  <Table className="w-full">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-1/5">Position</TableHead>
                        <TableHead className="w-1/5">Owner</TableHead>
                        <TableHead className="w-2/5">Content</TableHead>
                        <TableHead className="w-1/5">Type</TableHead>
                        <TableHead className="w-1/5">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pixels.map((pixel) => (
                        <TableRow key={`${pixel.x}-${pixel.y}`}>
                          <TableCell>({pixel.x}, {pixel.y})</TableCell>
                          <TableCell>{pixel.owner}</TableCell>
                          <TableCell>{pixel.content || "N/A"}</TableCell>
                          <TableCell>{pixel.purchaseType}</TableCell>
                          <TableCell>
                            <Button style={{ width: "80px" }} variant="outline" className="mr-2" onClick={() => handleEditPixel(pixel)}>
                              Edit
                            </Button>
                            <Button style={{ width: "80px" }} variant="destructive" onClick={() => handleDeletePixel(pixel.x, pixel.y)}>
                              Delete
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </section>

              {editPixel && (
                <section className="mb-12 p-6 border rounded-lg w-[1200px]">
                  <h2 className="text-2xl font-semibold text-gray-800 mb-4">Edit Pixel</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Owner</label>
                      <Input
                        value={editPixel.owner}
                        onChange={(e) => setEditPixel({ ...editPixel, owner: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Content URL</label>
                      <Input
                        value={editPixel.content}
                        onChange={(e) => setEditPixel({ ...editPixel, content: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Type</label>
                      <Input
                        value={editPixel.purchaseType}
                        onChange={(e) =>
                          setEditPixel({
                            ...editPixel,
                            purchaseType: e.target.value as "basic" | "premium",
                          })
                        }
                      />
                    </div>
                    <Button onClick={handleSavePixel} className="bg-[#0F4C81] hover:bg-[#1A5A96]">
                      Save Changes
                    </Button>
                  </div>
                </section>
              )}
            </>
          )}

          {activeTab === "Manage About" && (
            <section className="mb-12 p-6 border rounded-lg w-[1200px]">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">Manage About</h2>
              <div className="space-y-4">
                {editAboutItems.length > 0 ? (
                  editAboutItems.map((item, index) => (
                    <div key={item.category}>
                      <label className="block text-sm font-medium text-gray-700">Category</label>
                      <Input
                        value={item.category}
                        onChange={(e) => handleEditAbout(index, 'category', e.target.value)}
                        className="mb-2"
                      />
                      <label className="block text-sm font-medium text-gray-700">Content</label>
                      <ReactQuill
                        value={item.content}
                        onChange={(value) => handleEditAbout(index, 'content', value)}
                        modules={quillModules}
                        className="bg-white mb-4"
                      />
                    </div>
                  ))
                ) : (
                  <p className="text-gray-600">No About items available.</p>
                )}
                <div className="flex space-x-2">
                  <Button onClick={handleSaveAbout} className="bg-[#0F4C81] hover:bg-[#1A5A96]">
                    Save About Changes
                  </Button>
                  <Button onClick={() => setShowAddAboutForm(true)} className="bg-[#0F4C81] hover:bg-[#1A5A96]">
                    Add Content
                  </Button>
                </div>
              </div>

              {showAddAboutForm && (
                <div className="space-y-4 mt-8 p-4 border rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-800">Add New About Item</h3>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Category</label>
                    <Input
                      value={newAboutCategory}
                      onChange={(e) => setNewAboutCategory(e.target.value)}
                      placeholder="Enter category"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Content</label>
                    <ReactQuill
                      value={newAboutContent}
                      onChange={(value) => debouncedSetNewAboutContent(value)}
                      modules={quillModules}
                      className="bg-white"
                    />
                  </div>
                  <div className="space-x-2">
                    <Button onClick={handleAddAbout} className="bg-[#0F4C81] hover:bg-[#1A5A96]">
                      Add About Item
                    </Button>
                    <Button variant="outline" onClick={() => setShowAddAboutForm(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </section>
          )}

          {activeTab === "Manage FAQ" && (
            <section className="mb-12 p-6 border rounded-lg w-[1200px]">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">Manage FAQ</h2>
              <div className="space-y-4 mb-8">
                {faqItems.length > 0 ? (
                  faqItems.map((item) => (
                    <div key={item.id} className="p-4 border rounded-lg flex justify-between items-center">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800">{item.question}</h3>
                        <div
                          className="text-gray-600 mt-2"
                          dangerouslySetInnerHTML={{ __html: item.content }}
                        />
                      </div>
                      <div className="space-x-2 ml-10">
                        <Button style={{ width: "80px" }} className="mb-3" variant="outline" onClick={() => handleEditFAQ(item)}>
                          Edit
                        </Button>
                        <Button style={{ width: "80px" }} variant="destructive" onClick={() => handleDeleteFAQ(item.id)}>
                          Delete
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-600">No FAQ items available.</p>
                )}
              </div>

              <Button onClick={() => setShowAddFAQForm(true)} className="bg-[#0F4C81] hover:bg-[#1A5A96] mb-4">
                Add Content
              </Button>

              {showAddFAQForm && (
                <div className="space-y-4 mb-8 p-4 border rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-800">Add New FAQ</h3>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Question</label>
                    <Input
                      value={newFAQQuestion}
                      onChange={(e) => setNewFAQQuestion(e.target.value)}
                      placeholder="Enter question"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Answer</label>
                    <ReactQuill
                      value={newFAQAnswer}
                      onChange={(value) => debouncedSetNewFAQAnswer(value)}
                      modules={quillModules}
                      className="bg-white"
                    />
                  </div>
                  <div className="space-x-2">
                    <Button onClick={handleAddFAQ} className="bg-[#0F4C81] hover:bg-[#1A5A96]">
                      Add FAQ
                    </Button>
                    <Button variant="outline" onClick={() => setShowAddFAQForm(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              {editFAQItem && (
                <div className="space-y-4 p-4 border rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-800">Edit FAQ</h3>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Question</label>
                    <Input
                      value={editFAQItem.question}
                      onChange={(e) =>
                        setEditFAQItem({ ...editFAQItem, question: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Answer</label>
                    <ReactQuill
                      value={editFAQItem.content} // answer 대신 content 사용
                      onChange={(value) => debouncedSetEditFAQItem({ ...editFAQItem, content: value })}
                      modules={quillModules}
                      className="bg-white"
                    />
                  </div>
                  <div className="space-x-2">
                    <Button onClick={handleSaveFAQ} className="bg-[#0F4C81] hover:bg-[#1A5A96]">
                      Save Changes
                    </Button>
                    <Button variant="outline" onClick={() => setEditFAQItem(null)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </section>
          )}
        </div>
      </div>
    </div>
  );
}