import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { canPublish } from "@/lib/auth";
import { db } from "@/lib/db";
import { success, error, forbidden } from "@/lib/api";
import { slugify } from "@/lib/utils";
import type { PaperStatus, Prisma } from "@/lib/db-types";

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return error("Unauthorized", 401);
  if (!canPublish(user)) return forbidden("You do not have permission to publish papers.");

  try {
    const body = await request.json();
    const {
      title,
      abstract,
      keywords,
      researchField,
      publicationType,
      journal,
      conference,
      publisher,
      publicationDate,
      doi,
      volume,
      issue,
      pages,
      externalUrl,
      price,
      accessType,
      licenseType,
      authors,
      fileAssetId,
    } = body;

    if (!title?.trim()) return error("Title is required.", 422);
    if (!abstract?.trim()) return error("Abstract is required.", 422);

    const finalAccessType = accessType || "FREE";
    if (finalAccessType === "PAID" && !fileAssetId) {
      return error("A PDF file is required for paid papers.", 422);
    }

    if (fileAssetId) {
      const asset = await db.fileAsset.findFirst({
        where: { id: fileAssetId, uploadedById: user.id },
      });
      if (!asset) return error("Uploaded file not found.", 422);
    }

    const slug = slugify(title);
    // Ensure unique slug
    const existingSlug = await db.researchPaper.findUnique({ where: { slug } });
    const finalSlug = existingSlug ? `${slug}-${Date.now().toString(36)}` : slug;

    const paper = await db.researchPaper.create({
      data: {
        title: title.trim(),
        slug: finalSlug,
        abstract: abstract.trim(),
        keywords: keywords ? JSON.stringify(keywords) : null,
        researchField,
        publicationType,
        journal,
        conference,
        publisher,
        publicationDate: publicationDate ? new Date(publicationDate) : null,
        doi,
        volume,
        issue,
        pages,
        externalUrl,
        price: price ? parseFloat(price) : null,
        accessType: finalAccessType,
        licenseType,
        needsPermission: accessType === "PAID",
        fileAssetId: fileAssetId || null,
        status: "PENDING_REVIEW",
        uploaderId: user.id,
      },
    });

    // Add authors
    if (authors && Array.isArray(authors)) {
      await db.paperAuthor.createMany({
        data: authors.map((a: { name?: string; email?: string; affiliation?: string; userId?: string }, i: number) => ({
          paperId: paper.id,
          name: a.name ?? user.name,
          email: a.email,
          affiliation: a.affiliation,
          userId: a.userId || user.id,
          isPrimary: i === 0,
          order: i,
        })),
      });
    } else {
      // Default: uploader is the primary author
      await db.paperAuthor.create({
        data: {
          paperId: paper.id,
          userId: user.id,
          name: user.name,
          email: user.email,
          isPrimary: true,
          order: 0,
        },
      });
    }

    // Update researcher profile publication count
    const researcherProfile = await db.researcherProfile.findUnique({ where: { userId: user.id } });
    if (researcherProfile) {
      await db.researcherProfile.update({
        where: { userId: user.id },
        data: { publications: { increment: 1 } },
      });
    }

    return success({ paper }, 201);
  } catch (e) {
    console.error("Paper publish error:", e);
    return error("Failed to publish paper.", 500);
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const perPage = parseInt(searchParams.get("perPage") || "12");
  const status = searchParams.get("status");

  const user = await getCurrentUser();
  if (!user) return error("Unauthorized", 401);

  const where: Prisma.ResearchPaperWhereInput = { uploaderId: user.id };
  if (status) where.status = status as PaperStatus;

  const [papers, total] = await Promise.all([
    db.researchPaper.findMany({
      where,
      include: {
        authors: { select: { name: true } },
        _count: { select: { purchases: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    db.researchPaper.count({ where }),
  ]);

  return success({ papers, total, page, totalPages: Math.ceil(total / perPage) });
}
