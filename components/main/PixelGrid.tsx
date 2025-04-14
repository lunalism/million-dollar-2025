// components/main/PixelGrid.tsx
import { useEffect, useRef } from "react";
import Image from "next/image";
import { PixelMap } from "@/lib/types";

// 픽셀 그리드의 props 타입 정의
interface PixelGridProps {
  pixelMap: PixelMap;
  selected: { x: number; y: number; width?: number; height?: number } | null;
  onBlockClick: (x: number, y: number) => void;
  onGridUpdate: () => void;
  gridWidth: number;
  gridHeight: number;
}

// 픽셀 그리드 컴포넌트
export default function PixelGrid({ pixelMap, selected, onBlockClick, onGridUpdate, gridWidth, gridHeight }: PixelGridProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // 캔버스 초기화 및 격자선 그리기
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = gridWidth;
    canvas.height = gridHeight;

    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, gridWidth, gridHeight);

    ctx.beginPath();
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 0.5;

    for (let x = 0; x <= gridWidth; x++) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, gridHeight);
    }

    for (let y = 0; y <= gridHeight; y++) {
      ctx.moveTo(0, y);
      ctx.lineTo(gridWidth, y);
    }

    ctx.stroke();

    if (selected) {
      ctx.strokeStyle = "rgba(255, 0, 0, 0.5)";
      ctx.lineWidth = 2;
      ctx.strokeRect(
        selected.x,
        selected.y,
        selected.width || 100,
        selected.height || 100
      );
    }

    onGridUpdate();
  }, [selected, gridWidth, gridHeight, onGridUpdate]);

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = Math.floor(e.clientX - rect.left);
    const y = Math.floor(e.clientY - rect.top);

    onBlockClick(x, y);
  };

  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        onClick={handleClick}
        style={{ width: gridWidth, height: gridHeight }}
        className="border border-gray-300"
      />
      {Object.values(pixelMap).map((pixel) => (
        <div
          key={`${pixel.x}-${pixel.y}`}
          className="absolute group"
          style={{
            left: `${pixel.x}px`,
            top: `${pixel.y}px`,
            width: `${pixel.width}px`,
            height: `${pixel.height}px`,
            zIndex: 10,
          }}
        >
          {pixel.content ? (
            <Image
              src={pixel.content}
              alt={`Pixel at (${pixel.x}, ${pixel.y})`}
              width={pixel.width}
              height={pixel.height}
              style={{ objectFit: "cover" }}
              unoptimized={false} // 최적화 활성화 (remotePatterns 설정 후 필요 없으면 제거 가능)
              onError={(e) => {
                console.error(`Failed to load image at (${pixel.x}, ${pixel.y}): ${pixel.content}`);
                e.currentTarget.src = "/placeholder.png";
              }}
            />
          ) : (
            <div
              style={{
                width: "100%",
                height: "100%",
                backgroundColor: pixel.purchaseType === "premium" ? "#FFD700" : "#87CEEB",
              }}
            />
          )}
          <div className="absolute hidden group-hover:block bg-gray-800 text-white text-xs rounded py-1 px-2 -top-8 left-1/2 transform -translate-x-1/2 whitespace-nowrap z-20">
            Purchased by: {pixel.owner}
          </div>
        </div>
      ))}
    </div>
  );
}