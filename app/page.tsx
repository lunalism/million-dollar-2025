"use client";

import { useState, useEffect, useReducer } from "react";
import { usePathname } from "next/navigation";
import Image from "next/image";
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
import PixelGrid from "@/components/main/PixelGrid";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";

// purchasedPixels 상태를 해시맵으로 관리하기 위한 타입
interface PixelMap {
  [key: string]: Pixel;
}

// useReducer의 상태와 액션 타입 정의
interface PixelState {
  pixelMap: PixelMap;
  pixelList: Pixel[];
}

type PixelAction =
  | { type: "SET_PIXELS"; pixels: Pixel[] }
  | { type: "ADD_PIXEL"; pixel: Pixel };

const pixelReducer = (state: PixelState, action: PixelAction): PixelState => {
  switch (action.type) {
    case "SET_PIXELS": {
      const newPixelMap: PixelMap = {};
      action.pixels.forEach((pixel) => {
        const key = `${pixel.x}-${pixel.y}`;
        newPixelMap[key] = pixel;
      });
      return { pixelMap: newPixelMap, pixelList: action.pixels };
    }
    case "ADD_PIXEL": {
      const key = `${action.pixel.x}-${action.pixel.y}`;
      const newPixelMap = { ...state.pixelMap, [key]: action.pixel };
      const newPixelList = [...state.pixelList, action.pixel];
      return { pixelMap: newPixelMap, pixelList: newPixelList };
    }
    default:
      return state;
  }
};

export default function Home() {
  const pathname = usePathname();
  const GRID_WIDTH = 1500;
  const GRID_HEIGHT = 1000;
  const BLOCK_SIZE = 10;

  const [state, dispatch] = useReducer(pixelReducer, { pixelMap: {}, pixelList: [] });
  const [selected, setSelected] = useState<{ x: number; y: number; size: number } | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [purchaseType, setPurchaseType] = useState<"basic" | "premium">("basic");
  const [contentUrl, setContentUrl] = useState("");
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [scrollPosition, setScrollPosition] = useState({ scrollLeft: 0, scrollTop: 0 });
  const [focusedBlock, setFocusedBlock] = useState<{ x: number; y: number } | null>(null);
  const [gridWidth, setGridWidth] = useState(1500);
  const [gridHeight, setGridHeight] = useState(1000);

  // localStorage에서 캐싱된 데이터 로드
  useEffect(() => {
    const loadPixels = async () => {
      setIsLoading(true);
      try {
        const cachedPixels = localStorage.getItem("purchasedPixels");
        if (cachedPixels) {
          const pixels = JSON.parse(cachedPixels);
          dispatch({ type: "SET_PIXELS", pixels });
          setIsLoading(false);
          return;
        }

        const savedPixels: Pixel[] = await getPixels();
        dispatch({ type: "SET_PIXELS", pixels: savedPixels });
        localStorage.setItem("purchasedPixels", JSON.stringify(savedPixels));
      } catch (error) {
        console.error("Failed to load pixels:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadPixels();
  }, []);

  // 새로고침 또는 페이지 종료 시 데이터 저장
  useEffect(() => {
    const handleBeforeUnload = async () => {
      if (state.pixelList.length > 0) {
        await savePixels(state.pixelList);
        localStorage.setItem("purchasedPixels", JSON.stringify(state.pixelList));
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      handleBeforeUnload();
    };
  }, [state.pixelList]);

  // 그리드 크기 동적 조정
  useEffect(() => {
    const updateGridSize = () => {
      const windowWidth = window.innerWidth;
      // const windowHeight = window.innerHeight;
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

  const soldPixels = state.pixelList.reduce((total, pixel) => total + pixel.size * pixel.size, 0);
  const totalPixels = GRID_WIDTH * GRID_HEIGHT;
  const soldPercentage = ((soldPixels / totalPixels) * 100).toFixed(2);

  const handleBlockClick = (x: number, y: number) => {
    setSelected({ x, y, size: BLOCK_SIZE });
    setIsDialogOpen(true);
  };

  const handlePurchase = async () => {
    if (selected) {
      console.log(`Purchased: (${selected.x}, ${selected.y}), Type: ${purchaseType}, Content: ${contentUrl}`);
      const newPixel: Pixel = {
        x: selected.x,
        y: selected.y,
        size: selected.size,
        owner: "User",
        content: contentUrl,
        purchaseType,
      };
      dispatch({ type: "ADD_PIXEL", pixel: newPixel });

      setIsDialogOpen(false);
      setSelected(null);
      setContentUrl("");
    }
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
          Support an iOS app startup by buying pixels! 1 pixel = $1
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