import React, { useState, useRef } from 'react';
import { 
  Upload, Cloud, Check, Loader2, Music, Image as ImageIcon, Video, 
  ExternalLink, X, Search, RefreshCw, FolderOpen, Play, Pause, AlertCircle,
  Trash2
} from 'lucide-react';
import { 
  uploadFileToDrive, 
  listGoogleDriveFiles, 
  deleteDriveFile,
  DriveFileItem, 
  formatDriveMediaUrl 
} from '../services/googleDriveService';
import { transformGoogleDriveUrl, transformGoogleDriveAudioUrl } from '../types';

interface GoogleDriveUploaderProps {
  label: string;
  value: string;
  onChange: (url: string) => void;
  mediaType: 'audio' | 'image' | 'video' | 'any';
  placeholder?: string;
  helperText?: string;
  required?: boolean;
}

export default function GoogleDriveUploader({
  label,
  value,
  onChange,
  mediaType,
  placeholder = 'URL do Google Drive ou link direto',
  helperText,
  required = false
}: GoogleDriveUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Picker modal state
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [driveFiles, setDriveFiles] = useState<DriveFileItem[]>([]);
  const [isLoadingPicker, setIsLoadingPicker] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [pickerFilter, setPickerFilter] = useState<'all' | 'audio' | 'image' | 'video'>(
    mediaType === 'any' ? 'all' : mediaType
  );
  const [fileToDelete, setFileToDelete] = useState<DriveFileItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleConfirmDelete = async () => {
    if (!fileToDelete) return;
    setIsDeleting(true);
    try {
      await deleteDriveFile(fileToDelete.id);
      setDriveFiles((prev) => prev.filter((f) => f.id !== fileToDelete.id));
      if (value && value.includes(fileToDelete.id)) {
        onChange('');
        setUploadedFileName(null);
      }
      setFileToDelete(null);
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao excluir arquivo do Google Drive.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Audio preview playback state for uploaded audio
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);

  // Determine accepted MIME types for native file picker
  const getAcceptedExtensions = () => {
    switch (mediaType) {
      case 'audio':
        return 'audio/*,.mp3,.wav,.m4a,.flac,.aac,.ogg';
      case 'image':
        return 'image/*,.jpg,.jpeg,.png,.webp,.gif';
      case 'video':
        return 'video/*,.mp4,.mov,.webm,.m4v';
      default:
        return 'audio/*,image/*,video/*,.mp3,.wav,.jpg,.png,.mp4';
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    setErrorMsg(null);
    setIsUploading(true);
    setUploadProgress(0);
    setUploadedFileName(file.name);

    try {
      const result = await uploadFileToDrive(file, (percent) => {
        setUploadProgress(percent);
      });

      // Update parent value
      onChange(result.displayUrl);
      setIsUploading(false);
      setUploadProgress(100);
    } catch (err: any) {
      console.error('Erro ao enviar arquivo para o Google Drive:', err);
      setErrorMsg(err.message || 'Falha ao enviar arquivo para o Google Drive. Verifique a sua conexão.');
      setIsUploading(false);
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleOpenPicker = async () => {
    setIsPickerOpen(true);
    setErrorMsg(null);
    setIsLoadingPicker(true);
    try {
      const files = await listGoogleDriveFiles(pickerFilter, searchQuery);
      setDriveFiles(files);
    } catch (err: any) {
      console.error('Erro ao listar arquivos do Drive:', err);
      setErrorMsg(err.message || 'Não foi possível carregar os arquivos do Google Drive.');
    } finally {
      setIsLoadingPicker(false);
    }
  };

  const handleRefreshPicker = async (overrideFilter?: 'all' | 'audio' | 'image' | 'video') => {
    setIsLoadingPicker(true);
    setErrorMsg(null);
    const filterToUse = overrideFilter || pickerFilter;
    try {
      const files = await listGoogleDriveFiles(filterToUse, searchQuery);
      setDriveFiles(files);
    } catch (err: any) {
      setErrorMsg(err.message || 'Falha ao buscar arquivos.');
    } finally {
      setIsLoadingPicker(false);
    }
  };

  const handleSelectFromPicker = (file: DriveFileItem) => {
    onChange(file.formattedUrl);
    setUploadedFileName(file.name);
    setIsPickerOpen(false);
  };

  const toggleAudioPreview = () => {
    if (!previewAudioRef.current) return;
    if (isPlayingAudio) {
      previewAudioRef.current.pause();
      setIsPlayingAudio(false);
    } else {
      previewAudioRef.current.play().then(() => {
        setIsPlayingAudio(true);
      }).catch(err => {
        console.warn('Erro ao tocar áudio de pré-visualização:', err);
      });
    }
  };

  const isAudio = mediaType === 'audio' || (value && (value.includes('audio') || value.endsWith('.mp3') || value.endsWith('.wav')));
  const isImage = mediaType === 'image' || (value && (value.includes('thumbnail') || value.match(/\.(jpg|jpeg|png|webp|gif)/i)));
  const isVideo = mediaType === 'video' || (value && (value.includes('video') || value.match(/\.(mp4|mov|webm)/i)));

  return (
    <div className="space-y-2 bg-zinc-950/60 p-3.5 rounded-2xl border border-zinc-850 hover:border-zinc-700/80 transition-all">
      {/* Header and Label */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label className="text-xs font-semibold text-zinc-300 uppercase font-mono flex items-center gap-1.5">
          {mediaType === 'audio' && <Music className="w-3.5 h-3.5 text-amber-500" />}
          {mediaType === 'image' && <ImageIcon className="w-3.5 h-3.5 text-amber-500" />}
          {mediaType === 'video' && <Video className="w-3.5 h-3.5 text-amber-500" />}
          {mediaType === 'any' && <Cloud className="w-3.5 h-3.5 text-amber-500" />}
          <span>{label}</span>
          {required && <span className="text-amber-500">*</span>}
        </label>

        {/* Status or Google Drive indication */}
        <span className="inline-flex items-center gap-1 text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
          <Cloud className="w-2.5 h-2.5" />
          <span>Google Drive Integrado</span>
        </span>
      </div>

      {/* Main Upload Actions Bar */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Hidden file input for native device gallery/file picker */}
        <input
          ref={fileInputRef}
          type="file"
          accept={getAcceptedExtensions()}
          onChange={handleFileChange}
          className="hidden"
          disabled={isUploading}
        />

        {/* Primary Action Button: Select from local device -> directly to Google Drive */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className={`flex-1 min-w-[200px] flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl font-bold text-xs tracking-wide transition-all shadow-sm cursor-pointer ${
            isUploading
              ? 'bg-zinc-800 text-zinc-400 cursor-not-allowed border border-zinc-700'
              : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-semibold shadow-amber-500/10'
          }`}
          title="Selecionar arquivo da galeria ou computador para enviar ao Google Drive"
        >
          {isUploading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
              <span>A Enviar para Google Drive ({uploadProgress}%)</span>
            </>
          ) : (
            <>
              <Upload className="w-4 h-4 stroke-[2.5px]" />
              <span>Adicionar Ficheiro (Galeria / Dispositivo)</span>
            </>
          )}
        </button>

        {/* Secondary Action Button: Pick existing from Google Drive */}
        <button
          type="button"
          onClick={handleOpenPicker}
          disabled={isUploading}
          className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/80 hover:border-amber-500/50 text-zinc-300 hover:text-white text-xs font-medium transition-all cursor-pointer"
          title="Escolher arquivo já guardado no seu Google Drive"
        >
          <FolderOpen className="w-4 h-4 text-amber-400" />
          <span>Meu Google Drive</span>
        </button>
      </div>

      {/* Upload Progress Bar */}
      {isUploading && (
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400">
            <span className="truncate max-w-[250px]">
              {uploadedFileName ? `A enviar: ${uploadedFileName}` : 'A carregar para o Google Drive...'}
            </span>
            <span className="text-amber-400 font-bold">{uploadProgress}%</span>
          </div>
          <div className="w-full h-2 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800">
            <div 
              className="h-full bg-gradient-to-r from-amber-500 to-amber-400 transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Error Message */}
      {errorMsg && (
        <div className="flex items-center gap-2 p-2.5 rounded-xl bg-red-950/40 border border-red-800/60 text-red-300 text-xs">
          <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-400" />
          <span className="flex-1">{errorMsg}</span>
          <button 
            type="button" 
            onClick={() => setErrorMsg(null)}
            className="text-red-400 hover:text-white"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Manual URL Input / Current Value View */}
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          className="flex-1 bg-zinc-900/90 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-200 text-xs font-mono focus:outline-none focus:border-amber-500/50"
        />
        {value && (
          <button
            type="button"
            onClick={() => {
              onChange('');
              setUploadedFileName(null);
            }}
            className="p-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-red-400 border border-zinc-800 transition-colors cursor-pointer"
            title="Limpar link"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Visual Live Preview of current file */}
      {value && (
        <div className="mt-2 p-2.5 rounded-xl bg-zinc-900/50 border border-zinc-800/90 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {/* Image Preview Thumbnail */}
            {(mediaType === 'image' || isImage) && (
              <div className="w-12 h-12 bg-black rounded-lg border border-zinc-700/60 overflow-hidden flex-shrink-0 flex items-center justify-center">
                <img
                  src={transformGoogleDriveUrl(value)}
                  alt="Prévia da Mídia"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.currentTarget as HTMLElement).style.display = 'none';
                  }}
                />
              </div>
            )}

            {/* Audio Preview Controls */}
            {(mediaType === 'audio' || isAudio) && (
              <div className="flex items-center gap-2">
                <audio
                  ref={previewAudioRef}
                  src={transformGoogleDriveAudioUrl(value)}
                  onEnded={() => setIsPlayingAudio(false)}
                  onError={() => setIsPlayingAudio(false)}
                />
                <button
                  type="button"
                  onClick={toggleAudioPreview}
                  className="w-10 h-10 rounded-xl bg-amber-500 hover:bg-amber-400 text-black flex items-center justify-center shadow-md transition-all cursor-pointer flex-shrink-0"
                  title={isPlayingAudio ? "Pausar Prévia" : "Tocar Prévia"}
                >
                  {isPlayingAudio ? (
                    <Pause className="w-4 h-4 fill-current" />
                  ) : (
                    <Play className="w-4 h-4 fill-current ml-0.5" />
                  )}
                </button>
              </div>
            )}

            {/* Video preview icon */}
            {(mediaType === 'video' || isVideo) && (
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center flex-shrink-0">
                <Video className="w-5 h-5" />
              </div>
            )}

            {/* Text description */}
            <div className="min-w-0">
              <span className="text-[11px] font-bold text-zinc-200 block truncate max-w-[260px]">
                {uploadedFileName || (mediaType === 'audio' ? 'Áudio no Google Drive' : 'Arquivo no Google Drive')}
              </span>
              <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-mono">
                <Check className="w-3 h-3" /> Conectado e Pronto para Exibição
              </span>
            </div>
          </div>

          {/* Direct Drive View Link */}
          <a
            href={value}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] text-zinc-400 hover:text-amber-400 flex items-center gap-1 font-mono hover:underline flex-shrink-0"
          >
            <span>Ver no Google Drive</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      )}

      {/* Helper text if provided */}
      {helperText && (
        <p className="text-[10px] text-zinc-500 italic">
          {helperText}
        </p>
      )}

      {/* GOOGLE DRIVE FILE PICKER MODAL */}
      {isPickerOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Cloud className="w-5 h-5 text-amber-500" />
                <h3 className="font-bold text-white text-sm">Selecionar do seu Google Drive</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsPickerOpen(false)}
                className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Filter and Search Bar */}
            <div className="p-4 bg-zinc-950/60 border-b border-zinc-800/80 space-y-3">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-zinc-500" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleRefreshPicker()}
                    placeholder="Pesquisar arquivos no Google Drive..."
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500/50"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => handleRefreshPicker()}
                  className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white transition-colors"
                  title="Atualizar lista"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoadingPicker ? 'animate-spin text-amber-500' : ''}`} />
                </button>
              </div>

              {/* Category tabs */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
                {(['all', 'audio', 'image', 'video'] as const).map((filter) => (
                  <button
                    key={filter}
                    type="button"
                    onClick={() => {
                      setPickerFilter(filter);
                      handleRefreshPicker(filter);
                    }}
                    className={`px-3 py-1 rounded-lg text-xs font-mono capitalize transition-all cursor-pointer ${
                      pickerFilter === filter
                        ? 'bg-amber-500 text-black font-bold shadow'
                        : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800 border border-zinc-800'
                    }`}
                  >
                    {filter === 'all' ? 'Todos' : filter === 'audio' ? 'Músicas / Áudios' : filter === 'image' ? 'Imagens / Fotos' : 'Vídeos'}
                  </button>
                ))}
              </div>
            </div>

            {/* Files List Content */}
            <div className="p-4 overflow-y-auto flex-1 space-y-2 max-h-[50vh]">
              {isLoadingPicker ? (
                <div className="py-12 flex flex-col items-center justify-center text-zinc-500 space-y-2">
                  <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
                  <p className="text-xs font-mono">A carregar arquivos do Google Drive...</p>
                </div>
              ) : driveFiles.length === 0 ? (
                <div className="py-12 text-center text-zinc-500 space-y-3">
                  <FolderOpen className="w-10 h-10 mx-auto text-zinc-600 stroke-[1.5]" />
                  <p className="text-xs">Nenhum arquivo encontrado no Google Drive para este filtro.</p>
                  <p className="text-[11px] text-zinc-600">
                    Clique no botão &quot;Adicionar Ficheiro&quot; para enviar da sua galeria ou arquivos locais.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {driveFiles.map((file) => {
                    const isAudioFile = file.mimeType.startsWith('audio/');
                    const isImageFile = file.mimeType.startsWith('image/');
                    const isVideoFile = file.mimeType.startsWith('video/');

                    return (
                      <div
                        key={file.id}
                        onClick={() => handleSelectFromPicker(file)}
                        className="bg-zinc-950/80 hover:bg-zinc-800/80 border border-zinc-800 hover:border-amber-500/50 p-2.5 rounded-xl cursor-pointer transition-all flex items-center gap-3 group"
                      >
                        <div className="w-10 h-10 rounded-lg bg-zinc-900 border border-zinc-800 overflow-hidden flex items-center justify-center flex-shrink-0 text-zinc-400 group-hover:text-amber-400">
                          {isImageFile && file.thumbnailLink ? (
                            <img src={file.thumbnailLink} alt={file.name} className="w-full h-full object-cover" />
                          ) : isAudioFile ? (
                            <Music className="w-5 h-5 text-amber-500" />
                          ) : isVideoFile ? (
                            <Video className="w-5 h-5 text-blue-400" />
                          ) : (
                            <Cloud className="w-5 h-5" />
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <h4 className="text-xs font-semibold text-zinc-200 group-hover:text-amber-400 truncate">
                            {file.name}
                          </h4>
                          <span className="text-[10px] text-zinc-500 font-mono block">
                            {file.mimeType.split('/')[1]?.toUpperCase() || 'ARQUIVO'}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setFileToDelete(file);
                            }}
                            className="p-1 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-colors"
                            title="Excluir arquivo do Google Drive"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                          <span className="text-[10px] font-bold text-amber-400 font-mono bg-amber-500/10 px-2 py-1 rounded border border-amber-500/30">
                            Selecionar
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Delete Confirmation Modal (Workspace API mandatory requirement) */}
            {fileToDelete && (
              <div className="fixed inset-0 z-60 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
                <div className="bg-zinc-950 border border-red-500/30 rounded-2xl max-w-sm w-full p-5 shadow-2xl space-y-4">
                  <div className="flex items-center gap-2.5 text-red-400">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <h4 className="font-bold text-sm text-white">Excluir do Google Drive?</h4>
                  </div>
                  <p className="text-xs text-zinc-300 leading-relaxed">
                    Tem certeza de que deseja excluir permanentemente o ficheiro <strong className="text-amber-400">&ldquo;{fileToDelete.name}&rdquo;</strong> do Google Drive? Esta ação não pode ser revertida.
                  </p>
                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      disabled={isDeleting}
                      onClick={() => setFileToDelete(null)}
                      className="px-3.5 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-semibold border border-zinc-800 cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      disabled={isDeleting}
                      onClick={handleConfirmDelete}
                      className="px-3.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
                    >
                      {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                      <span>{isDeleting ? 'A Excluir...' : 'Confirmar Exclusão'}</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="p-3 border-t border-zinc-800 bg-zinc-950/80 flex items-center justify-between text-xs text-zinc-400">
              <span className="font-mono text-[11px]">
                {driveFiles.length} arquivo(s) disponíveis
              </span>
              <button
                type="button"
                onClick={() => setIsPickerOpen(false)}
                className="px-4 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white font-medium text-xs cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
