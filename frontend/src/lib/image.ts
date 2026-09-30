export interface EncodedImage {
  dataUrl: string;
  base64: string;
  mimeType: "image/jpeg" | "image/png" | "image/webp";
  name: string;
}

const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp"]);

export function encodeImage(file: File): Promise<EncodedImage> {
  if (!ALLOWED.has(file.type)) {
    return Promise.reject(new Error("Please upload a JPEG, PNG or WEBP image."));
  }
  if (file.size > 4_000_000) {
    return Promise.reject(new Error("Please choose an image smaller than 4 MB."));
  }
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("The image could not be read."));
    reader.onload = () => {
      const dataUrl = String(reader.result);
      const base64 = dataUrl.split(",")[1] ?? "";
      resolve({ dataUrl, base64, mimeType: file.type as EncodedImage["mimeType"], name: file.name });
    };
    reader.readAsDataURL(file);
  });
}