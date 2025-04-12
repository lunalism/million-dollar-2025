// components/main/PurchaseForm.tsx
import { useState, useEffect } from "react";
import Image from "next/image";
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
import { Pixel, PixelMap } from "@/lib/types";
import { getImageSize } from "@/utils/getImageSize";
import { uploadFile } from "@/lib/api";

// 픽셀 구매 폼의 props 타입 정의
interface PurchaseFormProps {
  selected: { x: number; y: number } | null; // 선택된 좌표
  isOpen: boolean; // 다이얼로그 열림/닫힘 상태
  onClose: () => void; // 다이얼로그 닫기 핸들러
  onPurchase: (pixel: Pixel, amount: number) => void; // 구매 완료 핸들러
  pixelMap: PixelMap; // 기존 픽셀 맵 (겹침 확인용)
  blockSize: number; // 블록 크기 (1 블록 = blockSize x blockSize 픽셀)
}

// 픽셀 구매 폼 컴포넌트
export default function PurchaseForm({ selected, isOpen, onClose, onPurchase, pixelMap, blockSize }: PurchaseFormProps) {
  // 상태 정의
  const [width, setWidth] = useState<string>("10"); // 픽셀 블록의 너비 (블록 단위)
  const [height, setHeight] = useState<string>("10"); // 픽셀 블록의 높이 (블록 단위)
  const [purchaseType, setPurchaseType] = useState<"basic" | "premium">("basic"); // 구매 유형 (basic/premium)
  const [contentType, setContentType] = useState<"url" | "file">("url"); // 콘텐츠 입력 방식 (URL/파일 업로드)
  const [contentUrl, setContentUrl] = useState(""); // URL 입력값
  const [contentFile, setContentFile] = useState<File | null>(null); // 업로드할 파일
  const [contentPreview, setContentPreview] = useState<string | null>(null); // 파일 미리보기 URL
  const [ownerName, setOwnerName] = useState(""); // 구매자 이름/닉네임
  const [error, setError] = useState(""); // 에러 메시지
  const [isLoading, setIsLoading] = useState(false); // 업로드/처리 중 로딩 상태

  // 파일 선택 시 미리보기 생성 및 크기 계산
  useEffect(() => {
    if (contentFile) {
      const previewUrl = URL.createObjectURL(contentFile);
      setContentPreview(previewUrl);

      // 이미지 크기 계산
      getImageSize(contentFile)
        .then((size) => {
          // 이미지 크기를 블록 단위로 변환 (올림 처리)
          const blockWidth = Math.ceil(size.width / blockSize) * 10;
          const blockHeight = Math.ceil(size.height / blockSize) * 10;
          setWidth(blockWidth.toString());
          setHeight(blockHeight.toString());
          setError("");
        })
        .catch((err) => {
          setError(`Failed to calculate image size: ${err.message}. Please set width and height manually.`);
        });

      return () => URL.revokeObjectURL(previewUrl);
    } else {
      setContentPreview(null);
    }
  }, [contentFile, blockSize]);

  // URL 입력 시 크기 계산
  useEffect(() => {
    if (contentType === "url" && contentUrl) {
      getImageSize(contentUrl)
        .then((size) => {
          // 이미지 크기를 블록 단위로 변환 (올림 처리)
          const blockWidth = Math.ceil(size.width / blockSize) * 10;
          const blockHeight = Math.ceil(size.height / blockSize) * 10;
          setWidth(blockWidth.toString());
          setHeight(blockHeight.toString());
          setError("");
        })
        .catch((err) => {
          setError(`Failed to calculate image size: ${err.message}. Please set width and height manually.`);
        });
    }
  }, [contentType, contentUrl, blockSize]);

  // 구매 가격 계산 함수
  const calculatePrice = () => {
    if (!selected) return 0;
    const widthNum = parseInt(width, 10);
    const heightNum = parseInt(height, 10);
    if (isNaN(widthNum) || isNaN(heightNum)) return 0;
    // 실제 픽셀 단위로 변환 (widthNum과 heightNum은 블록 단위)
    const pixelWidth = widthNum * blockSize;
    const pixelHeight = heightNum * blockSize;
    const area = pixelWidth * pixelHeight; // 실제 픽셀 면적
    const basePrice = area * 0.01; // 1 픽셀 = $0.01 (100x100 = 100달러)
    return purchaseType === "basic" ? basePrice : basePrice * 1.5; // Premium은 1.5배
  };

  // 새로운 픽셀 블록이 기존 블록과 겹치는지 확인하는 함수
  const checkOverlap = (newPixel: { x: number; y: number; width: number; height: number }) => {
    const newLeft = newPixel.x;
    const newRight = newPixel.x + newPixel.width;
    const newTop = newPixel.y;
    const newBottom = newPixel.y + newPixel.height;

    for (const existingPixel of Object.values(pixelMap)) {
      const existingLeft = existingPixel.x;
      const existingRight = existingPixel.x + existingPixel.width;
      const existingTop = existingPixel.y;
      const existingBottom = existingPixel.y + existingPixel.height;

      const overlaps =
        newLeft < existingRight &&
        newRight > existingLeft &&
        newTop < existingBottom &&
        newBottom > existingTop;

      if (overlaps) {
        return true;
      }
    }

    return false;
  };

  // 구매 처리 함수
  const handlePurchase = async () => {
    if (!selected) return;

    // 입력값 검증: 너비와 높이
    const widthNum = parseInt(width, 10);
    const heightNum = parseInt(height, 10);

    if (isNaN(widthNum) || isNaN(heightNum)) {
      setError("Width and Height must be valid numbers.");
      return;
    }

    if (widthNum < 10 || widthNum % 10 !== 0 || heightNum < 10 || heightNum % 10 !== 0) {
      setError("Width and Height must be multiples of 10 and at least 10 (e.g., 10, 20, 30).");
      return;
    }

    // 입력값 검증: 이름/닉네임
    if (!ownerName.trim()) {
      setError("Please enter your name or nickname.");
      return;
    }

    // 겹침 확인 (블록 단위를 픽셀 단위로 변환)
    const newPixel = {
      x: selected.x,
      y: selected.y,
      width: widthNum * blockSize,
      height: heightNum * blockSize,
    };

    if (checkOverlap(newPixel)) {
      setError("Selected area overlaps with an existing pixel block. Please choose a different location or size.");
      return;
    }

    // 콘텐츠 처리 (URL 또는 파일 업로드)
    setIsLoading(true);
    try {
      let finalContentUrl = "";
      let contentWidth = 0;
      let contentHeight = 0;

      if (contentType === "url" && contentUrl) {
        finalContentUrl = contentUrl;
        const size = await getImageSize(contentUrl);
        contentWidth = size.width;
        contentHeight = size.height;
      } else if (contentType === "file" && contentFile) {
        try {
          finalContentUrl = await uploadFile(contentFile);
        } catch (err) {
          // 업로드 실패 시 에러 로깅 및 메시지 설정
          console.error("Upload error:", err);
          throw new Error(`Failed to upload file to Supabase Storage:`);
        }
        try {
          const size = await getImageSize(contentFile);
          contentWidth = size.width;
          contentHeight = size.height;
        } catch (err) {
          // 이미지 크기 계산 실패 시 에러 로깅 및 메시지 설정
          console.error("Image size calculation error:", err);
          throw new Error(`Failed to calculate image size`);
        }
      }

      // 새로운 픽셀 객체 생성 (width와 height는 픽셀 단위로 저장)
      const pixel: Pixel = {
        x: selected.x,
        y: selected.y,
        width: widthNum * blockSize,
        height: heightNum * blockSize,
        owner: ownerName.trim(),
        content: finalContentUrl,
        purchaseType,
        content_width: contentWidth,
        content_height: contentHeight,
      };

      const amount = calculatePrice();
      onPurchase(pixel, amount);
    } catch (err) {
      // 에러 로깅 및 사용자에게 구체적인 에러 메시지 표시
      console.error("Purchase error:", err);
      setError("Failed to process content. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // 다이얼로그 닫기 및 상태 초기화 함수
  const handleClose = () => {
    setWidth("10");
    setHeight("10");
    setPurchaseType("basic");
    setContentType("url");
    setContentUrl("");
    setContentFile(null);
    setContentPreview(null);
    setOwnerName("");
    setError("");
    onClose();
  };

  // UI 렌더링
  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px] rounded-lg shadow-xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold text-gray-900">
            Purchase Pixels
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {/* 선택된 좌표 및 크기 입력 */}
          <div className="text-sm text-gray-600">
            <p>
              Selected: ({selected?.x}, {selected?.y})
            </p>
            <div className="mt-1 flex items-center space-x-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">Width (in blocks)</label>
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
                <label className="block text-sm font-medium text-gray-700">Height (in blocks)</label>
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
            {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
            {!error && (
              <p className="mt-1">
                Price: ${calculatePrice().toFixed(2)} ({purchaseType})
              </p>
            )}
          </div>

          {/* 이름/닉네임 입력 */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Name/Nickname</label>
            <Input
              value={ownerName}
              onChange={(e) => {
                setOwnerName(e.target.value);
                setError("");
              }}
              placeholder="Enter your name or nickname"
              className="mt-1 w-full"
            />
          </div>

          {/* 구매 유형 선택 (Basic/Premium) */}
          <Select onValueChange={(value) => setPurchaseType(value as "basic" | "premium")}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="basic">Basic</SelectItem>
              <SelectItem value="premium">Premium</SelectItem>
            </SelectContent>
          </Select>

          {/* 콘텐츠 입력 방식 선택 (URL/파일 업로드) */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Content Type</label>
            <div className="mt-1 flex space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="url"
                  checked={contentType === "url"}
                  onChange={() => setContentType("url")}
                  className="mr-2"
                />
                URL
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="file"
                  checked={contentType === "file"}
                  onChange={() => setContentType("file")}
                  className="mr-2"
                />
                File Upload
              </label>
            </div>
          </div>

          {/* 콘텐츠 입력 UI */}
          {contentType === "url" ? (
            <Input
              placeholder="Image/Video URL (optional)"
              value={contentUrl}
              onChange={(e) => {
                setContentUrl(e.target.value);
                setError("");
              }}
              className="w-full"
            />
          ) : (
            <div>
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0] || null;
                  setContentFile(file);
                  setError("");
                }}
                className="w-full"
              />
              {contentFile && (
                <div className="mt-2">
                  <p className="text-sm text-gray-600">Selected File: {contentFile.name}</p>
                  {contentPreview && (
                    <div className="mt-2 relative w-full h-[100px]">
                      <Image
                        src={contentPreview}
                        alt="Preview"
                        fill
                        style={{ objectFit: "contain" }}
                        className="rounded-md"
                      />
                    </div>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setContentFile(null)}
                    className="mt-2"
                  >
                    Remove File
                  </Button>
                </div>
              )}
              {isLoading && <p className="text-sm text-gray-600 mt-2">Uploading...</p>}
            </div>
          )}

          {/* Premium 유형 안내 메시지 */}
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
            disabled={!!error || isLoading}
          >
            {isLoading ? "Processing..." : "Confirm Purchase"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}