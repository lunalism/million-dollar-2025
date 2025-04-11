// components/main/PixelGrid.tsx

// 필요한 모듈 임포트
import { useRef, useEffect, useCallback, memo } from "react"; // React 훅 및 메모이제이션 유틸리티
import { Grid, GridCellRenderer, ScrollParams } from "react-virtualized"; // 가상화된 그리드 컴포넌트
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"; // 툴팁 컴포넌트
import { GridPixel, Pixel } from "@/lib/types"; // 픽셀 타입 정의
import debounce from "lodash/debounce"; // 디바운싱 유틸리티

// 이징 함수 정의: 스크롤 애니메이션에 사용할 이징 함수들
const easingFunctions = {
  linear: (t: number) => t, // 선형 이징
  easeInQuad: (t: number) => t * t, // 이즈인 쿼드 이징
  easeOutQuad: (t: number) => t * (2 - t), // 이즈아웃 쿼드 이징
  easeInOutQuad: (t: number) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t), // 이즈인아웃 쿼드 이징
};

// 이징 함수 타입 정의
// type EasingFunction = (t: number) => number;

// PixelGrid 컴포넌트의 props 타입 정의
type PixelGridProps = {
  pixelMap: Record<string, Pixel>; // 픽셀 위치를 키로 한 해시맵
  selected: { x: number; y: number; size: number } | null; // 선택된 블록 정보
  zoomLevel: number; // 현재 줌 레벨
  focusedBlock: { x: number; y: number } | null; // 포커스된 블록 위치
  scrollPosition: { scrollLeft: number; scrollTop: number }; // 현재 스크롤 위치
  onBlockClick: (x: number, y: number) => void; // 블록 클릭 시 호출되는 콜백
  onGridUpdate: () => void; // 그리드 업데이트 시 호출되는 콜백
  onScroll: (scrollInfo: ScrollParams) => void; // 스크롤 시 호출되는 콜백
  gridWidth: number; // 그리드 너비
  gridHeight: number; // 그리드 높이
  scrollDuration?: number; // 스크롤 애니메이션 지속 시간 (기본값: 300ms)
  scrollEasing?: keyof typeof easingFunctions; // 스크롤 이징 함수 (기본값: easeInOutQuad)
};

// CellRenderer 컴포넌트의 props 타입 정의
interface CellRendererProps {
  columnIndex: number; // 열 인덱스
  rowIndex: number; // 행 인덱스
  style: React.CSSProperties; // 셀 스타일 (react-virtualized에서 제공)
  isVisible: boolean; // 셀이 뷰포트에 보이는지 여부
  pixelMap: Record<string, Pixel>; // 픽셀 위치를 키로 한 해시맵
  selected: { x: number; y: number; size: number } | null; // 선택된 블록 정보
  zoomLevel: number; // 현재 줌 레벨
  scrollPosition: { scrollLeft: number; scrollTop: number }; // 현재 스크롤 위치
  gridWidth: number; // 그리드 너비
  gridHeight: number; // 그리드 높이
  onBlockClick: (x: number, y: number) => void; // 블록 클릭 시 호출되는 콜백
}

