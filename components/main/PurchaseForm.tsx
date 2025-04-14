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
import { Pixel } from "@/lib/types";
import { getImageSize } from "@/utils/getImageSize";
import { uploadFile } from "@/lib/api";

// 픽셀 구매 폼의 props 타입 정의
interface PurchaseFormProps {
  selected: { x: number; y: number } | null;
  isOpen: boolean;
  onClose: () => void;
  onPurchase: (pixel: Pixel, amount: number) => void;
  blockSize: number;
}

// 픽셀 구매 폼 컴포넌트
export default function PurchaseForm({ selected, isOpen, onClose, onPurchase }: PurchaseFormProps) {
  const [width, setWidth] = useState<string>("100");
  const [height, setHeight] = useState<string>("100");
  const [purchaseType, setPurchaseType] = useState<"basic" | "premium">("basic");
  const [contentType, setContentType] = useState<"url" | "file">("url");
  const [contentUrl, setContentUrl] = useState("");
  const [contentFile, setContentFile] = useState<File | null>(null);
  const [contentPreview, setContentPreview] = useState<string | null>(null);
  const [ownerName, setOwnerName] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (contentFile) {
      const previewUrl = URL.createObjectURL(contentFile);
      setContentPreview(previewUrl);

      getImageSize(contentFile)
        .then((size) => {
          setWidth(size.width.toString());
          setHeight(size.height.toString());
          setError("");
        })
        .catch((err) => {
          setError(`Failed to calculate image size: ${err.message}. Please set width and height manually.`);
        });

      return () => URL.revokeObjectURL(previewUrl);
    } else {
      setContentPreview(null);
    }
  }, [contentFile]);

  useEffect(() => {
    if (contentType === "url" && contentUrl) {
      getImageSize(contentUrl)
        .then((size) => {
          setWidth(size.width.toString());
          setHeight(size.height.toString());
          setError("");
        })
        .catch((err) => {
          setError(`Failed to calculate image size: ${err.message}. Please set width and height manually.`);
        });
    }
  }, [contentType, contentUrl]);

  const calculatePrice = () => {
    if (!selected) return 0;
    const widthNum = parseInt(width, 10);
    const heightNum = parseInt(height, 10);
    if (isNaN(widthNum) || isNaN(heightNum)) return 0;
    const area = widthNum * heightNum;
    const basePrice = area * 0.01;
    return purchaseType === "basic" ? basePrice : basePrice * 1.5;
  };

  const handlePurchase = async () => {
    if (!selected) return;

    const widthNum = parseInt(width, 10);
    const heightNum = parseInt(height, 10);

    if (isNaN(widthNum) || isNaN(heightNum)) {
      setError("Width and Height must be valid numbers.");
      return;
    }

    if (widthNum < 10 || heightNum < 10) {
      setError("Width and Height must be at least 10 pixels.");
      return;
    }

    if (!ownerName.trim()) {
      setError("Please enter your name or nickname.");
      return;
    }

    setIsLoading(true);
    try {
      let finalContentUrl: string | null = null;
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
        } catch (err: unknown) {
          throw new Error(`Failed to upload file: ${err instanceof Error ? err.message : "Unknown error"}`);
        }
        try {
          const size = await getImageSize(contentFile);
          contentWidth = size.width;
          contentHeight = size.height;
        } catch (err: unknown) {
          throw new Error(`Failed to calculate image size: ${err instanceof Error ? err.message : "Unknown error"}`);
        }
      }

      const pixel: Pixel = {
        x: selected.x,
        y: selected.y,
        width: widthNum,
        height: heightNum,
        owner: ownerName.trim(),
        content: finalContentUrl,
        purchaseType,
        content_width: contentWidth,
        content_height: contentHeight,
      };

      const amount = calculatePrice();
      onPurchase(pixel, amount);
    } catch (err: unknown) {
      if (err instanceof Error) {
        console.error("Purchase error:", err);
        setError(`Failed to process content: ${err.message}`);
      } else {
        console.error("Unknown error:", err);
        setError("Failed to process content: Unknown error");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setWidth("100");
    setHeight("100");
    setPurchaseType("basic");
    setContentType("url");
    setContentUrl("");
    setContentFile(null);
    setContentPreview(null);
    setOwnerName("");
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
            <p>
              Selected: ({selected?.x}, {selected?.y})
            </p>
            <div className="mt-1 flex items-center space-x-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">Width (in pixels)</label>
                <Input
                  type="number"
                  value={width}
                  onChange={(e) => {
                    setWidth(e.target.value);
                    setError("");
                  }}
                  placeholder="e.g., 100"
                  className="mt-1 w-full"
                  min={10}
                />
              </div>
              <span className="text-gray-700 text-lg">×</span>
              <div>
                <label className="block text-sm font-medium text-gray-700">Height (in pixels)</label>
                <Input
                  type="number"
                  value={height}
                  onChange={(e) => {
                    setHeight(e.target.value);
                    setError("");
                  }}
                  placeholder="e.g., 100"
                  className="mt-1 w-full"
                  min={10}
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

          <Select onValueChange={(value) => setPurchaseType(value as "basic" | "premium")}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="basic">Basic</SelectItem>
              <SelectItem value="premium">Premium</SelectItem>
            </SelectContent>
          </Select>

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

          {contentType === "url" ? (
            <Input
              placeholder="Image/Video URL (optional)"
              value={contentUrl}
              onChange={(e) => {
                setContentUrl(e.target.value);
                setError("");
              }}
              className="w-full"
              disabled={isLoading}
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
                disabled={isLoading}
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
                    disabled={isLoading}
                  >
                    Remove File
                  </Button>
                </div>
              )}
              {isLoading && <p className="text-sm text-gray-600 mt-2">Uploading...</p>}
            </div>
          )}

          {purchaseType === "premium" && (
            <p className="text-sm text-blue-600">
              Premium includes GIF/Video support and social media highlights!
            </p>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
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