import { Hono } from 'hono'
import type { CloudflareBindings } from '../types/cloudflare'

const fileBank = new Hono<{ Bindings: CloudflareBindings }>()

// ===== FILES =====

// Get all files
fileBank.get('/files', async (c) => {
  const userEmail = c.req.query('userEmail') || c.req.query('user') || 'admin@investaycapital.com'
  const folderId = c.req.query('folderId')
  const starred = c.req.query('starred')
  const pinned = c.req.query('pinned')
  const search = c.req.query('search')
  
  try {
    let query = `
      SELECT f.*, 
        folder.folder_name as folder_name,
        folder.is_team_shared as folder_is_shared,
        (SELECT COUNT(*) FROM file_bank_usage WHERE file_id = f.id) as usage_count
      FROM file_bank_files f
      LEFT JOIN file_bank_folders folder ON f.folder_id = folder.id
      WHERE (f.user_email = ? OR folder.is_team_shared = 1) 
        AND f.deleted_at IS NULL 
        AND f.is_latest_version = 1
    `
    const params: any[] = [userEmail]
    
    if (folderId) {
      query += ' AND f.folder_id = ?'
      params.push(folderId)
    }
    
    if (starred === 'true') {
      query += ' AND f.is_starred = 1'
    }
    
    if (pinned === 'true') {
      query += ' AND f.is_pinned = 1'
    }
    
    if (search) {
      query += ' AND (f.filename LIKE ? OR f.original_filename LIKE ? OR f.description LIKE ?)'
      const searchPattern = `%${search}%`
      params.push(searchPattern, searchPattern, searchPattern)
    }
    
    query += ' ORDER BY f.is_pinned DESC, f.created_at DESC'
    
    const { results } = await c.env.DB.prepare(query).bind(...params).all()
    
    // Parse JSON fields
    const files = (results || []).map((file: any) => ({
      ...file,
      tags: file.tags ? JSON.parse(file.tags) : []
    }))
    
    return c.json({ files })
  } catch (error: any) {
    console.error('Error fetching files:', error)
    return c.json({ error: 'Failed to fetch files', details: error.message }, 500)
  }
})

// Get single file with details
fileBank.get('/files/:id', async (c) => {
  const fileId = c.req.param('id')
  
  try {
    const file = await c.env.DB.prepare(`
      SELECT f.*, 
        folder.folder_name as folder_name,
        folder.folder_path as folder_path
      FROM file_bank_files f
      LEFT JOIN file_bank_folders folder ON f.folder_id = folder.id
      WHERE f.id = ? AND f.deleted_at IS NULL
    `).bind(fileId).first()
    
    if (!file) {
      return c.json({ error: 'File not found' }, 404)
    }
    
    // Get version history
    const { results: versions } = await c.env.DB.prepare(`
      SELECT id, version, version_notes, file_size, created_at, user_email
      FROM file_bank_files
      WHERE (id = ? OR parent_file_id = ?) AND deleted_at IS NULL
      ORDER BY version DESC
    `).bind(fileId, fileId).all()
    
    // Get usage in threads
    const { results: usage } = await c.env.DB.prepare(`
      SELECT u.*, e.subject, e.from_email
      FROM file_bank_usage u
      LEFT JOIN emails e ON u.email_id = e.id
      WHERE u.file_id = ?
      ORDER BY u.created_at DESC
      LIMIT 10
    `).bind(fileId).all()
    
    // Get recent activity
    const { results: activity } = await c.env.DB.prepare(`
      SELECT * FROM file_bank_activity
      WHERE file_id = ?
      ORDER BY created_at DESC
      LIMIT 20
    `).bind(fileId).all()
    
    return c.json({
      file: {
        ...file,
        tags: file.tags ? JSON.parse(file.tags) : []
      },
      versions: versions || [],
      usage: usage || [],
      activity: activity || []
    })
  } catch (error: any) {
    console.error('Error fetching file:', error)
    return c.json({ error: 'Failed to fetch file', details: error.message }, 500)
  }
})

