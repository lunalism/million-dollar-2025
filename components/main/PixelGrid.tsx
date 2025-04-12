// components/main/PixelGrid.tsx

import { useEffect, useRef } from "react";
import { Pixel, PixelMap } from "@/lib/types";

interface PixelGridProps {
  pixelMap: PixelMap;
  selected: { x: number; y: number; width?: number; height?: number } | null;
  onBlockClick: (x: number, y: number) => void;
  onGridUpdate: () => void;
  gridWidth: number;
  gridHeight: number;
}

export default function PixelGrid({
  pixelMap,
  selected,
  onBlockClick,
  onGridUpdate,
  gridWidth,
  gridHeight,
}: PixelGridProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const BLOCK_SIZE = 10; // 고정된 블록 크기

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = gridWidth;
    canvas.height = gridHeight;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "rgba(0, 0, 0, 0.1)";

    // 수직선 그리기
    for (let x = 0; x <= gridWidth; x += BLOCK_SIZE) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, gridHeight);
      ctx.stroke();
    }

    // 수평선 그리기
    for (let y = 0; y <= gridHeight; y += BLOCK_SIZE) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(gridWidth, y);
      ctx.stroke();
    }

    // 구매된 픽셀 그리기
    Object.values(pixelMap).forEach((pixel: Pixel) => {
      const x = pixel.x;
      const y = pixel.y;
      const width = pixel.width;
      const height = pixel.height;
      ctx.fillStyle = pixel.purchaseType === "premium" ? "rgba(255, 215, 0, 0.5)" : "rgba(0, 128, 0, 0.5)";
      ctx.fillRect(x, y, width, height);
    });

    // 선택된 블록 표시
    if (selected && selected.width && selected.height) {
      const x = selected.x;
      const y = selected.y;
      const width = selected.width;
      const height = selected.height;
      ctx.strokeStyle = "red";
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, width, height);
    }

    onGridUpdate();
  }, [pixelMap, selected, gridWidth, gridHeight, onGridUpdate]);

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const blockX = Math.floor(x / BLOCK_SIZE) * BLOCK_SIZE;
    const blockY = Math.floor(y / BLOCK_SIZE) * BLOCK_SIZE;
    onBlockClick(blockX, blockY);
  };

  return (
    <canvas
      ref={canvasRef}
      onClick={handleClick}
      style={{ width: gridWidth, height: gridHeight }}
    />
  );
}