// components/main/PurchaseForm.tsx

import { useState } from "react";
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
import { Pixel } from "@/lib/types";

interface PurchaseFormProps {
  selected: { x: number; y: number } | null;
  isOpen: boolean;
  onClose: () => void;
  onPurchase: (pixel: Pixel) => void;
}

export default function PurchaseForm({ selected, isOpen, onClose, onPurchase }: PurchaseFormProps) {
  const [width, setWidth] = useState<string>("10");
  const [height, setHeight] = useState<string>("10");
  const [purchaseType, setPurchaseType] = useState<"basic" | "premium">("basic");
  const [contentUrl, setContentUrl] = useState("");
  const [error, setError] = useState("");

  // 가격 계산
  const calculatePrice = () => {
    if (!selected) return 0;
    const widthNum = parseInt(width, 10);
    const heightNum = parseInt(height, 10);
    if (isNaN(widthNum) || isNaN(heightNum)) return 0;
    const area = widthNum * heightNum;
    const basePrice = area; // 1 픽셀 = $1
    return purchaseType === "basic" ? basePrice : basePrice * 1.5; // Premium은 1.5배
  };

  // 구매 확인
  const handlePurchase = async () => {
    if (!selected) return;

    const widthNum = parseInt(width, 10);
    const heightNum = parseInt(height, 10);

    // 입력값 검증
    if (isNaN(widthNum) || isNaN(heightNum)) {
      setError("Width and Height must be valid numbers.");
      return;
    }

    if (widthNum < 10 || widthNum % 10 !== 0 || heightNum < 10 || heightNum % 10 !== 0) {
      setError("Width and Height must be multiples of 10 and at least 10 (e.g., 10, 20, 30).");
      return;
    }

    const newPixel: Pixel = {
      x: selected.x,
      y: selected.y,
      size: widthNum, // width를 size로 사용 (가로 크기 기준, 기존 Pixel 타입에 맞춤)
      owner: "User",
      content: contentUrl,
      purchaseType,
    };

    onPurchase(newPixel);
    onClose();
  };

  // 다이얼로그 닫기 시 상태 초기화
  const handleClose = () => {
    setWidth("10");
    setHeight("10");
    setPurchaseType("basic");
    setContentUrl("");
    setError("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px] rounded-lg shadow-xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold text-gray-900">
            Purchase Pixels
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="text-sm text-gray-600">
            {/* 선택된 좌표 표시 */}
            <p>
              Selected: ({selected?.x}, {selected?.y})
            </p>
            {/* 크기 입력: width * height */}
            <div className="mt-1 flex items-center space-x-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">Width</label>
                <Input
                  type="number"
                  value={width}
                  onChange={(e) => {
                    setWidth(e.target.value);
                    setError("");
                  }}
                  placeholder="e.g., 10"
                  className="mt-1 w-full"
                  min={10}
                  step={10}
                />
              </div>
              <span className="text-gray-700 text-lg">×</span>
              <div>
                <label className="block text-sm font-medium text-gray-700">Height</label>
                <Input
                  type="number"
                  value={height}
                  onChange={(e) => {
                    setHeight(e.target.value);
                    setError("");
                  }}
                  placeholder="e.g., 10"
                  className="mt-1 w-full"
                  min={10}
                  step={10}
                />
              </div>
            </div>
            {/* 에러 메시지 */}
            {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
            {/* 가격 표시 */}
            {!error && (
              <p className="mt-1">
                Price: ${calculatePrice()} ({purchaseType})
              </p>
            )}
          </div>
          {/* 구매 타입 선택 */}
          <Select onValueChange={(value) => setPurchaseType(value as "basic" | "premium")}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="basic">Basic</SelectItem>
              <SelectItem value="premium">Premium</SelectItem>
            </SelectContent>
          </Select>
          {/* 콘텐츠 URL 입력 */}
          <Input
            placeholder="Image/Video URL (optional)"
            value={contentUrl}
            onChange={(e) => setContentUrl(e.target.value)}
            className="w-full"
          />
          {/* Premium 타입 안내 */}
          {purchaseType === "premium" && (
            <p className="text-sm text-blue-600">
              Premium includes GIF/Video support and social media highlights!
            </p>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            onClick={handlePurchase}
            className="bg-blue-600 hover:bg-blue-700"
            disabled={!!error}
          >
            Confirm Purchase
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}