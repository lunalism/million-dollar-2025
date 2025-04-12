// hooks/usePixelData.ts
import { useState, useEffect, useReducer } from "react";
import { getPixels, savePixels } from "@/lib/api";
import { Pixel, PixelMap } from "@/lib/types";
import debounce from "lodash/debounce";

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

export const usePixelData = () => {
  const [state, dispatch] = useReducer(pixelReducer, { pixelMap: {}, pixelList: [], changedPixels: [] });
  const [isLoading, setIsLoading] = useState(true);

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

  const addPixel = (pixel: Pixel) => {
    dispatch({ type: "ADD_PIXEL", pixel });
  };

  return {
    pixelMap: state.pixelMap,
    pixelList: state.pixelList,
    isLoading,
    addPixel,
  };
};