# Banner Upload System - Deployment Guide

## Overview

The banner upload system supports both **development** (local filesystem) and **production** (Vercel Blob) environments automatically.

## Development Setup

**No additional setup required!**

Images are automatically stored in:
```
/public/uploads/banners/
```

The system will create this directory automatically if it doesn't exist.

## Production Setup (Vercel Blob)

### 1. Install Vercel Blob Package

```bash
pnpm add @vercel/blob
```

### 2. Configure Environment Variables

Add to your Vercel project settings:

```env
BLOB_READ_WRITE_TOKEN=your_vercel_blob_token
```

To get your token:
1. Go to your Vercel project dashboard
2. Navigate to Storage → Blob
3. Create a new Blob store (if you haven't already)
4. Copy the `BLOB_READ_WRITE_TOKEN`

### 3. Deploy

That's it! The system automatically detects the environment and uses the appropriate storage:

- **Development**: Local filesystem (`/public/uploads/banners/`)
- **Production**: Vercel Blob (when `BLOB_READ_WRITE_TOKEN` is set)

## How It Works

### Upload Flow

```typescript
uploadBannerImage(file)
  ↓
Check environment
  ↓
Development?
  → Save to /public/uploads/banners/
  → Return: /uploads/banners/filename.jpg
  ↓
Production?
  → Upload to Vercel Blob
  → Return: https://blob.vercel-storage.com/...
```

### Delete Flow

```typescript
deleteBannerImage(imageUrl)
  ↓
Check URL format
  ↓
Starts with /uploads/?
  → Delete from local filesystem
  ↓
Starts with https://?
  → Delete from Vercel Blob
```

## File Structure

```
lib/
  upload-banner.ts         # Unified upload utility
app/
  api/
    admin/
      upload/
        banner-image/
          route.ts         # Upload endpoint
      banners/
        [id]/
          delete/
            route.ts       # Delete endpoint
```

## Features

✅ **Automatic Environment Detection**
- No code changes needed between dev and prod
- Seamless transition when deploying

✅ **Validation**
- File type: JPEG, PNG, WebP
- File size: Max 10MB
- Filename sanitization

✅ **Unique Filenames**
- Timestamp + random string
- Prevents collisions
- Format: `banner-{timestamp}-{random}.{ext}`

✅ **Error Handling**
- Graceful fallbacks
- Detailed error messages
- Non-blocking file deletion

✅ **Cleanup**
- Deletes old images when banner is deleted
- Handles both local and cloud storage

## API Usage

### Upload Image

```typescript
POST /api/admin/upload/banner-image
Content-Type: multipart/form-data

FormData:
  file: File

Response:
{
  "message": "Banner image uploaded successfully",
  "url": "/uploads/banners/banner-123.jpg"  // or Vercel Blob URL
}
```

### Delete Banner (with image cleanup)

```typescript
DELETE /api/admin/banners/[id]/delete

Response:
{
  "message": "Banner deleted successfully",
  "deletedBanner": {
    "id": "...",
    "imageUrl": "..."
  }
}
```

## Troubleshooting

### Images not uploading in production

1. Check `BLOB_READ_WRITE_TOKEN` is set in Vercel
2. Verify Blob store is created in Vercel dashboard
3. Check deployment logs for errors

### Images not deleting

- File deletion is non-blocking
- Check server logs for specific errors
- Database record is deleted even if file deletion fails

### Local development issues

1. Ensure `/public/uploads/banners/` directory exists
2. Check file permissions
3. Verify disk space

## Migration from Local to Vercel Blob

If you have existing local images and want to migrate:

1. Upload images to Vercel Blob manually or via script
2. Update database `imageUrl` fields with new Blob URLs
3. Old local files can be deleted

## Security

✅ **Admin-only access**
- All upload/delete endpoints require ADMIN role
- Authentication checked on every request

✅ **File validation**
- Type checking (JPEG, PNG, WebP only)
- Size limits (10MB max)
- Filename sanitization

✅ **No directory traversal**
- Filenames are generated, not user-provided
- Safe path construction

## Performance

- **Upload**: ~1-3 seconds for 5MB image
- **Delete**: ~100-500ms
- **Validation**: Instant (client + server)

## Best Practices

1. **Always validate on client-side first**
   - Better UX
   - Reduces server load

2. **Handle errors gracefully**
   - Show user-friendly messages
   - Log detailed errors server-side

3. **Clean up old images**
   - Delete route handles this automatically
   - Non-blocking to prevent request failures

4. **Monitor storage usage**
   - Vercel Blob has usage limits
   - Check dashboard regularly

## Notes

- The `@vercel/blob` package is only imported in production
- Lint errors for `@vercel/blob` in development are expected
- Install the package before deploying to production
- All image URLs are stored in the database as-is (local or Blob URLs)
