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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"; // 다이얼로그 컴포넌트
import { Input } from "@/components/ui/input"; // 입력 필드 컴포넌트

// useReducer의 상태와 액션 타입 정의
interface PixelState {
  pixelMap: PixelMap;
  pixelList: Pixel[];
  changedPixels: Pixel[];
}

type PixelAction =
  | { type: "SET_PIXELS"; pixels: Pixel[] }
  | { type: "ADD_PIXEL"; pixel: Pixel };

// 타입 가드: Pixel 타입인지 확인
const isPixel = (data: unknown): data is Pixel => {
  if (typeof data !== "object" || data === null) return false;

  const pixel = data as Record<string, unknown>;

  return (
    "x" in pixel &&
    typeof pixel.x === "number" &&
    "y" in pixel &&
    typeof pixel.y === "number" &&
    "width" in pixel &&
    typeof pixel.width === "number" &&
    "height" in pixel &&
    typeof pixel.height === "number" &&
    "owner" in pixel &&
    typeof pixel.owner === "string" &&
    "content" in pixel &&
    typeof pixel.content === "string" &&
    "purchaseType" in pixel &&
    (pixel.purchaseType === "basic" || pixel.purchaseType === "premium")
  );
};

// 타입 가드: Pixel[] 타입인지 확인
const isPixelArray = (data: unknown): data is Pixel[] => {
  return Array.isArray(data) && data.every(isPixel);
};

