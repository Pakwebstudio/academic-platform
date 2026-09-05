import { NextRequest } from "next/server";
import { getCurrentUser, canPublish } from "@/lib/auth";
import { success, error, forbidden } from "@/lib/api";
import { storageService, validateFileType, ALLOWED_PAPER_TYPES, MAX_PAPER_SIZE } from "@/lib/storage";

// Private file upload used by the research paper publish flow.
// Files are stored privately via the storage service and only served
// through the authorized /api/papers/[id]/access endpoint.
export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return error("Unauthorized", 401);
  if (!canPublish(user)) return forbidden("You do not have permission to upload research papers.");

  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || typeof file === "string") {
      return error("No file provided.", 422);
    }

    const { name, type, size } = file as File;
    if (!validateFileType(type, ALLOWED_PAPER_TYPES)) {
      return error("Only PDF files are supported.", 422);
    }
    if (size > MAX_PAPER_SIZE) {
      return error("File is too large. Maximum size is 20MB.", 422);
    }

    const data = Buffer.from(await (file as File).arrayBuffer());

    const asset = await storageService.upload({
      name,
      type,
      size,
      data,
      userId: user.id,
    });

    return success({ fileAssetId: asset.id, fileName: asset.fileName, size: asset.size }, 201);
  } catch (e) {
    console.error("Upload error:", e);
    return error("Failed to upload file.", 500);
  }
}