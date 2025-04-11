export async function getPixels() {
    const res = await fetch("/api/pixels");
    if (!res.ok) throw new Error("Failed to fetch pixels");
    return res.json();
}

export async function savePixels(pixels: any[]) {
    const res = await fetch("/api/pixels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pixels),
    });
    if (!res.ok) throw new Error("Failed to save pixels");
    return res.json();
}

export async function getContent() {
    const res = await fetch("/api/content");
    if (!res.ok) throw new Error("Failed to fetch content");
    return res.json();
}

export async function saveContent(content: any) {
    const res = await fetch("/api/content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(content),
    });
    if (!res.ok) throw new Error("Failed to save content");
    return res.json();
}