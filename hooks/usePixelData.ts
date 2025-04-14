// hooks/usePixelData.ts
import { useState, useEffect, useReducer } from "react";
import { getPixels, savePixels } from "@/lib/api";
import { Pixel, PixelMap } from "@/lib/types";
import { supabase } from "@/lib/supabase";
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
    (typeof pixel.content === "string" || pixel.content === null) &&
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
        // Supabase에서 픽셀 데이터 로드
        const { data: pixelsData, error: fetchError } = await supabase.from("pixels").select("*");

        if (fetchError) {
          throw fetchError;
        }

        const pixels = pixelsData as Pixel[];
        dispatch({ type: "SET_PIXELS", pixels });

        // localStorage에 저장 (캐싱)
        localStorage.setItem("purchasedPixels", JSON.stringify(pixels));
      } catch (error) {
        console.error("Failed to load pixels from Supabase:", error);
        // Supabase에서 로드 실패 시 localStorage에서 시도
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
        } catch (apiError) {
          console.error("Failed to load pixels from API:", apiError);
          dispatch({ type: "SET_PIXELS", pixels: [] });
        }
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
        try {
          await savePixels(changedPixels);
        } catch (error) {
          console.error("Failed to save pixels:", error);
        }
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

  const addPixel = async (pixel: Pixel) => {
    try {
      // 중복 구매 방지: Supabase에서 해당 좌표 확인
      const { data: existingPixel, error: fetchError } = await supabase
        .from("pixels")
        .select("*")
        .eq("x", pixel.x)
        .eq("y", pixel.y)
        .single();

      if (fetchError && fetchError.code !== "PGRST116") {
        throw fetchError;
      }

      if (existingPixel) {
        throw new Error("This pixel has already been purchased.");
      }

      // 중복 구매 방지: 선택한 영역에 겹치는 픽셀이 있는지 확인
      const newLeft = pixel.x;
      const newRight = pixel.x + pixel.width;
      const newTop = pixel.y;
      const newBottom = pixel.y + pixel.height;

      for (const existingPixel of state.pixelList) {
        const existingLeft = existingPixel.x;
        const existingRight = existingPixel.x + existingPixel.width;
        const existingTop = existingPixel.y;
        const existingBottom = existingPixel.y + existingPixel.height;

        const overlaps =
          newLeft < existingRight &&
          newRight > existingLeft &&
          newTop < existingBottom &&
          newBottom > existingTop;

        if (overlaps) {
          throw new Error("Selected area overlaps with an existing pixel block.");
        }
      }

      // Supabase에 픽셀 저장
      const { error: insertError } = await supabase
        .from("pixels")
        .insert({
          x: pixel.x,
          y: pixel.y,
          width: pixel.width,
          height: pixel.height,
          owner: pixel.owner,
          content: pixel.content,
          purchase_type: pixel.purchaseType,
          content_width: pixel.content_width,
          content_height: pixel.content_height,
        });

      if (insertError) {
        throw insertError;
      }

      // 상태 업데이트
      dispatch({ type: "ADD_PIXEL", pixel });
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new Error("Failed to add pixel: " + error.message);
      } else {
        throw new Error("Failed to add pixel: Unknown error");
      }
    }
  };

  return {
    pixelMap: state.pixelMap,
    pixelList: state.pixelList,
    isLoading,
    addPixel,
  };
};