import { auth, googleProvider, getCachedGoogleToken, setCachedGoogleToken } from '../firebase';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';

export interface DriveFileItem {
  id: string;
  name: string;
  mimeType: string;
  webViewLink?: string;
  webContentLink?: string;
  thumbnailLink?: string;
  size?: string;
  createdTime?: string;
  formattedUrl: string;
}

export interface UploadResult {
  fileId: string;
  name: string;
  mimeType: string;
  webViewLink: string;
  webContentLink: string;
  displayUrl: string; // Direct link for <img> or <audio>
}

/**
 * Ensures a valid Google OAuth access token with Drive scopes is present.
 * If not yet authorized, triggers the Google sign-in popup.
 */
export async function ensureGoogleDriveToken(): Promise<string> {
  const existing = getCachedGoogleToken();
  if (existing) {
    return existing;
  }

  try {
    const result = await signInWithPopup(auth, googleProvider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Não foi possível obter o token de acesso do Google Drive.');
    }
    setCachedGoogleToken(credential.accessToken);
    return credential.accessToken;
  } catch (error: any) {
    console.error('Erro na autenticação do Google Drive:', error);
    throw new Error(error.message || 'Falha ao conectar com o Google Drive');
  }
}

/**
 * Formats a Google Drive file ID into an optimized direct stream/embed URL
 * according to its media type.
 */
export function formatDriveMediaUrl(fileId: string, mimeType: string): string {
  if (mimeType.startsWith('image/')) {
    // High-resolution image direct thumbnail
    return `https://drive.google.com/thumbnail?id=${fileId}&sz=w1600`;
  }
  if (mimeType.startsWith('audio/')) {
    // Direct audio streaming link for HTML5 <audio>
    return `https://docs.google.com/uc?export=download&id=${fileId}`;
  }
  if (mimeType.startsWith('video/')) {
    // Direct preview link
    return `https://drive.google.com/file/d/${fileId}/preview`;
  }
  return `https://drive.google.com/file/d/${fileId}/view`;
}

/**
 * Uploads a local file (from file picker / gallery) directly into Google Drive
 * and makes it accessible for playback and display on the site.
 */
export async function uploadFileToDrive(
  file: File,
  onProgress?: (percent: number) => void
): Promise<UploadResult> {
  const token = await ensureGoogleDriveToken();

  // Step 1: Prepare multipart upload
  const metadata = {
    name: file.name,
    mimeType: file.type || 'application/octet-stream',
    description: `Carregado via Omni Sounds Studio (${new Date().toLocaleDateString('pt-PT')})`
  };

  const boundary = '-------314159265358979323846';
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const fileBuffer = await file.arrayBuffer();

  const metadataPart = delimiter +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    JSON.stringify(metadata);

  const filePartHeader = delimiter +
    `Content-Type: ${file.type || 'application/octet-stream'}\r\n\r\n`;

  // Build the complete multipart payload
  const enc = new TextEncoder();
  const metaBytes = enc.encode(metadataPart);
  const fileHeaderBytes = enc.encode(filePartHeader);
  const closeBytes = enc.encode(closeDelimiter);

  const totalLength = metaBytes.length + fileHeaderBytes.length + fileBuffer.byteLength + closeBytes.length;
  const combinedPayload = new Uint8Array(totalLength);

  let offset = 0;
  combinedPayload.set(metaBytes, offset);
  offset += metaBytes.length;

  combinedPayload.set(fileHeaderBytes, offset);
  offset += fileHeaderBytes.length;

  combinedPayload.set(new Uint8Array(fileBuffer), offset);
  offset += fileBuffer.byteLength;

  combinedPayload.set(closeBytes, offset);

  // Step 2: Upload using XMLHttpRequest to report progress
  const uploadResponse = await new Promise<any>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,webViewLink,webContentLink,thumbnailLink');
    xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    xhr.setRequestHeader('Content-Type', `multipart/related; boundary=${boundary}`);

    if (xhr.upload && onProgress) {
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percentComplete = Math.round((event.loaded / event.total) * 100);
          onProgress(percentComplete);
        }
      };
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const res = JSON.parse(xhr.responseText);
          resolve(res);
        } catch (e) {
          reject(new Error('Erro ao processar resposta do Google Drive.'));
        }
      } else {
        let msg = `Erro no envio (${xhr.status})`;
        try {
          const errRes = JSON.parse(xhr.responseText);
          if (errRes.error?.message) {
            msg = errRes.error.message;
          }
        } catch (e) {
          // ignore
        }
        reject(new Error(msg));
      }
    };

    xhr.onerror = () => {
      reject(new Error('Falha de rede ao conectar com os servidores do Google Drive.'));
    };

    xhr.send(combinedPayload);
  });

  const fileId = uploadResponse.id;

  // Step 3: Set read permissions to 'anyone' so the media can be played/viewed directly on the site
  try {
    await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}/permissions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        role: 'reader',
        type: 'anyone'
      })
    });
  } catch (permErr) {
    console.warn('Não foi possível definir permissão pública automática no arquivo:', permErr);
  }

  const mimeType = uploadResponse.mimeType || file.type;
  const displayUrl = formatDriveMediaUrl(fileId, mimeType);

  return {
    fileId,
    name: uploadResponse.name || file.name,
    mimeType,
    webViewLink: uploadResponse.webViewLink || `https://drive.google.com/file/d/${fileId}/view`,
    webContentLink: uploadResponse.webContentLink || `https://docs.google.com/uc?export=download&id=${fileId}`,
    displayUrl
  };
}

/**
 * Lists the user's files from Google Drive with optional media type filter
 * and search string.
 */
export async function listGoogleDriveFiles(
  mediaFilter: 'all' | 'audio' | 'image' | 'video' = 'all',
  searchQuery: string = ''
): Promise<DriveFileItem[]> {
  const token = await ensureGoogleDriveToken();

  let q = 'trashed = false';

  if (mediaFilter === 'audio') {
    q += " and (mimeType contains 'audio/' or name contains '.mp3' or name contains '.wav')";
  } else if (mediaFilter === 'image') {
    q += " and (mimeType contains 'image/' or name contains '.jpg' or name contains '.png' or name contains '.webp')";
  } else if (mediaFilter === 'video') {
    q += " and (mimeType contains 'video/' or name contains '.mp4' or name contains '.mov')";
  }

  if (searchQuery.trim()) {
    const cleanSearch = searchQuery.trim().replace(/'/g, "\\'");
    q += ` and name contains '${cleanSearch}'`;
  }

  const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&fields=files(id,name,mimeType,webViewLink,webContentLink,thumbnailLink,size,createdTime)&orderBy=modifiedTime desc&pageSize=35`;

  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || `Erro ao carregar arquivos do Drive (${response.status})`);
  }

  const data = await response.json();
  const files: any[] = data.files || [];

  return files.map((f) => ({
    id: f.id,
    name: f.name,
    mimeType: f.mimeType,
    webViewLink: f.webViewLink,
    webContentLink: f.webContentLink,
    thumbnailLink: f.thumbnailLink,
    size: f.size,
    createdTime: f.createdTime,
    formattedUrl: formatDriveMediaUrl(f.id, f.mimeType)
  }));
}

/**
 * Deletes a file from Google Drive.
 */
export async function deleteDriveFile(fileId: string): Promise<void> {
  const token = await ensureGoogleDriveToken();
  const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok && response.status !== 204) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || `Erro ao excluir arquivo do Google Drive (${response.status})`);
  }
}
