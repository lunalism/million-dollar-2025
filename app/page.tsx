// app/page.tsx
"use client";

// 필요한 모듈 임포트
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Image from "next/image";
import Header from "@/components/main/Header";
import { Button } from "@/components/ui/button";
import { Pixel } from "@/lib/types";
import PixelGrid from "@/components/main/PixelGrid";
import PurchaseForm from "@/components/main/PurchaseForm";
import CoordinateDialog from "@/components/main/CoordinateDialog";
import PaymentDialog from "@/components/main/PaymentDialog";
import { usePixelData } from "@/hooks/usePixelData";
import { PayPalScriptProvider } from "@paypal/react-paypal-js";
import { Toaster } from "sonner";

// PayPal 클라이언트 ID (환경 변수에서 가져옴)
const paypalClientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || "your-paypal-client-id";

// 홈 페이지 컴포넌트
export default function Home() {
  const pathname = usePathname();
  const GRID_WIDTH = 2500;
  const GRID_HEIGHT = 2000;
  const BLOCK_SIZE = 10; // 더 이상 사용하지 않지만, 호환성을 위해 유지

  const { pixelMap, pixelList, isLoading, addPixel } = usePixelData();
  const [selected, setSelected] = useState<{ x: number; y: number; width?: number; height?: number } | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCoordinateDialogOpen, setIsCoordinateDialogOpen] = useState(false);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [pendingPixel, setPendingPixel] = useState<Pixel | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [gridWidth, setGridWidth] = useState(1500);
  const [gridHeight, setGridHeight] = useState(1000);

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
    : pixelList.reduce((total, pixel) => {
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

  const handleCoordinateSubmit = (x: number, y: number) => {
    setSelected({ x, y });
    setIsCoordinateDialogOpen(false);
    setIsDialogOpen(true);
  };

  const handlePurchase = (pixel: Pixel, amount: number) => {
    setPendingPixel(pixel);
    setPaymentAmount(amount);
    setIsDialogOpen(false);
    setIsPaymentDialogOpen(true);
  };

  const handlePaymentSuccess = (pixel: Pixel) => {
    addPixel(pixel);
    setPendingPixel(null);
    setPaymentAmount(0);
    setIsPaymentDialogOpen(false);
    setSelected(null);
  };

  const handleGridUpdate = () => {
    // 그리드 업데이트 후 추가 작업이 필요하면 여기에
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center">
        <p className="text-lg text-gray-600">Loading...</p>
      </div>
    );
  }

  return (
    <PayPalScriptProvider options={{ clientId: paypalClientId }}>
      <div className="min-h-screen bg-white flex flex-col py-8">
        <Header activePath={pathname} />
        <div className="flex flex-col items-center px-4">
          <p className="text-lg text-gray-600 mb-4">
            Support an iOS app startup by buying pixels! 1 pixel = $0.01
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

          <div className="relative">
            <div style={{ width: gridWidth, height: gridHeight }}>
              <PixelGrid
                pixelMap={pixelMap}
                selected={selected}
                onBlockClick={handleBlockClick}
                onGridUpdate={handleGridUpdate}
                gridWidth={gridWidth}
                gridHeight={gridHeight}
              />
            </div>
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

          <CoordinateDialog
            isOpen={isCoordinateDialogOpen}
            onClose={() => setIsCoordinateDialogOpen(false)}
            onSubmit={handleCoordinateSubmit}
            gridWidth={GRID_WIDTH}
            gridHeight={GRID_HEIGHT}
            blockSize={BLOCK_SIZE}
          />

          <PurchaseForm
            selected={selected}
            isOpen={isDialogOpen}
            onClose={() => setIsDialogOpen(false)}
            onPurchase={handlePurchase}
            blockSize={BLOCK_SIZE}
          />

          <PaymentDialog
            isOpen={isPaymentDialogOpen}
            onClose={() => {
              setIsPaymentDialogOpen(false);
              setPendingPixel(null);
              setPaymentAmount(0);
              setSelected(null);
            }}
            pixel={pendingPixel}
            amount={paymentAmount}
            onSuccess={handlePaymentSuccess}
          />
        </div>
        <Toaster />
      </div>
    </PayPalScriptProvider>
  );
}