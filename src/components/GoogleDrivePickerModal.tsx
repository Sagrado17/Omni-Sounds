import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Search, 
  RefreshCw, 
  Music, 
  Play, 
  Pause, 
  Check, 
  Sliders, 
  Sparkles, 
  AlertCircle, 
  ExternalLink,
  HardDrive,
  FileAudio,
  Radio,
  ArrowRight,
  UploadCloud,
  FolderSync,
  Smartphone,
  CheckCircle2,
  FolderCheck,
  Disc3,
  Layers
} from 'lucide-react';
import { 
  fetchGoogleDriveAudioFiles, 
  uploadAudioFileToGoogleDrive,
  DriveAudioFile, 
  ExtractedBeatMetadata,
  extractBeatMetadataFromFilename,
  formatBytes,
  UploadedDriveTrackResult
} from '../services/googleDrive';
import { getCachedAccessToken, requestGoogleDriveAccess } from '../firebase';

interface GoogleDrivePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTrack: (trackData: {
    title: string;
    audioUrl: string;
    bpm: number;
    scale: string;
    genre: string;
    tags: string[];
    driveFile: DriveAudioFile;
  }) => void;
  initialTab?: 'upload' | 'browse';
}

export const GoogleDrivePickerModal: React.FC<GoogleDrivePickerModalProps> = ({
  isOpen,
  onClose,
  onSelectTrack,
  initialTab = 'upload'
}) => {
  // Navigation tabs
  const [activeTab, setActiveTab] = useState<'upload' | 'browse'>(initialTab);

  // Drive Browse State
  const [files, setFiles] = useState<DriveAudioFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'mp3' | 'wav'>('all');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // Upload from Device State
  const [selectedDeviceFile, setSelectedDeviceFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatusText, setUploadStatusText] = useState('');
  const [uploadResult, setUploadResult] = useState<UploadedDriveTrackResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // In-modal preview audio playback
  const [playingFileId, setPlayingFileId] = useState<string | null>(null);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);

  // Manual URL helper fallback
  const [manualDriveUrl, setManualDriveUrl] = useState('');

  // Check auth state and initialize whenever modal opens
  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      const token = getCachedAccessToken();
      setIsAuthenticated(Boolean(token));
      if (token && activeTab === 'browse') {
        loadFiles();
      }
    } else {
      // Pause audio preview if modal is closed
      if (previewAudioRef.current) {
        previewAudioRef.current.pause();
      }
      setPlayingFileId(null);
      setSelectedDeviceFile(null);
      setIsUploading(false);
      setUploadProgress(0);
      setUploadResult(null);
      setError(null);
    }
  }, [isOpen]);

  const handleConnectDrive = async () => {
    setIsAuthenticating(true);
    setError(null);
    try {
      await requestGoogleDriveAccess();
      setIsAuthenticated(true);
      if (activeTab === 'browse') {
        await loadFiles();
      }
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Falha na autenticação com o Google Drive.');
    } finally {
      setIsAuthenticating(false);
    }
  };

  const loadFiles = async (query = searchQuery) => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchGoogleDriveAudioFiles(query);
      setFiles(result.files);
    } catch (err: any) {
      console.error('Erro ao carregar arquivos do Drive:', err);
      if (err?.message?.includes('expirada') || err?.message?.includes('credenciais')) {
        setIsAuthenticated(false);
      }
      setError(err?.message || 'Não foi possível carregar os arquivos do Google Drive.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadFiles(searchQuery);
  };

  const togglePreview = (file: DriveAudioFile) => {
    if (playingFileId === file.id) {
      if (previewAudioRef.current) {
        previewAudioRef.current.pause();
      }
      setPlayingFileId(null);
    } else {
      if (!previewAudioRef.current) {
        previewAudioRef.current = new Audio();
      }
      previewAudioRef.current.src = file.directAudioUrl;
      previewAudioRef.current.play().catch(e => {
        console.warn('Erro ao tocar prévia direta:', e);
      });
      setPlayingFileId(file.id);

      previewAudioRef.current.onended = () => {
        setPlayingFileId(null);
      };
    }
  };

  const handleConfirmSelect = (file: DriveAudioFile) => {
    // Stop any preview
    if (previewAudioRef.current) {
      previewAudioRef.current.pause();
    }
    setPlayingFileId(null);

    onSelectTrack({
      title: file.extractedMeta.cleanTitle,
      audioUrl: file.directAudioUrl,
      bpm: file.extractedMeta.bpm,
      scale: file.extractedMeta.scale,
      genre: file.extractedMeta.genre,
      tags: file.extractedMeta.tags,
      driveFile: file
    });

    onClose();
  };

  // Device File Selected (from phone or PC)
  const handleDeviceFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedDeviceFile(file);
    setUploadResult(null);
    setError(null);
  };

  // Trigger upload from Device to Google Drive
  const handleStartUpload = async () => {
    if (!selectedDeviceFile) return;

    setIsUploading(true);
    setError(null);
    setUploadProgress(5);
    setUploadStatusText('Iniciando envio para o Google Drive...');

    try {
      const result = await uploadAudioFileToGoogleDrive(
        selectedDeviceFile,
        (percent, statusText) => {
          setUploadProgress(percent);
          setUploadStatusText(statusText);
        }
      );

      setUploadResult(result);
      setIsAuthenticated(true);
    } catch (err: any) {
      console.error('Erro no upload para o Drive:', err);
      setError(err?.message || 'Falha ao fazer upload para o Google Drive.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleApplyUploadedTrack = () => {
    if (!uploadResult) return;
    handleConfirmSelect(uploadResult.file);
  };

  const handleResetUpload = () => {
    setSelectedDeviceFile(null);
    setUploadResult(null);
    setUploadProgress(0);
    setUploadStatusText('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleManualConvert = () => {
    if (!manualDriveUrl.trim()) return;
    const url = manualDriveUrl.trim();
    let fileId = '';
    const dMatch = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
    const idMatch = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (dMatch && dMatch[1]) fileId = dMatch[1];
    else if (idMatch && idMatch[1]) fileId = idMatch[1];

    const directAudioUrl = fileId 
      ? `https://docs.google.com/uc?export=download&id=${fileId}`
      : url;

    const syntheticMeta = extractBeatMetadataFromFilename('Novo Beat Google Drive');

    onSelectTrack({
      title: 'Beat Importado do Drive',
      audioUrl: directAudioUrl,
      bpm: syntheticMeta.bpm,
      scale: syntheticMeta.scale,
      genre: syntheticMeta.genre,
      tags: ['drive', 'novo beat'],
      driveFile: {
        id: fileId || 'manual',
        name: 'Arquivo do Google Drive',
        mimeType: 'audio/mpeg',
        directAudioUrl,
        previewEmbedUrl: fileId ? `https://drive.google.com/file/d/${fileId}/preview` : directAudioUrl,
        extractedMeta: syntheticMeta
      }
    });

    onClose();
  };

  if (!isOpen) return null;

  const filteredFiles = files.filter(f => {
    if (filterType === 'mp3') return f.name.toLowerCase().endsWith('.mp3');
    if (filterType === 'wav') return f.name.toLowerCase().endsWith('.wav');
    return true;
  });

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="w-full max-w-4xl bg-zinc-950 border border-zinc-800 rounded-3xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-zinc-800/80 flex items-center justify-between bg-zinc-900/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 shadow-inner">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
                <path d="M4 14.5L8.5 6.5H15.5L11 14.5H4Z" fill="#F4B400" />
                <path d="M15.5 6.5L20 14.5L16.5 20.5H9L15.5 6.5Z" fill="#4285F4" />
                <path d="M4 14.5H18L14.5 20.5H7.5L4 14.5Z" fill="#0F9D58" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-zinc-100 font-sans tracking-wide">
                  Google Drive • Nuvem de Músicas
                </h3>
                <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-mono uppercase">
                  Nuvem Ativa
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Faça upload do seu telemóvel para o Google Drive ou escolha uma música já salva na sua nuvem.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-zinc-800/80 bg-zinc-900/60 px-4 sm:px-6 pt-2 gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            className={`flex items-center gap-2 px-4 py-3 text-xs sm:text-sm font-bold border-b-2 transition-all ${
              activeTab === 'upload'
                ? 'border-amber-500 text-amber-400 bg-amber-500/5 rounded-t-xl'
                : 'border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40 rounded-t-xl'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>Upload do Telemóvel / Dispositivo</span>
            <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.2 rounded font-mono uppercase hidden sm:inline">
              Direto para a Nuvem
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('browse');
              if (isAuthenticated && files.length === 0) {
                loadFiles();
              }
            }}
            className={`flex items-center gap-2 px-4 py-3 text-xs sm:text-sm font-bold border-b-2 transition-all ${
              activeTab === 'browse'
                ? 'border-amber-500 text-amber-400 bg-amber-500/5 rounded-t-xl'
                : 'border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40 rounded-t-xl'
            }`}
          >
            <HardDrive className="w-4 h-4" />
            <span>Meus Beats já no Drive</span>
            {files.length > 0 && (
              <span className="text-[10px] bg-zinc-800 text-zinc-400 px-1.5 py-0.2 rounded font-mono">
                {files.length}
              </span>
            )}
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {/* Error Message */}
          {error && (
            <div className="p-3.5 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-start gap-3 text-red-400 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold">{error}</p>
                {!isAuthenticated && (
                  <button
                    onClick={handleConnectDrive}
                    className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-500 text-white rounded-lg text-[11px] font-bold hover:bg-red-600 transition-colors"
                  >
                    Reconectar ao Google Drive
                  </button>
                )}
              </div>
            </div>
          )}

          {/* TAB 1: UPLOAD FROM PHONE / DEVICE */}
          {activeTab === 'upload' && (
            <div className="space-y-5">
              {/* Informative Banner */}
              <div className="bg-gradient-to-r from-amber-500/10 via-zinc-900 to-zinc-950 border border-amber-500/20 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-inner">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                    <UploadCloud className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-zinc-100 flex items-center gap-2">
                      <span>Como Funciona o Upload Automático</span>
                      <span className="text-[10px] bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded font-mono">
                        100% Automático
                      </span>
                    </h4>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      1. Selecione o beat no seu telefone &bull; 2. O arquivo é guardado na nuvem do Google Drive &bull; 3. O link e tags entram aqui automaticamente.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-[11px] font-mono text-zinc-400 bg-zinc-900 px-3 py-1.5 rounded-xl border border-zinc-800 self-start sm:self-auto shrink-0">
                  <FolderCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Pasta: <strong>Omni Sounds - Catálogo</strong></span>
                </div>
              </div>

              {/* Upload Card / Dropzone */}
              {!uploadResult ? (
                <div className="border-2 border-dashed border-zinc-800 hover:border-amber-500/50 rounded-3xl p-6 sm:p-10 transition-all text-center bg-zinc-900/20 hover:bg-zinc-900/40 relative">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="audio/*,.mp3,.wav,.m4a,.aac,.flac,.ogg"
                    onChange={handleDeviceFileChange}
                    disabled={isUploading}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                  />

                  <div className="max-w-md mx-auto space-y-4 pointer-events-none">
                    <div className="w-16 h-16 rounded-3xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400 shadow-lg">
                      <Smartphone className="w-8 h-8" />
                    </div>

                    <div>
                      <h4 className="text-base sm:text-lg font-bold text-zinc-200">
                        {selectedDeviceFile ? selectedDeviceFile.name : 'Selecione a música do seu telemóvel ou computador'}
                      </h4>
                      <p className="text-xs text-zinc-400 mt-1">
                        {selectedDeviceFile 
                          ? `Tamanho: ${formatBytes(selectedDeviceFile.size)} • Formato: ${selectedDeviceFile.type || 'Áudio'}`
                          : 'Toque aqui para escolher faixas nos formatos .MP3, .WAV, .M4A, .FLAC'}
                      </p>
                    </div>

                    {!selectedDeviceFile && (
                      <div className="pt-2">
                        <span className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-400 text-black font-bold text-xs rounded-xl shadow-md pointer-events-auto">
                          <UploadCloud className="w-4 h-4" />
                          <span>Escolher Ficheiro no Dispositivo</span>
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ) : null}

              {/* Selected File Action / Progress */}
              {selectedDeviceFile && !uploadResult && (
                <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-4 sm:p-5 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 shrink-0">
                        <FileAudio className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <h5 className="font-bold text-zinc-200 text-sm truncate">{selectedDeviceFile.name}</h5>
                        <p className="text-xs font-mono text-zinc-400">{formatBytes(selectedDeviceFile.size)} &bull; Pronto para upload</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={handleResetUpload}
                        disabled={isUploading}
                        className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-zinc-300 text-xs font-mono rounded-xl transition-colors"
                      >
                        Trocar Ficheiro
                      </button>

                      <button
                        type="button"
                        onClick={handleStartUpload}
                        disabled={isUploading}
                        className="px-5 py-2 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 disabled:opacity-50 text-black font-bold text-xs rounded-xl shadow-lg flex items-center gap-2 transition-transform active:scale-95"
                      >
                        {isUploading ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            <span>Enviando para o Drive ({uploadProgress}%)...</span>
                          </>
                        ) : (
                          <>
                            <UploadCloud className="w-4 h-4" />
                            <span>Enviar para o Google Drive e Importar</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  {isUploading && (
                    <div className="space-y-2 pt-2">
                      <div className="flex items-center justify-between text-xs font-mono">
                        <span className="text-amber-400 flex items-center gap-1.5">
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          {uploadStatusText || 'A transferir ficheiro...'}
                        </span>
                        <span className="text-zinc-300 font-bold">{uploadProgress}%</span>
                      </div>

                      <div className="w-full h-2.5 bg-zinc-950 rounded-full overflow-hidden border border-zinc-800">
                        <div 
                          className="h-full bg-gradient-to-r from-amber-500 to-amber-300 transition-all duration-300 rounded-full shadow-lg shadow-amber-500/50"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Upload Success View */}
              {uploadResult && (
                <div className="bg-zinc-900/80 border border-emerald-500/30 rounded-3xl p-5 sm:p-6 space-y-5 animate-in zoom-in-95 duration-200">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-800">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                        <CheckCircle2 className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-base font-bold text-zinc-100">
                            Upload Concluído com Sucesso!
                          </h4>
                          <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded font-mono">
                            Salvo no Google Drive
                          </span>
                        </div>
                        <p className="text-xs text-zinc-400 mt-0.5">
                          O arquivo está salvo na sua nuvem Google Drive e o link direto foi vinculado para tocar no catálogo.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleResetUpload}
                        className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-mono rounded-xl transition-colors"
                      >
                        Enviar Outro
                      </button>
                      <button
                        type="button"
                        onClick={handleApplyUploadedTrack}
                        className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-black font-bold text-xs rounded-xl shadow-lg flex items-center gap-2 transition-transform active:scale-95"
                      >
                        <Sparkles className="w-4 h-4" />
                        <span>Preencher Formulário do Catálogo</span>
                      </button>
                    </div>
                  </div>

                  {/* Audio Player Preview */}
                  <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <button
                        type="button"
                        onClick={() => togglePreview(uploadResult.file)}
                        className="w-10 h-10 rounded-xl bg-amber-500 text-black font-bold flex items-center justify-center shrink-0 shadow-md hover:bg-amber-400 transition-colors"
                      >
                        {playingFileId === uploadResult.file.id ? (
                          <Pause className="w-4 h-4 fill-current" />
                        ) : (
                          <Play className="w-4 h-4 fill-current ml-0.5" />
                        )}
                      </button>
                      <div className="min-w-0">
                        <span className="text-[10px] text-amber-400 font-mono uppercase block">Prévia do Áudio</span>
                        <h5 className="font-bold text-zinc-200 text-sm truncate">{uploadResult.extractedMeta.cleanTitle}</h5>
                      </div>
                    </div>

                    <div className="text-right text-[11px] font-mono text-zinc-400">
                      <span>{uploadResult.file.size}</span> &bull; <span>Google Drive ID: {uploadResult.file.id.slice(0, 8)}...</span>
                    </div>
                  </div>

                  {/* Extracted Metadata Grid */}
                  <div>
                    <h5 className="text-xs font-mono uppercase text-zinc-400 mb-2.5 flex items-center gap-1.5">
                      <Sliders className="w-3.5 h-3.5 text-amber-500" /> Metadados Extraídos Automaticamente
                    </h5>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="bg-zinc-950/80 p-3 rounded-xl border border-zinc-800">
                        <span className="text-[10px] text-zinc-500 font-mono uppercase block">Título Detectado</span>
                        <span className="text-xs font-bold text-zinc-200 truncate block mt-0.5">
                          {uploadResult.extractedMeta.cleanTitle}
                        </span>
                      </div>

                      <div className="bg-zinc-950/80 p-3 rounded-xl border border-zinc-800">
                        <span className="text-[10px] text-zinc-500 font-mono uppercase block">BPM (Andamento)</span>
                        <span className="text-xs font-bold text-amber-400 font-mono block mt-0.5">
                          {uploadResult.extractedMeta.bpm} BPM
                        </span>
                      </div>

                      <div className="bg-zinc-950/80 p-3 rounded-xl border border-zinc-800">
                        <span className="text-[10px] text-zinc-500 font-mono uppercase block">Tom Musical (Key)</span>
                        <span className="text-xs font-bold text-zinc-200 font-mono block mt-0.5">
                          {uploadResult.extractedMeta.scale}
                        </span>
                      </div>

                      <div className="bg-zinc-950/80 p-3 rounded-xl border border-zinc-800">
                        <span className="text-[10px] text-zinc-500 font-mono uppercase block">Gênero</span>
                        <span className="text-xs font-bold text-zinc-200 block mt-0.5">
                          {uploadResult.extractedMeta.genre}
                        </span>
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-1.5">
                      <span className="text-[11px] text-zinc-500 font-mono mr-1">Tags geradas:</span>
                      {uploadResult.extractedMeta.tags.map(t => (
                        <span key={t} className="text-[10px] font-mono px-2 py-0.5 bg-zinc-800 text-amber-300/90 rounded-md border border-zinc-700">
                          #{t}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: BROWSE EXISTING FILES IN DRIVE */}
          {activeTab === 'browse' && (
            <div className="space-y-4">
              {!isAuthenticated ? (
                <div className="py-10 px-4 text-center max-w-lg mx-auto space-y-4">
                  <div className="w-16 h-16 rounded-3xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-500">
                    <HardDrive className="w-8 h-8" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-zinc-200">
                      Conecte o seu Google Drive
                    </h4>
                    <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed">
                      Autorize o acesso para explorar os seus ficheiros de áudio guardados no Google Drive e selecioná-los para o catálogo.
                    </p>
                  </div>

                  <div className="pt-2">
                    <button
                      onClick={handleConnectDrive}
                      disabled={isAuthenticating}
                      className="inline-flex items-center justify-center gap-3 px-6 py-3 bg-zinc-100 hover:bg-white text-zinc-950 font-bold rounded-2xl text-xs sm:text-sm transition-all shadow-lg active:scale-95 disabled:opacity-50"
                    >
                      {isAuthenticating ? (
                        <RefreshCw className="w-4 h-4 animate-spin text-zinc-950" />
                      ) : (
                        <svg className="w-4 h-4" viewBox="0 0 24 24">
                          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                        </svg>
                      )}
                      <span>{isAuthenticating ? 'A conectar...' : 'Autorizar Acesso ao Google Drive'}</span>
                    </button>
                  </div>

                  {/* Manual link option */}
                  <div className="pt-6 border-t border-zinc-800/80 text-left">
                    <span className="text-[11px] font-mono text-zinc-400 block mb-2">
                      Ou insira um link direto já copiado do Drive:
                    </span>
                    <div className="flex gap-2">
                      <input
                        type="url"
                        placeholder="https://drive.google.com/file/d/.../view"
                        value={manualDriveUrl}
                        onChange={(e) => setManualDriveUrl(e.target.value)}
                        className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-zinc-200 focus:outline-none focus:border-amber-500/50"
                      />
                      <button
                        onClick={handleManualConvert}
                        disabled={!manualDriveUrl.trim()}
                        className="px-4 py-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-black font-bold text-xs rounded-xl transition-colors"
                      >
                        Usar Link
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  {/* Search & Filters Bar */}
                  <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
                    <form onSubmit={handleSearchSubmit} className="flex-1 relative">
                      <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Buscar áudio pelo nome no Drive (ex: trap, afrobeat, 140bpm)..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-zinc-900/90 border border-zinc-800 rounded-xl pl-9 pr-9 py-2.5 text-xs text-zinc-200 focus:outline-none focus:border-amber-500/50 font-sans"
                      />
                      {searchQuery && (
                        <button
                          type="button"
                          onClick={() => {
                            setSearchQuery('');
                            loadFiles('');
                          }}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </form>

                    <div className="flex items-center gap-2">
                      <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-xl p-1 text-[11px] font-mono">
                        <button
                          onClick={() => setFilterType('all')}
                          className={`px-3 py-1 rounded-lg transition-colors ${
                            filterType === 'all' ? 'bg-amber-500 text-black font-bold' : 'text-zinc-400 hover:text-zinc-200'
                          }`}
                        >
                          Todos
                        </button>
                        <button
                          onClick={() => setFilterType('mp3')}
                          className={`px-3 py-1 rounded-lg transition-colors ${
                            filterType === 'mp3' ? 'bg-amber-500 text-black font-bold' : 'text-zinc-400 hover:text-zinc-200'
                          }`}
                        >
                          MP3
                        </button>
                        <button
                          onClick={() => setFilterType('wav')}
                          className={`px-3 py-1 rounded-lg transition-colors ${
                            filterType === 'wav' ? 'bg-amber-500 text-black font-bold' : 'text-zinc-400 hover:text-zinc-200'
                          }`}
                        >
                          WAV
                        </button>
                      </div>

                      <button
                        onClick={() => loadFiles(searchQuery)}
                        disabled={loading}
                        title="Atualizar lista do Google Drive"
                        className="p-2.5 bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-100 hover:border-zinc-700 rounded-xl transition-colors disabled:opacity-50"
                      >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-amber-500' : ''}`} />
                      </button>
                    </div>
                  </div>

                  {/* Status Header */}
                  <div className="flex items-center justify-between text-[11px] font-mono text-zinc-500 px-1">
                    <span>
                      {loading ? 'A carregar ficheiros de áudio...' : `${filteredFiles.length} ficheiro(s) de áudio encontrado(s) no seu Google Drive`}
                    </span>
                    <span className="flex items-center gap-1.5 text-emerald-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                      Drive Sincronizado
                    </span>
                  </div>

                  {/* Files List */}
                  {loading && files.length === 0 ? (
                    <div className="py-16 text-center space-y-3">
                      <RefreshCw className="w-8 h-8 animate-spin text-amber-500 mx-auto" />
                      <p className="text-xs text-zinc-400">Procurando arquivos de áudio (.mp3, .wav, etc.) no seu Drive...</p>
                    </div>
                  ) : filteredFiles.length === 0 ? (
                    <div className="py-14 text-center border border-dashed border-zinc-800 rounded-2xl space-y-3">
                      <FileAudio className="w-10 h-10 text-zinc-600 mx-auto" />
                      <div>
                        <h5 className="text-sm font-semibold text-zinc-300">Nenhum áudio encontrado na busca</h5>
                        <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
                          Você pode fazer upload direto usando a aba <strong>Upload do Telemóvel</strong> acima!
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setActiveTab('upload')}
                        className="mt-2 inline-flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs rounded-xl"
                      >
                        <UploadCloud className="w-4 h-4" />
                        <span>Fazer Upload do Telemóvel Agora</span>
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-2.5 max-h-[48vh] overflow-y-auto pr-1">
                      {filteredFiles.map((file) => {
                        const isPlaying = playingFileId === file.id;
                        const meta = file.extractedMeta;

                        return (
                          <div
                            key={file.id}
                            className={`group p-3.5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                              isPlaying 
                                ? 'bg-amber-500/10 border-amber-500/50 shadow-lg shadow-amber-500/5' 
                                : 'bg-zinc-900/40 hover:bg-zinc-900/80 border-zinc-800/80 hover:border-zinc-700'
                            }`}
                          >
                            {/* Track Info */}
                            <div className="flex items-start gap-3 min-w-0 flex-1">
                              <button
                                type="button"
                                onClick={() => togglePreview(file)}
                                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                                  isPlaying 
                                    ? 'bg-amber-500 text-black font-bold animate-pulse' 
                                    : 'bg-zinc-800/80 text-zinc-300 group-hover:bg-amber-500/20 group-hover:text-amber-400'
                                }`}
                                title={isPlaying ? 'Pausar prévia' : 'Ouvir prévia'}
                              >
                                {isPlaying ? (
                                  <Pause className="w-4 h-4 fill-current" />
                                ) : (
                                  <Play className="w-4 h-4 fill-current ml-0.5" />
                                )}
                              </button>

                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                  <h4 className="text-xs sm:text-sm font-bold text-zinc-100 truncate group-hover:text-amber-400 transition-colors">
                                    {meta.cleanTitle || file.name}
                                  </h4>
                                  <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 font-mono shrink-0">
                                    {file.name.split('.').pop()}
                                  </span>
                                </div>

                                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-[11px] text-zinc-400 font-mono">
                                  <span>{file.size}</span>
                                  <span className="text-zinc-600">•</span>
                                  <span className="text-amber-400/90 font-medium">{meta.genre}</span>
                                  <span className="text-zinc-600">•</span>
                                  <span>{meta.bpm} BPM</span>
                                  <span className="text-zinc-600">•</span>
                                  <span>{meta.scale}</span>
                                </div>

                                {/* Tags preview */}
                                <div className="flex flex-wrap gap-1 mt-1.5">
                                  {meta.tags.map(tag => (
                                    <span key={tag} className="text-[9px] px-1.5 py-0.2 bg-zinc-800/60 text-zinc-400 rounded font-mono">
                                      #{tag}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                              <button
                                type="button"
                                onClick={() => togglePreview(file)}
                                className="px-3 py-1.5 rounded-xl border border-zinc-800 hover:border-zinc-700 text-zinc-300 text-xs font-mono transition-colors flex items-center gap-1.5"
                              >
                                {isPlaying ? (
                                  <>
                                    <Radio className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                                    <span>A Ouvir...</span>
                                  </>
                                ) : (
                                  <>
                                    <Play className="w-3 h-3" />
                                    <span>Prévia</span>
                                  </>
                                )}
                              </button>

                              <button
                                type="button"
                                onClick={() => handleConfirmSelect(file)}
                                className="px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs transition-transform active:scale-95 flex items-center gap-1.5 shadow-md shadow-amber-500/10"
                              >
                                <Sparkles className="w-3.5 h-3.5" />
                                <span>Importar Este Beat</span>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-zinc-800/80 bg-zinc-900/30 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-zinc-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            <span>As músicas são guardadas de forma segura no Google Drive e integradas ao catálogo.</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded-xl border border-zinc-800 transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