// Upload file (metadata only - actual upload handled by R2/client)
fileBank.post('/files', async (c) => {
  try {
    const {
      userEmail,
      filename,
      originalFilename,
      fileUrl,
      fileType,
      fileSize,
      fileExtension,
      folderId,
      tags,
      description
    } = await c.req.json()
    
    if (!userEmail || !filename || !fileUrl) {
      return c.json({ error: 'userEmail, filename, and fileUrl are required' }, 400)
    }
    
    // Determine file path
    let filePath = `/${filename}`
    if (folderId) {
      const folder = await c.env.DB.prepare('SELECT folder_path FROM file_bank_folders WHERE id = ?').bind(folderId).first()
      if (folder) {
        filePath = `${folder.folder_path}/${filename}`
      }
    }
    
    const result = await c.env.DB.prepare(`
      INSERT INTO file_bank_files (
        user_email, filename, original_filename, file_path, file_url,
        file_type, file_size, file_extension, folder_id, tags, description
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      userEmail,
      filename,
      originalFilename || filename,
      filePath,
      fileUrl,
      fileType || 'application/octet-stream',
      fileSize || 0,
      fileExtension || '',
      folderId || null,
      tags ? JSON.stringify(tags) : '[]',
      description || ''
    ).run()
    
    // Log activity
    await c.env.DB.prepare(`
      INSERT INTO file_bank_activity (file_id, user_email, activity_type)
      VALUES (?, ?, 'uploaded')
    `).bind(result.meta.last_row_id, userEmail).run()
    
    // Update folder file count
    if (folderId) {
      await c.env.DB.prepare(`
        UPDATE file_bank_folders
        SET file_count = file_count + 1,
            total_size = total_size + ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).bind(fileSize || 0, folderId).run()
    }
    
    return c.json({
      success: true,
      fileId: result.meta.last_row_id,
      message: 'File uploaded successfully'
    })
  } catch (error: any) {
    console.error('Error uploading file:', error)
    return c.json({ error: 'Failed to upload file', details: error.message }, 500)
  }
})

// Upload file with form data - NOW WITH R2 STORAGE!
fileBank.post('/files/upload', async (c) => {
  try {
    const formData = await c.req.formData()
    const userEmail = formData.get('userEmail') as string
    const folderId = (formData.get('folderId') || formData.get('folder_id')) as string
    
    // Support both 'file' (single) and 'files' (multiple)
    const files = formData.getAll('files').length > 0 ? formData.getAll('files') : [formData.get('file')];
    const validFiles = files.filter(f => f && f instanceof File) as File[];
    
    if (validFiles.length === 0 || !userEmail) {
      console.error('❌ Upload validation failed:', { 
        filesCount: validFiles.length, 
        userEmail,
        formDataKeys: Array.from(formData.keys())
      });
      return c.json({ error: 'At least one file and userEmail are required' }, 400)
    }
    
    console.log(`📤 Uploading ${validFiles.length} file(s) for ${userEmail}`);
    
    const uploadedFiles = [];
    
    for (const file of validFiles) {
      console.log(`📤 Processing: ${file.name} (${file.size} bytes)`);
      
      // Extract file info
      const filename = file.name
      const fileSize = file.size
      const fileType = file.type
      const fileExtension = filename.split('.').pop() || ''
      
      // 🚀 UPLOAD TO R2
      const r2Key = `uploads/${Date.now()}-${Math.random().toString(36).substring(2, 9)}-${filename}`;
      const arrayBuffer = await file.arrayBuffer();
      
      console.log(`📦 Uploading to R2: ${r2Key}`);
      await c.env.R2_BUCKET.put(r2Key, arrayBuffer, {
        httpMetadata: {
          contentType: fileType || 'application/octet-stream'
        }
      });
      console.log(`✅ Uploaded to R2 successfully`);
      
      // R2 file URL (will be served via /r2/ endpoint)
      const fileUrl = `/r2/${r2Key}`;
      
      // Determine file path and check if folder is shared
      let filePath = `/${filename}`
      let isShared = 0; // Default: not shared
      
      if (folderId) {
        const folder = await c.env.DB.prepare(`
          SELECT folder_path, is_team_shared 
          FROM file_bank_folders 
          WHERE id = ?
        `).bind(folderId).first()
        
        if (folder && folder.folder_path) {
          filePath = `${folder.folder_path}/${filename}`
          // If uploading to a shared folder, auto-share the file
          if (folder.is_team_shared === 1) {
            isShared = 1;
            console.log(`📁 Folder "${folder.folder_path}" is shared, auto-sharing file: ${filename}`);
          }
        }
      }
      
      const result = await c.env.DB.prepare(`
        INSERT INTO file_bank_files (
          user_email, filename, original_filename, file_path, file_url,
          file_type, file_size, file_extension, folder_id, tags, description, is_shared
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        userEmail,
        filename,
        filename,
        filePath,
        fileUrl,
        fileType || 'application/octet-stream',
        fileSize || 0,
        fileExtension || '',
        folderId || null,
        '[]',
        '',
        isShared
      ).run()
      
      // Log activity
      await c.env.DB.prepare(`
        INSERT INTO file_bank_activity (file_id, user_email, activity_type)
        VALUES (?, ?, 'uploaded')
      `).bind(result.meta.last_row_id, userEmail).run()
      
      // Update folder file count
      if (folderId) {
        await c.env.DB.prepare(`
          UPDATE file_bank_folders
          SET file_count = file_count + 1,
              total_size = total_size + ?,
              updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).bind(fileSize || 0, folderId).run()
      }
      
      uploadedFiles.push({
        id: result.meta.last_row_id,
        filename,
        fileSize,
        fileType,
        fileExtension,
        fileUrl
      });
    }
    
    return c.json({
      success: true,
      files: uploadedFiles,
      message: `${uploadedFiles.length} file(s) uploaded successfully`
    })
  } catch (error: any) {
    console.error('❌ Error uploading file:', error)
    return c.json({ error: 'Failed to upload file', details: error.message }, 500)
  }
})

