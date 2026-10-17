import { getCachedAccessToken, requestGoogleDriveAccess, setCachedAccessToken } from '../firebase';

export interface DriveAudioFile {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  sizeBytes?: number;
  webViewLink?: string;
  webContentLink?: string;
  iconLink?: string;
  thumbnailLink?: string;
  createdTime?: string;
  modifiedTime?: string;
  directAudioUrl: string;
  previewEmbedUrl: string;
  extractedMeta: ExtractedBeatMetadata;
}

export interface ExtractedBeatMetadata {
  cleanTitle: string;
  bpm: number;
  scale: string;
  genre: string;
  tags: string[];
}

/**
 * Format bytes into human readable format (MB, KB)
 */
export function formatBytes(bytes?: number | string): string {
  if (!bytes) return 'Tamanho n/d';
  const num = typeof bytes === 'string' ? parseInt(bytes, 10) : bytes;
  if (isNaN(num) || num <= 0) return 'Tamanho n/d';
  if (num < 1024 * 1024) {
    return `${(num / 1024).toFixed(1)} KB`;
  }
  return `${(num / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Intelligent parser to extract beat title, BPM, scale/key, genre, and tags from audio filenames.
 * Examples:
 * - "Travis Scott x Drake - Utopia Dark Trap [140 BPM - C# Minor].mp3"
 * - "Afrobeat Club Hit - Luanda Nights 105bpm Am.wav"
 * - "Kizomba Romântica - Amor Eterno (prod. Pascoal) [88 BPM].mp3"
 */
export function extractBeatMetadataFromFilename(filename: string): ExtractedBeatMetadata {
  // Remove file extension
  let base = filename.replace(/\.(mp3|wav|m4a|aac|flac|ogg|aiff|wma)$/i, '').trim();

  // 1. Detect BPM
  let bpm = 140; // Default
  const bpmMatch = base.match(/(\d{2,3})\s*(?:bpm|BPM)/i) || 
                   base.match(/\b(6[0-9]|7[0-9]|8[0-9]|9[0-9]|1[0-9]{2}|200)\b/);
  if (bpmMatch && bpmMatch[1]) {
    const parsedBpm = parseInt(bpmMatch[1], 10);
    if (parsedBpm >= 60 && parsedBpm <= 200) {
      bpm = parsedBpm;
    }
  }

  // 2. Detect Musical Key / Scale
  let scale = 'C Minor';
  const scalePatterns = [
    /\b([A-G][#b]?\s*(?:Minor|Major|min|maj|m))\b/i,
    /\b([A-G][#b]?m)\b/,
    /\b([A-G][#b]?\s*m[A-Za-z]+)\b/i
  ];
  for (const pattern of scalePatterns) {
    const match = base.match(pattern);
    if (match && match[1]) {
      let rawKey = match[1].trim();
      // Normalize
      if (/min$/i.test(rawKey) || /minor$/i.test(rawKey) || /[a-g][#b]?m$/i.test(rawKey)) {
        const root = rawKey.charAt(0).toUpperCase() + (rawKey.charAt(1) === '#' || rawKey.charAt(1) === 'b' ? rawKey.charAt(1) : '');
        scale = `${root} Minor`;
      } else if (/maj$/i.test(rawKey) || /major$/i.test(rawKey)) {
        const root = rawKey.charAt(0).toUpperCase() + (rawKey.charAt(1) === '#' || rawKey.charAt(1) === 'b' ? rawKey.charAt(1) : '');
        scale = `${root} Major`;
      } else {
        scale = rawKey;
      }
      break;
    }
  }

  // 3. Detect Genre
  const genreKeywords: Record<string, string[]> = {
    'Trap': ['trap', '808', 'dark trap', 'rage', 'hard trap', 'melodic trap'],
    'Afrobeat': ['afrobeat', 'afrobeats', 'afro', 'burna', 'wizkid', 'rema', 'luanda', 'amapiano'],
    'Drill': ['drill', 'uk drill', 'ny drill', 'chicago drill'],
    'Kizomba': ['kizomba', 'tarraxinha', 'ghetto zouk', 'zouk', 'semba'],
    'R&B': ['r&b', 'rnb', 'soul', 'neo soul', 'slow jam'],
    'Boom Bap': ['boom bap', 'boombap', '90s', 'lofi', 'lo-fi', 'old school'],
    'Kuduro': ['kuduro', 'afro house', 'batida'],
    'Pop': ['pop', 'dance', 'synthwave', 'commercial']
  };

  let genre = 'Trap';
  const lowerBase = base.toLowerCase();
  for (const [gName, keywords] of Object.entries(genreKeywords)) {
    if (keywords.some(kw => lowerBase.includes(kw))) {
      genre = gName;
      break;
    }
  }

  // 4. Clean Title
  // Strip producer prefixes/suffixes like "[FREE]", "(Prod. by ...)", brackets with BPM/Key
  let cleanTitle = base
    .replace(/\[\s*(?:FREE|OFFICIAL|EXCLUSIVO|TAGGED|PROD|INSTRUMENTAL)[^\]]*\]/gi, '')
    .replace(/\(\s*(?:FREE|OFFICIAL|EXCLUSIVO|TAGGED|PROD|INSTRUMENTAL)[^)]*\)/gi, '')
    .replace(/\[\s*\d+\s*bpm[^\]]*\]/gi, '')
    .replace(/\(\s*\d+\s*bpm[^)]*\)/gi, '')
    .replace(/\[\s*[A-G][#b]?\s*(?:min|maj|minor|major)[^\]]*\]/gi, '')
    .replace(/prod\.\s*by\s*[\w\s-]+/gi, '')
    .replace(/prod\s*[\w\s-]+/gi, '')
    .replace(/[-_]{2,}/g, '-')
    .replace(/^[ -]+|[ -]+$/g, '')
    .trim();

  if (!cleanTitle) {
    cleanTitle = base.replace(/\.(mp3|wav|m4a)$/i, '');
  }

  // 5. Generate intelligent tags
  const tagsSet = new Set<string>();
  tagsSet.add(genre.toLowerCase());
  
  if (lowerBase.includes('dark')) tagsSet.add('dark');
  if (lowerBase.includes('hard')) tagsSet.add('hard');
  if (lowerBase.includes('melodic')) tagsSet.add('melodic');
  if (lowerBase.includes('heavy') || lowerBase.includes('808')) tagsSet.add('808');
  if (lowerBase.includes('club') || lowerBase.includes('dance')) tagsSet.add('club');
  if (lowerBase.includes('vibes') || lowerBase.includes('chill')) tagsSet.add('chill');
  if (lowerBase.includes('guitar')) tagsSet.add('guitar');
  if (lowerBase.includes('piano')) tagsSet.add('piano');
  if (lowerBase.includes('vocal')) tagsSet.add('vocal');
  tagsSet.add(`${bpm}bpm`);

  const tags = Array.from(tagsSet).slice(0, 5);

  return {
    cleanTitle,
    bpm,
    scale,
    genre,
    tags
  };
}

/**
 * Fetch audio files from user's Google Drive via REST API v3
 */
export async function fetchGoogleDriveAudioFiles(
  searchQuery = '',
  pageToken?: string
): Promise<{ files: DriveAudioFile[]; nextPageToken?: string }> {
  let token = getCachedAccessToken();

  // If token is missing, attempt to authenticate with Google Drive
  if (!token) {
    const authResult = await requestGoogleDriveAccess();
    token = authResult.accessToken;
  }

  if (!token) {
    throw new Error('Não foi possível obter credenciais do Google Drive.');
  }

  // Construct query for audio files
  // Supports audio MIME types and standard music extensions
  const mimeQuery = "mimeType contains 'audio/' or mimeType = 'application/vnd.google-apps.audio' or name contains '.mp3' or name contains '.wav' or name contains '.m4a' or name contains '.flac' or name contains '.aac' or name contains '.ogg'";
  
  let q = `(${mimeQuery}) and trashed = false`;
  if (searchQuery.trim()) {
    const sanitizedSearch = searchQuery.trim().replace(/['\\]/g, '');
    q += ` and name contains '${sanitizedSearch}'`;
  }

  const params = new URLSearchParams({
    q,
    pageSize: '50',
    fields: 'nextPageToken, files(id, name, mimeType, size, webViewLink, webContentLink, iconLink, thumbnailLink, createdTime, modifiedTime)',
    orderBy: 'modifiedTime desc'
  });

  if (pageToken) {
    params.set('pageToken', pageToken);
  }

  const response = await fetch(`https://www.googleapis.com/drive/v3/files?${params.toString()}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json'
    }
  });

  if (response.status === 401) {
    // Token may have expired, clear cached token
    setCachedAccessToken(null);
    throw new Error('Sessão do Google Drive expirada. Por favor, conecte novamente.');
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const message = errorData?.error?.message || `Erro do Google Drive (${response.status})`;
    throw new Error(message);
  }

  const data = await response.json();
  const rawFiles = data.files || [];

  const files: DriveAudioFile[] = rawFiles.map((file: any) => {
    const extractedMeta = extractBeatMetadataFromFilename(file.name || 'Sem título');
    const directAudioUrl = `https://docs.google.com/uc?export=download&id=${file.id}`;
    const previewEmbedUrl = `https://drive.google.com/file/d/${file.id}/preview`;

    return {
      id: file.id,
      name: file.name,
      mimeType: file.mimeType || 'audio/mpeg',
      size: formatBytes(file.size),
      sizeBytes: file.size ? parseInt(file.size, 10) : undefined,
      webViewLink: file.webViewLink,
      webContentLink: file.webContentLink,
      iconLink: file.iconLink,
      thumbnailLink: file.thumbnailLink,
      createdTime: file.createdTime,
      modifiedTime: file.modifiedTime,
      directAudioUrl,
      previewEmbedUrl,
      extractedMeta
    };
  });

  return {
    files,
    nextPageToken: data.nextPageToken
  };
}

