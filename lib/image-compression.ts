/**
 * Image Compression Utility (Canvas-based)
 * Digunakan untuk mengompresi dan mengoptimalkan gambar (seperti foto profil pengguna)
 * di sisi browser sebelum diunggah ke server atau Supabase Storage.
 */

export interface ImageCompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0.1 s/d 1.0 (default 0.82)
  outputFormat?: "image/webp" | "image/jpeg" | "image/png";
  fileName?: string;
}

export interface CompressionResult {
  file: File;
  blob: Blob;
  dataUrl: string;
  originalSizeBytes: number;
  compressedSizeBytes: number;
  savingsPercentage: number;
  width: number;
  height: number;
}

/**
 * Mengompresi file gambar (File / Blob) dengan mempertahankan rasio aspek
 * dan mengonversinya ke format yang lebih efisien (WebP / JPEG).
 */
export async function compressImage(
  inputFile: File | Blob,
  options: ImageCompressionOptions = {}
): Promise<CompressionResult> {
  const {
    maxWidth = 512,
    maxHeight = 512,
    quality = 0.82,
    outputFormat = "image/webp",
    fileName = inputFile instanceof File ? inputFile.name : "profile_avatar.webp",
  } = options;

  const originalSizeBytes = inputFile.size;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Gagal membaca berkas gambar."));
    reader.onload = (event) => {
      const img = new Image();
      img.onerror = () => reject(new Error("Format berkas gambar tidak valid."));
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Hitung skala rasio aspek
        if (width > maxWidth || height > maxHeight) {
          if (width / height > maxWidth / maxHeight) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          return reject(new Error("Gagal menginisialisasi canvas context."));
        }

        // Render gambar dengan smoothing berkualitas tinggi
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(img, 0, 0, width, height);

        // Ekspor ke DataURL
        const dataUrl = canvas.toDataURL(outputFormat, quality);

        // Ekspor ke Blob & File
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              return reject(new Error("Gagal mengonversi canvas ke Blob."));
            }

            const cleanFileName =
              fileName.replace(/\.[^/.]+$/, "") +
              (outputFormat === "image/webp" ? ".webp" : ".jpg");
            const compressedFile = new File([blob], cleanFileName, {
              type: outputFormat,
              lastModified: Date.now(),
            });

            const compressedSizeBytes = blob.size;
            const savingsPercentage = Math.max(
              0,
              Math.round(
                ((originalSizeBytes - compressedSizeBytes) /
                  originalSizeBytes) *
                  100
              )
            );

            resolve({
              file: compressedFile,
              blob,
              dataUrl,
              originalSizeBytes,
              compressedSizeBytes,
              savingsPercentage,
              width,
              height,
            });
          },
          outputFormat,
          quality
        );
      };

      img.src = event.target?.result as string;
    };

    reader.readAsDataURL(inputFile);
  });
}
