// utils/getImageSize.ts
export const getImageSize = (source: File | string): Promise<{ width: number; height: number }> => {
    return new Promise((resolve, reject) => {
        const img = new Image();

        img.onload = () => {
            resolve({ width: img.width, height: img.height });
        };

        img.onerror = () => {
            reject(new Error("Failed to load image"));
        };
        
        if (typeof source === "string") {
            img.src = source;
        } else {
            img.src = URL.createObjectURL(source);
        }
    });
};