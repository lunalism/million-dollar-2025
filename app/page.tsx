"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { usePathname } from "next/navigation";
import Header from "@/components/main/Header";
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
import { Pixel } from "@/lib/types";

type GridPixel = {
  x: number;
  y: number;
  purchased: boolean;
  owner?: string;
  content?: string;
  purchaseType?: "basic" | "premium";
};

export default function Home() {
  const pathname = usePathname();
  const GRID_WIDTH = 1500;
  const GRID_HEIGHT = 1000;

  const [grid, setGrid] = useState<GridPixel[][]>(() => {
    const initialGrid: GridPixel[][] = [];
    for (let x = 0; x < GRID_WIDTH; x++) {
      initialGrid[x] = [];
      for (let y = 0; y < GRID_HEIGHT; y++) {
        initialGrid[x][y] = { x, y, purchased: false };
      }
    }
    return initialGrid;
  });
  const [selected, setSelected] = useState<{ x: number; y: number; size: number } | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [purchaseType, setPurchaseType] = useState<"basic" | "premium">("basic");
  const [contentUrl, setContentUrl] = useState("");
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // 캔버스 렌더링 함수
  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        grid.forEach((row) =>
          row.forEach((pixel) => {
            ctx.fillStyle = pixel.purchased ? "blue" : "#e5e7eb";
            ctx.fillRect(pixel.x, pixel.y, 1, 1);
            if (pixel.content && pixel.purchased) {
              const img = new Image();
              img.src = pixel.content;
              img.onload = () => {
                ctx.drawImage(img, pixel.x, pixel.y, 10, 10);
              };
            }
          })
        );
      }
    }
  }, [grid]);

  // 초기 픽셀 데이터 로드
  useEffect(() => {
    const loadPixels = async () => {
      const savedPixels: Pixel[] = await getPixels();
      const newGrid = [...grid];
      savedPixels.forEach((pixel) => {
        for (let i = pixel.x; i < pixel.x + pixel.size; i++) {
          for (let j = pixel.y; j < pixel.y + pixel.size; j++) {
            newGrid[i][j] = {
              ...newGrid[i][j],
              purchased: true,
              owner: pixel.owner,
              content: pixel.content,
              purchaseType: pixel.purchaseType,
            };
          }
        }
      });
      setGrid(newGrid);
    };
    loadPixels();
  }, [grid]); // grid는 의존성에서 제외, 초기 로드 시에만 실행

  // 캔버스 렌더링
  useEffect(() => {
    renderCanvas();
  }, [renderCanvas]); // renderCanvas는 grid에 의존하므로 의존성 배열에 포함

  const soldPixels = grid.flat().filter((pixel) => pixel.purchased).length;
  const totalPixels = GRID_WIDTH * GRID_HEIGHT;
  const soldPercentage = ((soldPixels / totalPixels) * 100).toFixed(2);

  const handleClick = (x: number, y: number) => {
    setSelected({ x, y, size: 10 });
    setIsDialogOpen(true);
  };

  const handlePurchase = async () => {
    if (selected) {
      console.log(`Purchased: (${selected.x}, ${selected.y}), Type: ${purchaseType}, Content: ${contentUrl}`);
      const newGrid = [...grid];
      for (let i = selected.x; i < selected.x + selected.size; i++) {
        for (let j = selected.y; j < selected.y + selected.size; j++) {
          newGrid[i][j] = {
            ...newGrid[i][j],
            purchased: true,
            content: contentUrl,
            owner: "User",
            purchaseType,
          };
        }
      }
      setGrid(newGrid);

      const savedPixels: Pixel[] = await getPixels();
      savedPixels.push({
        x: selected.x,
        y: selected.y,
        size: selected.size,
        owner: "User",
        content: contentUrl,
        purchaseType,
      });
      await savePixels(savedPixels);

      setIsDialogOpen(false);
      setSelected(null);
      setContentUrl("");
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col py-8">
      <Header activePath={pathname} />
      <div className="flex flex-col items-center">
        <p className="text-lg text-gray-600 mb-4">
          Support an iOS app startup by buying pixels! 1 pixel = $1
        </p>
        <div className="mb-8 flex flex-col items-center">
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

        <div className="relative w-[1500px] h-[1000px] border-2 border-gray-300 shadow-lg rounded-lg overflow-auto">
          <canvas
            ref={canvasRef}
            width={GRID_WIDTH}
            height={GRID_HEIGHT}
            className="w-full h-full"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const x = Math.floor((e.clientX - rect.left) / 1);
              const y = Math.floor((e.clientY - rect.top) / 1);
              handleClick(x - (x % 10), y - (y % 10));
            }}
          />
          {selected && (
            <div
              className="absolute border-2 border-blue-500 bg-blue-200 bg-opacity-30"
              style={{
                left: selected.x,
                top: selected.y,
                width: selected.size,
                height: selected.size,
              }}
            />
          )}
        </div>

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