// 🚀 SERVE FILES FROM R2
fileBank.get('/r2/*', async (c) => {
  try {
    const path = c.req.path.replace('/api/filebank/r2/', '')
    console.log(`📥 Fetching from R2: ${path}`)
    
    const object = await c.env.R2_BUCKET.get(path)
    
    if (!object) {
      console.error(`❌ File not found in R2: ${path}`)
      return c.notFound()
    }
    
    const headers = new Headers()
    object.writeHttpMetadata(headers)
    headers.set('etag', object.httpEtag)
    headers.set('Cache-Control', 'public, max-age=31536000')
    
    console.log(`✅ Serving from R2: ${path} (${object.size} bytes)`)
    
    return new Response(object.body, {
      headers
    })
  } catch (error: any) {
    console.error('❌ Error serving R2 file:', error)
    return c.json({ error: 'Failed to fetch file', details: error.message }, 500)
  }
})

// Update file metadata
fileBank.put('/files/:id', async (c) => {
  const fileId = c.req.param('id')
  
  try {
    const data = await c.req.json()
    const updates: string[] = []
    const params: any[] = []
    
    const allowedFields = ['filename', 'description', 'folder_id', 'tags', 'is_starred', 'is_pinned']
    
    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        if (field === 'tags' && Array.isArray(data[field])) {
          updates.push(`${field} = ?`)
          params.push(JSON.stringify(data[field]))
        } else {
          updates.push(`${field} = ?`)
          params.push(data[field])
        }
      }
    }
    
    if (updates.length === 0) {
      return c.json({ error: 'No fields to update' }, 400)
    }
    
    params.push(fileId)
    
    await c.env.DB.prepare(`
      UPDATE file_bank_files
      SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(...params).run()
    
    return c.json({ success: true, message: 'File updated successfully' })
  } catch (error: any) {
    console.error('Error updating file:', error)
    return c.json({ error: 'Failed to update file', details: error.message }, 500)
  }
})

// Delete file (soft delete) - only owner can delete
// Update file metadata (star, share, etc.)
fileBank.patch('/files/:id', async (c) => {
  const fileId = c.req.param('id')
  const body = await c.req.json()
  const userEmail = body.userEmail || c.req.header('X-User-Email') || 'unknown'
  
  console.log('🔧 PATCH /files/:id', { fileId, userEmail, body })
  
  try {
    // First check if file exists
    const file = await c.env.DB.prepare(`
      SELECT id, user_email, is_starred, is_shared FROM file_bank_files WHERE id = ? AND deleted_at IS NULL
    `).bind(fileId).first()
    
    console.log('📁 File found:', file)
    
    if (!file) {
      return c.json({ error: 'File not found' }, 404)
    }
    
    // Build update query dynamically
    const updates: string[] = []
    const values: any[] = []
    
    // Only owner can update is_shared
    if ('is_shared' in body) {
      console.log('🔍 Checking ownership:', { 
        fileOwner: file.user_email, 
        requestUser: userEmail,
        match: file.user_email === userEmail 
      })
      
      if (file.user_email !== userEmail) {
        console.log('❌ Permission denied: user_email mismatch')
        return c.json({ 
          error: 'Permission denied',
          message: 'You can only share files you uploaded',
          debug: { fileOwner: file.user_email, requestUser: userEmail }
        }, 403)
      }
      updates.push('is_shared = ?')
      values.push(body.is_shared ? 1 : 0)
    }
    
    // Anyone can star/unstar
    if ('is_starred' in body) {
      updates.push('is_starred = ?')
      values.push(body.is_starred ? 1 : 0)
    }
    
    if (updates.length === 0) {
      return c.json({ error: 'No valid fields to update' }, 400)
    }
    
    values.push(fileId)
    
    console.log('✏️ Updating file:', { updates, values })
    
    const updateQuery = `
      UPDATE file_bank_files
      SET ${updates.join(', ')}
      WHERE id = ?
    `;
    console.log('📝 SQL Query:', updateQuery, 'Values:', values);
    
    const updateResult = await c.env.DB.prepare(updateQuery).bind(...values).run()
    
    console.log('✅ File updated successfully', updateResult)
    
    return c.json({ success: true, message: 'File updated successfully' })
  } catch (error: any) {
    console.error('❌ Error updating file:', error)
    return c.json({ error: 'Failed to update file', details: error.message, stack: error.stack }, 500)
  }
})

fileBank.delete('/files/:id', async (c) => {
  const fileId = c.req.param('id')
  const bodyText = await c.req.text()
  let body: any = {}
  try {
    body = bodyText ? JSON.parse(bodyText) : {}
  } catch (e) {
    console.log('⚠️ Could not parse DELETE body')
  }
  const userEmail = body.userEmail || c.req.header('X-User-Email') || c.req.query('userEmail') || 'unknown'
  
  console.log('🗑️ DELETE /files/:id', { fileId, userEmail, body })
  
  try {
    // First check if file exists
    const file = await c.env.DB.prepare(`
      SELECT id, user_email FROM file_bank_files WHERE id = ? AND deleted_at IS NULL
    `).bind(fileId).first()
    
    console.log('📁 File found:', file)
    
    if (!file) {
      return c.json({ error: 'File not found' }, 404)
    }
    
    console.log('🔍 Checking ownership:', { 
      fileOwner: file.user_email, 
      requestUser: userEmail,
      match: file.user_email === userEmail 
    })
    
    // Check ownership (allow deletion only by owner)
    if (file.user_email !== userEmail) {
      console.log('❌ Permission denied: user_email mismatch')
      return c.json({ 
        error: 'Permission denied',
        message: 'You can only delete files you uploaded',
        debug: { fileOwner: file.user_email, requestUser: userEmail }
      }, 403)
    }
    
    await c.env.DB.prepare(`
      UPDATE file_bank_files
      SET deleted_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(fileId).run()
    
    console.log('✅ File deleted successfully')
    
    return c.json({ success: true, message: 'File deleted successfully' })
  } catch (error: any) {
    console.error('❌ Error deleting file:', error)
    return c.json({ error: 'Failed to delete file', details: error.message, stack: error.stack }, 500)
  }
})

