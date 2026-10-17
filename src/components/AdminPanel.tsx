import React, { useState, useEffect } from 'react';
import { Settings, Plus, CheckCircle, Trash2, Edit3, X, Sliders, Calendar, Music, Disc, Link2, Type, Check, Sparkles, Mic2, Clock, MessageCircle, ExternalLink, Shield, Layers, DollarSign, Image as ImageIcon } from 'lucide-react';
import { Beat, StudioSession, StudioProject, StudioSettings, BeatPurchase, CustomBeatOrder, transformGoogleDriveUrl, DEFAULT_CUSTOM_BEAT_PRICES, DEFAULT_STUDIO_RATES, getBeatLicensePrice } from '../types';
import { FONT_OPTIONS, FontStyleType } from './FontSwitcher';
// @ts-ignore
import BEAT_COVER_DEFAULT from '../assets/images/aegis_beat_cover_1783897086619.jpg';

interface AdminPanelProps {
  beats: Beat[];
  onAddBeat: (beat: Beat) => void;
  onDeleteBeat: (id: string) => void;
  onUpdateBeat: (beat: Beat) => void;
  
  bookings: StudioSession[];
  onUpdateBookingStatus: (id: string, status: StudioSession['status']) => void;
  onDeleteBooking: (id: string) => void;
  
  projects: StudioProject[];
  onAddProject: (project: StudioProject) => void;
  onDeleteProject: (id: string) => void;
  onUpdateProject: (project: StudioProject) => void;

  settings: StudioSettings;
  onUpdateSettings: (settings: StudioSettings) => void;

  purchases: BeatPurchase[];
  onUpdatePurchaseStatus: (id: string, status: BeatPurchase['status']) => void;
  onDeletePurchase: (id: string) => void;

  customOrders?: CustomBeatOrder[];
  onUpdateCustomOrderStatus?: (id: string, status: CustomBeatOrder['status']) => void;
  onDeleteCustomOrder?: (id: string) => void;

  currentFont?: FontStyleType;
  onSelectFont?: (font: FontStyleType) => void;
}