// 개별 셀을 렌더링하는 컴포넌트
const CellRenderer = ({
  columnIndex,
  rowIndex,
  style,
  isVisible,
  pixelMap,
  selected,
  zoomLevel,
  scrollPosition,
  gridWidth,
  gridHeight,
  onBlockClick,
}: CellRendererProps) => {
  // 기본 블록 크기 상수
  const BASE_BLOCK_SIZE = 10; // 기본 블록 크기 (10×10 픽셀)
  const BLOCK_SIZE = BASE_BLOCK_SIZE * zoomLevel; // 줌 레벨에 따른 실제 블록 크기

  // 블록의 좌표 계산
  const x = columnIndex * BASE_BLOCK_SIZE; // x 좌표
  const y = rowIndex * BASE_BLOCK_SIZE; // y 좌표

  // 해당 좌표의 픽셀 정보 가져오기
  const pixel = pixelMap[`${x}-${y}`];
  const gridPixel: GridPixel = pixel
    ? {
        x,
        y,
        purchased: true, // 구매된 픽셀
        owner: pixel.owner,
        content: pixel.content,
        purchaseType: pixel.purchaseType,
      }
    : { x, y, purchased: false }; // 구매되지 않은 픽셀

  // 구매 여부 및 선택 여부 확인
  const isPurchased = gridPixel.purchased; // 해당 픽셀이 구매되었는지
  const isSelected =
    selected &&
    x === selected.x &&
    y === selected.y &&
    x < selected.x + selected.size &&
    y < selected.y + selected.size; // 해당 픽셀이 선택된 블록에 포함되는지

  // 뷰포트 범위 계산: 현재 보이는 영역
  const viewportLeft = scrollPosition.scrollLeft;
  const viewportTop = scrollPosition.scrollTop;
  const viewportRight = viewportLeft + gridWidth;
  const viewportBottom = viewportTop + gridHeight;

  // 블록의 픽셀 좌표 계산: 줌 레벨 적용
  const blockLeft = x * zoomLevel;
  const blockTop = y * zoomLevel;
  const blockRight = blockLeft + BLOCK_SIZE;
  const blockBottom = blockTop + BLOCK_SIZE;

  // 뷰포트 근처 여부 확인: 100px 여유 추가
  const isNearViewport =
    blockRight >= viewportLeft - 100 &&
    blockLeft <= viewportRight + 100 &&
    blockBottom >= viewportTop - 100 &&
    blockTop <= viewportBottom + 100;

  // 블록 스타일 정의
  const blockStyle = {
    ...style,
    width: BLOCK_SIZE, // 블록 너비
    height: BLOCK_SIZE, // 블록 높이
    backgroundColor: isPurchased ? "blue" : "#e5e7eb", // 구매 여부에 따라 배경색 설정
    border: isSelected ? "2px solid #3b82f6" : "none", // 선택 여부에 따라 테두리 설정
    backgroundImage: isPurchased && gridPixel.content ? `url(${gridPixel.content})` : "none", // 콘텐츠 이미지 설정
    backgroundSize: "cover", // 이미지 크기 조정
    backgroundPosition: "center", // 이미지 위치 중앙
  };

  return (
    // 블록 요소
    <div
      style={blockStyle}
      onClick={() => onBlockClick(x, y)} // 클릭 시 콜백 호출
      onTouchEnd={() => onBlockClick(x, y)} // 터치 종료 시 콜백 호출 (모바일 지원)
      className={isSelected ? "bg-blue-200 bg-opacity-30" : ""} // 선택된 경우 반투명 배경 추가
    >
      {/* 툴팁: 뷰포트에 보이고 근처에 있으며 구매된 경우 표시 */}
      {isVisible && isNearViewport && isPurchased && (
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
  );
};

// CellRenderer 컴포넌트 설정
CellRenderer.displayName = "CellRenderer"; // 디버깅을 위한 displayName 설정
// 메모이제이션 적용: 불필요한 리렌더링 방지
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
    prevProps.scrollPosition === nextProps.scrollPosition &&
    prevProps.gridWidth === nextProps.gridWidth &&
    prevProps.gridHeight === nextProps.gridHeight &&
    prevProps.onBlockClick === nextProps.onBlockClick
);

// PixelGrid 컴포넌트: 가상화된 그리드를 렌더링
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
    // 그리드 크기 상수
    const GRID_WIDTH = 1500; // 그리드 너비
    const GRID_HEIGHT = 1000; // 그리드 높이
    const BASE_BLOCK_SIZE = 10; // 기본 블록 크기
    const BLOCK_SIZE = BASE_BLOCK_SIZE * zoomLevel; // 줌 레벨에 따른 실제 블록 크기
    const gridRef = useRef<Grid>(null); // Grid 컴포넌트 참조

    // 부드러운 스크롤 함수: 지정된 위치로 부드럽게 스크롤
    const smoothScrollTo = useCallback(
      (targetLeft: number, targetTop: number, duration: number = scrollDuration) => {
        if (!gridRef.current) return; // Grid 참조가 없으면 종료

        const startLeft = scrollPosition.scrollLeft; // 시작 스크롤 좌표
        const startTop = scrollPosition.scrollTop;
        const distanceLeft = targetLeft - startLeft; // 이동 거리
        const distanceTop = targetTop - startTop;
        const startTime = performance.now(); // 시작 시간
        const ease = easingFunctions[scrollEasing] || easingFunctions.easeInOutQuad; // 이징 함수 선택

        // 스크롤 애니메이션 함수
        const animateScroll = (currentTime: number) => {
          const elapsed = currentTime - startTime;
          const progress = Math.min(elapsed / duration, 1); // 진행률 (0~1)

          const newLeft = startLeft + distanceLeft * ease(progress); // 새로운 스크롤 위치
          const newTop = startTop + distanceTop * ease(progress);

          if (gridRef.current) {
            gridRef.current.scrollToPosition({
              scrollLeft: newLeft,
              scrollTop: newTop,
            });
          }

          if (progress < 1) {
            requestAnimationFrame(animateScroll); // 애니메이션 계속
          }
        };

        requestAnimationFrame(animateScroll); // 애니메이션 시작
      },
      [scrollPosition, scrollDuration, scrollEasing] // 의존성 배열
    );

    // 디바운싱된 onScroll 핸들러: 스크롤 이벤트 디바운싱
    const debouncedOnScroll = debounce((scrollInfo: ScrollParams) => {
      onScroll(scrollInfo); // 스크롤 콜백 호출
    }, 100);

    // 줌 레벨 변경 시 스크롤 위치 조정
    useEffect(() => {
      if (gridRef.current && focusedBlock) {
        const { x, y } = focusedBlock;
        const newX = x * zoomLevel; // 줌 레벨에 따른 새로운 x 좌표
        const newY = y * zoomLevel; // 줌 레벨에 따른 새로운 y 좌표
        const viewportWidth = gridWidth;
        const viewportHeight = gridHeight;
        const blockSize = BASE_BLOCK_SIZE * zoomLevel;
        const newScrollLeft = newX - viewportWidth / 2 + blockSize / 2; // 중앙으로 스크롤 위치 조정
        const newScrollTop = newY - viewportHeight / 2 + blockSize / 2;

        smoothScrollTo(Math.max(0, newScrollLeft), Math.max(0, newScrollTop)); // 부드러운 스크롤 실행
      }
      if (gridRef.current) {
        gridRef.current.recomputeGridSize(); // 그리드 크기 재계산
      }
      onGridUpdate(); // 그리드 업데이트 콜백 호출
    }, [zoomLevel, focusedBlock, onGridUpdate, gridWidth, gridHeight, smoothScrollTo]); // 의존성 배열

    // 셀 렌더링 함수: react-virtualized에서 호출
    const cellRenderer: GridCellRenderer = ({ key, ...props }) => (
      <MemoizedCellRenderer
        key={key}
        {...props}
        pixelMap={pixelMap}
        selected={selected}
        zoomLevel={zoomLevel}
        scrollPosition={scrollPosition}
        gridWidth={gridWidth}
        gridHeight={gridHeight}
        onBlockClick={onBlockClick}
      />
    );

    return (
      // 툴팁 제공자: 모든 셀에 툴팁 기능 제공
      <TooltipProvider>
        {/* 그리드 컨테이너: 테두리, 그림자, 둥근 모서리, 오버플로우 자동 */}
        <div className="relative border-2 border-gray-300 shadow-lg rounded-lg overflow-auto">
          {/* 가상화된 그리드 컴포넌트 */}
          <Grid
            ref={gridRef}
            width={gridWidth}
            height={gridHeight}
            columnCount={GRID_WIDTH / BASE_BLOCK_SIZE} // 열 개수
            rowCount={GRID_HEIGHT / BASE_BLOCK_SIZE} // 행 개수
            columnWidth={BLOCK_SIZE} // 열 너비
            rowHeight={BLOCK_SIZE} // 행 높이
            cellRenderer={cellRenderer} // 셀 렌더링 함수
            style={{ overflowX: "auto", overflowY: "auto" }} // 스크롤 스타일
            overscanRowCount={2} // 세로 오버스캔: 추가 렌더링 행 수
            overscanColumnCount={2} // 가로 오버스캔: 추가 렌더링 열 수
            onScroll={debouncedOnScroll} // 스크롤 이벤트 핸들러
          />
        </div>
      </TooltipProvider>
    );
  },
  // 메모이제이션 비교 함수: 불필요한 리렌더링 방지
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

// PixelGrid 컴포넌트 설정
PixelGrid.displayName = "PixelGrid"; // 디버깅을 위한 displayName 설정

export default PixelGrid; // 컴포넌트 내보내기