export type UploadProgressCallback = (percent: number, statusText: string) => void;

export interface UploadedDriveTrackResult extends DriveAudioFile {
  file: DriveAudioFile;
  shareableAudioUrl: string;
  previewEmbedUrl: string;
  extractedMeta: ExtractedBeatMetadata;
}

/**
 * Find or create a dedicated folder in Google Drive for Omni Sounds catalog tracks
 */
export async function getOrCreateDriveFolder(folderName = 'Omni Sounds - Catálogo', token: string): Promise<string | null> {
  try {
    const searchRes = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=mimeType='application/vnd.google-apps.folder' and name='${folderName.replace(/'/g, "\\'")}' and trashed=false&fields=files(id,name)`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json'
        }
      }
    );

    if (searchRes.ok) {
      const data = await searchRes.json();
      if (data.files && data.files.length > 0) {
        return data.files[0].id;
      }
    }

    // Create the folder
    const createRes = await fetch('https://www.googleapis.com/drive/v3/files', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Accept: 'application/json'
      },
      body: JSON.stringify({
        name: folderName,
        mimeType: 'application/vnd.google-apps.folder',
        description: 'Músicas e instrumentais enviados a partir do seu telefone/dispositivo pelo Omni Sounds'
      })
    });

    if (createRes.ok) {
      const newFolder = await createRes.json();
      return newFolder.id || null;
    }
  } catch (err) {
    console.warn('Não foi possível obter ou criar pasta específica no Drive, usando raiz:', err);
  }
  return null;
}

