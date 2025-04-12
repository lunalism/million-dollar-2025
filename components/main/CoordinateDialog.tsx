// components/main/CoordinateDialog.tsx
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

// 좌표 입력 다이얼로그의 props 타입 정의
interface CoordinateDialogProps {
  isOpen: boolean; // 다이얼로그 열림/닫힘 상태
  onClose: () => void; // 다이얼로그 닫기 핸들러
  onSubmit: (x: number, y: number) => void; // 좌표 제출 핸들러
  gridWidth: number; // 그리드 너비 (픽셀 단위)
  gridHeight: number; // 그리드 높이 (픽셀 단위)
  blockSize: number; // 블록 크기 (사용하지 않음, 호환성을 위해 유지)
}

// 좌표 입력 다이얼로그 컴포넌트
export default function CoordinateDialog({ isOpen, onClose, onSubmit, gridWidth, gridHeight }: CoordinateDialogProps) {
  // 상태 정의
  const [x, setX] = useState("");
  const [y, setY] = useState("");
  const [error, setError] = useState("");

  // 좌표 제출 핸들러
  const handleSubmit = () => {
    const xNum = parseInt(x, 10);
    const yNum = parseInt(y, 10);

    if (isNaN(xNum) || isNaN(yNum)) {
      setError("Please enter valid numbers for coordinates.");
      return;
    }

    if (xNum < 0 || xNum > gridWidth || yNum < 0 || yNum > gridHeight) {
      setError(`Coordinates must be within grid bounds (0, 0) to (${gridWidth}, ${gridHeight}).`);
      return;
    }

    setError("");
    onSubmit(xNum, yNum);
  };

  // 다이얼로그 닫기 및 상태 초기화
  const handleClose = () => {
    setX("");
    setY("");
    setError("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px] rounded-lg shadow-xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold text-gray-900">
            Enter Coordinates
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="flex items-center space-x-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">X Coordinate (in pixels)</label>
              <Input
                type="number"
                value={x}
                onChange={(e) => setX(e.target.value)}
                placeholder="e.g., 0"
                className="mt-1 w-full"
              />
            </div>
            <span className="text-gray-700 text-lg">×</span>
            <div>
              <label className="block text-sm font-medium text-gray-700">Y Coordinate (in pixels)</label>
              <Input
                type="number"
                value={y}
                onChange={(e) => setY(e.target.value)}
                placeholder="e.g., 0"
                className="mt-1 w-full"
              />
            </div>
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} className="bg-blue-600 hover:bg-blue-700">
            Submit
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}