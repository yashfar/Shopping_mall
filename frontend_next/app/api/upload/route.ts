import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import sharp from 'sharp';

// Optimization settings — high quality, no visible loss
const MAX_WIDTH = 1920;       // max resolution for full images
const WEBP_QUALITY = 92;      // 92 = excellent quality, ~40% smaller than JPEG
const MAX_FILE_MB = 10;       // reject files over 10MB before processing

export async function POST(req: Request) {
    try {
        const formData = await req.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
        }

        // Reject oversized files early
        if (file.size > MAX_FILE_MB * 1024 * 1024) {
            return NextResponse.json(
                { error: `File too large. Max ${MAX_FILE_MB}MB allowed.` },
                { status: 400 }
            );
        }

        const isImage = file.type.startsWith('image/');

        let uploadBuffer: Buffer;
        let contentType: string;
        let extension: string;

        if (isImage) {
            // Convert to ArrayBuffer → Buffer for sharp
            const arrayBuffer = await file.arrayBuffer();
            const inputBuffer = Buffer.from(arrayBuffer);

            // Get image metadata to decide if resize is needed
            const metadata = await sharp(inputBuffer).metadata();
            const needsResize = (metadata.width ?? 0) > MAX_WIDTH;

            // Process: resize if needed + convert to WebP
            uploadBuffer = await sharp(inputBuffer)
                .resize(needsResize ? { width: MAX_WIDTH, withoutEnlargement: true } : undefined)
                .webp({ quality: WEBP_QUALITY, effort: 4 })
                .toBuffer();

            contentType = 'image/webp';
            extension = 'webp';
        } else {
            // Non-image file — upload as-is
            uploadBuffer = Buffer.from(await file.arrayBuffer());
            contentType = file.type;
            extension = file.name.split('.').pop() ?? 'bin';
        }

        const bucket = process.env.SUPABASE_BUCKET || 'products';
        const timestamp = Date.now();
        const baseName = file.name.replace(/\.[^.]+$/, '').replace(/[^a-zA-Z0-9-]/g, '_');
        const path = `products/${timestamp}-${baseName}.${extension}`;

        const { error } = await supabaseAdmin.storage
            .from(bucket)
            .upload(path, uploadBuffer, {
                contentType,
                cacheControl: '31536000', // 1 year cache for immutable uploads
                upsert: false,
            });

        if (error) {
            console.error('Supabase upload error:', error);
            if (error.message.includes('row-level security policy')) {
                return NextResponse.json(
                    { error: 'Storage permission denied (RLS). Please check Supabase policies.' },
                    { status: 500 }
                );
            }
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        const { data: { publicUrl } } = supabaseAdmin.storage
            .from(bucket)
            .getPublicUrl(path);

        return NextResponse.json({ url: publicUrl, path });

    } catch (error: any) {
        console.error('Upload handler error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
