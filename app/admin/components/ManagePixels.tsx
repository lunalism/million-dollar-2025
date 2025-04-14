// app/admin/components/ManagePixels.tsx

// Supabase 클라이언트 타입을 임포트 (Supabase와의 통신을 위해 사용)
import { SupabaseClient } from "@supabase/supabase-js";

// UI 컴포넌트를 임포트 (버튼, 입력 필드, 테이블 등을 렌더링하기 위해 사용)
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

// Pixel 타입 정의를 임포트 (픽셀 데이터의 구조를 정의)
import { Pixel } from "@/lib/types";

// ManagePixels 컴포넌트의 Props 타입 정의
interface ManagePixelsProps {
    pixels: Pixel[]; // 현재 픽셀 데이터 배열
    setPixels: (pixels: Pixel[]) => void; // 픽셀 데이터를 업데이트하는 함수
    editPixel: Pixel | null; // 편집 중인 픽셀 데이터 (없으면 null)
    setEditPixel: (pixel: Pixel | null) => void; // 편집 중인 픽셀 데이터를 설정하는 함수
    savePixels: (pixels: Pixel[]) => Promise<void>; // 픽셀 데이터를 저장하는 함수
    getPixels: () => Promise<Pixel[]>; // 픽셀 데이터를 가져오는 함수
    supabase: SupabaseClient; // Supabase 클라이언트 인스턴스 (데이터베이스 작업에 사용)
}

// ManagePixels 컴포넌트: 픽셀 데이터를 관리하는 UI와 로직을 처리
export default function ManagePixels({ pixels, setPixels, editPixel, setEditPixel, savePixels, getPixels, supabase }: ManagePixelsProps) {
    // 픽셀 편집 핸들러: 선택한 픽셀 데이터를 편집 상태로 설정
    const handleEditPixel = (pixel: Pixel) => {
        setEditPixel({ ...pixel });
    };

    // 픽셀 저장 핸들러: 편집된 픽셀 데이터를 저장
    const handleSavePixel = async () => {
        if (!editPixel) return; // 편집 중인 픽셀이 없으면 종료
        
        try {
            // 현재 픽셀 목록에서 편집된 픽셀로 업데이트
            const updatedPixels = pixels.map((p) =>
                p.x === editPixel.x && p.y === editPixel.y ? editPixel : p
            );
            await savePixels(updatedPixels); // Supabase에 저장
            setPixels(updatedPixels); // 로컬 상태 업데이트
            setEditPixel(null); // 편집 상태 초기화
            alert("Pixel saved successfully!"); // 성공 알림
        } catch (error: unknown) {
            // 에러 처리: 저장 실패 시 사용자에게 알림
            console.error("Failed to save pixel:", error);

            if (error && typeof error === "object" && "message" in error) {
                alert(`Failed to save pixel: ${(error as { message: string }).message}`);
            } else if (error instanceof Error) {
                alert(`Failed to save pixel: ${error.message}`);
            } else {
                alert("Failed to save pixel: An unexpected error occurred");
            }
        }
    };

    // 픽셀 삭제 핸들러: 특정 픽셀 데이터를 삭제
    const handleDeletePixel = async (x: number, y: number) => {
        try {
            // Supabase에서 픽셀 데이터 삭제 (x, y 좌표로 식별)
            const { error } = await supabase
                .from("pixels")
                .delete()
                .eq("x", x)
                .eq("y", y);

            if (error) {
                console.error("Error deleting pixel from Supabase:", error);
                throw error; // 에러 발생 시 예외 처리
            }

            // 로컬 상태에서 삭제된 픽셀 제거
            const updatedPixels = pixels.filter((p) => !(p.x === x && p.y === y));
            setPixels(updatedPixels); // 상태 업데이트
            alert("Pixel deleted successfully!"); // 성공 알림
            const remainingPixels = await getPixels(); // 최신 픽셀 데이터 가져오기
            setPixels(remainingPixels); // 최신 데이터로 상태 업데이트
        } catch (error: unknown) {
            // 에러 처리: 삭제 실패 시 사용자에게 알림
            console.error("Failed to delete pixel:", error);
            
            if (error && typeof error === "object" && "message" in error) {
                alert(`Failed to delete pixel: ${(error as { message: string }).message}`);
            } else if (error instanceof Error) {
                alert(`Failed to delete pixel: ${error.message}`);
            } else {
                alert("Failed to delete pixel: An unexpected error occurred");
            }

            const pixelData = await getPixels(); // 에러 발생 시에도 최신 데이터 동기화
            setPixels(pixelData);
        }
    };

    // UI 렌더링
    return (
        <>
            {/* 픽셀 목록 섹션 */}
            <section className="mb-12 w-[1200px]">
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">Manage Pixels</h2>
                <div className="overflow-x-auto">
                    {/* 픽셀 데이터를 테이블로 표시 */}
                    <Table className="w-full">
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-1/6">Position</TableHead>
                                <TableHead className="w-1/6">Size</TableHead>
                                <TableHead className="w-1/6">Owner</TableHead>
                                <TableHead className="w-2/6">Content</TableHead>
                                <TableHead className="w-1/6">Type</TableHead>
                                <TableHead className="w-1/6">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {pixels.map((pixel) => (
                                <TableRow key={`${pixel.x}-${pixel.y}`}>
                                <TableCell>({pixel.x}, {pixel.y})</TableCell>
                                <TableCell>{pixel.width}×{pixel.height}</TableCell>
                                <TableCell>{pixel.owner}</TableCell>
                                <TableCell>{pixel.content || "N/A"}</TableCell>
                                <TableCell>{pixel.purchaseType}</TableCell>
                                <TableCell>
                                    {/* 편집 버튼: 픽셀 편집 모드로 전환 */}
                                    <Button style={{ width: "80px" }} variant="outline" className="mr-2" onClick={() => handleEditPixel(pixel)}>
                                        Edit
                                    </Button>
                                    {/* 삭제 버튼: 픽셀 데이터 삭제 */}
                                    <Button style={{ width: "80px" }} variant="destructive" onClick={() => handleDeletePixel(pixel.x, pixel.y)}>
                                        Delete
                                    </Button>
                                </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </section>

            {/* 편집 모드일 때 표시되는 섹션 */}
            {editPixel && (
                <section className="mb-12 p-6 border rounded-lg w-[1200px]">
                    <h2 className="text-2xl font-semibold text-gray-800 mb-4">Edit Pixel</h2>
                    <div className="space-y-4">
                        {/* 소유자 정보 입력 */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Owner</label>
                            <Input
                                value={editPixel.owner}
                                onChange={(e) => setEditPixel({ ...editPixel, owner: e.target.value })}
                            />
                        </div>
                        {/* 콘텐츠 URL 입력 */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Content URL</label>
                            <Input
                                value={editPixel.content ?? ""}
                                onChange={(e) => setEditPixel({ ...editPixel, content: e.target.value })}
                            />
                        </div>
                        {/* 구매 유형 입력 */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Type</label>
                            <Input
                                value={editPixel.purchaseType}
                                onChange={(e) =>
                                setEditPixel({
                                    ...editPixel,
                                    purchaseType: e.target.value as "basic" | "premium",
                                })
                                }
                            />
                        </div>
                        {/* 저장 버튼: 변경사항 저장 */}
                        <Button onClick={handleSavePixel} className="bg-[#0F4C81] hover:bg-[#1A5A96]">
                            Save Changes
                        </Button>
                    </div>
                </section>
            )}
        </>
    );
}