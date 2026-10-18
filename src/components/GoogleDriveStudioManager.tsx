import React, { useState, useEffect, useRef } from 'react';
import { 
  Cloud, Upload, RefreshCw, Search, Music, Image as ImageIcon, Video, 
  Trash2, ExternalLink, Copy, Check, Play, Pause, AlertCircle, Loader2,
  FolderOpen, Sparkles, FileText, CheckCircle2
} from 'lucide-react';
import { 
  listGoogleDriveFiles, 
  uploadFileToDrive, 
  deleteDriveFile, 
  DriveFileItem, 
  formatDriveMediaUrl 
} from '../services/googleDriveService';
import { transformGoogleDriveAudioUrl, transformGoogleDriveUrl } from '../types';

export default function GoogleDriveStudioManager() {
  const [files, setFiles] = useState<DriveFileItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Filters & search
  const [filter, setFilter] = useState<'all' | 'audio' | 'image' | 'video'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Upload state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadingName, setUploadingName] = useState<string | null>(null);

  // Audio preview state
  const [playingFileId, setPlayingFileId] = useState<string | null>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  // Delete modal state
  const [fileToDelete, setFileToDelete] = useState<DriveFileItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Copied link state
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchFiles = async (customFilter = filter) => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const result = await listGoogleDriveFiles(customFilter, searchQuery);
      setFiles(result);
    } catch (err: any) {
      console.warn('Google Drive Manager:', err);
      setErrorMsg(err.message || 'Não foi possível carregar os arquivos do Google Drive.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, [filter]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;
    const file = fileList[0];

    setErrorMsg(null);
    setIsUploading(true);
    setUploadProgress(0);
    setUploadingName(file.name);

    try {
      const result = await uploadFileToDrive(file, (percent) => {
        setUploadProgress(percent);
      });
      setSuccessMsg(`Arquivo "${file.name}" enviado com sucesso para o Google Drive!`);
      setTimeout(() => setSuccessMsg(null), 4000);
      await fetchFiles();
    } catch (err: any) {
      console.warn('Erro de envio ao Drive:', err);
      setErrorMsg(err.message || 'Falha ao enviar arquivo para o Google Drive.');
    } finally {
      setIsUploading(false);
      setUploadingName(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleConfirmDelete = async () => {
    if (!fileToDelete) return;
    setIsDeleting(true);
    setErrorMsg(null);
    try {
      await deleteDriveFile(fileToDelete.id);
      setFiles(prev => prev.filter(f => f.id !== fileToDelete.id));
      if (playingFileId === fileToDelete.id) {
        setPlayingFileId(null);
        if (audioPlayerRef.current) audioPlayerRef.current.pause();
      }
      setSuccessMsg(`Arquivo "${fileToDelete.name}" excluído do Google Drive.`);
      setTimeout(() => setSuccessMsg(null), 4000);
      setFileToDelete(null);
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao excluir o arquivo do Google Drive.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCopyUrl = (file: DriveFileItem) => {
    navigator.clipboard?.writeText(file.formattedUrl);
    setCopiedId(file.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const togglePlayAudio = (file: DriveFileItem) => {
    if (playingFileId === file.id) {
      if (audioPlayerRef.current) audioPlayerRef.current.pause();
      setPlayingFileId(null);
    } else {
      setPlayingFileId(file.id);
      if (audioPlayerRef.current) {
        audioPlayerRef.current.src = transformGoogleDriveAudioUrl(file.formattedUrl);
        audioPlayerRef.current.play().catch(err => {
          console.warn('Preview play warning:', err);
        });
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Hidden audio element for previews */}
      <audio
        ref={audioPlayerRef}
        onEnded={() => setPlayingFileId(null)}
        onError={() => setPlayingFileId(null)}
      />

      {/* Header & Status Card */}
      <div className="bg-gradient-to-r from-amber-500/10 via-zinc-900 to-zinc-900 p-5 rounded-2xl border border-amber-500/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Cloud className="w-5 h-5" />
            </span>
            <div>
              <h3 className="font-bold text-white text-base">Google Drive do Estúdio Omni</h3>
              <p className="text-zinc-400 text-xs font-mono">
                Armazenamento em nuvem oficial para beats, stems de áudio, capas e artes de lançamentos.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-mono flex items-center gap-1.5 font-bold">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Drive API Ativa</span>
          </span>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs tracking-wide shadow-md transition-all cursor-pointer"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-black" />
                <span>A Enviar ({uploadProgress}%)</span>
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 stroke-[2.5px]" />
                <span>Novo Envio para o Drive</span>
              </>
            )}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleUpload}
            accept="audio/*,image/*,video/*,.mp3,.wav,.flac,.jpg,.png,.webp,.zip"
            className="hidden"
          />
        </div>
      </div>

      {/* Upload progress feedback */}
      {isUploading && (
        <div className="bg-zinc-900/90 border border-zinc-800 p-4 rounded-xl space-y-2">
          <div className="flex justify-between text-xs font-mono text-zinc-300">
            <span>A carregar: {uploadingName}</span>
            <span className="text-amber-400 font-bold">{uploadProgress}%</span>
          </div>
          <div className="w-full h-2 bg-zinc-950 rounded-full overflow-hidden border border-zinc-800">
            <div 
              className="h-full bg-gradient-to-r from-amber-500 to-amber-400 transition-all duration-200"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Notifications */}
      {successMsg && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="p-3 bg-red-950/40 border border-red-800/60 rounded-xl text-red-300 text-xs flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg(null)} className="text-red-400 hover:text-white">✕</button>
        </div>
      )}

      {/* Toolbar: Search, Filters, Refresh */}
      <div className="bg-zinc-900/60 border border-zinc-900 p-4 rounded-xl flex flex-col md:flex-row gap-3 justify-between items-stretch md:items-center">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-zinc-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchFiles()}
            placeholder="Pesquisar nos arquivos do Drive..."
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500/50 font-mono"
          />
        </div>

        {/* Filter categories */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {(['all', 'audio', 'image', 'video'] as const).map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => {
                setFilter(cat);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono capitalize transition-all cursor-pointer whitespace-nowrap ${
                filter === cat
                  ? 'bg-amber-500 text-black font-bold shadow'
                  : 'bg-zinc-950 text-zinc-400 hover:bg-zinc-850 border border-zinc-800'
              }`}
            >
              {cat === 'all' ? 'Todos' : cat === 'audio' ? 'Áudios & Beats' : cat === 'image' ? 'Capas & Fotos' : 'Vídeos'}
            </button>
          ))}
          <button
            type="button"
            onClick={() => fetchFiles()}
            className="p-2 rounded-lg bg-zinc-950 hover:bg-zinc-850 border border-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
            title="Atualizar lista"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-amber-500' : ''}`} />
          </button>
        </div>
      </div>

      {/* Files Grid */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="py-16 text-center text-zinc-500 space-y-3">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-amber-500" />
            <p className="text-xs font-mono">A carregar arquivos do seu Google Drive...</p>
          </div>
        ) : files.length === 0 ? (
          <div className="py-16 text-center text-zinc-500 space-y-3 bg-zinc-900/30 rounded-2xl border border-zinc-900">
            <FolderOpen className="w-12 h-12 mx-auto text-zinc-600 stroke-[1.5]" />
            <p className="text-sm font-semibold text-zinc-300">Nenhum arquivo encontrado no Google Drive.</p>
            <p className="text-xs text-zinc-500 max-w-sm mx-auto">
              Utilize o botão &quot;Novo Envio para o Drive&quot; acima para carregar músicas, beats ou artes do seu dispositivo.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {files.map((file) => {
              const isAudio = file.mimeType.startsWith('audio/') || file.name.endsWith('.mp3') || file.name.endsWith('.wav');
              const isImage = file.mimeType.startsWith('image/');
              const isVideo = file.mimeType.startsWith('video/');
              const isPlaying = playingFileId === file.id;

              return (
                <div
                  key={file.id}
                  className="bg-zinc-900/60 hover:bg-zinc-900 border border-zinc-850 hover:border-zinc-700/80 rounded-2xl p-4 transition-all flex flex-col justify-between gap-3 group relative shadow-md"
                >
                  <div className="space-y-3">
                    {/* Media Thumbnail or Playback Preview */}
                    <div className="h-32 bg-black/80 rounded-xl overflow-hidden border border-zinc-800 flex items-center justify-center relative">
                      {isImage && file.thumbnailLink ? (
                        <img
                          src={file.thumbnailLink}
                          alt={file.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : isAudio ? (
                        <div className="flex flex-col items-center justify-center gap-2 p-3 text-center">
                          <button
                            type="button"
                            onClick={() => togglePlayAudio(file)}
                            className="w-12 h-12 rounded-full bg-amber-500 hover:bg-amber-400 text-black flex items-center justify-center shadow-lg transition-transform hover:scale-105 cursor-pointer"
                          >
                            {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
                          </button>
                          <span className="text-[10px] font-mono text-zinc-400">
                            {isPlaying ? 'A reproduzir...' : 'Pré-escutar faixa'}
                          </span>
                        </div>
                      ) : isVideo ? (
                        <div className="flex items-center justify-center text-blue-400">
                          <Video className="w-10 h-10" />
                        </div>
                      ) : (
                        <div className="flex items-center justify-center text-zinc-500">
                          <FileText className="w-10 h-10" />
                        </div>
                      )}

                      {/* Format badge */}
                      <span className="absolute top-2 right-2 text-[9px] font-mono uppercase px-2 py-0.5 bg-black/80 border border-zinc-800 text-zinc-300 rounded-md backdrop-blur-sm">
                        {file.mimeType.split('/')[1] || 'Ficheiro'}
                      </span>
                    </div>

                    {/* File Title and Metadata */}
                    <div>
                      <h4 className="text-xs font-bold text-white truncate" title={file.name}>
                        {file.name}
                      </h4>
                      <p className="text-[10px] text-zinc-500 font-mono mt-0.5">
                        ID: {file.id.substring(0, 12)}...
                      </p>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between gap-1.5">
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleCopyUrl(file)}
                        className="px-2.5 py-1.5 rounded-lg bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 hover:border-amber-500/40 text-zinc-300 hover:text-amber-400 text-[10px] font-mono flex items-center gap-1 transition-all cursor-pointer"
                        title="Copiar link direto para áudio/imagem"
                      >
                        {copiedId === file.id ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span className="text-emerald-400">Copiado!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copiar Link</span>
                          </>
                        )}
                      </button>

                      <a
                        href={file.webViewLink || `https://drive.google.com/file/d/${file.id}/view`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-lg bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white text-[10px] transition-colors"
                        title="Abrir no Google Drive oficial"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>

                    {/* Delete action with confirmation modal */}
                    <button
                      type="button"
                      onClick={() => setFileToDelete(file)}
                      className="p-1.5 rounded-lg bg-zinc-950 hover:bg-red-500/10 border border-zinc-800 hover:border-red-500/30 text-zinc-500 hover:text-red-400 transition-colors cursor-pointer"
                      title="Excluir arquivo do Google Drive"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal (Workspace API mandatory requirement) */}
      {fileToDelete && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-950 border border-red-500/30 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-red-400">
              <div className="p-2 rounded-xl bg-red-500/10 border border-red-500/20">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-white">Excluir do Google Drive?</h4>
                <p className="text-[11px] text-zinc-400 font-mono">Operação destrutiva em conta Google</p>
              </div>
            </div>

            <p className="text-xs text-zinc-300 leading-relaxed">
              Tem certeza de que deseja excluir permanentemente o ficheiro{' '}
              <strong className="text-amber-400 font-mono">&ldquo;{fileToDelete.name}&rdquo;</strong> do Google Drive?
              Esta ação removerá o arquivo de forma irreversível.
            </p>

            <div className="flex justify-end gap-2 pt-2 border-t border-zinc-900">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setFileToDelete(null)}
                className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-semibold border border-zinc-800 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
              >
                {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                <span>{isDeleting ? 'A Excluir...' : 'Confirmar Exclusão'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
