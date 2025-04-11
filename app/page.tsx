"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Header from "@/components/main/Header";
import PixelGrid from "@/components/main/PixelGrid";
import { getPixels, savePixels } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Pixel, GridPixel } from "@/lib/types";


export default function Home() {
  const pathname = usePathname();
  const GRID_WIDTH = 1500;
  const GRID_HEIGHT = 1000;
  const BLOCK_SIZE = 10;

  const [purchasedPixels, setPurchasedPixels] = useState<Pixel[]>([]);
  const [selected, setSelected] = useState<{ x: number; y: number; size: number } | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [purchaseType, setPurchaseType] = useState<"basic" | "premium">("basic");
  const [contentUrl, setContentUrl] = useState("");
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  // 초기 픽셀 데이터 로드 (페이지 로드 시 한 번만 호출)
  useEffect(() => {
    const loadPixels = async () => {
      setIsLoading(true);
      const savedPixels: Pixel[] = await getPixels();
      setPurchasedPixels(savedPixels);
      setIsLoading(false);
    };
    loadPixels();
  }, []);

  // 새로고침 또는 페이지 종료 시 데이터 저장
  useEffect(() => {
    const handleBeforeUnload = async () => {
      if (purchasedPixels.length > 0) {
        await savePixels(purchasedPixels);
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      handleBeforeUnload();
    };
  }, [purchasedPixels]);

  const soldPixels = purchasedPixels.reduce((total, pixel) => total + pixel.size * pixel.size, 0);
  const totalPixels = GRID_WIDTH * GRID_HEIGHT;
  const soldPercentage = ((soldPixels / totalPixels) * 100).toFixed(2);

  const handleBlockClick = (x: number, y: number) => {
    setSelected({ x, y, size: BLOCK_SIZE });
    setIsDialogOpen(true);
  };

  const handlePurchase = async () => {
    if (selected) {
      console.log(`Purchased: (${selected.x}, ${selected.y}), Type: ${purchaseType}, Content: ${contentUrl}`);
      const newPixel: Pixel = {
        x: selected.x,
        y: selected.y,
        size: selected.size,
        owner: "User",
        content: contentUrl,
        purchaseType,
      };
      const updatedPixels = [...purchasedPixels, newPixel];
      setPurchasedPixels(updatedPixels);

      setIsDialogOpen(false);
      setSelected(null);
      setContentUrl("");
    }
  };

  const handleGridUpdate = () => {
    // 그리드 업데이트 후 추가 작업이 필요하면 여기에
  };

  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(prev + 0.5, 5));
  };

  const handleZoomOut = () => {
    setZoomLevel((prev) => Math.max(prev - 0.5, 0.5));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center">
        <p className="text-lg text-gray-600">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col py-8">
      <Header activePath={pathname} />
      <div className="flex flex-col items-center">
        <p className="text-lg text-gray-600 mb-4">
          Support an iOS app startup by buying pixels! 1 pixel = $1
        </p>
        <div className="mb-4 flex flex-col items-center">
          <p className="text-sm text-gray-500">
            Sold: {soldPixels} pixels ({soldPercentage}%)
          </p>
          <div className="w-80 h-3 bg-gray-200 rounded-full mt-2 shadow-sm">
            <div
              className="h-3 bg-blue-500 rounded-full transition-all duration-300"
              style={{ width: `${soldPercentage}%` }}
            />
          </div>
        </div>

        <div className="flex space-x-2 mb-4">
          <Button onClick={handleZoomIn} className="bg-blue-600 hover:bg-blue-700">
            Zoom In
          </Button>
          <Button onClick={handleZoomOut} className="bg-blue-600 hover:bg-blue-700">
            Zoom Out
          </Button>
        </div>

        <PixelGrid
          purchasedPixels={purchasedPixels}
          selected={selected}
          zoomLevel={zoomLevel}
          onBlockClick={handleBlockClick}
          onGridUpdate={handleGridUpdate}
        />

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[425px] rounded-lg shadow-xl">
            <DialogHeader>
              <DialogTitle className="text-2xl font-semibold text-gray-900">
                Purchase Pixels
              </DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="text-sm text-gray-600">
                <p>
                  Selected: ({selected?.x}, {selected?.y}) - 10x10
                </p>
                <p className="mt-1">
                  Price: {purchaseType === "basic" ? "$100" : "$150"}
                </p>
              </div>
              <Select onValueChange={(value) => setPurchaseType(value as "basic" | "premium")}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="basic">Basic ($100)</SelectItem>
                  <SelectItem value="premium">Premium ($150)</SelectItem>
                </SelectContent>
              </Select>
              <Input
                placeholder="Image/Video URL (optional)"
                value={contentUrl}
                onChange={(e) => setContentUrl(e.target.value)}
                className="w-full"
              />
              {purchaseType === "premium" && (
                <p className="text-sm text-blue-600">
                  Premium includes GIF/Video support and social media highlights!
                </p>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handlePurchase} className="bg-blue-600 hover:bg-blue-700">
                Confirm Purchase
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}