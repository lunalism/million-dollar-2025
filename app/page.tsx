// app/page.tsx
"use client";

// 필요한 모듈 임포트
import { useState, useEffect, useReducer } from "react"; // React 훅
import { usePathname } from "next/navigation"; // 현재 경로를 가져오기 위한 훅
import Image from "next/image"; // Next.js 이미지 컴포넌트
import Header from "@/components/main/Header"; // 상단 헤더 컴포넌트
import { getPixels, savePixels } from "@/lib/api"; // API 함수
import { Button } from "@/components/ui/button"; // 버튼 컴포넌트
import { Pixel, PixelMap } from "@/lib/types"; // 픽셀 타입 정의
import PixelGrid from "@/components/main/PixelGrid"; // 픽셀 그리드 컴포넌트
import PurchaseForm from "@/components/main/PurchaseForm"; // 구매 폼 컴포넌트
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch"; // 줌/팬 기능 컴포넌트
import debounce from "lodash/debounce"; // 디바운싱 유틸리티

// useReducer의 상태와 액션 타입 정의
interface PixelState {
  pixelMap: PixelMap; // 픽셀 위치를 키로 한 해시맵
  pixelList: Pixel[]; // 픽셀 리스트 (저장용)
  changedPixels: Pixel[]; // 변경된 픽셀 리스트 (API 저장용)
}

type PixelAction =
  | { type: "SET_PIXELS"; pixels: Pixel[] } // 픽셀 초기화 액션
  | { type: "ADD_PIXEL"; pixel: Pixel }; // 픽셀 추가 액션

// useReducer 리듀서 함수
const pixelReducer = (state: PixelState, action: PixelAction): PixelState => {
  switch (action.type) {
    case "SET_PIXELS": {
      // 초기 픽셀 데이터를 설정
      const newPixelMap: PixelMap = {};
      action.pixels.forEach((pixel) => {
        const key = `${pixel.x}-${pixel.y}`;
        newPixelMap[key] = pixel;
      });
      return { pixelMap: newPixelMap, pixelList: action.pixels, changedPixels: [] };
    }
    case "ADD_PIXEL": {
      // 새로운 픽셀 추가
      const key = `${action.pixel.x}-${action.pixel.y}`;
      const newPixelMap = { ...state.pixelMap, [key]: action.pixel };
      const newPixelList = [...state.pixelList, action.pixel];
      const newChangedPixels = [...state.changedPixels, action.pixel];
      return { pixelMap: newPixelMap, pixelList: newPixelList, changedPixels: newChangedPixels };
    }
    default:
      return state;
  }
};

