import React, { useState } from 'react';
import { Play, Pause, ShoppingCart, Search, Music, Disc, BadgeAlert, Layers, Sparkles, Check, X, Shield, ChevronDown, ChevronUp, Info, CheckCircle2 } from 'lucide-react';
import { Beat, transformGoogleDriveUrl, getBeatLicensePrice } from '../types';
import PricingTable, { PRICING_TIERS } from './PricingTable';

interface BeatStoreProps {
  beats: Beat[];
  onPlayBeat: (beat: Beat) => void;
  currentPlayingBeat: Beat | null;
  isPlaying: boolean;
  onPurchase: (
    beat: Beat,
    licenseType: 'mp3' | 'premium' | 'stems' | 'exclusive' | string,
    clientName: string,
    clientEmail: string,
    clientPhone: string
  ) => void;
  onOpenCustomOrder?: () => void;
}

export default function BeatStore({
  beats,
  onPlayBeat,
  currentPlayingBeat,
  isPlaying,
  onPurchase,
  onOpenCustomOrder
}: BeatStoreProps) {
  const [search, setSearch] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('Todos');
  const [selectedBeatForCheckout, setSelectedBeatForCheckout] = useState<Beat | null>(null);
  const [licenseType, setLicenseType] = useState<'mp3' | 'premium' | 'stems' | 'exclusive'>('premium');
  const [expandedLicenses, setExpandedLicenses] = useState<Record<string, boolean>>({
    mp3: false,
    premium: true,
    stems: false,
    exclusive: false
  });
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [formError, setFormError] = useState('');

  const handleSelectLicense = (type: 'mp3' | 'premium' | 'stems' | 'exclusive') => {
    setLicenseType(type);
    setExpandedLicenses(prev => ({
      ...prev,
      [type]: true
    }));
  };

  const handleToggleExpandLicense = (e: React.MouseEvent, type: 'mp3' | 'premium' | 'stems' | 'exclusive') => {
    e.stopPropagation();
    setExpandedLicenses(prev => ({
      ...prev,
      [type]: !prev[type]
    }));
  };

  const genres = ['Todos', 'Trap', 'Boom Bap', 'Drill', 'R&B', 'Afrobeats'];

  const filteredBeats = beats.filter(beat => {
    const searchLower = search.toLowerCase();
    const matchesSearch = beat.title.toLowerCase().includes(searchLower) || 
                          (beat.producer && beat.producer.toLowerCase().includes(searchLower)) ||
                          beat.tags.some(tag => tag.toLowerCase().includes(searchLower));
    const matchesGenre = selectedGenre === 'Todos' || beat.genre === selectedGenre;
    return matchesSearch && matchesGenre;
  });

  const openCheckout = (beat: Beat, initialLicense?: 'mp3' | 'premium' | 'stems' | 'exclusive') => {
    setSelectedBeatForCheckout(beat);
    setLicenseType(initialLicense || 'premium');
    setClientName('');
    setClientEmail('');
    setClientPhone('');
    setFormError('');
  };

  const getPriceForLicense = (type: 'mp3' | 'premium' | 'stems' | 'exclusive') => {
    if (!selectedBeatForCheckout) return 7000;
    return getBeatLicensePrice(selectedBeatForCheckout, type);
  };

  const handleConfirmPurchase = () => {
    if (!clientName.trim() || !clientPhone.trim()) {
      setFormError('Por favor, preencha os campos obrigatórios (Nome e WhatsApp).');
      return;
    }
    if (selectedBeatForCheckout) {
      onPurchase(selectedBeatForCheckout, licenseType, clientName.trim(), clientEmail.trim(), clientPhone.trim());
      setSelectedBeatForCheckout(null);
      setClientName('');
      setClientEmail('');
      setClientPhone('');
      setFormError('');
    }
  };

  return (
    <div id="beats-store" className="py-4 sm:py-8 space-y-6 sm:space-y-10">
      {/* Custom Beat Order Callout Banner */}
      {onOpenCustomOrder && (
        <div className="relative overflow-hidden bg-gradient-to-r from-amber-500/15 via-zinc-900/90 to-zinc-950 border border-amber-500/30 rounded-2xl p-4 sm:p-6 shadow-xl shadow-amber-500/5">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
            <div className="space-y-1.5 max-w-xl">
              <div className="flex items-center gap-2">
                <span className="bg-amber-500 text-black text-[10px] font-mono font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                  Produção Exclusiva
                </span>
                <span className="text-[11px] text-amber-400 font-bold flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" /> 100% Sob Medida
                </span>
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-white">
                Quer um Beat Personalizado para o seu Projeto?
              </h3>
              <p className="text-zinc-300 text-xs sm:text-sm leading-relaxed">
                Defina o estilo, BPM, duração, músicas de referência e envie a sua voz/vocal pelo WhatsApp para criarmos um instrumental feito à sua medida.
              </p>
            </div>

            <button
              onClick={onOpenCustomOrder}
              className="bg-amber-500 hover:bg-amber-400 text-black text-xs sm:text-sm font-extrabold px-5 py-3 rounded-xl transition-all shadow-lg shadow-amber-500/20 flex items-center gap-2 cursor-pointer flex-shrink-0"
            >
              <Disc className="w-4 h-4" />
              <span>Encomendar Beat Personalizado</span>
            </button>
          </div>

          <div className="absolute -right-8 -bottom-8 w-40 h-40 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
        </div>
      )}

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-3 sm:gap-4 justify-between items-start md:items-center">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            placeholder="Buscar por título, produtor ou tags (ex: trap)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800/80 rounded-xl pl-9 pr-3 py-2 sm:py-2.5 text-zinc-200 text-xs sm:text-sm focus:outline-none focus:border-amber-500/50 transition-colors"
          />
        </div>

        <div className="flex gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          {genres.map(genre => (
            <button
              key={genre}
              onClick={() => setSelectedGenre(genre)}
              className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-semibold whitespace-nowrap transition-all duration-300 ${
                selectedGenre === genre
                  ? 'bg-amber-500 text-black shadow-md shadow-amber-500/10'
                  : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800 border border-zinc-800/40'
              }`}
            >
              {genre}
            </button>
          ))}
        </div>
      </div>

      {/* Beats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
        {filteredBeats.length > 0 ? (
          filteredBeats.map(beat => {
            const isThisPlaying = currentPlayingBeat?.id === beat.id && isPlaying;
            return (
              <div
                key={beat.id}
                className="bg-zinc-950/80 border border-zinc-900 rounded-xl p-2.5 sm:p-4 hover:border-amber-500/30 transition-all duration-300 flex items-center justify-between gap-2.5 sm:gap-4 group"
              >
                {/* Left side: Artwork, Title, Details */}
                <div className="flex items-center gap-2.5 sm:gap-4 flex-1 min-w-0">
                  <div className="relative w-12 h-12 sm:w-16 sm:h-16 rounded-lg overflow-hidden flex-shrink-0 bg-zinc-900 border border-zinc-800/60 group-hover:border-amber-500/30 transition-all">
                    <img
                      src={transformGoogleDriveUrl(beat.coverUrl)}
                      alt={beat.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                    <button
                      onClick={() => onPlayBeat(beat)}
                      className="absolute inset-0 bg-black/60 sm:opacity-0 sm:group-hover:opacity-100 flex items-center justify-center transition-opacity"
                    >
                      {isThisPlaying ? (
                        <Pause className="w-5 h-5 text-amber-500 fill-current" />
                      ) : (
                        <Play className="w-5 h-5 text-amber-500 fill-current" />
                      )}
                    </button>
                  </div>

                  <div className="min-w-0">
                    <h4 className="font-bold text-zinc-100 text-xs sm:text-sm truncate group-hover:text-amber-500 transition-colors">
                      {beat.title}
                    </h4>
                    <p className="text-zinc-500 text-[10px] sm:text-xs mt-0.5 truncate">
                      {beat.genre} • {beat.bpm} BPM • {beat.key}
                    </p>
                    <div className="flex flex-wrap gap-1 mt-1 sm:mt-2">
                      {beat.tags.slice(0, 3).map(tag => (
                        <span key={tag} className="text-[9px] sm:text-[10px] bg-zinc-900 border border-zinc-800/60 text-zinc-400 px-1.5 py-0.2 rounded font-mono">
                          #{tag}
                        </span>
                      ))}
                    </div>

                    {/* Nome do produtor exibido abaixo das tags */}
                    <div className="mt-1.5 sm:mt-2 flex items-center gap-1.5 text-[10px] sm:text-[11px] leading-none">
                      <span className="text-zinc-500 font-medium font-mono">Nome do produtor:</span>
                      <span className="text-amber-400 font-bold tracking-wide truncate">
                        {beat.producer || 'Omni Sounds'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right side: Action, Price */}
                <div className="flex flex-col items-end gap-1.5 sm:gap-2 flex-shrink-0">
                  <div className="text-right">
                    <span className="text-[9px] font-mono text-zinc-500 block uppercase">a partir de</span>
                    <span className="text-[11px] sm:text-sm font-bold text-amber-500 font-mono">
                      {getBeatLicensePrice(beat, 'mp3').toLocaleString()} KZ
                    </span>
                  </div>
                  <button
                    onClick={() => openCheckout(beat)}
                    className="flex items-center gap-1 bg-zinc-900 hover:bg-amber-500 hover:text-black border border-zinc-800 hover:border-amber-500 text-zinc-300 text-[11px] sm:text-xs font-semibold px-2.5 py-1.5 sm:px-3.5 sm:py-2 rounded-lg transition-all cursor-pointer"
                  >
                    <ShoppingCart className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                    <span>Comprar</span>
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-2 text-center py-12 bg-zinc-900/40 rounded-2xl border border-zinc-800/30">
            <Music className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
            <p className="text-zinc-400 text-sm">Nenhum beat encontrado para sua pesquisa.</p>
          </div>
        )}
      </div>

      {/* Pricing Table Section directly in the Beats View */}
      <div className="border-t border-zinc-900 pt-10">
        <PricingTable
          title="Tabela de Licenças de Beats"
          subtitle="Consulte os termos, direitos de uso, formatos de áudio e limites de reprodução incluídos em cada licença."
        />
      </div>

      {/* Checkout Modal / Dialog */}
      {selectedBeatForCheckout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-lg p-6 relative shadow-2xl my-8 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setSelectedBeatForCheckout(null)}
              className="absolute top-4 right-4 text-zinc-500 hover:text-white p-1 rounded-lg hover:bg-zinc-900 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-bold text-white mb-1 flex items-center gap-2">
              <Disc className="w-5 h-5 text-amber-500 animate-spin" />
              Licenciamento de Beat
            </h3>
            <p className="text-zinc-400 text-xs mb-5">
              Selecione o formato de licença para <span className="text-amber-500 font-bold">"{selectedBeatForCheckout.title}"</span> <span className="text-zinc-400 text-[11px]">(Nome do produtor: <strong className="text-amber-400 font-semibold">{selectedBeatForCheckout.producer || 'Omni Sounds'}</strong>)</span>:
            </p>

            {/* 4 License Option Cards with independent toggle icons and expandable details */}
            <div className="space-y-3 mb-5">
              {/* Option 1: MP3 */}
              <div
                onClick={() => handleSelectLicense('mp3')}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                  licenseType === 'mp3'
                    ? 'bg-amber-500/10 border-amber-500 ring-1 ring-amber-500/50'
                    : 'bg-zinc-900/40 border-zinc-800/80 hover:border-zinc-700'
                }`}
              >
                <div className="flex justify-between items-start gap-2 mb-1">
                  <div className="flex items-center gap-2">
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center flex-shrink-0 ${
                      licenseType === 'mp3' ? 'border-amber-500 bg-amber-500' : 'border-zinc-700 bg-transparent'
                    }`}>
                      {licenseType === 'mp3' && <div className="w-1.5 h-1.5 rounded-full bg-black" />}
                    </div>
                    <span className="font-bold text-xs text-white">Licença MP3</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-xs text-amber-500">
                      {getPriceForLicense('mp3').toLocaleString()} Kz.
                    </span>

                    {/* Dedicated Toggle Icon for details */}
                    <button
                      type="button"
                      onClick={(e) => handleToggleExpandLicense(e, 'mp3')}
                      title={expandedLicenses.mp3 ? "Ocultar detalhes da Licença MP3" : "Ver detalhes da Licença MP3"}
                      className={`p-1 rounded-lg border transition-all flex items-center gap-1 text-[10px] font-mono ${
                        expandedLicenses.mp3
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                          : 'bg-zinc-800/80 text-zinc-400 border-zinc-700 hover:text-white hover:bg-zinc-700'
                      }`}
                    >
                      <Info className="w-3 h-3 text-amber-400" />
                      {expandedLicenses.mp3 ? (
                        <ChevronUp className="w-3 h-3 text-amber-400" />
                      ) : (
                        <ChevronDown className="w-3 h-3 text-zinc-400" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="pl-6 flex items-center justify-between">
                  <div>
                    <p className="text-[11px] text-zinc-300 font-medium">Beat em MP3 (320kbps)</p>
                    <p className="text-[10px] text-zinc-500 mt-0.5">Uso comercial conforme contrato</p>
                  </div>
                  {!expandedLicenses.mp3 && (
                    <button
                      type="button"
                      onClick={(e) => handleToggleExpandLicense(e, 'mp3')}
                      className="text-[10px] text-amber-500/80 hover:text-amber-400 font-mono underline ml-2"
                    >
                      Ver detalhes
                    </button>
                  )}
                </div>

                {/* Specific Details for MP3 shown when expanded */}
                {expandedLicenses.mp3 && (
                  <div className="mt-3 pt-3 border-t border-zinc-800 space-y-1.5 text-[11px] bg-zinc-950/80 p-3 rounded-lg border border-zinc-800/60">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1">
                        <Shield className="w-3 h-3 text-amber-500" />
                        Termos & Direitos inclusos na Licença MP3:
                      </span>
                      {licenseType === 'mp3' ? (
                        <span className="text-[9px] font-mono font-bold text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                          ✓ Selecionada
                        </span>
                      ) : (
                        <span className="text-[9px] font-mono text-zinc-500 hover:text-amber-400">
                          Clique para selecionar
                        </span>
                      )}
                    </div>
                    <div className="flex items-start gap-2 text-zinc-300">
                      <Check className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
                      <span><strong>Direito de uso:</strong> Uso comercial conforme contrato</span>
                    </div>
                    <div className="flex items-start gap-2 text-zinc-300">
                      <Check className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
                      <span><strong>Formato:</strong> Arquivo de áudio em formato MP3 (320kbps)</span>
                    </div>
                    <div className="flex items-start gap-2 text-zinc-300">
                      <Check className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
                      <span><strong>Distribuição em streaming:</strong> Até 5.000 reproduções</span>
                    </div>
                    <div className="flex items-start gap-2 text-zinc-300">
                      <Check className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
                      <span><strong>Autoria & Créditos:</strong> Uso não-exclusivo com créditos ao produtor</span>
                    </div>
                    <div className="flex items-start gap-2 text-zinc-300">
                      <Check className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
                      <span><strong>Entrega:</strong> Liberação rápida por link protegido</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Option 2: Premium (MP3 + WAV) */}
              <div
                onClick={() => handleSelectLicense('premium')}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all relative ${
                  licenseType === 'premium'
                    ? 'bg-amber-500/10 border-amber-500 ring-1 ring-amber-500/50'
                    : 'bg-zinc-900/40 border-zinc-800/80 hover:border-zinc-700'
                }`}
              >
                <div className="flex justify-between items-start gap-2 mb-1">
                  <div className="flex items-center gap-2">
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center flex-shrink-0 ${
                      licenseType === 'premium' ? 'border-amber-500 bg-amber-500' : 'border-zinc-700 bg-transparent'
                    }`}>
                      {licenseType === 'premium' && <div className="w-1.5 h-1.5 rounded-full bg-black" />}
                    </div>
                    <span className="font-bold text-xs text-white">Licença Premium</span>
                    <span className="text-[8px] bg-amber-500 text-black px-1.5 py-0.2 rounded font-bold uppercase font-mono">Popular</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-xs text-amber-500">
                      {getPriceForLicense('premium').toLocaleString()} Kz.
                    </span>

                    {/* Dedicated Toggle Icon for details */}
                    <button
                      type="button"
                      onClick={(e) => handleToggleExpandLicense(e, 'premium')}
                      title={expandedLicenses.premium ? "Ocultar detalhes da Licença Premium" : "Ver detalhes da Licença Premium"}
                      className={`p-1 rounded-lg border transition-all flex items-center gap-1 text-[10px] font-mono ${
                        expandedLicenses.premium
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                          : 'bg-zinc-800/80 text-zinc-400 border-zinc-700 hover:text-white hover:bg-zinc-700'
                      }`}
                    >
                      <Info className="w-3 h-3 text-amber-400" />
                      {expandedLicenses.premium ? (
                        <ChevronUp className="w-3 h-3 text-amber-400" />
                      ) : (
                        <ChevronDown className="w-3 h-3 text-zinc-400" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="pl-6 flex items-center justify-between">
                  <div>
                    <p className="text-[11px] text-zinc-300 font-medium">MP3 + WAV Alta Qualidade (24-bit)</p>
                    <p className="text-[10px] text-zinc-500 mt-0.5">Lançamento comercial liberado</p>
                  </div>
                  {!expandedLicenses.premium && (
                    <button
                      type="button"
                      onClick={(e) => handleToggleExpandLicense(e, 'premium')}
                      className="text-[10px] text-amber-500/80 hover:text-amber-400 font-mono underline ml-2"
                    >
                      Ver detalhes
                    </button>
                  )}
                </div>

                {/* Specific Details for Premium shown when expanded */}
                {expandedLicenses.premium && (
                  <div className="mt-3 pt-3 border-t border-zinc-800 space-y-1.5 text-[11px] bg-zinc-950/80 p-3 rounded-lg border border-zinc-800/60">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1">
                        <Shield className="w-3 h-3 text-amber-500" />
                        Termos & Direitos inclusos na Licença Premium:
                      </span>
                      {licenseType === 'premium' ? (
                        <span className="text-[9px] font-mono font-bold text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                          ✓ Selecionada
                        </span>
                      ) : (
                        <span className="text-[9px] font-mono text-zinc-500 hover:text-amber-400">
                          Clique para selecionar
                        </span>
                      )}
                    </div>
                    <div className="flex items-start gap-2 text-zinc-300">
                      <Check className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
                      <span><strong>Direito de uso:</strong> Lançamento comercial em todas as plataformas (Spotify, Apple, etc.)</span>
                    </div>
                    <div className="flex items-start gap-2 text-zinc-300">
                      <Check className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
                      <span><strong>Formato:</strong> Arquivo MP3 + WAV Master sem compressão (24-bit/48kHz)</span>
                    </div>
                    <div className="flex items-start gap-2 text-zinc-300">
                      <Check className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
                      <span><strong>Performances:</strong> Direitos de apresentação ao vivo e videoclipe oficial</span>
                    </div>
                    <div className="flex items-start gap-2 text-zinc-300">
                      <Check className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
                      <span><strong>Entrega:</strong> Arquivos Master de alta fidelidade para estúdio</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Option 3: Stems/Trackouts */}
              <div
                onClick={() => handleSelectLicense('stems')}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                  licenseType === 'stems'
                    ? 'bg-amber-500/10 border-amber-500 ring-1 ring-amber-500/50'
                    : 'bg-zinc-900/40 border-zinc-800/80 hover:border-zinc-700'
                }`}
              >
                <div className="flex justify-between items-start gap-2 mb-1">
                  <div className="flex items-center gap-2">
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center flex-shrink-0 ${
                      licenseType === 'stems' ? 'border-amber-500 bg-amber-500' : 'border-zinc-700 bg-transparent'
                    }`}>
                      {licenseType === 'stems' && <div className="w-1.5 h-1.5 rounded-full bg-black" />}
                    </div>
                    <span className="font-bold text-xs text-white">Stems / Pistas</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-xs text-amber-500">
                      {getPriceForLicense('stems').toLocaleString()} Kz.
                    </span>

                    {/* Dedicated Toggle Icon for details */}
                    <button
                      type="button"
                      onClick={(e) => handleToggleExpandLicense(e, 'stems')}
                      title={expandedLicenses.stems ? "Ocultar detalhes da Licença Stems" : "Ver detalhes da Licença Stems"}
                      className={`p-1 rounded-lg border transition-all flex items-center gap-1 text-[10px] font-mono ${
                        expandedLicenses.stems
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                          : 'bg-zinc-800/80 text-zinc-400 border-zinc-700 hover:text-white hover:bg-zinc-700'
                      }`}
                    >
                      <Info className="w-3 h-3 text-amber-400" />
                      {expandedLicenses.stems ? (
                        <ChevronUp className="w-3 h-3 text-amber-400" />
                      ) : (
                        <ChevronDown className="w-3 h-3 text-zinc-400" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="pl-6 flex items-center justify-between">
                  <div>
                    <p className="text-[11px] text-zinc-300 font-medium">Pistas separadas (Trackouts)</p>
                    <p className="text-[10px] text-zinc-500 mt-0.5">Mixagem e edição completa</p>
                  </div>
                  {!expandedLicenses.stems && (
                    <button
                      type="button"
                      onClick={(e) => handleToggleExpandLicense(e, 'stems')}
                      className="text-[10px] text-amber-500/80 hover:text-amber-400 font-mono underline ml-2"
                    >
                      Ver detalhes
                    </button>
                  )}
                </div>

                {/* Specific Details for Stems shown when expanded */}
                {expandedLicenses.stems && (
                  <div className="mt-3 pt-3 border-t border-zinc-800 space-y-1.5 text-[11px] bg-zinc-950/80 p-3 rounded-lg border border-zinc-800/60">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1">
                        <Shield className="w-3 h-3 text-amber-500" />
                        Termos & Direitos inclusos na Licença Stems:
                      </span>
                      {licenseType === 'stems' ? (
                        <span className="text-[9px] font-mono font-bold text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                          ✓ Selecionada
                        </span>
                      ) : (
                        <span className="text-[9px] font-mono text-zinc-500 hover:text-amber-400">
                          Clique para selecionar
                        </span>
                      )}
                    </div>
                    <div className="flex items-start gap-2 text-zinc-300">
                      <Check className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
                      <span><strong>Direito de uso:</strong> Liberdade total para mixar, cortar e editar arranjos</span>
                    </div>
                    <div className="flex items-start gap-2 text-zinc-300">
                      <Check className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
                      <span><strong>Formato:</strong> Pistas individuais separadas (Bateria, 808, Melodia, FX, Synths)</span>
                    </div>
                    <div className="flex items-start gap-2 text-zinc-300">
                      <Check className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
                      <span><strong>Edição na DAW:</strong> Ajuste total de mixagem e arranjo na sua estação de trabalho</span>
                    </div>
                    <div className="flex items-start gap-2 text-zinc-300">
                      <Check className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
                      <span><strong>Entrega:</strong> Arquivos WAV organizados em ZIP + Contrato de licença estendida</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Option 4: Exclusivo + Mix */}
              <div
                onClick={() => handleSelectLicense('exclusive')}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                  licenseType === 'exclusive'
                    ? 'bg-amber-500/10 border-amber-500 ring-1 ring-amber-500/50'
                    : 'bg-zinc-900/40 border-zinc-800/80 hover:border-zinc-700'
                }`}
              >
                <div className="flex justify-between items-start gap-2 mb-1">
                  <div className="flex items-center gap-2">
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center flex-shrink-0 ${
                      licenseType === 'exclusive' ? 'border-amber-500 bg-amber-500' : 'border-zinc-700 bg-transparent'
                    }`}>
                      {licenseType === 'exclusive' && <div className="w-1.5 h-1.5 rounded-full bg-black" />}
                    </div>
                    <span className="font-bold text-xs text-white">Exclusivo + Mix</span>
                    <span className="text-[8px] bg-amber-500 text-black px-1.5 py-0.2 rounded font-bold uppercase font-mono">VIP</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-xs text-amber-500">
                      {getPriceForLicense('exclusive').toLocaleString()} Kz.
                    </span>

                    {/* Dedicated Toggle Icon for details */}
                    <button
                      type="button"
                      onClick={(e) => handleToggleExpandLicense(e, 'exclusive')}
                      title={expandedLicenses.exclusive ? "Ocultar detalhes da Licença Exclusiva" : "Ver detalhes da Licença Exclusiva"}
                      className={`p-1 rounded-lg border transition-all flex items-center gap-1 text-[10px] font-mono ${
                        expandedLicenses.exclusive
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                          : 'bg-zinc-800/80 text-zinc-400 border-zinc-700 hover:text-white hover:bg-zinc-700'
                      }`}
                    >
                      <Info className="w-3 h-3 text-amber-400" />
                      {expandedLicenses.exclusive ? (
                        <ChevronUp className="w-3 h-3 text-amber-400" />
                      ) : (
                        <ChevronDown className="w-3 h-3 text-zinc-400" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="pl-6 flex items-center justify-between">
                  <div>
                    <p className="text-[11px] text-zinc-300 font-medium">Beat exclusivo + produção</p>
                    <p className="text-[10px] text-zinc-500 mt-0.5">Mix & Master e suporte VIP</p>
                  </div>
                  {!expandedLicenses.exclusive && (
                    <button
                      type="button"
                      onClick={(e) => handleToggleExpandLicense(e, 'exclusive')}
                      className="text-[10px] text-amber-500/80 hover:text-amber-400 font-mono underline ml-2"
                    >
                      Ver detalhes
                    </button>
                  )}
                </div>

                {/* Specific Details for Exclusive shown when expanded */}
                {expandedLicenses.exclusive && (
                  <div className="mt-3 pt-3 border-t border-zinc-800 space-y-1.5 text-[11px] bg-zinc-950/80 p-3 rounded-lg border border-zinc-800/60">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1">
                        <Shield className="w-3 h-3 text-amber-500" />
                        Termos & Direitos inclusos na Licença Exclusiva:
                      </span>
                      {licenseType === 'exclusive' ? (
                        <span className="text-[9px] font-mono font-bold text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                          ✓ Selecionada
                        </span>
                      ) : (
                        <span className="text-[9px] font-mono text-zinc-500 hover:text-amber-400">
                          Clique para selecionar
                        </span>
                      )}
                    </div>
                    <div className="flex items-start gap-2 text-zinc-300">
                      <Check className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
                      <span><strong>Direito de uso:</strong> 100% Exclusivo (o beat é retirado imediatamente da loja)</span>
                    </div>
                    <div className="flex items-start gap-2 text-zinc-300">
                      <Check className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
                      <span><strong>Serviço de Produção:</strong> Tratamento e mixagem profissional da sua voz com o instrumental</span>
                    </div>
                    <div className="flex items-start gap-2 text-zinc-300">
                      <Check className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
                      <span><strong>Formato & Master:</strong> Stems completos + masterização final pronta para rádio e streaming</span>
                    </div>
                    <div className="flex items-start gap-2 text-zinc-300">
                      <Check className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
                      <span><strong>Monetização:</strong> Reproduções e vendas ilimitadas em todas as plataformas mundiais</span>
                    </div>
                    <div className="flex items-start gap-2 text-zinc-300">
                      <Check className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
                      <span><strong>Suporte:</strong> Suporte direto de engenharia de som do Omni Sounds</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Buyer Contact Details Form */}
            <div className="mb-5 space-y-3 border-t border-zinc-900 pt-4">
              <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Dados do Comprador</h4>
              
              <div>
                <label className="block text-[11px] font-mono text-zinc-500 mb-1">Seu Nome Completo *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: João Silva"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2 text-zinc-200 text-xs focus:outline-none focus:border-amber-500/50"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-[11px] font-mono text-zinc-500">Gmail / E-mail</label>
                  <span className="text-[10px] text-zinc-500 font-mono">Opcional</span>
                </div>
                <input
                  type="email"
                  placeholder="Ex: joao@gmail.com (opcional)"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2 text-zinc-200 text-xs focus:outline-none focus:border-amber-500/50"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono text-zinc-500 mb-1">WhatsApp / Telemóvel *</label>
                <input
                  type="tel"
                  required
                  placeholder="Ex: +244 923 000 000"
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2 text-zinc-200 text-xs focus:outline-none focus:border-amber-500/50"
                />
                <span className="text-[10px] text-zinc-500 mt-1 block">Receberá as instruções de pagamento e link dos arquivos no WhatsApp.</span>
              </div>

              {formError && (
                <div className="text-red-500 text-xs font-semibold bg-red-500/10 border border-red-500/20 px-3 py-2 rounded-xl">
                  {formError}
                </div>
              )}
            </div>

            {/* Total */}
            <div className="bg-zinc-900 p-4 rounded-xl mb-6 flex justify-between items-center border border-zinc-800/40">
              <div>
                <span className="text-xs font-semibold text-zinc-400 block">Total a Pagar</span>
                <span className="text-[11px] text-zinc-500 font-mono">
                  Licença: {
                    licenseType === 'mp3' ? 'MP3' :
                    licenseType === 'premium' ? 'Premium (MP3 + WAV)' :
                    licenseType === 'stems' ? 'Stems/Trackouts' : 'Exclusivo + Mix'
                  }
                </span>
              </div>
              <span className="text-lg font-mono font-bold text-amber-500">
                {getPriceForLicense(licenseType).toLocaleString()} KZ
              </span>
            </div>

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => setSelectedBeatForCheckout(null)}
                className="flex-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 text-xs font-semibold py-2.5 rounded-xl transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmPurchase}
                className="flex-1 bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold py-2.5 rounded-xl transition-all shadow-lg shadow-amber-500/10 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Check className="w-4 h-4 stroke-[3px]" />
                <span>Confirmar Pedido</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