export default function AdminPanel({
  beats,
  onAddBeat,
  onDeleteBeat,
  onUpdateBeat,
  bookings,
  onUpdateBookingStatus,
  onDeleteBooking,
  projects,
  onAddProject,
  onDeleteProject,
  onUpdateProject,
  settings,
  onUpdateSettings,
  purchases,
  onUpdatePurchaseStatus,
  onDeletePurchase,
  customOrders = [],
  onUpdateCustomOrderStatus,
  onDeleteCustomOrder,
  currentFont = 'modern',
  onSelectFont
}: AdminPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'bookings' | 'beats' | 'custom_orders' | 'purchases' | 'projects' | 'settings'>('bookings');

  // Form states
  const [beatForm, setBeatForm] = useState({
    title: '',
    producer: 'Omni Sounds',
    genre: 'Trap',
    bpm: 120,
    key: 'La Menor (Am)',
    priceMp3: 4000,
    priceBasic: 7000,
    priceStems: 10000,
    priceExclusive: 15000,
    coverUrl: '',
    tags: 'heavy, trap, hard',
    audioUrl: ''
  });

  const [projectForm, setProjectForm] = useState({
    title: '',
    artist: '',
    type: 'Single',
    youtubeId: '',
    driveFolderUrl: '',
    coverImage: '',
    releaseDate: new Date().getFullYear().toString(),
    spotifyUrl: '',
    instagramUrl: ''
  });

  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);

  const handleStartEditProject = (project: StudioProject) => {
    setEditingProjectId(project.id);
    setProjectForm({
      title: project.title,
      artist: project.artist,
      type: project.type,
      youtubeId: project.youtubeId,
      driveFolderUrl: project.driveFolderUrl || '',
      coverImage: project.coverImage || '',
      releaseDate: project.releaseDate,
      spotifyUrl: project.spotifyUrl || '',
      instagramUrl: project.instagramUrl || ''
    });
  };

  const handleCancelEditProject = () => {
    setEditingProjectId(null);
    setProjectForm({
      title: '',
      artist: '',
      type: 'Single',
      youtubeId: '',
      driveFolderUrl: '',
      coverImage: '',
      releaseDate: new Date().getFullYear().toString(),
      spotifyUrl: '',
      instagramUrl: ''
    });
  };

  const [editingBeatId, setEditingBeatId] = useState<string | null>(null);

  const handleStartEditBeat = (beat: Beat) => {
    setEditingBeatId(beat.id);
    setBeatForm({
      title: beat.title,
      producer: beat.producer || 'Omni Sounds',
      genre: beat.genre,
      bpm: beat.bpm,
      key: beat.key,
      priceMp3: beat.priceMp3 ?? 4000,
      priceBasic: beat.priceBasic ?? 7000,
      priceStems: beat.priceStems ?? 10000,
      priceExclusive: beat.priceExclusive ?? 15000,
      coverUrl: beat.coverUrl || '',
      tags: beat.tags.join(', '),
      audioUrl: beat.audioUrl || ''
    });
  };

  const handleCancelEditBeat = () => {
    setEditingBeatId(null);
    setBeatForm({
      title: '',
      producer: 'Omni Sounds',
      genre: 'Trap',
      bpm: 120,
      key: 'La Menor (Am)',
      priceMp3: 4000,
      priceBasic: 7000,
      priceStems: 10000,
      priceExclusive: 15000,
      coverUrl: '',
      tags: 'heavy, trap, hard',
      audioUrl: ''
    });
  };

  const [studioSettingsForm, setStudioSettingsForm] = useState<StudioSettings>({
    ...settings,
    customBeatPrices: settings.customBeatPrices || DEFAULT_CUSTOM_BEAT_PRICES,
    studioRates: settings.studioRates || DEFAULT_STUDIO_RATES
  });

  // Sync settings when props change
  useEffect(() => {
    setStudioSettingsForm({
      ...settings,
      customBeatPrices: settings.customBeatPrices || DEFAULT_CUSTOM_BEAT_PRICES,
      studioRates: settings.studioRates || DEFAULT_STUDIO_RATES
    });
  }, [settings]);

  const handleAddBeatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!beatForm.title) return;

    const mp3Val = Number(beatForm.priceMp3) || 4000;
    const premiumVal = Number(beatForm.priceBasic) || 7000;
    const stemsVal = Number(beatForm.priceStems) || 10000;
    const exclVal = Number(beatForm.priceExclusive) || 15000;
    const producerVal = beatForm.producer.trim() || 'Omni Sounds';

    if (editingBeatId) {
      const updatedBeat: Beat = {
        id: editingBeatId,
        title: beatForm.title.trim(),
        producer: producerVal,
        genre: beatForm.genre,
        bpm: Number(beatForm.bpm),
        key: beatForm.key,
        priceMp3: mp3Val,
        priceBasic: premiumVal,
        pricePremium: premiumVal,
        priceStems: stemsVal,
        priceExclusive: exclVal,
        coverUrl: beatForm.coverUrl.trim() || BEAT_COVER_DEFAULT,
        tags: beatForm.tags.split(',').map(t => t.trim()).filter(Boolean),
        audioUrl: beatForm.audioUrl ? beatForm.audioUrl.trim() : ''
      };

      onUpdateBeat(updatedBeat);
      handleCancelEditBeat();
    } else {
      const newBeat: Beat = {
        id: 'beat-' + Date.now(),
        title: beatForm.title.trim(),
        producer: producerVal,
        genre: beatForm.genre,
        bpm: Number(beatForm.bpm),
        key: beatForm.key,
        priceMp3: mp3Val,
        priceBasic: premiumVal,
        pricePremium: premiumVal,
        priceStems: stemsVal,
        priceExclusive: exclVal,
        coverUrl: beatForm.coverUrl.trim() || BEAT_COVER_DEFAULT,
        tags: beatForm.tags.split(',').map(t => t.trim()).filter(Boolean),
        audioUrl: beatForm.audioUrl ? beatForm.audioUrl.trim() : ''
      };

      onAddBeat(newBeat);
      setBeatForm({
        title: '',
        producer: 'Omni Sounds',
        genre: 'Trap',
        bpm: 120,
        key: 'La Menor (Am)',
        priceMp3: 4000,
        priceBasic: 7000,
        priceStems: 10000,
        priceExclusive: 15000,
        coverUrl: '',
        tags: 'heavy, trap, hard',
        audioUrl: ''
      });
    }
  };

  const handleAddProjectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectForm.title || !projectForm.artist || !projectForm.youtubeId) return;

    if (editingProjectId) {
      const updatedProject: StudioProject = {
        id: editingProjectId,
        title: projectForm.title.trim(),
        artist: projectForm.artist.trim(),
        type: projectForm.type,
        youtubeId: projectForm.youtubeId.trim(),
        driveFolderUrl: projectForm.driveFolderUrl ? projectForm.driveFolderUrl.trim() : '',
        spotifyUrl: projectForm.spotifyUrl ? projectForm.spotifyUrl.trim() : '',
        instagramUrl: projectForm.instagramUrl ? projectForm.instagramUrl.trim() : '',
        coverImage: projectForm.coverImage ? projectForm.coverImage.trim() : 'https://picsum.photos/seed/project/400/225',
        releaseDate: projectForm.releaseDate.trim()
      };

      onUpdateProject(updatedProject);
      handleCancelEditProject();
    } else {
      const newProject: StudioProject = {
        id: 'proj-' + Date.now(),
        title: projectForm.title.trim(),
        artist: projectForm.artist.trim(),
        type: projectForm.type,
        youtubeId: projectForm.youtubeId.trim(),
        driveFolderUrl: projectForm.driveFolderUrl ? projectForm.driveFolderUrl.trim() : '',
        spotifyUrl: projectForm.spotifyUrl ? projectForm.spotifyUrl.trim() : '',
        instagramUrl: projectForm.instagramUrl ? projectForm.instagramUrl.trim() : '',
        coverImage: projectForm.coverImage ? projectForm.coverImage.trim() : 'https://picsum.photos/seed/project/400/225',
        releaseDate: projectForm.releaseDate.trim()
      };

      onAddProject(newProject);
      setProjectForm({
        title: '',
        artist: '',
        type: 'Single',
        youtubeId: '',
        driveFolderUrl: '',
        coverImage: '',
        releaseDate: new Date().getFullYear().toString(),
        spotifyUrl: '',
        instagramUrl: ''
      });
    }
  };

  const handleSettingsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSettings(studioSettingsForm);
  };

  return (
    <>
      {/* Floating Toggle Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-40 bg-amber-500 hover:bg-amber-400 text-black p-4 rounded-full shadow-2xl shadow-amber-500/20 transition-all duration-300 hover:scale-105 flex items-center justify-center gap-2 border border-amber-600/50"
      >
        <Settings className="w-5 h-5 animate-spin-slow" />
        <span className="text-xs uppercase font-extrabold tracking-wider font-mono">Controle Omni</span>
      </button>

      {/* Admin Panel Drawer Backdrop */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex justify-end transition-opacity duration-300">
          {/* Main Container */}
          <div className="w-full max-w-4xl bg-zinc-950 border-l border-zinc-900 h-full flex flex-col shadow-2xl relative">
            
            {/* Header */}
            <div className="p-6 border-b border-zinc-900 flex justify-between items-center bg-black/40">
              <div>
                <span className="text-[10px] uppercase font-mono font-bold text-amber-500 tracking-widest">Painel do Produtor</span>
                <h3 className="text-xl font-bold text-white flex items-center gap-2 mt-0.5">
                  <Sliders className="w-5 h-5 text-amber-500" />
                  Gerenciamento Omni Sounds
                </h3>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white p-2 rounded-xl border border-zinc-800/80 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Navigation Tabs */}
            <div className="flex bg-zinc-900/40 border-b border-zinc-900 px-4 sm:px-6 gap-1 sm:gap-2 overflow-x-auto">
              <button
                onClick={() => setActiveTab('bookings')}
                className={`py-2.5 sm:py-3 px-3 sm:px-4 text-[11px] sm:text-xs font-semibold uppercase tracking-wider border-b-2 transition-all flex-shrink-0 ${
                  activeTab === 'bookings'
                    ? 'border-amber-500 text-amber-500'
                    : 'border-transparent text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Agendamentos ({bookings.length})
              </button>
              <button
                onClick={() => setActiveTab('beats')}
                className={`py-2.5 sm:py-3 px-3 sm:px-4 text-[11px] sm:text-xs font-semibold uppercase tracking-wider border-b-2 transition-all flex-shrink-0 ${
                  activeTab === 'beats'
                    ? 'border-amber-500 text-amber-500'
                    : 'border-transparent text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Beats ({beats.length})
              </button>
              <button
                onClick={() => setActiveTab('custom_orders')}
                className={`py-2.5 sm:py-3 px-3 sm:px-4 text-[11px] sm:text-xs font-semibold uppercase tracking-wider border-b-2 transition-all flex-shrink-0 ${
                  activeTab === 'custom_orders'
                    ? 'border-amber-500 text-amber-500 font-bold'
                    : 'border-transparent text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Encomendas Beats ({customOrders.length})
              </button>
              <button
                onClick={() => setActiveTab('purchases')}
                className={`py-2.5 sm:py-3 px-3 sm:px-4 text-[11px] sm:text-xs font-semibold uppercase tracking-wider border-b-2 transition-all flex-shrink-0 ${
                  activeTab === 'purchases'
                    ? 'border-amber-500 text-amber-500'
                    : 'border-transparent text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Vendas ({purchases.length})
              </button>
              <button
                onClick={() => setActiveTab('projects')}
                className={`py-2.5 sm:py-3 px-3 sm:px-4 text-[11px] sm:text-xs font-semibold uppercase tracking-wider border-b-2 transition-all flex-shrink-0 ${
                  activeTab === 'projects'
                    ? 'border-amber-500 text-amber-500'
                    : 'border-transparent text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Projetos ({projects.length})
              </button>
              <button
                onClick={() => setActiveTab('settings')}
                className={`py-2.5 sm:py-3 px-3 sm:px-4 text-[11px] sm:text-xs font-semibold uppercase tracking-wider border-b-2 transition-all flex-shrink-0 ${
                  activeTab === 'settings'
                    ? 'border-amber-500 text-amber-500'
                    : 'border-transparent text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Estúdio & Visual
              </button>
            </div>

            {/* Scrollable Content Container */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">

              {/* TAB 1: BOOKINGS MANAGEMENT */}
              {activeTab === 'bookings' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="font-bold text-white text-sm">Controle de Agendamentos Recentes</h4>
                    <span className="text-[10px] font-mono bg-zinc-900 px-2 py-1 rounded text-zinc-400">Total: {bookings.length}</span>
                  </div>

                  {bookings.length > 0 ? (
                    <div className="space-y-3">
                      {bookings.map(booking => (
                        <div key={booking.id} className="bg-zinc-900/60 border border-zinc-900 rounded-xl p-4 flex flex-col md:flex-row justify-between gap-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs bg-amber-500/20 text-amber-400 font-mono font-bold px-1.5 py-0.5 rounded border border-amber-500/10">
                                {booking.serviceType}
                              </span>
                              <span className="text-zinc-400 text-xs font-mono">{booking.date} • {booking.timeSlot}</span>
                            </div>
                            <h5 className="font-bold text-zinc-100">{booking.clientName}</h5>
                            <p className="text-zinc-400 text-xs">{booking.clientEmail ? `${booking.clientEmail} • ` : ''}{booking.clientPhone}</p>
                            {booking.notes && <p className="text-zinc-500 text-xs italic bg-black/20 p-2 rounded mt-1 border border-zinc-900">Nota: {booking.notes}</p>}
                          </div>

                          <div className="flex flex-row md:flex-col items-end justify-between md:justify-center gap-2 border-t md:border-t-0 pt-3 md:pt-0 border-zinc-900">
                            <span className="font-mono text-amber-500 font-bold text-sm">{booking.estimatedCost.toLocaleString()} KZ</span>
                            
                            <div className="flex gap-1.5">
                              {booking.status !== 'Confirmado' && (
                                <button
                                  onClick={() => onUpdateBookingStatus(booking.id, 'Confirmado')}
                                  className="bg-emerald-500 hover:bg-emerald-400 text-black px-2.5 py-1 rounded text-[11px] font-semibold transition-colors flex items-center gap-1"
                                >
                                  <CheckCircle className="w-3.5 h-3.5" /> Confirmar
                                </button>
                              )}
                              {booking.status !== 'Concluído' && booking.status === 'Confirmado' && (
                                <button
                                  onClick={() => onUpdateBookingStatus(booking.id, 'Concluído')}
                                  className="bg-blue-500 hover:bg-blue-400 text-white px-2.5 py-1 rounded text-[11px] font-semibold transition-colors"
                                >
                                  Concluir
                                </button>
                              )}
                              <button
                                onClick={() => onDeleteBooking(booking.id)}
                                className="bg-zinc-800 hover:bg-red-600/80 text-zinc-400 hover:text-white p-1 rounded-lg border border-zinc-800 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-16 bg-zinc-900/10 border border-zinc-900 border-dashed rounded-xl">
                      <Calendar className="w-8 h-8 text-zinc-700 mx-auto mb-2" />
                      <p className="text-zinc-500 text-xs">Nenhuma sessão registrada para gerenciar.</p>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: BEATS LISTING MANAGEMENT */}
              {activeTab === 'beats' && (
                <div className="space-y-6">
                  {/* Add New/Edit Beat Form */}
                  <form onSubmit={handleAddBeatSubmit} className="bg-zinc-900/40 border border-zinc-900 p-5 rounded-2xl space-y-4">
                    <h4 className="font-bold text-white text-sm flex items-center gap-1.5">
                      {editingBeatId ? (
                        <span className="flex items-center gap-1.5 text-amber-500 font-sans">
                          <Edit3 className="w-4 h-4" /> Editar Beat do Catálogo
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 text-zinc-100 font-sans">
                          <Plus className="w-4 h-4 text-amber-500" /> Adicionar Novo Beat ao Catálogo
                        </span>
                      )}
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase font-mono">Título do Beat *</label>
                        <input
                          type="text"
                          placeholder="Ex: Legacy Empire"
                          value={beatForm.title}
                          onChange={(e) => setBeatForm(prev => ({ ...prev, title: e.target.value }))}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-zinc-200 text-xs focus:outline-none focus:border-amber-500/50"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase font-mono">Nome do Produtor / Beatmaker *</label>
                        <input
                          type="text"
                          placeholder="Ex: Omni Sounds, Beatmaker X, Prod. Bernabé..."
                          value={beatForm.producer}
                          onChange={(e) => setBeatForm(prev => ({ ...prev, producer: e.target.value }))}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-zinc-200 text-xs focus:outline-none focus:border-amber-500/50"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase font-mono">Gênero</label>
                        <select
                          value={beatForm.genre}
                          onChange={(e) => setBeatForm(prev => ({ ...prev, genre: e.target.value }))}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-zinc-200 text-xs focus:outline-none focus:border-amber-500/50"
                        >
                          <option value="Trap">Trap</option>
                          <option value="Boom Bap">Boom Bap</option>
                          <option value="Drill">Drill</option>
                          <option value="R&B">R&B</option>
                          <option value="Afrobeats">Afrobeats</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase font-mono">BPM (Andamento) *</label>
                        <input
                          type="number"
                          value={beatForm.bpm}
                          onChange={(e) => setBeatForm(prev => ({ ...prev, bpm: Number(e.target.value) }))}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-zinc-200 text-xs focus:outline-none focus:border-amber-500/50 font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase font-mono">Tom Musical (Key)</label>
                        <input
                          type="text"
                          placeholder="Ex: Am, G#m, Dm, C Menor"
                          value={beatForm.key}
                          onChange={(e) => setBeatForm(prev => ({ ...prev, key: e.target.value }))}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-zinc-200 text-xs focus:outline-none focus:border-amber-500/50 font-mono"
                        />
                      </div>
                    </div>

                    {/* License Specific Pricing for this Beat */}
                    <div className="bg-zinc-950/80 border border-zinc-800/90 rounded-xl p-3.5 space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-amber-500 uppercase font-mono flex items-center gap-1.5">
                          <DollarSign className="w-3.5 h-3.5" /> Preços por Licença deste Beat (Kz)
                        </label>
                        <span className="text-[10px] text-zinc-500 font-mono">Personalize o valor de cada licença</span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div>
                          <label className="block text-[11px] font-mono text-zinc-400 mb-1">
                            1. Licença MP3 (KZ)
                          </label>
                          <input
                            type="number"
                            value={beatForm.priceMp3}
                            onChange={(e) => setBeatForm(prev => ({ ...prev, priceMp3: Number(e.target.value) }))}
                            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-200 text-xs focus:outline-none focus:border-amber-500/50 font-mono"
                            placeholder="4000"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-mono text-amber-400 mb-1">
                            2. Premium WAV (KZ)
                          </label>
                          <input
                            type="number"
                            value={beatForm.priceBasic}
                            onChange={(e) => setBeatForm(prev => ({ ...prev, priceBasic: Number(e.target.value) }))}
                            className="w-full bg-zinc-900 border border-amber-500/30 rounded-xl px-3 py-2 text-zinc-200 text-xs focus:outline-none focus:border-amber-500/50 font-mono"
                            placeholder="7000"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-mono text-zinc-400 mb-1">
                            3. Stems / Pistas (KZ)
                          </label>
                          <input
                            type="number"
                            value={beatForm.priceStems}
                            onChange={(e) => setBeatForm(prev => ({ ...prev, priceStems: Number(e.target.value) }))}
                            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-200 text-xs focus:outline-none focus:border-amber-500/50 font-mono"
                            placeholder="10000"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-mono text-zinc-400 mb-1">
                            4. Exclusivo + Mix (KZ)
                          </label>
                          <input
                            type="number"
                            value={beatForm.priceExclusive}
                            onChange={(e) => setBeatForm(prev => ({ ...prev, priceExclusive: Number(e.target.value) }))}
                            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-200 text-xs focus:outline-none focus:border-amber-500/50 font-mono"
                            placeholder="15000"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase font-mono flex items-center gap-1">
                          <Link2 className="w-3.5 h-3.5 text-amber-500" /> Link Capa/Drive/URL
                        </label>
                        <input
                          type="url"
                          placeholder="Link da Imagem (ou deixe vazio para padrão)"
                          value={beatForm.coverUrl}
                          onChange={(e) => setBeatForm(prev => ({ ...prev, coverUrl: e.target.value }))}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-zinc-200 text-xs focus:outline-none focus:border-amber-500/50"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase font-mono">Tags (separadas por vírgula)</label>
                        <input
                          type="text"
                          placeholder="heavy, aggressive, dark"
                          value={beatForm.tags}
                          onChange={(e) => setBeatForm(prev => ({ ...prev, tags: e.target.value }))}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-zinc-200 text-xs focus:outline-none focus:border-amber-500/50 font-mono"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase font-mono flex items-center gap-1">
                        <Music className="w-3.5 h-3.5 text-amber-500" /> Link de Áudio / Demonstração (Drive ou YouTube)
                      </label>
                      <input
                        type="url"
                        placeholder="Insira URL do áudio no Google Drive ou link de vídeo/áudio do YouTube"
                        value={beatForm.audioUrl}
                        onChange={(e) => setBeatForm(prev => ({ ...prev, audioUrl: e.target.value }))}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-zinc-200 text-xs focus:outline-none focus:border-amber-500/50"
                      />
                      <p className="text-[10px] text-zinc-500 italic">
                        Permite a reprodução direta e em tempo real do beat a partir do Google Drive ou do YouTube.
                      </p>
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                      {editingBeatId && (
                        <button
                          type="button"
                          onClick={handleCancelEditBeat}
                          className="bg-zinc-800 hover:bg-zinc-750 text-zinc-300 font-bold px-4 py-2 rounded-lg text-xs tracking-wide transition-all border border-zinc-700 flex items-center gap-1 cursor-pointer"
                        >
                          <X className="w-4 h-4" /> Cancelar
                        </button>
                      )}
                      <button
                        type="submit"
                        className="bg-amber-500 hover:bg-amber-400 text-black font-bold px-4 py-2 rounded-lg text-xs tracking-wide transition-all shadow-md flex items-center gap-1 cursor-pointer"
                      >
                        {editingBeatId ? (
                          <>
                            <Edit3 className="w-4 h-4 stroke-[2.5px]" /> Salvar Alterações
                          </>
                        ) : (
                          <>
                            <Plus className="w-4 h-4 stroke-[2.5px]" /> Adicionar Beat
                          </>
                        )}
                      </button>
                    </div>
                  </form>

                  {/* Beats list and delete */}
                  <div className="space-y-3">
                    <h4 className="font-bold text-white text-sm">Lista de Beats Cadastrados</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {beats.map(beat => (
                        <div key={beat.id} className="bg-zinc-900 border border-zinc-800 p-3 rounded-xl flex justify-between items-center gap-4">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-10 h-10 bg-zinc-800 rounded overflow-hidden flex-shrink-0">
                              <img src={transformGoogleDriveUrl(beat.coverUrl)} alt={beat.title} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <h5 className="font-bold text-zinc-100 text-sm truncate">{beat.title}</h5>
                              <p className="text-zinc-400 text-[11px] font-medium mt-0.5 truncate">
                                <span className="text-zinc-500">Produtor:</span> <span className="text-amber-400 font-semibold">{beat.producer || 'Omni Sounds'}</span>
                              </p>
                              <p className="text-amber-400 text-[11px] font-mono mt-0.5">
                                MP3: {getBeatLicensePrice(beat, 'mp3').toLocaleString()} KZ • WAV: {getBeatLicensePrice(beat, 'premium').toLocaleString()} KZ
                              </p>
                              <p className="text-zinc-500 text-[10px] mt-0.5">
                                {beat.genre} • {beat.bpm} BPM • Stems: {getBeatLicensePrice(beat, 'stems').toLocaleString()} KZ • Excl: {getBeatLicensePrice(beat, 'exclusive').toLocaleString()} KZ
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            <button
                              onClick={() => handleStartEditBeat(beat)}
                              className="bg-zinc-800 hover:bg-amber-500 hover:text-black p-2 rounded-lg border border-zinc-850 text-zinc-400 transition-colors cursor-pointer"
                              title="Editar Beat"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => onDeleteBeat(beat.id)}
                              className="bg-zinc-800 hover:bg-red-950 hover:text-red-400 p-2 rounded-lg border border-zinc-850 text-zinc-500 transition-colors cursor-pointer"
                              title="Deletar Beat"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: PROJECTS PORTFOLIO MANAGEMENT */}
              {activeTab === 'projects' && (
                <div className="space-y-6">
                  {/* Add New Project Form */}
                  <form onSubmit={handleAddProjectSubmit} className="bg-zinc-900/40 border border-zinc-900 p-5 rounded-2xl space-y-4">
                    <h4 className="font-bold text-white text-sm">
                      {editingProjectId ? (
                        <span className="flex items-center gap-1.5 text-amber-500">
                          <Edit3 className="w-4 h-4" /> Editar Trabalho Feito por Omni Sounds
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 text-zinc-100">
                          <Plus className="w-4 h-4 text-amber-500" /> Adicionar Trabalho Feito por Omni Sounds
                        </span>
                      )}
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase font-mono">Nome da Faixa / Álbum *</label>
                        <input
                          type="text"
                          placeholder="Ex: O Legado Não Morre"
                          value={projectForm.title}
                          onChange={(e) => setProjectForm(prev => ({ ...prev, title: e.target.value }))}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-zinc-200 text-xs focus:outline-none focus:border-amber-500/50"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase font-mono">Artista / Banda *</label>
                        <input
                          type="text"
                          placeholder="Ex: MC Kronos"
                          value={projectForm.artist}
                          onChange={(e) => setProjectForm(prev => ({ ...prev, artist: e.target.value }))}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-zinc-200 text-xs focus:outline-none focus:border-amber-500/50"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase font-mono">Tipo</label>
                        <select
                          value={projectForm.type}
                          onChange={(e) => setProjectForm(prev => ({ ...prev, type: e.target.value }))}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-zinc-200 text-xs focus:outline-none focus:border-amber-500/50"
                        >
                          <option value="Single">Single</option>
                          <option value="Álbum">Álbum</option>
                          <option value="Clipe">Clipe</option>
                          <option value="Beats">Beats</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase font-mono">Link / ID do YouTube *</label>
                        <input
                          type="text"
                          placeholder="Código de vídeo ou link"
                          value={projectForm.youtubeId}
                          onChange={(e) => setProjectForm(prev => ({ ...prev, youtubeId: e.target.value }))}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-zinc-200 text-xs focus:outline-none focus:border-amber-500/50 font-mono"
                          required
                        />
                      </div>

                      <div className="col-span-2 md:col-span-1">
                        <label className="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase font-mono">Pasta Google Drive</label>
                        <input
                          type="url"
                          placeholder="URL da pasta de áudios"
                          value={projectForm.driveFolderUrl}
                          onChange={(e) => setProjectForm(prev => ({ ...prev, driveFolderUrl: e.target.value }))}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-zinc-200 text-xs focus:outline-none focus:border-amber-500/50 font-mono"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="md:col-span-2">
                        <label className="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase font-mono">URL Capa do Projeto / Imagem</label>
                        <input
                          type="url"
                          placeholder="https://exemplo.com/capa.jpg"
                          value={projectForm.coverImage}
                          onChange={(e) => setProjectForm(prev => ({ ...prev, coverImage: e.target.value }))}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-zinc-200 text-xs focus:outline-none focus:border-amber-500/50"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase font-mono">Ano de Lançamento</label>
                        <input
                          type="text"
                          value={projectForm.releaseDate}
                          onChange={(e) => setProjectForm(prev => ({ ...prev, releaseDate: e.target.value }))}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-zinc-200 text-xs focus:outline-none focus:border-amber-500/50 font-mono"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                      {editingProjectId && (
                        <button
                          type="button"
                          onClick={handleCancelEditProject}
                          className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold px-4 py-2 rounded-lg text-xs tracking-wide transition-all cursor-pointer"
                        >
                          Cancelar Edição
                        </button>
                      )}
                      <button
                        type="submit"
                        className="bg-amber-500 hover:bg-amber-400 text-black font-bold px-4 py-2 rounded-lg text-xs tracking-wide transition-all shadow-md flex items-center gap-1 cursor-pointer"
                      >
                        {editingProjectId ? (
                          <>
                            <CheckCircle className="w-4 h-4 stroke-[2.5px]" /> Salvar Alterações
                          </>
                        ) : (
                          <>
                            <Plus className="w-4 h-4 stroke-[2.5px]" /> Adicionar Projeto
                          </>
                        )}
                      </button>
                    </div>
                  </form>

                  {/* Projects List and delete */}
                  <div className="space-y-3">
                    <h4 className="font-bold text-white text-sm">Lista de Projetos Feitos</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {projects.map(project => (
                        <div key={project.id} className="bg-zinc-900 border border-zinc-800 p-3 rounded-xl flex justify-between items-center gap-4">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-10 bg-zinc-800 rounded overflow-hidden flex-shrink-0">
                              <img src={transformGoogleDriveUrl(project.coverImage)} alt={project.title} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                            </div>
                            <div className="min-w-0">
                              <h5 className="font-bold text-zinc-100 text-sm truncate">{project.title}</h5>
                              <p className="text-zinc-500 text-xs">{project.artist} ({project.type})</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => handleStartEditProject(project)}
                              className="bg-zinc-800 hover:bg-zinc-700 hover:text-amber-400 p-2 rounded-lg border border-zinc-850 text-zinc-400 transition-colors cursor-pointer"
                              title="Editar Projeto"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => onDeleteProject(project.id)}
                              className="bg-zinc-800 hover:bg-red-950 hover:text-red-400 p-2 rounded-lg border border-zinc-850 text-zinc-500 transition-colors cursor-pointer"
                              title="Deletar Projeto"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: GENERAL STUDIO SETTINGS */}
              {activeTab === 'settings' && (
                <form onSubmit={handleSettingsSubmit} className="bg-zinc-900/40 border border-zinc-900 p-5 rounded-2xl space-y-4">
                  <h4 className="font-bold text-white text-sm flex items-center gap-1.5">
                    Configurações Cadastrais da Omni Sounds
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase font-mono">Nome do Estúdio</label>
                      <input
                        type="text"
                        value={studioSettingsForm.studioName}
                        onChange={(e) => setStudioSettingsForm(prev => ({ ...prev, studioName: e.target.value }))}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-zinc-200 text-xs focus:outline-none focus:border-amber-500/50"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase font-mono">Slogan</label>
                      <input
                        type="text"
                        value={studioSettingsForm.slogan}
                        onChange={(e) => setStudioSettingsForm(prev => ({ ...prev, slogan: e.target.value }))}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-zinc-200 text-xs focus:outline-none focus:border-amber-500/50"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase font-mono">Sobre o Estúdio</label>
                    <textarea
                      rows={3}
                      value={studioSettingsForm.aboutText}
                      onChange={(e) => setStudioSettingsForm(prev => ({ ...prev, aboutText: e.target.value }))}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-zinc-200 text-xs focus:outline-none focus:border-amber-500/50 resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase font-mono">E-mail de Contato</label>
                      <input
                        type="email"
                        value={studioSettingsForm.contactEmail}
                        onChange={(e) => setStudioSettingsForm(prev => ({ ...prev, contactEmail: e.target.value }))}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-zinc-200 text-xs focus:outline-none focus:border-amber-500/50 font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase font-mono">Telemóvel Comercial</label>
                      <input
                        type="text"
                        value={studioSettingsForm.contactPhone}
                        onChange={(e) => setStudioSettingsForm(prev => ({ ...prev, contactPhone: e.target.value }))}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-zinc-200 text-xs focus:outline-none focus:border-amber-500/50 font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase font-mono">Instagram (Link Completo)</label>
                      <input
                        type="url"
                        value={studioSettingsForm.instagramUrl}
                        onChange={(e) => setStudioSettingsForm(prev => ({ ...prev, instagramUrl: e.target.value }))}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-zinc-200 text-xs focus:outline-none focus:border-amber-500/50 font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase font-mono">YouTube Canal (Link)</label>
                      <input
                        type="url"
                        value={studioSettingsForm.youtubeUrl}
                        onChange={(e) => setStudioSettingsForm(prev => ({ ...prev, youtubeUrl: e.target.value }))}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-zinc-200 text-xs focus:outline-none focus:border-amber-500/50 font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase font-mono">Pasta Drive Portfólio Geral</label>
                      <input
                        type="url"
                        value={studioSettingsForm.drivePortfolioUrl}
                        onChange={(e) => setStudioSettingsForm(prev => ({ ...prev, drivePortfolioUrl: e.target.value }))}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-zinc-200 text-xs focus:outline-none focus:border-amber-500/50 font-mono"
                      />
                    </div>
                  </div>

                  {/* Logotipo Oficial da Marca (Google Drive ou Link Web) */}
                  <div className="bg-zinc-950 border border-zinc-800/80 p-4 rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <ImageIcon className="w-4 h-4 text-amber-500" />
                        <span className="text-xs font-bold text-white uppercase font-mono">Logotipo Oficial da Marca (Google Drive)</span>
                      </div>
                      <span className="text-[10px] text-amber-500 font-mono bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">Substitui o logo atual</span>
                    </div>

                    <p className="text-[11px] text-zinc-400 leading-relaxed">
                      Insira o link de compartilhamento ou visualização da imagem do seu logotipo no <strong>Google Drive</strong> (ou URL de imagem direta). O sistema converte automaticamente o link do Drive e atualiza o seu logotipo oficial no cabeçalho e no rodapé do site.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-3 items-start">
                      <div className="flex-1 w-full">
                        <input
                          type="url"
                          placeholder="https://drive.google.com/file/d/... ou link de imagem"
                          value={studioSettingsForm.logoUrl || ''}
                          onChange={(e) => setStudioSettingsForm(prev => ({ ...prev, logoUrl: e.target.value }))}
                          className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-zinc-200 text-xs focus:outline-none focus:border-amber-500/50 font-mono"
                        />
                      </div>
                      {studioSettingsForm.logoUrl && (
                        <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 p-2 rounded-xl flex-shrink-0">
                          <div className="w-10 h-10 bg-black rounded-lg border border-zinc-700/60 overflow-hidden flex items-center justify-center p-1">
                            <img
                              src={transformGoogleDriveUrl(studioSettingsForm.logoUrl)}
                              alt="Prévia do Logotipo"
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-contain"
                              onError={(e) => {
                                (e.currentTarget as HTMLElement).style.display = 'none';
                              }}
                            />
                          </div>
                          <div className="text-[10px] text-zinc-400 font-mono">
                            <span className="text-emerald-400 font-bold block">✓ Prévia do Logo</span>
                            <span>Carregado com sucesso</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Tipografia & Estilo de Letra */}
                  <div className="bg-zinc-950 border border-zinc-800/80 p-4 rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Type className="w-4 h-4 text-amber-500" />
                        <span className="text-xs font-bold text-white uppercase font-mono">Estilo de Letra (Tipografia)</span>
                      </div>
                      <span className="text-[10px] text-zinc-500 font-mono">Aplicado em tempo real</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                      {FONT_OPTIONS.map((font) => {
                        const isSelected = currentFont === font.id;
                        return (
                          <div
                            key={font.id}
                            onClick={() => onSelectFont && onSelectFont(font.id)}
                            className={`p-2.5 rounded-xl border cursor-pointer transition-all ${
                              isSelected
                                ? 'bg-amber-500/10 border-amber-500 ring-1 ring-amber-500/50'
                                : 'bg-zinc-900/60 border-zinc-800 hover:border-zinc-700'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <p className="text-xs font-bold text-white truncate">{font.name}</p>
                              {isSelected && (
                                <div className="w-4 h-4 rounded-full bg-amber-500 text-black flex items-center justify-center flex-shrink-0">
                                  <Check className="w-3 h-3 stroke-[3px]" />
                                </div>
                              )}
                            </div>
                            <p className="text-[10px] text-amber-400/90 font-mono mt-1 truncate">
                              {font.headingFont} + {font.bodyFont}
                            </p>
                            <p className="text-[9px] text-zinc-400 mt-1 line-clamp-1">
                              {font.description}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Preços das Licenças para Beats Personalizados */}
                  <div className="bg-zinc-950 border border-amber-500/30 p-4 rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-amber-500" />
                        <span className="text-xs font-bold text-amber-400 uppercase font-mono">Preços das Licenças para Beats Personalizados (KZ)</span>
                      </div>
                      <span className="text-[10px] text-zinc-500 font-mono">Valores exibidos no formulário de encomenda sob medida</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
                      <div className="bg-zinc-900/60 p-3 rounded-xl border border-zinc-800 space-y-1.5">
                        <label className="block text-[11px] font-bold text-zinc-300 font-mono">
                          1. Licença MP3 Sob Medida
                        </label>
                        <p className="text-[10px] text-zinc-500">Áudio MP3 masterizado (320kbps)</p>
                        <div className="relative">
                          <input
                            type="number"
                            value={studioSettingsForm.customBeatPrices?.mp3 ?? DEFAULT_CUSTOM_BEAT_PRICES.mp3}
                            onChange={(e) => {
                              const val = Number(e.target.value);
                              setStudioSettingsForm(prev => ({
                                ...prev,
                                customBeatPrices: {
                                  ...(prev.customBeatPrices || DEFAULT_CUSTOM_BEAT_PRICES),
                                  mp3: val
                                }
                              }));
                            }}
                            className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-200 text-xs focus:outline-none focus:border-amber-500/50 font-mono"
                            placeholder="8000"
                          />
                          <span className="absolute right-3 top-2 text-[10px] font-mono text-zinc-500">KZ</span>
                        </div>
                      </div>

                      <div className="bg-zinc-900/60 p-3 rounded-xl border border-amber-500/30 space-y-1.5">
                        <label className="block text-[11px] font-bold text-amber-400 font-mono">
                          2. Premium WAV + MP3 (Popular)
                        </label>
                        <p className="text-[10px] text-zinc-500">Áudio WAV 24-bit + MP3</p>
                        <div className="relative">
                          <input
                            type="number"
                            value={studioSettingsForm.customBeatPrices?.premium ?? DEFAULT_CUSTOM_BEAT_PRICES.premium}
                            onChange={(e) => {
                              const val = Number(e.target.value);
                              setStudioSettingsForm(prev => ({
                                ...prev,
                                customBeatPrices: {
                                  ...(prev.customBeatPrices || DEFAULT_CUSTOM_BEAT_PRICES),
                                  premium: val
                                }
                              }));
                            }}
                            className="w-full bg-zinc-950 border border-amber-500/40 rounded-lg px-3 py-2 text-zinc-200 text-xs focus:outline-none focus:border-amber-500/50 font-mono"
                            placeholder="15000"
                          />
                          <span className="absolute right-3 top-2 text-[10px] font-mono text-amber-400">KZ</span>
                        </div>
                      </div>

                      <div className="bg-zinc-900/60 p-3 rounded-xl border border-zinc-800 space-y-1.5">
                        <label className="block text-[11px] font-bold text-zinc-300 font-mono">
                          3. Stems / Pistas Separadas
                        </label>
                        <p className="text-[10px] text-zinc-500">WAV + Faixas e canais individuais</p>
                        <div className="relative">
                          <input
                            type="number"
                            value={studioSettingsForm.customBeatPrices?.stems ?? DEFAULT_CUSTOM_BEAT_PRICES.stems}
                            onChange={(e) => {
                              const val = Number(e.target.value);
                              setStudioSettingsForm(prev => ({
                                ...prev,
                                customBeatPrices: {
                                  ...(prev.customBeatPrices || DEFAULT_CUSTOM_BEAT_PRICES),
                                  stems: val
                                }
                              }));
                            }}
                            className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-200 text-xs focus:outline-none focus:border-amber-500/50 font-mono"
                            placeholder="25000"
                          />
                          <span className="absolute right-3 top-2 text-[10px] font-mono text-zinc-500">KZ</span>
                        </div>
                      </div>

                      <div className="bg-zinc-900/60 p-3 rounded-xl border border-zinc-800 space-y-1.5">
                        <label className="block text-[11px] font-bold text-zinc-300 font-mono">
                          4. Exclusivo + Mix Sob Medida
                        </label>
                        <p className="text-[10px] text-zinc-500">Uso 100% exclusivo + mixagem dedicada</p>
                        <div className="relative">
                          <input
                            type="number"
                            value={studioSettingsForm.customBeatPrices?.exclusive ?? DEFAULT_CUSTOM_BEAT_PRICES.exclusive}
                            onChange={(e) => {
                              const val = Number(e.target.value);
                              setStudioSettingsForm(prev => ({
                                ...prev,
                                customBeatPrices: {
                                  ...(prev.customBeatPrices || DEFAULT_CUSTOM_BEAT_PRICES),
                                  exclusive: val
                                }
                              }));
                            }}
                            className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-200 text-xs focus:outline-none focus:border-amber-500/50 font-mono"
                            placeholder="35000"
                          />
                          <span className="absolute right-3 top-2 text-[10px] font-mono text-zinc-500">KZ</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Preços dos Agendamentos & Sessões de Estúdio (Por Hora) */}
                  <div className="bg-zinc-950 border border-amber-500/30 p-4 rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-amber-500" />
                        <span className="text-xs font-bold text-amber-400 uppercase font-mono">Preços dos Serviços & Sessões de Estúdio (KZ)</span>
                      </div>
                      <span className="text-[10px] text-zinc-500 font-mono">Preço fixo por 1h de estúdio e serviços</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
                      {/* Gravação por Hora */}
                      <div className="bg-zinc-900/60 p-3 rounded-xl border border-amber-500/40 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <label className="block text-[11px] font-bold text-amber-400 font-mono">
                            1. Gravação (Preço por 1h) *
                          </label>
                          <span className="text-[9px] bg-amber-500/20 text-amber-400 px-1 rounded font-mono font-bold">1h FIXO</span>
                        </div>
                        <p className="text-[10px] text-zinc-500">Valor cobrado por cada hora de sessão</p>
                        <div className="relative">
                          <input
                            type="number"
                            value={studioSettingsForm.studioRates?.recordingPerHour ?? DEFAULT_STUDIO_RATES.recordingPerHour}
                            onChange={(e) => {
                              const val = Number(e.target.value);
                              setStudioSettingsForm(prev => ({
                                ...prev,
                                studioRates: {
                                  ...(prev.studioRates || DEFAULT_STUDIO_RATES),
                                  recordingPerHour: val
                                }
                              }));
                            }}
                            className="w-full bg-zinc-950 border border-amber-500/40 rounded-lg px-3 py-2 text-zinc-200 text-xs focus:outline-none focus:border-amber-500/50 font-mono font-bold"
                            placeholder="30000"
                          />
                          <span className="absolute right-3 top-2 text-[10px] font-mono text-amber-400">KZ/h</span>
                        </div>
                      </div>

                      {/* Mixagem */}
                      <div className="bg-zinc-900/60 p-3 rounded-xl border border-zinc-800 space-y-1.5">
                        <label className="block text-[11px] font-bold text-zinc-300 font-mono">
                          2. Mixagem Digital
                        </label>
                        <p className="text-[10px] text-zinc-500">Preço por cada música mixada</p>
                        <div className="relative">
                          <input
                            type="number"
                            value={studioSettingsForm.studioRates?.mixingPerSong ?? DEFAULT_STUDIO_RATES.mixingPerSong}
                            onChange={(e) => {
                              const val = Number(e.target.value);
                              setStudioSettingsForm(prev => ({
                                ...prev,
                                studioRates: {
                                  ...(prev.studioRates || DEFAULT_STUDIO_RATES),
                                  mixingPerSong: val
                                }
                              }));
                            }}
                            className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-200 text-xs focus:outline-none focus:border-amber-500/50 font-mono"
                            placeholder="80000"
                          />
                          <span className="absolute right-3 top-2 text-[10px] font-mono text-zinc-500">KZ</span>
                        </div>
                      </div>

                      {/* Masterização */}
                      <div className="bg-zinc-900/60 p-3 rounded-xl border border-zinc-800 space-y-1.5">
                        <label className="block text-[11px] font-bold text-zinc-300 font-mono">
                          3. Masterização Digital
                        </label>
                        <p className="text-[10px] text-zinc-500">Preço por cada faixa masterizada</p>
                        <div className="relative">
                          <input
                            type="number"
                            value={studioSettingsForm.studioRates?.masteringPerSong ?? DEFAULT_STUDIO_RATES.masteringPerSong}
                            onChange={(e) => {
                              const val = Number(e.target.value);
                              setStudioSettingsForm(prev => ({
                                ...prev,
                                studioRates: {
                                  ...(prev.studioRates || DEFAULT_STUDIO_RATES),
                                  masteringPerSong: val
                                }
                              }));
                            }}
                            className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-200 text-xs focus:outline-none focus:border-amber-500/50 font-mono"
                            placeholder="40000"
                          />
                          <span className="absolute right-3 top-2 text-[10px] font-mono text-zinc-500">KZ</span>
                        </div>
                      </div>

                      {/* Produção Completa */}
                      <div className="bg-zinc-900/60 p-3 rounded-xl border border-zinc-800 space-y-1.5">
                        <label className="block text-[11px] font-bold text-zinc-300 font-mono">
                          4. Produção Completa
                        </label>
                        <p className="text-[10px] text-zinc-500">Beat + Gravação + Mix & Master</p>
                        <div className="relative">
                          <input
                            type="number"
                            value={studioSettingsForm.studioRates?.fullProductionPerSong ?? DEFAULT_STUDIO_RATES.fullProductionPerSong}
                            onChange={(e) => {
                              const val = Number(e.target.value);
                              setStudioSettingsForm(prev => ({
                                ...prev,
                                studioRates: {
                                  ...(prev.studioRates || DEFAULT_STUDIO_RATES),
                                  fullProductionPerSong: val
                                }
                              }));
                            }}
                            className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-200 text-xs focus:outline-none focus:border-amber-500/50 font-mono"
                            placeholder="250000"
                          />
                          <span className="absolute right-3 top-2 text-[10px] font-mono text-zinc-500">KZ</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase font-mono">Endereço do Estúdio</label>
                    <input
                      type="text"
                      value={studioSettingsForm.address}
                      onChange={(e) => setStudioSettingsForm(prev => ({ ...prev, address: e.target.value }))}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-zinc-200 text-xs focus:outline-none focus:border-amber-500/50"
                    />
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      className="bg-amber-500 hover:bg-amber-400 text-black font-bold px-5 py-2.5 rounded-lg text-xs tracking-wide transition-all shadow-md"
                    >
                      Salvar Alterações
                    </button>
                  </div>
                </form>
              )}

              {/* TAB: CUSTOM BEAT COMMISSIONS / ENCOMENDAS PERSONALIZADAS */}
              {activeTab === 'custom_orders' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center mb-2">
                    <div>
                      <h4 className="font-bold text-white text-sm flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-amber-500" />
                        Encomendas de Beats Personalizados
                      </h4>
                      <p className="text-zinc-500 text-[11px] mt-0.5">
                        Instrumentais encomendados sob medida com especificações de estilo, BPM, referências e vocais dos clientes.
                      </p>
                    </div>
                  </div>

                  {customOrders.length === 0 ? (
                    <div className="text-center py-12 bg-zinc-900/30 border border-zinc-900/60 rounded-2xl">
                      <Sparkles className="w-10 h-10 text-zinc-700 mx-auto mb-3 animate-pulse" />
                      <p className="text-zinc-400 text-xs">Nenhuma encomenda de beat personalizado recebida ainda.</p>
                      <p className="text-zinc-600 text-[11px] mt-1">Os pedidos feitos através do formulário aparecerão aqui em tempo real.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {customOrders.map((order) => {
                        const dateStr = new Date(order.timestamp).toLocaleDateString('pt-PT', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        });

                        const cleanPhone = order.clientPhone.replace(/[^0-9+]/g, '');
                        const licenseLabel = order.licenseType === 'mp3'
                          ? 'Licença MP3'
                          : order.licenseType === 'premium'
                          ? 'Licença Premium WAV + MP3'
                          : order.licenseType === 'stems'
                          ? 'Licença Stems / Pistas'
                          : order.licenseType === 'exclusive'
                          ? 'Licença Exclusiva + Mix'
                          : 'Beat Personalizado';
                        
                        const priceText = order.licensePrice ? `${order.licensePrice.toLocaleString()} KZ` : '';
                        const waMsg = `Olá ${order.clientName}! Recebemos a sua encomenda de Beat Personalizado na Omni Sounds (${order.genre} - ${order.bpm} BPM, Ref: "${order.referenceSongName}", ${licenseLabel}${priceText ? ` - ${priceText}` : ''}). ${order.hasVocal ? 'Pode enviar a gravação da sua voz/vocal no WhatsApp para alinharmos a harmonia?' : 'Vamos dar início à produção!'}`;
                        const waUrl = `https://api.whatsapp.com/send?phone=${encodeURIComponent(cleanPhone)}&text=${encodeURIComponent(waMsg)}`;

                        return (
                          <div
                            key={order.id}
                            className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-4 space-y-3.5 hover:border-amber-500/30 transition-all"
                          >
                            {/* Header Row */}
                            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 pb-2.5 border-b border-zinc-800/60">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold px-2 py-0.5 rounded text-[10px] uppercase font-mono">
                                  {order.genre}
                                </span>
                                <span className="text-white font-bold text-sm">
                                  {order.clientName}
                                </span>
                                {order.licenseType && (
                                  <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 font-mono">
                                    <Shield className="w-2.5 h-2.5" /> {licenseLabel} {order.licensePrice ? `(${order.licensePrice.toLocaleString()} KZ)` : ''}
                                  </span>
                                )}
                                {order.hasVocal && (
                                  <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                                    <Mic2 className="w-3 h-3" /> Tem Vocal / Voz
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-mono text-zinc-500">{dateStr}</span>
                                {onUpdateCustomOrderStatus && (
                                  <select
                                    value={order.status}
                                    onChange={(e) => onUpdateCustomOrderStatus(order.id, e.target.value as CustomBeatOrder['status'])}
                                    className={`px-2 py-1 rounded text-[10px] font-bold border focus:outline-none bg-zinc-950 cursor-pointer ${
                                      order.status === 'Concluído'
                                        ? 'text-emerald-400 border-emerald-500/30'
                                        : order.status === 'Em Produção'
                                        ? 'text-purple-400 border-purple-500/30'
                                        : order.status === 'Prévia Enviada'
                                        ? 'text-blue-400 border-blue-500/30'
                                        : order.status === 'Cancelado'
                                        ? 'text-red-400 border-red-500/30'
                                        : 'text-amber-400 border-amber-500/30'
                                    }`}
                                  >
                                    <option value="Pendente">Pendente</option>
                                    <option value="Em Produção">Em Produção</option>
                                    <option value="Prévia Enviada">Prévia Enviada</option>
                                    <option value="Concluído">Concluído</option>
                                    <option value="Cancelado">Cancelado</option>
                                  </select>
                                )}
                              </div>
                            </div>

                            {/* Details Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5 text-xs">
                              <div className="bg-zinc-950/80 p-2.5 rounded-lg border border-zinc-800/60">
                                <span className="text-[10px] font-mono text-zinc-500 uppercase block">Licença & Valor</span>
                                <span className="font-bold text-amber-400 mt-0.5 block">{licenseLabel}</span>
                                <span className="text-[11px] font-mono text-zinc-300">{order.licensePrice ? `${order.licensePrice.toLocaleString()} KZ` : 'A combinar'}</span>
                              </div>

                              <div className="bg-zinc-950/80 p-2.5 rounded-lg border border-zinc-800/60">
                                <span className="text-[10px] font-mono text-zinc-500 uppercase block">Andamento & Duração</span>
                                <span className="font-bold text-zinc-200 mt-0.5 block">{order.bpm} BPM • {order.beatDuration}</span>
                              </div>

                              <div className="bg-zinc-950/80 p-2.5 rounded-lg border border-zinc-800/60">
                                <span className="text-[10px] font-mono text-zinc-500 uppercase block">Música de Referência</span>
                                <div className="flex items-center justify-between gap-2 mt-0.5">
                                  <span className="font-bold text-amber-400 truncate">{order.referenceSongName}</span>
                                  {order.referenceSongUrl && (
                                    <a
                                      href={order.referenceSongUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-[10px] text-amber-500 hover:underline flex items-center gap-1 font-mono flex-shrink-0"
                                    >
                                      <ExternalLink className="w-3 h-3" /> Link
                                    </a>
                                  )}
                                </div>
                              </div>

                              <div className="bg-zinc-950/80 p-2.5 rounded-lg border border-zinc-800/60">
                                <span className="text-[10px] font-mono text-zinc-500 uppercase block">Contatos</span>
                                <div className="text-[11px] text-zinc-300 font-mono truncate mt-0.5">{order.clientPhone}</div>
                                {order.clientEmail ? (
                                  <div className="text-[10px] text-zinc-500 font-mono truncate">{order.clientEmail}</div>
                                ) : (
                                  <div className="text-[10px] text-zinc-600 font-mono italic">Sem e-mail</div>
                                )}
                              </div>
                            </div>

                            {/* Notes / Instructions if any */}
                            {order.notes && (
                              <div className="bg-zinc-950/60 p-2.5 rounded-lg border border-zinc-800/40 text-xs">
                                <span className="text-[10px] font-mono text-zinc-500 uppercase block">Observações do Cliente:</span>
                                <p className="text-zinc-300 text-xs mt-0.5 italic">{order.notes}</p>
                              </div>
                            )}

                            {/* Vocal Callout if marked */}
                            {order.hasVocal && (
                              <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-lg p-2 flex items-center justify-between text-xs">
                                <span className="text-[11px] text-emerald-300">
                                  🎤 O cliente indicou ter guia vocal para este beat. Peça o áudio no WhatsApp se ainda não tiver enviado.
                                </span>
                              </div>
                            )}

                            {/* Bottom Actions */}
                            <div className="flex justify-between items-center pt-1">
                              <span className="text-[10px] font-mono text-zinc-600">ID: {order.id}</span>
                              <div className="flex items-center gap-2">
                                <a
                                  href={waUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shadow-md shadow-emerald-500/10"
                                >
                                  <MessageCircle className="w-3.5 h-3.5 fill-black" />
                                  <span>Falar no WhatsApp</span>
                                </a>
                                {onDeleteCustomOrder && (
                                  <button
                                    onClick={() => {
                                      if (confirm(`Tem certeza que deseja excluir a encomenda de "${order.clientName}"?`)) {
                                        onDeleteCustomOrder(order.id);
                                      }
                                    }}
                                    className="p-1.5 bg-zinc-950 hover:bg-red-500/10 hover:text-red-400 text-zinc-500 border border-zinc-800 rounded-lg transition-all cursor-pointer"
                                    title="Excluir encomenda"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 5: BEAT PURCHASES / SALES */}
              {activeTab === 'purchases' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center mb-2">
                    <div>
                      <h4 className="font-bold text-white text-sm">Pedidos de Compra de Beats</h4>
                      <p className="text-zinc-500 text-[11px] mt-0.5">Veja e gerencie as compras de beats realizadas pelos clientes, envie mensagens no WhatsApp.</p>
                    </div>
                  </div>

                  {purchases.length === 0 ? (
                    <div className="text-center py-12 bg-zinc-900/30 border border-zinc-900/60 rounded-2xl">
                      <Music className="w-10 h-10 text-zinc-700 mx-auto mb-3 animate-pulse" />
                      <p className="text-zinc-400 text-xs">Nenhum pedido de compra recebido ainda.</p>
                    </div>
                  ) : (
                    <div className="bg-zinc-900/40 border border-zinc-900 rounded-2xl overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="border-b border-zinc-900 bg-zinc-950 font-mono text-zinc-500 uppercase text-[10px]">
                              <th className="p-4">Comprador</th>
                              <th className="p-4">Beat / Licença</th>
                              <th className="p-4 font-mono">Valor</th>
                              <th className="p-4 font-mono">Data</th>
                              <th className="p-4 text-center">Status</th>
                              <th className="p-4 text-right">Ações</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-900/60">
                            {purchases.map((pur) => {
                              const dateStr = new Date(pur.timestamp).toLocaleDateString('pt-PT', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              });

                              const cleanPhone = pur.clientPhone.replace(/[^0-9+]/g, '');
                              const getLicenseLabel = (type: string) => {
                                switch (type) {
                                  case 'mp3':
                                    return 'MP3';
                                  case 'premium':
                                    return 'Premium (MP3 + WAV)';
                                  case 'stems':
                                    return 'Stems/Trackouts';
                                  case 'exclusive':
                                    return 'Exclusivo + Mix';
                                  case 'basic':
                                    return 'Básica';
                                  default:
                                    return type;
                                }
                              };

                              const waMessage = `Olá ${pur.clientName}! Vimos seu pedido do beat "${pur.beatTitle}" (Licença ${getLicenseLabel(pur.licenseType)}) no Omni Sounds. Como podemos proceder com a entrega?`;
                              const waUrl = `https://api.whatsapp.com/send?phone=${encodeURIComponent(cleanPhone)}&text=${encodeURIComponent(waMessage)}`;

                              return (
                                <tr key={pur.id} className="hover:bg-zinc-900/20 transition-colors">
                                  <td className="p-4">
                                    <div className="font-semibold text-zinc-200">{pur.clientName}</div>
                                    {pur.clientEmail ? (
                                      <div className="text-[10px] text-zinc-500 font-mono mt-0.5">{pur.clientEmail}</div>
                                    ) : (
                                      <div className="text-[10px] text-zinc-600 font-mono mt-0.5 italic">Sem e-mail</div>
                                    )}
                                    <div className="text-[10px] text-zinc-500 font-mono">{pur.clientPhone}</div>
                                  </td>
                                  <td className="p-4">
                                    <div className="font-semibold text-white">{pur.beatTitle}</div>
                                    <div className="mt-1">
                                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase font-mono tracking-wider ${
                                        pur.licenseType === 'exclusive'
                                          ? 'bg-purple-500/10 text-purple-400 border border-purple-500/30'
                                          : pur.licenseType === 'stems'
                                          ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                                          : pur.licenseType === 'premium'
                                          ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                                          : 'bg-zinc-800 text-zinc-400'
                                      }`}>
                                        {getLicenseLabel(pur.licenseType)}
                                      </span>
                                    </div>
                                  </td>
                                  <td className="p-4 font-mono font-bold text-amber-500">
                                    {pur.pricePaid.toLocaleString()} KZ
                                  </td>
                                  <td className="p-4 font-mono text-zinc-500">
                                    {dateStr}
                                  </td>
                                  <td className="p-4 text-center">
                                    <select
                                      value={pur.status}
                                      onChange={(e) => onUpdatePurchaseStatus(pur.id, e.target.value as BeatPurchase['status'])}
                                      className={`px-2 py-1 rounded text-[10px] font-bold border focus:outline-none bg-zinc-950 cursor-pointer ${
                                        pur.status === 'Concluído'
                                          ? 'text-emerald-500 border-emerald-500/20'
                                          : pur.status === 'Cancelado'
                                          ? 'text-red-500 border-red-500/20'
                                          : 'text-amber-500 border-amber-500/20'
                                      }`}
                                    >
                                      <option value="Pendente" className="text-amber-500 bg-zinc-950">Pendente</option>
                                      <option value="Concluído" className="text-emerald-500 bg-zinc-950">Concluído</option>
                                      <option value="Cancelado" className="text-red-500 bg-zinc-950">Cancelado</option>
                                    </select>
                                  </td>
                                  <td className="p-4 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                      <a
                                        href={waUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        title="Enviar mensagem no WhatsApp"
                                        className="p-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400 hover:bg-emerald-500 hover:text-black transition-all flex items-center gap-1 text-[10px] font-bold"
                                      >
                                        <span className="font-mono">WhatsApp</span>
                                      </a>
                                      <button
                                        onClick={() => {
                                          if (confirm('Tem certeza que deseja excluir esta venda?')) {
                                            onDeletePurchase(pur.id);
                                          }
                                        }}
                                        className="p-1.5 bg-zinc-950 border border-zinc-900 rounded-lg text-zinc-500 hover:text-red-500 hover:border-red-500/30 transition-all"
                                        title="Eliminar pedido"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}

            </div>

            {/* Sticky Footnote */}
            <div className="p-4 border-t border-zinc-900 text-center text-[11px] text-zinc-500 font-mono bg-black/60">
              ⚡ As alterações efetuadas neste painel são salvas automaticamente no armazenamento local deste dispositivo.
            </div>

          </div>
        </div>
      )}
    </>
  );
}
