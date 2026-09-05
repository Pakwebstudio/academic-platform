import fs from "fs";
import path from "path";
import crypto from "crypto";
import { db } from "@/lib/db";

// FileStorageService abstraction - supports local storage now,
// can be swapped for S3/GCS/Cloudflare R2 later via the PROVIDER env var.
export class FileStorageService {
  private provider: string;
  private basePath: string;

  constructor() {
    this.provider = process.env.STORAGE_PROVIDER || "LOCAL";
    this.basePath = process.env.STORAGE_PATH || path.join(process.cwd(), "uploads");
  }

  private ensureDir(dir: string) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  async upload(
    file: {
      name: string;
      type: string;
      size: number;
      data: Buffer;
      userId?: string;
    }
  ): Promise<{ id: string; storagePath: string; mimeType: string; size: number; fileName: string }> {
    const safeName = path.basename(file.name).replace(/[^\w.\-]/g, "_");
    const token = crypto.randomBytes(16).toString("hex");
    const ext = path.extname(safeName);
    const storedName = `${token}${ext}`;
    const date = new Date();
    const subdir = `${date.getFullYear()}-${date.getMonth() + 1}`;
    const dir = path.join(this.basePath, subdir);
    this.ensureDir(dir);
    const storagePath = path.join(subdir, storedName);
    const fullPath = path.join(this.basePath, storagePath);
    fs.writeFileSync(fullPath, file.data);

    const asset = await db.fileAsset.create({
      data: {
        fileName: safeName,
        mimeType: file.type,
        size: file.size,
        storagePath,
        provider: this.provider,
        uploadedById: file.userId,
      },
    });

    return {
      id: asset.id,
      storagePath,
      mimeType: file.type,
      size: file.size,
      fileName: safeName,
    };
  }

  async getFile(assetId: string): Promise<{ buffer: Buffer; mimeType: string; fileName: string } | null> {
    try {
      const asset = await db.fileAsset.findUnique({ where: { id: assetId } });
      if (!asset) return null;
      const fullPath = path.join(this.basePath, asset.storagePath);
      if (!fs.existsSync(fullPath)) return null;
      const buffer = fs.readFileSync(fullPath);
      return { buffer, mimeType: asset.mimeType, fileName: asset.fileName };
    } catch {
      return null;
    }
  }

  async getFileByPath(storagePath: string): Promise<{ buffer: Buffer; mimeType: string; fileName: string } | null> {
    try {
      const fullPath = path.join(this.basePath, storagePath);
      if (!fs.existsSync(fullPath)) return null;
      const buffer = fs.readFileSync(fullPath);
      return { buffer, mimeType: "application/pdf", fileName: path.basename(storagePath) };
    } catch {
      return null;
    }
  }

  async delete(assetId: string): Promise<boolean> {
    try {
      const asset = await db.fileAsset.findUnique({ where: { id: assetId } });
      if (!asset) return false;
      const fullPath = path.join(this.basePath, asset.storagePath);
      if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
      await db.fileAsset.delete({ where: { id: assetId } });
      return true;
    } catch {
      return false;
    }
  }
}

export const storageService = new FileStorageService();

export const ALLOWED_PAPER_TYPES = ["application/pdf"];
export const MAX_PAPER_SIZE = 20 * 1024 * 1024; // 20MB
export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/svg+xml"];
export const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB

export function validateFileType(mimeType: string, allowed: string[]): boolean {
  return allowed.includes(mimeType);
}
