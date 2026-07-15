import { NextResponse } from "next/server";
import { auth } from "@@/lib/auth-helper";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import sharp from "sharp";

const MAX_FILE_MB = 10;
const MAX_WIDTH = 1920;
const WEBP_QUALITY = 85;

export async function POST(req: Request) {
    const session = await auth();
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const formData = await req.formData();
        const file = formData.get("file") as File;

        if (!file) {
            return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
        }

        if (!file.type.startsWith("image/")) {
            return NextResponse.json({ error: "Only image files are allowed" }, { status: 400 });
        }

        if (file.size > MAX_FILE_MB * 1024 * 1024) {
            return NextResponse.json(
                { error: `File too large. Max ${MAX_FILE_MB}MB allowed.` },
                { status: 400 }
            );
        }

        const arrayBuffer = await file.arrayBuffer();
        const inputBuffer = Buffer.from(arrayBuffer);

        const metadata = await sharp(inputBuffer).metadata();
        const needsResize = (metadata.width ?? 0) > MAX_WIDTH;

        const uploadBuffer = await sharp(inputBuffer)
            .resize(needsResize ? { width: MAX_WIDTH, withoutEnlargement: true } : undefined)
            .webp({ quality: WEBP_QUALITY, effort: 4 })
            .toBuffer();

        const bucket = process.env.SUPABASE_BUCKET || "products";
        const timestamp = Date.now();
        const path = `returns/${session.user.id}-${timestamp}.webp`;

        const { error } = await supabaseAdmin.storage
            .from(bucket)
            .upload(path, uploadBuffer, {
                contentType: "image/webp",
                cacheControl: "31536000",
                upsert: false,
            });

        if (error) {
            console.error("Supabase upload error:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        const {
            data: { publicUrl },
        } = supabaseAdmin.storage.from(bucket).getPublicUrl(path);

        return NextResponse.json({ url: publicUrl, path });
    } catch (error) {
        console.error("Return photo upload error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
