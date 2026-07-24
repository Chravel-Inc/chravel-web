import 'https://deno.land/x/xhr@0.1.0/mod.ts';
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3';
import { getCorsHeaders } from '../_shared/cors.ts';
import {
  FileUploadSchema,
  validateInput,
  isBlockedExtension,
  isValidFileType,
  ALLOWED_FILE_TYPES,
} from '../_shared/validation.ts';
import { verifyTripMembership } from '../_shared/verifyTripMembership.ts';

async function cleanupUploadedTripFile(
  supabase: ReturnType<typeof createClient>,
  uploadPath: string,
): Promise<void> {
  const { error } = await supabase.storage.from('trip-files').remove([uploadPath]);
  if (error) {
    console.error('[file-upload] Failed to clean up orphaned upload:', error);
  }
}

serve(async req => {
  const corsHeaders = getCorsHeaders(req);
  const { createOptionsResponse } = await import('../_shared/securityHeaders.ts');

  if (req.method === 'OPTIONS') {
    return createOptionsResponse(req);
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Authenticate user from JWT instead of trusting client-supplied userId
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const token = authHeader.replace('Bearer ', '');
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData.user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;
    const tripId = formData.get('tripId') as string;
    // Use authenticated user ID from JWT, ignore client-supplied userId
    const userId = userData.user.id;

    if (!file || !tripId) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate using Zod schema
    const validation = validateInput(FileUploadSchema, { file, tripId, userId });
    if (!validation.success) {
      return new Response(JSON.stringify({ error: validation.error }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Enforce active trip membership before service-role storage/metadata writes.
    // The shared helper calls public.is_active_trip_member(), preventing removed
    // members with stale trip_members rows from uploading files.
    const membership = await verifyTripMembership(supabase, userId, tripId);
    if (membership.error) {
      console.error('[file-upload] Membership verification failed:', membership.error);
      return new Response(JSON.stringify({ error: 'Failed to verify trip access' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!membership.isMember) {
      return new Response(
        JSON.stringify({ error: 'Forbidden - you must be a member of this trip' }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      );
    }

    // Additional explicit checks for better error messages
    // Check file extension (block executables and scripts)
    if (isBlockedExtension(file.name)) {
      return new Response(
        JSON.stringify({
          error: `File type not allowed: ${file.name.split('.').pop()} files are blocked for security reasons`,
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // Check file size (50MB max)
    if (file.size > 50 * 1024 * 1024) {
      return new Response(JSON.stringify({ error: 'File size too large (max 50MB)' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check MIME type
    const allowedTypes = [
      ...ALLOWED_FILE_TYPES.images,
      ...ALLOWED_FILE_TYPES.documents,
      ...ALLOWED_FILE_TYPES.media,
    ];
    if (!isValidFileType(file.type, allowedTypes)) {
      return new Response(
        JSON.stringify({
          error: `File type not allowed: ${file.type}. Allowed types: images, documents (PDF, DOCX, XLSX, TXT, CSV), and media (MP4, MOV, MP3, WAV)`,
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // Generate unique file path
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `${tripId}/${fileName}`;

    // Upload to storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('trip-files')
      .upload(filePath, file, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return new Response(JSON.stringify({ error: 'Failed to upload file' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from('trip-files')
      .createSignedUrl(uploadData.path, 60 * 60 * 24 * 365);

    if (signedUrlError || !signedUrlData?.signedUrl) {
      console.error('Signed URL error:', signedUrlError);
      await cleanupUploadedTripFile(supabase, uploadData.path);
      return new Response(JSON.stringify({ error: 'Failed to create file access URL' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Save file metadata to database
    const { data: fileRecord, error: dbError } = await supabase
      .from('trip_files')
      .insert({
        trip_id: tripId,
        file_name: file.name,
        file_path: uploadData.path,
        file_url: signedUrlData.signedUrl,
        file_type: file.type,
        file_size: file.size,
        uploaded_by: userId,
        metadata: {
          original_name: file.name,
          upload_timestamp: new Date().toISOString(),
        },
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      await cleanupUploadedTripFile(supabase, uploadData.path);
      return new Response(JSON.stringify({ error: 'Failed to save file metadata' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        file: fileRecord,
        downloadUrl: signedUrlData.signedUrl,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (error) {
    console.error('Error in file-upload function:', error);
    return new Response(JSON.stringify({ error: 'File upload failed' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
