import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

const pixelsFilePath = path.join(process.cwd(), "data", "pixels.json");

export async function GET() {
    const data = await fs.readFile(pixelsFilePath, "utf-8");
    return NextResponse.json(JSON.parse(data));
}

export async function POST(request: Request) {
    const newPixels = await request.json();
    await fs.writeFile(pixelsFilePath, JSON.stringify(newPixels, null, 2));
    return NextResponse.json({ message: "Pixels saved" });
}