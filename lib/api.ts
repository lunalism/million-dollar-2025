// lib/api.ts
import { createClient } from "@supabase/supabase-js";
import { Pixel } from "@/lib/types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_KEY || "";

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Supabase URL and Anon Key must be defined in environment variables.");
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const normalizeFileName = (fileName: string): string => {
  const extension = fileName.substring(fileName.lastIndexOf("."));
  const nameWithoutExtension = fileName.substring(0, fileName.lastIndexOf("."));

  const normalizedName = nameWithoutExtension
    .replace(/[^a-zA-Z0-9-_]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return `${normalizedName}${extension}`;
};

export const getPixels = async (): Promise<Pixel[]> => {
  const { data, error } = await supabase.from("pixels").select("*");
  if (error) {
    console.error("Error fetching pixels:", error);
    return [];
  }
  return data || [];
};

export const savePixels = async (pixels: Pixel[]): Promise<void> => {
  const { error } = await supabase.from("pixels").insert(pixels);
  if (error) {
    console.error("Error saving pixels:", error);
    throw error;
  }
};

export const uploadFile = async (file: File): Promise<string> => {
  const originalFileName = `${Date.now()}-${file.name}`;
  const fileName = normalizeFileName(originalFileName);

  const { error } = await supabase.storage.from("pixel-content").upload(fileName, file);
  if (error) {
    console.error("Error uploading file to Supabase Storage:", error.message);
    throw new Error(`Failed to upload file: ${error.message}. File names must contain only letters, numbers, hyphens, underscores, and periods.`);
  }

  const { data } = supabase.storage.from("pixel-content").getPublicUrl(fileName);
  if (!data.publicUrl) {
    throw new Error("Failed to get public URL for the uploaded file.");
  }

  console.log("Uploaded file URL:", data.publicUrl); // 디버깅 로그 추가
  return data.publicUrl;
};