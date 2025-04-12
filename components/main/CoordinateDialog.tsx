// components/main/CoordinateDialog.tsx
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

interface CoordinateDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (x: number, y: number) => void;
  gridWidth: number;
  gridHeight: number;
  blockSize: number;
}

export default function CoordinateDialog({
  isOpen,
  onClose,
  onSubmit,
  gridWidth,
  gridHeight,
  blockSize,
}: CoordinateDialogProps) {
  const [coordinateX, setCoordinateX] = useState<string>("0");
  const [coordinateY, setCoordinateY] = useState<string>("0");
  const [coordinateError, setCoordinateError] = useState<string>("");

  const handleSubmit = () => {
    const x = parseInt(coordinateX, 10);
    const y = parseInt(coordinateY, 10);

    if (isNaN(x) || isNaN(y)) {
      setCoordinateError("Coordinates must be valid numbers.");
      return;
    }

    if (x < 0 || x > gridWidth - blockSize || y < 0 || y > gridHeight - blockSize) {
      setCoordinateError(`Coordinates must be within the grid (x: 0 to ${gridWidth - blockSize}, y: 0 to ${gridHeight - blockSize}).`);
      return;
    }

    setCoordinateError("");
    onSubmit(x, y);
  };

  const handleClose = () => {
    setCoordinateX("0");
    setCoordinateY("0");
    setCoordinateError("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
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
              (x: 0 to {gridWidth - blockSize}, y: 0 to {gridHeight - blockSize})
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
                  max={gridWidth - blockSize}
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
                  max={gridHeight - blockSize}
                />
              </div>
            </div>
            {coordinateError && <p className="text-red-500 text-sm mt-1">{coordinateError}</p>}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            className="bg-blue-600 hover:bg-blue-700"
            disabled={!!coordinateError}
          >
            Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}