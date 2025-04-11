// public/pixelWorker.js
self.onmessage = (event) => {
    const purchasedPixels = event.data;

    // purchasedPixels를 해시맵으로 변환
    const pixelMap = {};
    purchasedPixels.forEach((pixel) => {
        const key = `${pixel.x}-${pixel.y}`;
        pixelMap[key] = {
            x: pixel.x,
            y: pixel.y,
            purchased: true,
            owner: pixel.owner,
            content: pixel.content,
            purchaseType: pixel.purchaseType,
        };
    });

    // 결과를 메인 스레드로 전달
    self.postMessage(pixelMap);
};