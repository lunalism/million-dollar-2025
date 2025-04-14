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
  id: string;
  category: string;
  title: string;
  content: string;
}

// Admin 페이지 컴포넌트
export default function Admin() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pixels, setPixels] = useState<Pixel[]>([]);
  const [editPixel, setEditPixel] = useState<Pixel | null>(null);
  const [editAboutItems, setEditAboutItems] = useState<AboutItem[]>([]);
  const [editAboutItem, setEditAboutItem] = useState<AboutItem | null>(null);
  const [newAboutCategory, setNewAboutCategory] = useState("");
  const [newAboutTitle, setNewAboutTitle] = useState("");
  const [newAboutContent, setNewAboutContent] = useState("");
  const [faqItems, setFaqItems] = useState<FAQItem[]>([]);
  const [editFAQItem, setEditFAQItem] = useState<FAQItem | null>(null);
  const [newFAQQuestion, setNewFAQQuestion] = useState("");
  const [newFAQAnswer, setNewFAQAnswer] = useState("");
  const [activeTab, setActiveTab] = useState("Manage Pixels");
  const [showAddAboutForm, setShowAddAboutForm] = useState(false);
  const [showAddFAQForm, setShowAddFAQForm] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // 디바운싱된 상태 업데이트 함수
  const debouncedSetNewAboutContent = debounce((value: string) => {
    setNewAboutContent(value);
  }, 300);

  const debouncedSetEditAboutItem = debounce((newAboutItem: AboutItem) => {
    setEditAboutItem(newAboutItem);
  }, 300);

  const debouncedSetEditFAQItem = debounce((newFAQItem: FAQItem) => {
    setEditFAQItem(newFAQItem);
  }, 300);

  const debouncedSetNewFAQAnswer = debounce((value: string) => {
    setNewFAQAnswer(value);
  }, 300);

  // 데이터 로드 함수
  const loadData = async () => {
    setIsLoading(true);
    try {
      const pixelData: Pixel[] = await getPixels();
      const contentData = await getAboutContent();
      const faqData = await getFAQItems();
      console.log("Loaded pixels:", pixelData);
      console.log("Loaded about content:", contentData);
      console.log("Loaded FAQ items:", faqData);
      setPixels(pixelData);
      setEditAboutItems(contentData);
      console.log("Set editAboutItems:", contentData);
      const mappedFAQItems = faqData.map(item => ({
        id: item.id,
        question: item.question,
        content: item.answer
      }));
      setFaqItems(mappedFAQItems);
      console.log("Set faqItems:", mappedFAQItems);
      if (contentData.length === 0 && faqData.length === 0) {
        setLoadError("No data found in About or FAQ tables.");
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error("Error loading data:", error);
        setLoadError("Failed to load data: " + error.message);
      } else {
        console.error("Unknown error:", error);
        setLoadError("Failed to load data: Unknown error");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // 로그인 상태 확인
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
          router.push('/');
          return;
        }

        const userRole = data?.role;
        if (userRole === 'admin') {
          setIsAuthenticated(true);
        } else {
          router.push('/');
        }
      } else {
        setIsLoading(false);
      }
    };

    checkSession();
  }, [router]);

  // isAuthenticated가 true일 때 데이터 로드
  useEffect(() => {
    if (isAuthenticated) {
      loadData();
    }
  }, [isAuthenticated]);

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
    try {
      // Supabase에서 픽셀 데이터 삭제
      const { error } = await supabase
        .from("pixels")
        .delete()
        .eq("x", x)
        .eq("y", y);

      if (error) {
        console.error("Error deleting pixel from Supabase:", error);
        throw error;
      }

      // UI에서 픽셀 데이터 업데이트
      const updatedPixels = pixels.filter((p) => !(p.x === x && p.y === y));
      setPixels(updatedPixels);
      alert("Pixel deleted successfully!");

      // 삭제 후 데이터 리로드 확인
      const remainingPixels = await getPixels();
      console.log("Remaining pixels after deletion:", remainingPixels);
    } catch (error: unknown) {
      console.error("Failed to delete pixel:", error);
      if (error && typeof error === "object" && "message" in error) {
        alert(`Failed to delete pixel: ${(error as { message: string }).message}`);
      } else if (error instanceof Error) {
        alert(`Failed to delete pixel: ${error.message}`);
      } else {
        alert("Failed to delete pixel: An unexpected error occurred");
      }
      // 실패 시 데이터 리로드
      const pixelData = await getPixels();
      setPixels(pixelData);
    }
  };

  // About 항목 수정 시작 핸들러
  const handleEditAbout = (item: AboutItem) => {
    setEditAboutItem({ ...item });
  };

  // About 항목 저장 핸들러
  const handleSaveAbout = async () => {
    if (!editAboutItem) return;
    try {
      console.log("Saving About item:", editAboutItem);
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
      );
      setEditAboutItem(null);
      alert("About item updated!");
      // 데이터 리로드
      const contentData = await getAboutContent();
      setEditAboutItems(contentData);
    } catch (error: unknown) {
      console.error("Failed to update About item:", error);
      if (error && typeof error === "object" && "message" in error) {
        alert(`Failed to update About item: ${(error as { message: string }).message}`);
      } else if (error instanceof Error) {
        alert(`Failed to update About item: ${error.message}`);
      } else {
        alert("Failed to update About item: An unexpected error occurred");
      }
      // 실패 시 데이터 리로드
      const contentData = await getAboutContent();
      setEditAboutItems(contentData);
    }
  };

  // About 항목 삭제 핸들러
  const handleDeleteAbout = async (category: string) => {
    try {
      await supabase.from("about").delete().eq("category", category);
      setEditAboutItems(editAboutItems.filter((item) => item.category !== category));
      alert("About item deleted!");
      // 데이터 리로드
      const contentData = await getAboutContent();
      setEditAboutItems(contentData);
    } catch (error: unknown) {
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
      // 실패 시 데이터 리로드
      const contentData = await getAboutContent();
      setEditAboutItems(contentData);
    }
  };

  // About 항목 추가 핸들러
  const handleAddAbout = async () => {
    if (!newAboutCategory || !newAboutContent || !newAboutTitle) {
      alert("Please fill in category, title, and content.");
      return;
    }
    try {
      await updateAboutContent(newAboutCategory, newAboutCategory, newAboutTitle, newAboutContent);
      setEditAboutItems([...editAboutItems, { id: crypto.randomUUID(), category: newAboutCategory, title: newAboutTitle, content: newAboutContent }]);
      setNewAboutCategory("");
      setNewAboutTitle("");
      setNewAboutContent("");
      setShowAddAboutForm(false);
      alert("About item added!");
      // 데이터 리로드
      const contentData = await getAboutContent();
      setEditAboutItems(contentData);
    } catch (error: unknown) {
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
      // 실패 시 데이터 리로드
      const contentData = await getAboutContent();
      setEditAboutItems(contentData);
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
      setShowAddFAQForm(false);
      alert("FAQ item added!");
      // 데이터 리로드
      const faqData = await getFAQItems();
      const mappedFAQItems = faqData.map(item => ({
        id: item.id,
        question: item.question,
        content: item.answer
      }));
      setFaqItems(mappedFAQItems);
    } catch (error: unknown) {
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
      // 실패 시 데이터 리로드
      const faqData = await getFAQItems();
      const mappedFAQItems = faqData.map(item => ({
        id: item.id,
        question: item.question,
        content: item.answer
      }));
      setFaqItems(mappedFAQItems);
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
      console.log("Saving FAQ item:", editFAQItem);
      const updatedItem = await upsertFAQItem(
        editFAQItem.id,
        editFAQItem.question,
        editFAQItem.content
      );
      setFaqItems(
        faqItems.map((item) => (item.id === updatedItem[0].id ? updatedItem[0] : item))
      );
      setEditFAQItem(null);
      alert("FAQ item updated!");
      // 데이터 리로드
      const faqData = await getFAQItems();
      const mappedFAQItems = faqData.map(item => ({
        id: item.id,
        question: item.question,
        content: item.answer
      }));
      setFaqItems(mappedFAQItems);
    } catch (error: unknown) {
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
      // 실패 시 데이터 리로드
      const faqData = await getFAQItems();
      const mappedFAQItems = faqData.map(item => ({
        id: item.id,
        question: item.question,
        content: item.answer
      }));
      setFaqItems(mappedFAQItems);
    }
  };

  // FAQ 항목 삭제 핸들러
  const handleDeleteFAQ = async (id: number) => {
    try {
      await deleteFAQItem(id);
      setFaqItems(faqItems.filter((item) => item.id !== id));
      alert("FAQ item deleted!");
      // 데이터 리로드
      const faqData = await getFAQItems();
      const mappedFAQItems = faqData.map(item => ({
        id: item.id,
        question: item.question,
        content: item.answer
      }));
      setFaqItems(mappedFAQItems);
    } catch (error: unknown) {
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
      // 실패 시 데이터 리로드
      const faqData = await getFAQItems();
      const mappedFAQItems = faqData.map(item => ({
        id: item.id,
        question: item.question,
        content: item.answer
      }));
      setFaqItems(mappedFAQItems);
    }
  };

  // 인증되지 않은 경우 로그인 화면 표시
  if (!isAuthenticated && !isLoading) {
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

  // 로딩 중일 때 표시
  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-lg text-gray-600">Loading...</p>
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

        {loadError && (
          <div className="mb-4 p-4 border rounded-lg bg-red-50 text-red-600">
            {loadError}
          </div>
        )}

        <div className="w-full">
          {activeTab === "Manage Pixels" && (
            <>
              <section className="mb-12 w-[1200px]">
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">Manage Pixels</h2>
                <div className="overflow-x-auto">
                  <Table className="w-full">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-1/6">Position</TableHead>
                        <TableHead className="w-1/6">Size</TableHead>
                        <TableHead className="w-1/6">Owner</TableHead>
                        <TableHead className="w-2/6">Content</TableHead>
                        <TableHead className="w-1/6">Type</TableHead>
                        <TableHead className="w-1/6">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pixels.map((pixel) => (
                        <TableRow key={`${pixel.x}-${pixel.y}`}>
                          <TableCell>({pixel.x}, {pixel.y})</TableCell>
                          <TableCell>{pixel.width}×{pixel.height}</TableCell>
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
                        value={editPixel.content ?? ""}
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
              <div className="space-y-4 mb-8">
                {editAboutItems.length > 0 ? (
                  editAboutItems.map((item) => (
                    <div key={item.id} className="p-4 border rounded-lg flex justify-between items-center">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800">{item.title}</h3>
                        <p className="text-gray-600 mt-1">Category: {item.category}</p>
                        <div
                          className="text-gray-600 mt-2"
                          dangerouslySetInnerHTML={{ __html: item.content }}
                        />
                      </div>
                      <div className="space-x-2 ml-10">
                        <Button style={{ width: "80px" }} className="mb-3" variant="outline" onClick={() => handleEditAbout(item)}>
                          Edit
                        </Button>
                        <Button style={{ width: "80px" }} variant="destructive" onClick={() => handleDeleteAbout(item.category)}>
                          Delete
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-600">No About items available.</p>
                )}
              </div>

              <Button onClick={() => setShowAddAboutForm(true)} className="bg-[#0F4C81] hover:bg-[#1A5A96] mb-4">
                Add Content
              </Button>

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
                    <label className="block text-sm font-medium text-gray-700">Title</label>
                    <Input
                      value={newAboutTitle}
                      onChange={(e) => setNewAboutTitle(e.target.value)}
                      placeholder="Enter title"
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

              {editAboutItem && (
                <div className="space-y-4 p-4 border rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-800">Edit About</h3>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Category</label>
                    <Input
                      value={editAboutItem.category}
                      onChange={(e) =>
                        setEditAboutItem({ ...editAboutItem, category: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Title</label>
                    <Input
                      value={editAboutItem.title}
                      onChange={(e) =>
                        setEditAboutItem({ ...editAboutItem, title: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Content</label>
                    <ReactQuill
                      value={editAboutItem.content}
                      onChange={(value) => debouncedSetEditAboutItem({ ...editAboutItem, content: value })}
                      modules={quillModules}
                      className="bg-white"
                    />
                  </div>
                  <div className="space-x-2">
                    <Button onClick={handleSaveAbout} className="bg-[#0F4C81] hover:bg-[#1A5A96]">
                      Save Changes
                    </Button>
                    <Button variant="outline" onClick={() => setEditAboutItem(null)}>
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
                      value={editFAQItem.content}
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