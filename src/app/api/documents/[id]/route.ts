import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { Role } from "@prisma/client";
import { readFile } from "fs/promises";
import { join } from "path";
import fs from "fs";

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();

    // 1. Authentication Check
    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // 2. Fetch Document Info
    const documentId = params.id;
    const document = await prisma.projectDocument.findUnique({
      where: { id: documentId },
      include: {
        project: {
          select: { developer: true } // We need to check who owns this project!
        }
      }
    });

    if (!document) {
      return new NextResponse("Document not found", { status: 404 });
    }

    // 3. Authorization Check
    const developerName = user.organization || user.name;
    const isOwner = document.project.developer === developerName;
    const isAdmin = user.role === Role.ADMIN;

    if (!isOwner && !isAdmin) {
      return new NextResponse("Forbidden: Access Denied", { status: 403 });
    }

    // 4. Serve the file securely
    const filePath = join(process.cwd(), 'storage', 'documents', document.filePath);
    
    try {
      const fileBuffer = await readFile(filePath);
      
      return new NextResponse(fileBuffer, {
        status: 200,
        headers: {
          'Content-Type': document.mimeType,
          'Content-Disposition': `inline; filename="${document.originalFileName}"`,
          'Cache-Control': 'private, max-age=3600',
        },
      });
    } catch (e) {
      console.error("Failed to read file from disk", e);
      return new NextResponse("File corrupted or missing on disk", { status: 500 });
    }

  } catch (error) {
    console.error("Error serving document:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
