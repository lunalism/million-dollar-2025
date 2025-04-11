import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

const contentFilePath = path.join(process.cwd(), "data", "content.json");

export async function GET() {
    const data = await fs.readFile(contentFilePath, "utf-8");
    return NextResponse.json(JSON.parse(data));
}

export async function POST(request: Request) {
    const newContent = await request.json();
    await fs.writeFile(contentFilePath, JSON.stringify(newContent, null, 2));
    return NextResponse.json({ message: "Content saved" });
}