/**
 * Upload an audio file directly from device (phone or computer) to Google Drive.
 * 1. Uploads file to Google Drive (in "Omni Sounds - Catálogo" folder)
 * 2. Makes file streamable via Google Drive link
 * 3. Automatically parses title, BPM, scale, genre, and tags
 * 4. Returns ready-to-use audio URLs for catalog playback
 */
export async function uploadAudioFileToGoogleDrive(
  file: File,
  onProgress?: UploadProgressCallback
): Promise<UploadedDriveTrackResult> {
  let token = getCachedAccessToken();

  if (!token) {
    if (onProgress) onProgress(5, 'Conectando ao Google Drive...');
    const authResult = await requestGoogleDriveAccess();
    token = authResult.accessToken;
  }

  if (!token) {
    throw new Error('Não foi possível autenticar com o Google Drive para fazer o upload.');
  }

  if (onProgress) onProgress(10, 'Preparando nuvem no Google Drive...');

  // Try to locate/create organized folder
  const folderId = await getOrCreateDriveFolder('Omni Sounds - Catálogo', token);

  if (onProgress) onProgress(15, `A enviar "${file.name}" para o Google Drive (0%)...`);

  // Prepare metadata
  const metadata = {
    name: file.name,
    mimeType: file.type || 'audio/mpeg',
    description: 'Enviado do telefone/dispositivo pelo painel Omni Sounds',
    ...(folderId ? { parents: [folderId] } : {})
  };

  const boundary = '-------OmniSoundsUpload_' + Math.random().toString(36).substring(2);
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const metaPart = `${delimiter}Content-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n`;
  const fileHeaderPart = `${delimiter}Content-Type: ${file.type || 'audio/mpeg'}\r\n\r\n`;

  const metaBlob = new Blob([metaPart, fileHeaderPart]);
  const closeBlob = new Blob([closeDelimiter]);
  const multipartBlob = new Blob([metaBlob, file, closeBlob], {
    type: `multipart/related; boundary=${boundary}`
  });

  const uploadFields = 'id, name, mimeType, size, webViewLink, webContentLink, createdTime, modifiedTime';
  const uploadUrl = `https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=${uploadFields}`;

  // Execute upload with progress tracking
  const uploadedRawFile: any = await new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', uploadUrl, true);
    xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    xhr.setRequestHeader('Content-Type', `multipart/related; boundary=${boundary}`);

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        // Range 15% to 85%
        const percent = Math.round(15 + (e.loaded / e.total) * 70);
        const percentText = Math.round((e.loaded / e.total) * 100);
        onProgress(percent, `A enviar ficheiro para o Google Drive (${percentText}%)...`);
      }
    };

    xhr.onload = () => {
      if (xhr.status === 401) {
        setCachedAccessToken(null);
        reject(new Error('Sessão do Google Drive expirada durante o upload. Conecte novamente.'));
        return;
      }

      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const res = JSON.parse(xhr.responseText);
          resolve(res);
        } catch (parseErr) {
          reject(new Error('Resposta inválida do Google Drive'));
        }
      } else {
        let errMsg = `Erro no upload (${xhr.status})`;
        try {
          const errRes = JSON.parse(xhr.responseText);
          if (errRes.error?.message) errMsg = errRes.error.message;
        } catch (_) {}
        reject(new Error(errMsg));
      }
    };

    xhr.onerror = () => {
      reject(new Error('Erro de conexão ao enviar para o Google Drive. Verifique sua internet.'));
    };

    xhr.send(multipartBlob);
  });

  if (onProgress) onProgress(88, 'Configurando permissão de áudio para reprodução...');

  // Make the file readable for streaming on site
  try {
    await fetch(`https://www.googleapis.com/drive/v3/files/${uploadedRawFile.id}/permissions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        role: 'reader',
        type: 'anyone'
      })
    });
  } catch (permErr) {
    console.warn('Aviso: falha ao definir permissão pública do áudio no Drive:', permErr);
  }

  if (onProgress) onProgress(96, 'Extraindo metadados musicais (BPM, tom e tags)...');

  const extractedMeta = extractBeatMetadataFromFilename(uploadedRawFile.name || file.name);
  const directAudioUrl = `https://docs.google.com/uc?export=download&id=${uploadedRawFile.id}`;
  const previewEmbedUrl = `https://drive.google.com/file/d/${uploadedRawFile.id}/preview`;

  const driveFile: DriveAudioFile = {
    id: uploadedRawFile.id,
    name: uploadedRawFile.name || file.name,
    mimeType: uploadedRawFile.mimeType || file.type || 'audio/mpeg',
    size: formatBytes(uploadedRawFile.size || file.size),
    sizeBytes: uploadedRawFile.size ? parseInt(uploadedRawFile.size, 10) : file.size,
    webViewLink: uploadedRawFile.webViewLink,
    webContentLink: uploadedRawFile.webContentLink,
    createdTime: uploadedRawFile.createdTime,
    modifiedTime: uploadedRawFile.modifiedTime,
    directAudioUrl,
    previewEmbedUrl,
    extractedMeta
  };

  if (onProgress) onProgress(100, 'Upload para o Google Drive concluído com sucesso!');

  return {
    ...driveFile,
    file: driveFile,
    shareableAudioUrl: directAudioUrl,
    previewEmbedUrl,
    extractedMeta
  };
}

export const uploadAudioFileToDrive = uploadAudioFileToGoogleDrive;