// 홈 페이지 컴포넌트
export default function Home() {
  // 현재 경로 가져오기
  const pathname = usePathname();
  // 그리드 크기 상수
  const GRID_WIDTH = 1500; // 그리드 너비
  const GRID_HEIGHT = 1000; // 그리드 높이
  const BLOCK_SIZE = 10; // 최소 블록 크기 (10×10)

  // 상태 정의
  const [state, dispatch] = useReducer(pixelReducer, { pixelMap: {}, pixelList: [], changedPixels: [] }); // 픽셀 상태 관리
  const [selected, setSelected] = useState<{ x: number; y: number; width?: number; height?: number } | null>(null); // 선택된 블록 정보
  const [isDialogOpen, setIsDialogOpen] = useState(false); // 다이얼로그 열림/닫힘 상태
  const [zoomLevel, setZoomLevel] = useState(1); // 줌 레벨
  const [isLoading, setIsLoading] = useState(true); // 로딩 상태
  const [scrollPosition, setScrollPosition] = useState({ scrollLeft: 0, scrollTop: 0 }); // 스크롤 위치
  const [focusedBlock, setFocusedBlock] = useState<{ x: number; y: number } | null>(null); // 포커스된 블록 위치
  const [gridWidth, setGridWidth] = useState(1500); // 그리드 너비 (동적 조정)
  const [gridHeight, setGridHeight] = useState(1000); // 그리드 높이 (동적 조정)

  // localStorage에서 캐싱된 데이터 로드
  useEffect(() => {
    const loadPixels = async () => {
      setIsLoading(true); // 로딩 시작
      try {
        const cachedPixels = localStorage.getItem("purchasedPixels"); // 캐싱된 데이터 확인
        if (cachedPixels) {
          const pixels = JSON.parse(cachedPixels);
          dispatch({ type: "SET_PIXELS", pixels }); // 캐싱된 데이터로 상태 초기화
          setIsLoading(false);
          return;
        }

        const savedPixels: Pixel[] = await getPixels(); // API에서 데이터 가져오기
        dispatch({ type: "SET_PIXELS", pixels: savedPixels });
        localStorage.setItem("purchasedPixels", JSON.stringify(savedPixels)); // 캐싱
      } catch (error) {
        console.error("Failed to load pixels:", error); // 에러 처리
      } finally {
        setIsLoading(false); // 로딩 종료
      }
    };
    loadPixels();
  }, []); // 컴포넌트 마운트 시 실행

  // 상태 변경 시 디바운싱된 저장 호출
  useEffect(() => {
    const saveToLocalStorage = debounce((pixelList: Pixel[]) => {
      localStorage.setItem("purchasedPixels", JSON.stringify(pixelList)); // localStorage에 저장
    }, 1000);

    const saveToApi = debounce(async (changedPixels: Pixel[]) => {
      if (changedPixels.length > 0) {
        await savePixels(changedPixels); // API에 변경된 픽셀 저장
      }
    }, 1000);

    saveToLocalStorage(state.pixelList);
    saveToApi(state.changedPixels);

    return () => {
      saveToLocalStorage.cancel(); // 디바운싱 취소
      saveToApi.cancel();
    };
  }, [state.pixelList, state.changedPixels]); // pixelList, changedPixels 변경 시 실행

  // 페이지 종료 시 최종 저장
  useEffect(() => {
    const handleBeforeUnload = async () => {
      if (state.pixelList.length > 0) {
        const saveToLocalStorage = debounce((pixelList: Pixel[]) => {
          localStorage.setItem("purchasedPixels", JSON.stringify(pixelList));
        }, 1000);

        const saveToApi = debounce(async (changedPixels: Pixel[]) => {
          if (changedPixels.length > 0) {
            await savePixels(changedPixels);
          }
        }, 1000);

        saveToLocalStorage.cancel();
        saveToApi.cancel();
        localStorage.setItem("purchasedPixels", JSON.stringify(state.pixelList));
        await savePixels(state.changedPixels);
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload); // 페이지 종료 시 이벤트 리스너 추가

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload); // 클린업
      handleBeforeUnload();
    };
  }, [state.pixelList, state.changedPixels]); // pixelList, changedPixels 변경 시 실행

  // 그리드 크기 동적 조정
  useEffect(() => {
    const updateGridSize = () => {
      const windowWidth = window.innerWidth;
      const maxWidth = Math.min(windowWidth - 32, GRID_WIDTH);
      const aspectRatio = GRID_WIDTH / GRID_HEIGHT;
      const newWidth = Math.min(maxWidth, windowWidth - 32);
      const newHeight = newWidth / aspectRatio;
      setGridWidth(newWidth); // 그리드 너비 업데이트
      setGridHeight(newHeight); // 그리드 높이 업데이트
    };

    updateGridSize();
    window.addEventListener("resize", updateGridSize); // 창 크기 변경 시 이벤트 리스너 추가

    return () => window.removeEventListener("resize", updateGridSize); // 클린업
  }, []); // 컴포넌트 마운트 시 실행

  // 판매된 픽셀 수와 비율 계산
  const soldPixels = state.pixelList.reduce((total, pixel) => total + pixel.size * pixel.size, 0);
  const totalPixels = GRID_WIDTH * GRID_HEIGHT;
  const soldPercentage = ((soldPixels / totalPixels) * 100).toFixed(2);

  // 블록 클릭 시 다이얼로그 열기
  const handleBlockClick = (x: number, y: number) => {
    setSelected({ x, y });
    setIsDialogOpen(true); // 다이얼로그 열기
  };

  // Buy Pixel Now 버튼 클릭 시 다이얼로그 열기
  const handleBuyPixelClick = () => {
    // 기본 좌표 (0, 0)으로 설정
    handleBlockClick(0, 0);
  };

  // 구매 확인 시
  const handlePurchase = (pixel: Pixel) => {
    dispatch({ type: "ADD_PIXEL", pixel }); // 새로운 픽셀 추가
  };

  // 그리드 업데이트 핸들러
  const handleGridUpdate = () => {
    // 그리드 업데이트 후 추가 작업이 필요하면 여기에
  };

  // 줌 인 버튼 클릭 시
  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(prev + 0.5, 5)); // 줌 레벨 증가 (최대 5배)
  };

  // 줌 아웃 버튼 클릭 시
  const handleZoomOut = () => {
    setZoomLevel((prev) => Math.max(prev - 0.5, 0.5)); // 줌 레벨 감소 (최소 0.5배)
  };

  // 스크롤 핸들러
  const handleScroll = (scrollInfo: { scrollLeft: number; scrollTop: number }) => {
    setScrollPosition(scrollInfo); // 스크롤 위치 업데이트
    const viewportWidth = gridWidth;
    const viewportHeight = gridHeight;
    const blockSize = BLOCK_SIZE * zoomLevel;
    const centerX = (scrollInfo.scrollLeft + viewportWidth / 2) / blockSize;
    const centerY = (scrollInfo.scrollTop + viewportHeight / 2) / blockSize;
    const blockX = Math.floor(centerX) * BLOCK_SIZE;
    const blockY = Math.floor(centerY) * BLOCK_SIZE;
    setFocusedBlock({ x: blockX, y: blockY }); // 포커스된 블록 위치 업데이트
  };

  // 핀치 줌 핸들러
  const handlePinchZoom = (ref: { state: { scale: number; positionX: number; positionY: number } }) => {
    const { scale, positionX, positionY } = ref.state;
    setZoomLevel(scale); // 줌 레벨 업데이트

    const viewportWidth = gridWidth;
    const viewportHeight = gridHeight;
    const blockSize = BLOCK_SIZE * scale;
    const centerX = (-positionX + viewportWidth / 2) / blockSize;
    const centerY = (-positionY + viewportHeight / 2) / blockSize;
    const blockX = Math.floor(centerX) * BLOCK_SIZE;
    const blockY = Math.floor(centerY) * BLOCK_SIZE;
    setFocusedBlock({ x: blockX, y: blockY }); // 포커스된 블록 위치 업데이트
  };

  // 로딩 중일 때 표시
  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center">
        <p className="text-lg text-gray-600">Loading...</p>
      </div>
    );
  }

  return (
    // 메인 레이아웃: 최소 높이 화면 전체, 배경 흰색, 세로 방향 플렉스, 상하 패딩 8
    <div className="min-h-screen bg-white flex flex-col py-8">
      {/* 헤더 컴포넌트 */}
      <Header activePath={pathname} />
      {/* 메인 콘텐츠: 중앙 정렬, 좌우 패딩 4 */}
      <div className="flex flex-col items-center px-4">
        {/* 안내 문구 */}
        <p className="text-lg text-gray-600 mb-4">
          Support an iOS app startup by buying pixels! 1 pixel = $1
        </p>
        {/* 판매된 픽셀 비율 표시 */}
        <div className="mb-4 flex flex-col items-center w-full max-w-md">
          <p className="text-sm text-gray-500">
            Sold: {soldPixels} pixels ({soldPercentage}%)
          </p>
          <div className="w-full h-3 bg-gray-200 rounded-full mt-2 shadow-sm">
            <div
              className="h-3 bg-blue-500 rounded-full transition-all duration-300"
              style={{ width: `${soldPercentage}%` }}
            />
          </div>
        </div>

        {/* Buy Pixel Now 버튼 */}
        <Button
          onClick={handleBuyPixelClick}
          className="mb-4 bg-blue-600 hover:bg-blue-700 text-white text-sm sm:text-base px-4 sm:px-6 py-2 sm:py-3 rounded-lg"
        >
          Buy Pixel Now
        </Button>

        {/* 줌 버튼 그룹 */}
        <div className="flex items-center space-x-2 mb-4">
          <Button onClick={handleZoomIn} className="bg-blue-600 hover:bg-blue-700 text-sm sm:text-base px-3 sm:px-4 py-1 sm:py-2">
            Zoom In
          </Button>
          <span className="text-sm text-gray-600">
            Zoom: {zoomLevel.toFixed(1)}x
          </span>
          <Button onClick={handleZoomOut} className="bg-blue-600 hover:bg-blue-700 text-sm sm:text-base px-3 sm:px-4 py-1 sm:py-2">
            Zoom Out
          </Button>
        </div>

        {/* 그리드 영역 */}
        <div className="relative">
          <TransformWrapper
            initialScale={1}
            minScale={0.5}
            maxScale={5}
            onZoom={handlePinchZoom}
            panning={{ disabled: true }}
          >
            <TransformComponent>
              <div style={{ width: gridWidth, height: gridHeight }}>
                <PixelGrid
                  pixelMap={state.pixelMap}
                  selected={selected}
                  zoomLevel={zoomLevel}
                  focusedBlock={focusedBlock}
                  scrollPosition={scrollPosition}
                  onBlockClick={handleBlockClick}
                  onGridUpdate={handleGridUpdate}
                  onScroll={handleScroll}
                  gridWidth={gridWidth}
                  gridHeight={gridHeight}
                  scrollDuration={500}
                  scrollEasing="easeOutQuad"
                />
              </div>
            </TransformComponent>
          </TransformWrapper>

          {/* 중앙 이미지 */}
          <Image
            src="/example.png"
            alt="Example Image"
            width={300}
            height={300}
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10 w-[300px] h-[300px] sm:w-[200px] sm:h-[200px] object-contain"
            quality={75}
            priority
          />
        </div>

        {/* 픽셀 구매 다이얼로그 */}
        <PurchaseForm
          selected={selected}
          isOpen={isDialogOpen}
          onClose={() => setIsDialogOpen(false)}
          onPurchase={handlePurchase}
        />
      </div>
    </div>
  );
}