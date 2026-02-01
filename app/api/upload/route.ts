import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(req: Request) {
    try {
        const formData = await req.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
        }

        const bucket = process.env.SUPABASE_BUCKET || 'products';
        const timestamp = Date.now();
        // Sanitize filename to prevent issues
        const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const path = `products/${timestamp}-${safeName}`;

        // Upload to Supabase using Admin client to bypass RLS
        const { error } = await supabaseAdmin.storage
            .from(bucket)
            .upload(path, file, {
                cacheControl: '3600',
                upsert: false
            });

        if (error) {
            console.error('Supabase upload error:', error);
            // Check for row-level security policy violation specifically to give better feedback
            if (error.message.includes("row-level security policy")) {
                return NextResponse.json({ error: "Storage permission denied (RLS). Please check Supabase policies or use Admin key." }, { status: 500 });
            }
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Get Public URL
        const { data: { publicUrl } } = supabaseAdmin.storage
            .from(bucket)
            .getPublicUrl(path);

        // Return the URL and the storage path (for deletion)
        return NextResponse.json({
            url: publicUrl,
            path: path
        });

    } catch (error: any) {
        console.error('Upload handler error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
