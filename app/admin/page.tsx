"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getPixels, savePixels, getContent, saveContent } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Pixel, AboutContent, FAQItem, Content } from "@/lib/types";

export default function Admin() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [pixels, setPixels] = useState<Pixel[]>([]);
  const [content, setContent] = useState<Content | null>(null);
  const [editPixel, setEditPixel] = useState<Pixel | null>(null);
  const [editAbout, setEditAbout] = useState<AboutContent>({
    whyStarted: "",
    vision: "",
    howHelp: "",
  });
  const [editFAQ, setEditFAQ] = useState<FAQItem[]>([]);

  // 데이터 로드
  useEffect(() => {
    const loadData = async () => {
      const pixelData: Pixel[] = await getPixels();
      const contentData: Content = await getContent();
      setPixels(pixelData);
      setContent(contentData);
      setEditAbout(contentData.about);
      setEditFAQ(contentData.faq);
    };
    loadData();
  }, []);

  // 비밀번호 인증
  const handleAuth = () => {
    if (password === "Chlqudwls1379!@") {
      setIsAuthenticated(true);
    } else {
      alert("Incorrect password");
    }
  };

  // 픽셀 수정
  const handleEditPixel = (pixel: Pixel) => {
    setEditPixel({ ...pixel });
  };

  const handleSavePixel = async () => {
    if (!editPixel) return;
    const updatedPixels = pixels.map((p) =>
      p.x === editPixel.x && p.y === editPixel.y ? editPixel : p
    );
    await savePixels(updatedPixels);
    setPixels(updatedPixels);
    setEditPixel(null);
  };

  // 픽셀 삭제
  const handleDeletePixel = async (x: number, y: number) => {
    const updatedPixels = pixels.filter((p) => !(p.x === x && p.y === y));
    await savePixels(updatedPixels);
    setPixels(updatedPixels);
  };

  // About 내용 수정
  const handleSaveAbout = async () => {
    if (!content) return;
    const updatedContent: Content = { ...content, about: editAbout };
    await saveContent(updatedContent);
    setContent(updatedContent);
    alert("About content updated!");
  };

  // FAQ 수정
  const handleSaveFAQ = async () => {
    if (!content) return;
    const updatedContent: Content = { ...content, faq: editFAQ };
    await saveContent(updatedContent);
    setContent(updatedContent);
    alert("FAQ updated!");
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="max-w-md w-full p-6 border rounded-lg shadow-lg">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4 text-center">
            Admin Login
          </h2>
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password"
            className="mb-4"
          />
          <Button onClick={handleAuth} className="w-full bg-blue-600 hover:bg-blue-700">
            Login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col py-8">
      <div className="max-w-7xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Admin Dashboard</h1>

        {/* 픽셀 관리 섹션 */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Manage Pixels</h2>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Position</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Content</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Actions</TableHead>
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
                    <Button
                      variant="outline"
                      className="mr-2"
                      onClick={() => handleEditPixel(pixel)}
                    >
                      Edit
                    </Button>
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
              <Button onClick={handleSavePixel} className="bg-blue-600 hover:bg-blue-700">
                Save Changes
              </Button>
            </div>
          </section>
        )}

        {/* About 내용 수정 섹션 */}
        <section className="mb-12 p-6 border rounded-lg">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Edit About Page</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Why We Started This</label>
              <Textarea
                value={editAbout.whyStarted}
                onChange={(e) => setEditAbout({ ...editAbout, whyStarted: e.target.value })}
                rows={4}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Our Vision</label>
              <Textarea
                value={editAbout.vision}
                onChange={(e) => setEditAbout({ ...editAbout, vision: e.target.value })}
                rows={4}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">How You Can Help</label>
              <Textarea
                value={editAbout.howHelp}
                onChange={(e) => setEditAbout({ ...editAbout, howHelp: e.target.value })}
                rows={4}
              />
            </div>
            <Button onClick={handleSaveAbout} className="bg-blue-600 hover:bg-blue-700">
              Save About Changes
            </Button>
          </div>
        </section>

        {/* FAQ 수정 섹션 */}
        <section className="mb-12 p-6 border rounded-lg">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Edit FAQ</h2>
          {editFAQ.map((item, index) => (
            <div key={index} className="space-y-4 mb-4 p-4 border rounded-lg">
              <div>
                <label className="block text-sm font-medium text-gray-700">Question</label>
                <Input
                  value={item.question}
                  onChange={(e) => {
                    const newFAQ = [...editFAQ];
                    newFAQ[index] = { ...newFAQ[index], question: e.target.value };
                    setEditFAQ(newFAQ);
                  }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Answer</label>
                <Textarea
                  value={item.answer}
                  onChange={(e) => {
                    const newFAQ = [...editFAQ];
                    newFAQ[index] = { ...newFAQ[index], answer: e.target.value };
                    setEditFAQ(newFAQ);
                  }}
                  rows={3}
                />
              </div>
            </div>
          ))}
          <Button onClick={handleSaveFAQ} className="bg-blue-600 hover:bg-blue-700">
            Save FAQ Changes
          </Button>
        </section>
      </div>
    </div>
  );
}