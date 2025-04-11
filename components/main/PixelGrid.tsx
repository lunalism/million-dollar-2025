import { useRef, useEffect, useCallback, memo } from "react";
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

// type EasingFunction = (t: number) => number;

type PixelGridProps = {
  pixelMap: Record<string, Pixel>;
  selected: { x: number; y: number; size: number } | null;
  zoomLevel: number;
  focusedBlock: { x: number; y: number } | null;
  scrollPosition: { scrollLeft: number; scrollTop: number };
  onBlockClick: (x: number, y: number) => void;
  onGridUpdate: () => void;
  onScroll: (scrollInfo: ScrollParams) => void;
  gridWidth: number;
  gridHeight: number;
  scrollDuration?: number;
  scrollEasing?: keyof typeof easingFunctions;
};

// CellRenderer 컴포넌트 prop 타입 정의
interface CellRendererProps {
  columnIndex: number;
  rowIndex: number;
  style: React.CSSProperties;
  isVisible: boolean;
  pixelMap: Record<string, Pixel>;
  selected: { x: number; y: number; size: number } | null;
  zoomLevel: number;
  onBlockClick: (x: number, y: number) => void;
}

const CellRenderer = ({
  columnIndex,
  rowIndex,
  style,
  isVisible,
  pixelMap,
  selected,
  zoomLevel,
  onBlockClick,
}: CellRendererProps) => {
  const BASE_BLOCK_SIZE = 10;
  const BLOCK_SIZE = BASE_BLOCK_SIZE * zoomLevel;

  const x = columnIndex * BASE_BLOCK_SIZE;
  const y = rowIndex * BASE_BLOCK_SIZE;
  const pixel = pixelMap[`${x}-${y}`];
  const gridPixel: GridPixel = pixel
    ? {
        x,
        y,
        purchased: true,
        owner: pixel.owner,
        content: pixel.content,
        purchaseType: pixel.purchaseType,
      }
    : { x, y, purchased: false };

  const isPurchased = gridPixel.purchased;
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
    backgroundImage: isPurchased && gridPixel.content ? `url(${gridPixel.content})` : "none",
    backgroundSize: "cover",
    backgroundPosition: "center",
  };

  return (
    <TooltipProvider>
      <div
        style={blockStyle}
        onClick={() => onBlockClick(x, y)}
        onTouchEnd={() => onBlockClick(x, y)}
        className={isSelected ? "bg-blue-200 bg-opacity-30" : ""}
      >
        {isVisible && isPurchased && (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="w-full h-full" />
            </TooltipTrigger>
            <TooltipContent>
              <p>
                <strong>Position:</strong> ({x}, {y})
              </p>
              <p>
                <strong>Owner:</strong> {gridPixel.owner || "Unknown"}
              </p>
              <p>
                <strong>Content:</strong> {gridPixel.content || "No content"}
              </p>
              <p>
                <strong>Type:</strong> {gridPixel.purchaseType || "basic"}
              </p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </TooltipProvider>
  );
};

// displayName 설정 및 memo 적용
CellRenderer.displayName = "CellRenderer";
const MemoizedCellRenderer = memo(
  CellRenderer,
  (prevProps, nextProps) =>
    prevProps.columnIndex === nextProps.columnIndex &&
    prevProps.rowIndex === nextProps.rowIndex &&
    prevProps.style === nextProps.style &&
    prevProps.isVisible === nextProps.isVisible &&
    prevProps.pixelMap === nextProps.pixelMap &&
    prevProps.selected === nextProps.selected &&
    prevProps.zoomLevel === nextProps.zoomLevel &&
    prevProps.onBlockClick === nextProps.onBlockClick
);

// PixelGrid 컴포넌트 메모이제이션
const PixelGrid = memo(
  ({
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
    scrollDuration = 300,
    scrollEasing = "easeInOutQuad",
  }: PixelGridProps) => {
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

    const cellRenderer: GridCellRenderer = ({ key, ...props }) => (
      <MemoizedCellRenderer
        key={key}
        {...props}
        pixelMap={pixelMap}
        selected={selected}
        zoomLevel={zoomLevel}
        onBlockClick={onBlockClick}
      />
    );

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
          overscanRowCount={2}
          overscanColumnCount={2}
          onScroll={debouncedOnScroll}
        />
      </div>
    );
  },
  (prevProps, nextProps) =>
    prevProps.pixelMap === nextProps.pixelMap &&
    prevProps.selected === nextProps.selected &&
    prevProps.zoomLevel === nextProps.zoomLevel &&
    prevProps.focusedBlock === nextProps.focusedBlock &&
    prevProps.scrollPosition === nextProps.scrollPosition &&
    prevProps.onBlockClick === nextProps.onBlockClick &&
    prevProps.onGridUpdate === nextProps.onGridUpdate &&
    prevProps.onScroll === nextProps.onScroll &&
    prevProps.gridWidth === nextProps.gridWidth &&
    prevProps.gridHeight === nextProps.gridHeight &&
    prevProps.scrollDuration === nextProps.scrollDuration &&
    prevProps.scrollEasing === nextProps.scrollEasing
);

PixelGrid.displayName = "PixelGrid";

export default PixelGrid;