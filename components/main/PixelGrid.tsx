import { useRef, useEffect, useCallback } from "react";
import { Grid, GridCellRenderer, ScrollParams } from "react-virtualized";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { GridPixel, Pixel } from "@/lib/types";
import debounce from "lodash/debounce";

// 이징 함수 정의
const easingFunctions = {
  linear: (t: number) => t,
  easeInQuad: (t: number) => t * t,
  easeOutQuad: (t: number) => t * (2 - t),
  easeInOutQuad: (t: number) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t),
};

type EasingFunction = (t: number) => number;

type PixelGridProps = {
  purchasedPixels: Pixel[];
  selected: { x: number; y: number; size: number } | null;
  zoomLevel: number;
  focusedBlock: { x: number; y: number } | null;
  scrollPosition: { scrollLeft: number; scrollTop: number };
  onBlockClick: (x: number, y: number) => void;
  onGridUpdate: () => void;
  onScroll: (scrollInfo: ScrollParams) => void;
  gridWidth: number;
  gridHeight: number;
  scrollDuration?: number; // 지속 시간 prop 추가
  scrollEasing?: keyof typeof easingFunctions; // 이징 함수 prop 추가
};

export default function PixelGrid({
  purchasedPixels,
  selected,
  zoomLevel,
  focusedBlock,
  scrollPosition,
  onBlockClick,
  onGridUpdate,
  onScroll,
  gridWidth,
  gridHeight,
  scrollDuration = 300, // 기본값 300ms
  scrollEasing = "easeInOutQuad", // 기본값 easeInOutQuad
}: PixelGridProps) {
  const GRID_WIDTH = 1500;
  const GRID_HEIGHT = 1000;
  const BASE_BLOCK_SIZE = 10;
  const BLOCK_SIZE = BASE_BLOCK_SIZE * zoomLevel;
  const gridRef = useRef<Grid>(null);

  // 부드러운 스크롤 함수
  const smoothScrollTo = useCallback(
    (targetLeft: number, targetTop: number, duration: number = scrollDuration) => {
      if (!gridRef.current) return;

      const startLeft = scrollPosition.scrollLeft;
      const startTop = scrollPosition.scrollTop;
      const distanceLeft = targetLeft - startLeft;
      const distanceTop = targetTop - startTop;
      const startTime = performance.now();
      const ease = easingFunctions[scrollEasing] || easingFunctions.easeInOutQuad;

      const animateScroll = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);

        const newLeft = startLeft + distanceLeft * ease(progress);
        const newTop = startTop + distanceTop * ease(progress);

        if (gridRef.current) {
          gridRef.current.scrollToPosition({
            scrollLeft: newLeft,
            scrollTop: newTop,
          });
        }

        if (progress < 1) {
          requestAnimationFrame(animateScroll);
        }
      };

      requestAnimationFrame(animateScroll);
    },
    [scrollPosition, scrollDuration, scrollEasing]
  );

  // purchasedPixels를 기반으로 블록 상태 확인
  const getPixelAt = (x: number, y: number): GridPixel => {
    const pixel = purchasedPixels.find(
      (p) =>
        x >= p.x &&
        x < p.x + p.size &&
        y >= p.y &&
        y < p.y + p.size &&
        x === p.x &&
        y === p.y
    );
    return pixel
      ? {
          x,
          y,
          purchased: true,
          owner: pixel.owner,
          content: pixel.content,
          purchaseType: pixel.purchaseType,
        }
      : { x, y, purchased: false };
  };

  // 디바운싱된 onScroll 핸들러
  const debouncedOnScroll = debounce((scrollInfo: ScrollParams) => {
    onScroll(scrollInfo);
  }, 100);

  // 줌 레벨 변경 시 스크롤 위치 조정
  useEffect(() => {
    if (gridRef.current && focusedBlock) {
      const { x, y } = focusedBlock;
      const newX = x * zoomLevel;
      const newY = y * zoomLevel;
      const viewportWidth = gridWidth;
      const viewportHeight = gridHeight;
      const blockSize = BASE_BLOCK_SIZE * zoomLevel;
      const newScrollLeft = newX - viewportWidth / 2 + blockSize / 2;
      const newScrollTop = newY - viewportHeight / 2 + blockSize / 2;

      smoothScrollTo(Math.max(0, newScrollLeft), Math.max(0, newScrollTop));
    }
    if (gridRef.current) {
      gridRef.current.recomputeGridSize();
    }
    onGridUpdate();
  }, [zoomLevel, focusedBlock, onGridUpdate, gridWidth, gridHeight, smoothScrollTo]);

  const cellRenderer: GridCellRenderer = ({ columnIndex, rowIndex, style }) => {
    const x = columnIndex * BASE_BLOCK_SIZE;
    const y = rowIndex * BASE_BLOCK_SIZE;
    const pixel = getPixelAt(x, y);

    const isPurchased = pixel.purchased;
    const isSelected =
      selected &&
      x === selected.x &&
      y === selected.y &&
      x < selected.x + selected.size &&
      y < selected.y + selected.size;

    const blockStyle = {
      ...style,
      width: BLOCK_SIZE,
      height: BLOCK_SIZE,
      backgroundColor: isPurchased ? "blue" : "#e5e7eb",
      border: isSelected ? "2px solid #3b82f6" : "none",
      backgroundImage: isPurchased && pixel.content ? `url(${pixel.content})` : "none",
      backgroundSize: "cover",
      backgroundPosition: "center",
    };

    return (
      <TooltipProvider key={`${columnIndex}-${rowIndex}`}>
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              style={blockStyle}
              onClick={() => onBlockClick(x, y)}
              onTouchEnd={() => onBlockClick(x, y)}
              className={isSelected ? "bg-blue-200 bg-opacity-30" : ""}
            />
          </TooltipTrigger>
          {isPurchased && (
            <TooltipContent>
              <p>
                <strong>Position:</strong> ({x}, {y})
              </p>
              <p>
                <strong>Owner:</strong> {pixel.owner || "Unknown"}
              </p>
              <p>
                <strong>Content:</strong> {pixel.content || "No content"}
              </p>
              <p>
                <strong>Type:</strong> {pixel.purchaseType || "basic"}
              </p>
            </TooltipContent>
          )}
        </Tooltip>
      </TooltipProvider>
    );
  };

  return (
    <div className="relative border-2 border-gray-300 shadow-lg rounded-lg overflow-auto">
      <Grid
        ref={gridRef}
        width={gridWidth}
        height={gridHeight}
        columnCount={GRID_WIDTH / BASE_BLOCK_SIZE}
        rowCount={GRID_HEIGHT / BASE_BLOCK_SIZE}
        columnWidth={BLOCK_SIZE}
        rowHeight={BLOCK_SIZE}
        cellRenderer={cellRenderer}
        style={{ overflowX: "auto", overflowY: "auto" }}
        overscanRowCount={5}
        overscanColumnCount={5}
        onScroll={debouncedOnScroll}
      />
    </div>
  );
}