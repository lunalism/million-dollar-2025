// components/main/PixelGrid.tsx
import { useEffect, useRef, useState } from "react";
import { PixelMap } from "@/lib/types";

// 픽셀 그리드의 props 타입 정의
interface PixelGridProps {
  pixelMap: PixelMap; // 픽셀 데이터 맵
  selected: { x: number; y: number; width?: number; height?: number } | null; // 선택된 좌표 및 크기
  onBlockClick: (x: number, y: number) => void; // 블록 클릭 핸들러
  onGridUpdate: () => void; // 그리드 업데이트 핸들러
  gridWidth: number; // 그리드 너비 (픽셀 단위)
  gridHeight: number; // 그리드 높이 (픽셀 단위)
}

// 픽셀 그리드 컴포넌트
export default function PixelGrid({ pixelMap, selected, onBlockClick, onGridUpdate, gridWidth, gridHeight }: PixelGridProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hoverPixel, setHoverPixel] = useState<{ x: number; y: number } | null>(null);

  // 캔버스 초기화 및 격자선 그리기
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // 캔버스 크기 설정
    canvas.width = gridWidth;
    canvas.height = gridHeight;

    // 캔버스 초기화 (배경 검정색)
    ctx.fillStyle = "#000000"; // 배경을 검정색으로 설정
    ctx.fillRect(0, 0, gridWidth, gridHeight);

    // 1픽셀 단위 격자선 그리기
    ctx.beginPath();
    ctx.strokeStyle = "rgba(255, 255, 255, 0.2)"; // 격자선 색상 (흰색, 투명도 낮게)
    ctx.lineWidth = 0.5; // 격자선 두께

    // 세로선 그리기 (1픽셀 단위)
    for (let x = 0; x <= gridWidth; x++) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, gridHeight);
    }

    // 가로선 그리기 (1픽셀 단위)
    for (let y = 0; y <= gridHeight; y++) {
      ctx.moveTo(0, y);
      ctx.lineTo(gridWidth, y);
    }

    ctx.stroke();

    // 픽셀 데이터 렌더링
    Object.values(pixelMap).forEach((pixel) => {
      if (pixel.content) {
        const img = new window.Image();
        img.src = pixel.content;
        img.onload = () => {
          ctx.drawImage(img, pixel.x, pixel.y, pixel.width, pixel.height);
          onGridUpdate();
        };
        img.onerror = () => {
          console.error(`Failed to load image: ${pixel.content}`);
        };
      }
    });
  }, [pixelMap, gridWidth, gridHeight, onGridUpdate]);

  // 마우스 hover 및 선택된 영역 렌더링
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // 이전 프레임 지우기 (격자선과 픽셀 데이터는 유지)
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, gridWidth, gridHeight);

    // 격자선 다시 그리기
    ctx.beginPath();
    ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
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

    // 픽셀 데이터 다시 그리기
    Object.values(pixelMap).forEach((pixel) => {
      if (pixel.content) {
        const img = new window.Image();
        img.src = pixel.content;
        img.onload = () => {
          ctx.drawImage(img, pixel.x, pixel.y, pixel.width, pixel.height);
        };
      }
    });

    // 선택된 영역 표시
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

    // 마우스 hover 픽셀 테두리 표시
    if (hoverPixel) {
      ctx.strokeStyle = "rgba(255, 255, 0, 0.8)"; // 노란색 테두리
      ctx.lineWidth = 2;
      ctx.strokeRect(hoverPixel.x, hoverPixel.y, 1, 1); // 1x1 픽셀 테두리
    }
  }, [pixelMap, selected, hoverPixel, gridWidth, gridHeight]);

  // 캔버스 클릭 핸들러
  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    onBlockClick(Math.floor(x), Math.floor(y));
  };

  // 마우스 이동 핸들러 (hover 기능)
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = Math.floor(e.clientX - rect.left);
    const y = Math.floor(e.clientY - rect.top);

    setHoverPixel({ x, y });
  };

  // 마우스가 캔버스를 벗어날 때 hover 상태 초기화
  const handleMouseLeave = () => {
    setHoverPixel(null);
  };

  return (
    <canvas
      ref={canvasRef}
      onClick={handleClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ width: gridWidth, height: gridHeight }}
      className="border border-gray-300"
    />
  );
}