import { useRef, useEffect } from "react";
import { Grid, GridCellRenderer } from "react-virtualized";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { GridPixel, Pixel } from "@/lib/types";

type PixelGridProps = {
    purchasedPixels: Pixel[];
    selected: { x: number; y: number; size: number } | null;
    zoomLevel: number;
    onBlockClick: (x: number, y: number) => void;
    onGridUpdate: () => void;
};

export default function PixelGrid({ purchasedPixels, selected, zoomLevel, onBlockClick, onGridUpdate }: PixelGridProps) {
    const GRID_WIDTH = 1500;
    const GRID_HEIGHT = 1000;
    const BASE_BLOCK_SIZE = 10;
    const BLOCK_SIZE = BASE_BLOCK_SIZE * zoomLevel;
    const gridRef = useRef<Grid>(null);

    // purchasedPixels를 기반으로 블록 상태 확인
    const getPixelAt = (x: number, y: number): GridPixel => {
        const pixel = purchasedPixels.find(
            (p) =>
            x >= p.x &&
            x < p.x + p.size &&
            y >= p.y &&
            y < p.y + p.size &&
            x === p.x &&
            y === p.y // 10x10 블록의 시작 좌표만 확인
        );
        return pixel
            ? {
                x,
                y,
                purchased: true,
                owner: pixel.owner,
                content: pixel.content,
                purchaseType: pixel.purchaseType,
            }
        : { x, y, purchased: false };
    };

    useEffect(() => {
        if (gridRef.current) {
            gridRef.current.recomputeGridSize();
        }
        onGridUpdate();
    }, [purchasedPixels, zoomLevel, onGridUpdate]);

    const cellRenderer: GridCellRenderer = ({ columnIndex, rowIndex, style }) => {
        const x = columnIndex * BASE_BLOCK_SIZE;
        const y = rowIndex * BASE_BLOCK_SIZE;
        const pixel = getPixelAt(x, y);
  
        const isPurchased = pixel.purchased;
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
            backgroundImage: isPurchased && pixel.content ? `url(${pixel.content})` : "none",
            backgroundSize: "cover",
            backgroundPosition: "center",
        };
  
        return (
            <TooltipProvider key={`${columnIndex}-${rowIndex}`}>
                <Tooltip>
                    <TooltipTrigger asChild>
                    <div
                        style={blockStyle}
                        onClick={() => onBlockClick(x, y)}
                        className={isSelected ? "bg-blue-200 bg-opacity-30" : ""}
                    />
                    </TooltipTrigger>
                    {isPurchased && (
                    <TooltipContent>
                        <p>
                        <strong>Position:</strong> ({x}, {y})
                        </p>
                        <p>
                        <strong>Owner:</strong> {pixel.owner || "Unknown"}
                        </p>
                        <p>
                        <strong>Content:</strong> {pixel.content || "No content"}
                        </p>
                        <p>
                        <strong>Type:</strong> {pixel.purchaseType || "basic"}
                        </p>
                    </TooltipContent>
                    )}
                </Tooltip>
            </TooltipProvider>
        );
        };
  
    return (
        <div className="relative w-[1500px] h-[1000px] border-2 border-gray-300 shadow-lg rounded-lg overflow-auto">
            <Grid
                ref={gridRef}
                width={1500}
                height={1000}
                columnCount={GRID_WIDTH / BASE_BLOCK_SIZE}
                rowCount={GRID_HEIGHT / BASE_BLOCK_SIZE}
                columnWidth={BLOCK_SIZE}
                rowHeight={BLOCK_SIZE}
                cellRenderer={cellRenderer}
                style={{ overflowX: "auto", overflowY: "auto" }} // 단축 속성 제거
                overscanRowCount={10} // 오버스캔 범위 조정
                overscanColumnCount={10} // 오버스캔 범위 조정
            />
        </div>
    );
  }