// ===== FOLDERS =====

// Get all folders
fileBank.get('/folders', async (c) => {
  const userEmail = c.req.query('userEmail') || c.req.query('user') || 'admin@investaycapital.com'
  
  try {
    // Get user's own folders + team shared folders
    const { results } = await c.env.DB.prepare(`
      SELECT * FROM file_bank_folders
      WHERE user_email = ? OR is_team_shared = 1
      ORDER BY is_team_shared DESC, is_pinned DESC, folder_name ASC
    `).bind(userEmail).all()
    
    return c.json({ folders: results || [] })
  } catch (error: any) {
    console.error('Error fetching folders:', error)
    return c.json({ error: 'Failed to fetch folders', details: error.message }, 500)
  }
})

// Create folder
fileBank.post('/folders', async (c) => {
  try {
    const body = await c.req.json()
    const userEmail = body.userEmail || body.user_email
    const folderName = body.folderName || body.folder_name
    const parentFolderId = body.parentFolderId || body.parent_folder_id
    const { icon, color, description, isShared, isTeamShared } = body
    
    console.log('📁 Creating folder:', { userEmail, folderName, parentFolderId, body })
    
    if (!userEmail || !folderName) {
      console.error('❌ Validation failed:', { userEmail, folderName })
      return c.json({ error: 'userEmail and folderName are required' }, 400)
    }
    
    // Build folder path
    let folderPath = `/${folderName}`
    if (parentFolderId) {
      const parent = await c.env.DB.prepare('SELECT folder_path FROM file_bank_folders WHERE id = ?').bind(parentFolderId).first()
      if (parent && parent.folder_path) {
        folderPath = `${parent.folder_path}/${folderName}`
      }
    }
    
    console.log('📂 Folder path:', folderPath)
    
    const result = await c.env.DB.prepare(`
      INSERT INTO file_bank_folders (
        user_email, folder_name, parent_folder_id, folder_path, icon, color, description, is_shared, is_team_shared
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      userEmail,
      folderName,
      parentFolderId || null,
      folderPath,
      icon || '📁',
      color || '#C9A962',
      description || '',
      isShared ? 1 : 0,
      isTeamShared ? 1 : 0
    ).run()
    
    console.log('✅ Folder created successfully:', result.meta.last_row_id)
    
    return c.json({
      success: true,
      folderId: result.meta.last_row_id,
      message: 'Folder created successfully'
    })
  } catch (error: any) {
    console.error('❌ Error creating folder:', error)
    return c.json({ error: 'Failed to create folder', details: error.message, stack: error.stack }, 500)
  }
})

// ===== USAGE TRACKING =====

// Track file usage in email
fileBank.post('/usage', async (c) => {
  try {
    const { fileId, threadId, emailId, userEmail, usageType } = await c.req.json()
    
    if (!fileId || !userEmail || !usageType) {
      return c.json({ error: 'fileId, userEmail, and usageType are required' }, 400)
    }
    
    const result = await c.env.DB.prepare(`
      INSERT INTO file_bank_usage (
        file_id, thread_id, email_id, user_email, usage_type
      ) VALUES (?, ?, ?, ?, ?)
    `).bind(fileId, threadId || null, emailId || null, userEmail, usageType).run()
    
    // Update file thread count
    await c.env.DB.prepare(`
      UPDATE file_bank_files
      SET thread_count = (
        SELECT COUNT(DISTINCT thread_id)
        FROM file_bank_usage
        WHERE file_id = ? AND thread_id IS NOT NULL
      ),
      share_count = share_count + 1
      WHERE id = ?
    `).bind(fileId, fileId).run()
    
    return c.json({ success: true, usageId: result.meta.last_row_id })
  } catch (error: any) {
    console.error('Error tracking usage:', error)
    return c.json({ error: 'Failed to track usage', details: error.message }, 500)
  }
})

// Get suggested files for thread
fileBank.get('/suggestions', async (c) => {
  const userEmail = c.req.query('userEmail') || c.req.query('user') || 'admin@investaycapital.com'
  const threadId = c.req.query('threadId')
  
  try {
    // Get files already used in this thread
    let threadFiles: any[] = []
    if (threadId) {
      const { results } = await c.env.DB.prepare(`
        SELECT DISTINCT f.*
        FROM file_bank_files f
        JOIN file_bank_usage u ON f.id = u.file_id
        WHERE u.thread_id = ? AND f.deleted_at IS NULL
        ORDER BY u.created_at DESC
        LIMIT 5
      `).bind(threadId).all()
      threadFiles = results || []
    }
    
    // Get starred files
    const { results: starredFiles } = await c.env.DB.prepare(`
      SELECT * FROM file_bank_files
      WHERE user_email = ? AND is_starred = 1 AND deleted_at IS NULL
      ORDER BY updated_at DESC
      LIMIT 5
    `).bind(userEmail).all()
    
    // Get recently used files
    const { results: recentFiles } = await c.env.DB.prepare(`
      SELECT DISTINCT f.*
      FROM file_bank_files f
      JOIN file_bank_usage u ON f.id = u.file_id
      WHERE f.user_email = ? AND f.deleted_at IS NULL
      ORDER BY u.created_at DESC
      LIMIT 5
    `).bind(userEmail).all()
    
    return c.json({
      threadFiles: threadFiles.map((f: any) => ({ ...f, tags: f.tags ? JSON.parse(f.tags) : [] })),
      starredFiles: (starredFiles || []).map((f: any) => ({ ...f, tags: f.tags ? JSON.parse(f.tags) : [] })),
      recentFiles: (recentFiles || []).map((f: any) => ({ ...f, tags: f.tags ? JSON.parse(f.tags) : [] }))
    })
  } catch (error: any) {
    console.error('Error fetching suggestions:', error)
    return c.json({ error: 'Failed to fetch suggestions', details: error.message }, 500)
  }
})

export default fileBank
