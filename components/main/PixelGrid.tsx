// components/main/PixelGrid.tsx

import { useEffect, useRef, useCallback } from "react";
import { Pixel, PixelMap } from "@/lib/types";

interface PixelGridProps {
  pixelMap: PixelMap;
  selected: { x: number; y: number; width?: number; height?: number } | null;
  zoomLevel: number;
  focusedBlock: { x: number; y: number } | null;
  scrollPosition: { scrollLeft: number; scrollTop: number };
  onBlockClick: (x: number, y: number) => void;
  onGridUpdate: () => void;
  onScroll: (scrollInfo: { scrollLeft: number; scrollTop: number }) => void;
  gridWidth: number;
  gridHeight: number;
  scrollDuration: number;
  scrollEasing: string;
}

export default function PixelGrid({
  pixelMap,
  selected,
  zoomLevel,
  focusedBlock,
  scrollPosition,
  onBlockClick,
  onGridUpdate,
  onScroll,
  gridWidth,
  gridHeight,
  scrollDuration,
  scrollEasing,
}: PixelGridProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // 캔버스 크기 설정
    canvas.width = gridWidth;
    canvas.height = gridHeight;

    // 그리드 그리기
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "rgba(0, 0, 0, 0.1)";
    const blockSize = 10 * zoomLevel;

    // 수직선 그리기
    for (let x = 0; x <= gridWidth; x += blockSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, gridHeight);
      ctx.stroke();
    }

    // 수평선 그리기
    for (let y = 0; y <= gridHeight; y += blockSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(gridWidth, y);
      ctx.stroke();
    }

    // 구매된 픽셀 그리기
    Object.values(pixelMap).forEach((pixel: Pixel) => {
      const x = pixel.x * zoomLevel;
      const y = pixel.y * zoomLevel;
      const size = pixel.size * zoomLevel;
      ctx.fillStyle = pixel.purchaseType === "premium" ? "rgba(255, 215, 0, 0.5)" : "rgba(0, 128, 0, 0.5)";
      ctx.fillRect(x, y, size, size);
    });

    // 선택된 블록 표시
    if (selected && selected.width && selected.height) {
      const x = selected.x * zoomLevel;
      const y = selected.y * zoomLevel;
      const width = selected.width * zoomLevel;
      const height = selected.height * zoomLevel;
      ctx.strokeStyle = "red";
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, width, height);
    }

    onGridUpdate();
  }, [pixelMap, selected, zoomLevel, gridWidth, gridHeight, onGridUpdate]);

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / zoomLevel;
    const y = (e.clientY - rect.top) / zoomLevel;
    const blockX = Math.floor(x / 10) * 10;
    const blockY = Math.floor(y / 10) * 10;
    onBlockClick(blockX, blockY);
  };

  const handleScroll = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const scrollInfo = { scrollLeft: window.scrollX, scrollTop: window.scrollY };
    onScroll(scrollInfo);
  }, [onScroll]);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [handleScroll]); // handleScroll을 의존성 배열에 추가

  return (
    <canvas
      ref={canvasRef}
      onClick={handleClick}
      style={{ width: gridWidth, height: gridHeight }}
    />
  );
}