// useReducer 리듀서 함수
const pixelReducer = (state: PixelState, action: PixelAction): PixelState => {
  switch (action.type) {
    case "SET_PIXELS": {
      const newPixelMap: PixelMap = {};
      action.pixels.forEach((pixel) => {
        const key = `${pixel.x}-${pixel.y}`;
        newPixelMap[key] = pixel;
      });
      return { pixelMap: newPixelMap, pixelList: action.pixels, changedPixels: [] };
    }
    case "ADD_PIXEL": {
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
  const pathname = usePathname();
  const GRID_WIDTH = 1500;
  const GRID_HEIGHT = 1000;
  const BLOCK_SIZE = 10;

  const [state, dispatch] = useReducer(pixelReducer, { pixelMap: {}, pixelList: [], changedPixels: [] });
  const [selected, setSelected] = useState<{ x: number; y: number; width?: number; height?: number } | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCoordinateDialogOpen, setIsCoordinateDialogOpen] = useState(false);
  const [coordinateX, setCoordinateX] = useState<string>("0");
  const [coordinateY, setCoordinateY] = useState<string>("0");
  const [coordinateError, setCoordinateError] = useState<string>("");
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [scrollPosition, setScrollPosition] = useState({ scrollLeft: 0, scrollTop: 0 });
  const [focusedBlock, setFocusedBlock] = useState<{ x: number; y: number } | null>(null);
  const [gridWidth, setGridWidth] = useState(1500);
  const [gridHeight, setGridHeight] = useState(1000);

  useEffect(() => {
    const loadPixels = async () => {
      setIsLoading(true);
      try {
        const cachedPixels: string | null = localStorage.getItem("purchasedPixels");
        let pixels: Pixel[] = [];
        if (cachedPixels) {
          const parsedPixels: unknown = JSON.parse(cachedPixels);
          if (isPixelArray(parsedPixels)) {
            pixels = parsedPixels;
          } else {
            console.warn("Invalid pixel data in localStorage, resetting to empty array.");
            pixels = [];
            localStorage.setItem("purchasedPixels", JSON.stringify(pixels));
          }
        } else {
          pixels = await getPixels();
          localStorage.setItem("purchasedPixels", JSON.stringify(pixels));
        }
        dispatch({ type: "SET_PIXELS", pixels });
      } catch (error) {
        console.error("Failed to load pixels:", error);
        dispatch({ type: "SET_PIXELS", pixels: [] });
      } finally {
        setIsLoading(false);
      }
    };
    loadPixels();
  }, []);

  useEffect(() => {
    const saveToLocalStorage = debounce((pixelList: Pixel[]) => {
      localStorage.setItem("purchasedPixels", JSON.stringify(pixelList));
    }, 1000);

    const saveToApi = debounce(async (changedPixels: Pixel[]) => {
      if (changedPixels.length > 0) {
        await savePixels(changedPixels);
      }
    }, 1000);

    saveToLocalStorage(state.pixelList);
    saveToApi(state.changedPixels);

    return () => {
      saveToLocalStorage.cancel();
      saveToApi.cancel();
    };
  }, [state.pixelList, state.changedPixels]);

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (state.pixelList.length > 0) {
        localStorage.setItem("purchasedPixels", JSON.stringify(state.pixelList));
        event.preventDefault();
        event.returnValue = "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      localStorage.setItem("purchasedPixels", JSON.stringify(state.pixelList));
    };
  }, [state.pixelList]);

  useEffect(() => {
    const updateGridSize = () => {
      const windowWidth = window.innerWidth;
      const maxWidth = Math.min(windowWidth - 32, GRID_WIDTH);
      const aspectRatio = GRID_WIDTH / GRID_HEIGHT;
      const newWidth = Math.min(maxWidth, windowWidth - 32);
      const newHeight = newWidth / aspectRatio;
      setGridWidth(newWidth);
      setGridHeight(newHeight);
    };

    updateGridSize();
    window.addEventListener("resize", updateGridSize);

    return () => window.removeEventListener("resize", updateGridSize);
  }, []);

  const soldPixels = isLoading
    ? 0
    : state.pixelList.reduce((total, pixel) => {
        const pixelWidth = typeof pixel.width === "number" ? pixel.width : 0;
        const pixelHeight = typeof pixel.height === "number" ? pixel.height : 0;
        return total + pixelWidth * pixelHeight;
      }, 0);
  const totalPixels = GRID_WIDTH * GRID_HEIGHT;
  const soldPercentage = isLoading || totalPixels === 0
    ? "0.00"
    : ((soldPixels / totalPixels) * 100).toFixed(2);

  const handleBlockClick = (x: number, y: number) => {
    setSelected({ x, y });
    setIsDialogOpen(true);
  };

  const handleBuyPixelClick = () => {
    setIsCoordinateDialogOpen(true);
  };

  const handleCoordinateSubmit = () => {
    const x = parseInt(coordinateX, 10);
    const y = parseInt(coordinateY, 10);

    if (isNaN(x) || isNaN(y)) {
      setCoordinateError("Coordinates must be valid numbers.");
      return;
    }

    if (x < 0 || x > GRID_WIDTH - BLOCK_SIZE || y < 0 || y > GRID_HEIGHT - BLOCK_SIZE) {
      setCoordinateError(`Coordinates must be within the grid (x: 0 to ${GRID_WIDTH - BLOCK_SIZE}, y: 0 to ${GRID_HEIGHT - BLOCK_SIZE}).`);
      return;
    }

    setCoordinateError("");
    setSelected({ x, y });
    setIsCoordinateDialogOpen(false);
    setIsDialogOpen(true);
  };

  const handlePurchase = (pixel: Pixel) => {
    dispatch({ type: "ADD_PIXEL", pixel });
  };

  const handleGridUpdate = () => {
    // 그리드 업데이트 후 추가 작업이 필요하면 여기에
  };

  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(prev + 0.5, 5));
  };

  const handleZoomOut = () => {
    setZoomLevel((prev) => Math.max(prev - 0.5, 0.5));
  };

  const handleScroll = (scrollInfo: { scrollLeft: number; scrollTop: number }) => {
    setScrollPosition(scrollInfo);
    const viewportWidth = gridWidth;
    const viewportHeight = gridHeight;
    const blockSize = BLOCK_SIZE * zoomLevel;
    const centerX = (scrollInfo.scrollLeft + viewportWidth / 2) / blockSize;
    const centerY = (scrollInfo.scrollTop + viewportHeight / 2) / blockSize;
    const blockX = Math.floor(centerX) * BLOCK_SIZE;
    const blockY = Math.floor(centerY) * BLOCK_SIZE;
    setFocusedBlock({ x: blockX, y: blockY });
  };

  const handlePinchZoom = (ref: { state: { scale: number; positionX: number; positionY: number } }) => {
    const { scale, positionX, positionY } = ref.state;
    setZoomLevel(scale);

    const viewportWidth = gridWidth;
    const viewportHeight = gridHeight;
    const blockSize = BLOCK_SIZE * scale;
    const centerX = (-positionX + viewportWidth / 2) / blockSize;
    const centerY = (-positionY + viewportHeight / 2) / blockSize;
    const blockX = Math.floor(centerX) * BLOCK_SIZE;
    const blockY = Math.floor(centerY) * BLOCK_SIZE;
    setFocusedBlock({ x: blockX, y: blockY });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center">
        <p className="text-lg text-gray-600">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col py-8">
      <Header activePath={pathname} />
      <div className="flex flex-col items-center px-4">
        <p className="text-lg text-gray-600 mb-4">
          Support an iOS app startup by buying pixels! 1 pixel = $0.1
        </p>
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

        <Button
          onClick={handleBuyPixelClick}
          className="mb-4 bg-blue-600 hover:bg-blue-700 text-white text-sm sm:text-base px-4 sm:px-6 py-2 sm:py-3 rounded-lg"
        >
          Buy Pixel Now
        </Button>

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

        {/* 좌표 입력 다이얼로그 */}
        <Dialog open={isCoordinateDialogOpen} onOpenChange={setIsCoordinateDialogOpen}>
          <DialogContent className="sm:max-w-[425px] rounded-lg shadow-xl">
            <DialogHeader>
              <DialogTitle className="text-2xl font-semibold text-gray-900">
                Select Coordinates
              </DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="text-sm text-gray-600">
                <p className="mb-2">
                  Enter the coordinates (x, y) where you want to buy pixels.
                  <br />
                  (x: 0 to {GRID_WIDTH - BLOCK_SIZE}, y: 0 to {GRID_HEIGHT - BLOCK_SIZE})
                </p>
                <div className="flex items-center space-x-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">X</label>
                    <Input
                      type="number"
                      value={coordinateX}
                      onChange={(e) => {
                        setCoordinateX(e.target.value);
                        setCoordinateError("");
                      }}
                      placeholder="e.g., 0"
                      className="mt-1 w-full"
                      min={0}
                      max={GRID_WIDTH - BLOCK_SIZE}
                    />
                  </div>
                  <span className="text-gray-700 text-lg">,</span>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Y</label>
                    <Input
                      type="number"
                      value={coordinateY}
                      onChange={(e) => {
                        setCoordinateY(e.target.value);
                        setCoordinateError("");
                      }}
                      placeholder="e.g., 0"
                      className="mt-1 w-full"
                      min={0}
                      max={GRID_HEIGHT - BLOCK_SIZE}
                    />
                  </div>
                </div>
                {coordinateError && <p className="text-red-500 text-sm mt-1">{coordinateError}</p>}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCoordinateDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleCoordinateSubmit}
                className="bg-blue-600 hover:bg-blue-700"
                disabled={!!coordinateError}
              >
                Confirm
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* 픽셀 구매 다이얼로그 */}
        <PurchaseForm
          selected={selected}
          isOpen={isDialogOpen}
          onClose={() => setIsDialogOpen(false)}
          onPurchase={handlePurchase}
          pixelMap={state.pixelMap}
        />
      </div>
    </div>
  );
}