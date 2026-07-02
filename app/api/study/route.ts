import { NextRequest, NextResponse } from "next/server";
import { readdirSync, readFileSync, statSync } from "fs";
import { join, extname } from "path";

export async function POST(request: NextRequest) {
  try {
    const { dirPath } = await request.json();
    if (!dirPath) {
      return NextResponse.json({ error: "dirPath required" }, { status: 400 });
    }

    const entries = readdirSync(dirPath);
    const files = entries
      .filter((f) => extname(f).toLowerCase() === ".dcm")
      .filter((f) => statSync(join(dirPath, f)).isFile())
      .sort()
      .map((f) => ({
        name: f,
        path: join(dirPath, f),
      }));

    const baseUrl = new URL(request.url).origin;
    const imageIds = files.map(
      (f) => `wadouri:${baseUrl}/api/study?file=${encodeURIComponent(f.path)}`
    );

    return NextResponse.json({
      files,
      imageIds,
      count: files.length,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Error reading directory" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const filePath = request.nextUrl.searchParams.get("file");
  if (!filePath) {
    return NextResponse.json({ error: "file param required" }, { status: 400 });
  }

  try {
    const buffer = readFileSync(filePath);
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/dicom",
        "Access-Control-Allow-Origin": "*",
        "Content-Length": buffer.length.toString(),
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "File not found" },
      { status: 404 }
    );
  }
}
