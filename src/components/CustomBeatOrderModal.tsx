import React, { useState } from 'react';
import { Sparkles, Disc, Send, X, AlertTriangle, Music, Sliders, CheckCircle2, MessageCircle, Clock, Link as LinkIcon, Mic2, Layers, Shield, Check, ChevronDown, ChevronUp, Info } from 'lucide-react';
import { CustomBeatOrder, StudioSettings, DEFAULT_CUSTOM_BEAT_PRICES, CustomBeatLicensePrices } from '../types';

interface CustomBeatOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitOrder: (orderData: Omit<CustomBeatOrder, 'id' | 'timestamp' | 'status'>) => void;
  settings?: StudioSettings;
}

const GENRE_PRESETS = [
  'Trap',
  'Boom Bap',
  'Drill',
  'Afrobeats',
  'R&B / Soul',
  'Amapiano',
  'Kizomba / Zouk',
  'Kuduro',
  'Pop / Afro Pop',
  'Outro (Personalizado)'
];

const DURATION_PRESETS = [
  '2:00 min',
  '2:30 min',
  '3:00 min',
  '3:30 min',
  '4:00 min',
  'Outra duração'
];

export default function CustomBeatOrderModal({
  isOpen,
  onClose,
  onSubmitOrder,
  settings
}: CustomBeatOrderModalProps) {
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [genre, setGenre] = useState('Trap');
  const [customGenre, setCustomGenre] = useState('');
  const [bpm, setBpm] = useState('130');
  const [referenceSongName, setReferenceSongName] = useState('');
  const [referenceSongUrl, setReferenceSongUrl] = useState('');
  const [beatDuration, setBeatDuration] = useState('3:00 min');
  const [customDuration, setCustomDuration] = useState('');
  const [hasVocal, setHasVocal] = useState(false);
  const [notes, setNotes] = useState('');
  const [licenseType, setLicenseType] = useState<'mp3' | 'premium' | 'stems' | 'exclusive'>('premium');
  const [expandedLicenses, setExpandedLicenses] = useState<Record<string, boolean>>({
    mp3: false,
    premium: true,
    stems: false,
    exclusive: false
  });
  
  const [formError, setFormError] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submittedOrder, setSubmittedOrder] = useState<Partial<CustomBeatOrder> | null>(null);

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

  if (!isOpen) return null;

  const customPrices: CustomBeatLicensePrices = {
    mp3: settings?.customBeatPrices?.mp3 ?? DEFAULT_CUSTOM_BEAT_PRICES.mp3,
    premium: settings?.customBeatPrices?.premium ?? DEFAULT_CUSTOM_BEAT_PRICES.premium,
    stems: settings?.customBeatPrices?.stems ?? DEFAULT_CUSTOM_BEAT_PRICES.stems,
    exclusive: settings?.customBeatPrices?.exclusive ?? DEFAULT_CUSTOM_BEAT_PRICES.exclusive,
  };

  const getLicenseLabel = (type: 'mp3' | 'premium' | 'stems' | 'exclusive' | string) => {
    switch (type) {
      case 'mp3': return 'Licença MP3 Personalizada';
      case 'premium': return 'Licença Premium (MP3 + WAV)';
      case 'stems': return 'Licença Stems / Trackouts';
      case 'exclusive': return 'Licença Exclusiva + Mix & Master';
      default: return 'Licença Personalizada';
    }
  };

  const currentPrice = customPrices[licenseType] || customPrices.premium;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!clientName.trim() || !clientPhone.trim()) {
      setFormError('Por favor, preencha seus dados de contato (Nome e WhatsApp).');
      return;
    }

    if (!referenceSongName.trim()) {
      setFormError('Por favor, informe o nome da música de referência para sabermos o estilo desejado.');
      return;
    }

    const finalGenre = genre === 'Outro (Personalizado)' ? (customGenre.trim() || 'Personalizado') : genre;
    const finalDuration = beatDuration === 'Outra duração' ? (customDuration.trim() || '3:00 min') : beatDuration;
    const finalPrice = customPrices[licenseType] || customPrices.premium;

    const orderData = {
      clientName: clientName.trim(),
      clientEmail: clientEmail.trim(),
      clientPhone: clientPhone.trim(),
      genre: finalGenre,
      bpm: bpm.trim() || '130',
      referenceSongName: referenceSongName.trim(),
      referenceSongUrl: referenceSongUrl.trim() || '',
      beatDuration: finalDuration,
      hasVocal,
      notes: notes.trim() || '',
      licenseType,
      licensePrice: finalPrice
    };

    onSubmitOrder(orderData);
    setSubmittedOrder(orderData);
    setIsSubmitted(true);
  };

  const handleResetAndClose = () => {
    setIsSubmitted(false);
    setSubmittedOrder(null);
    setFormError('');
    onClose();
  };

  const studioPhone = settings?.contactPhone ? settings.contactPhone.replace(/[^0-9+]/g, '') : '+244947131590';
  const finalGenre = genre === 'Outro (Personalizado)' ? (customGenre.trim() || 'Personalizado') : genre;
  const finalDuration = beatDuration === 'Outra duração' ? (customDuration.trim() || '3:00 min') : beatDuration;

  const generateWhatsAppUrl = () => {
    const studioBrandName = settings?.studioName ? settings.studioName.toUpperCase() : 'OMNI SOUNDS';
    const text = `🎧 *ENCOMENDA DE BEAT PERSONALIZADO - ${studioBrandName}*

Olá Produtor Pascoal! Acabei de enviar uma encomenda de beat sob medida pelo site:

👤 *Cliente:* ${clientName}
📱 *WhatsApp:* ${clientPhone}
📧 *E-mail:* ${clientEmail.trim() || 'Não informado'}

📜 *Licença Escolhida:* ${getLicenseLabel(licenseType)}
💰 *Valor da Licença:* ${currentPrice.toLocaleString()} Kz

🎵 *Estilo / Gênero:* ${finalGenre}
⚡ *BPM Desejado:* ${bpm} BPM
⏱️ *Duração do Beat:* ${finalDuration}
🎯 *Música de Referência:* ${referenceSongName}
${referenceSongUrl ? `🔗 *Link da Referência:* ${referenceSongUrl}\n` : ''}🎤 *Possui gravação de voz/vocal:* ${hasVocal ? 'SIM (estou a enviar o áudio aqui em anexo)' : 'Não / Apenas instrumental'}
${notes ? `📝 *Observações / Ideias:* ${notes}\n` : ''}
${hasVocal ? '👉 *Segue em anexo a gravação de voz (vocal/acapella) para sincronizar o tom e ritmo.*\n' : ''}
Aguardo a vossa confirmação e proposta para darmos início à produção! Obrigado.`;

    return `https://api.whatsapp.com/send?phone=${encodeURIComponent(studioPhone)}&text=${encodeURIComponent(text)}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-2xl p-4 sm:p-7 relative shadow-2xl my-6 max-h-[92vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={handleResetAndClose}
          className="absolute top-4 right-4 text-zinc-400 hover:text-white p-1.5 rounded-xl hover:bg-zinc-900 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {isSubmitted ? (
          /* Confirmation Screen after submission */
          <div className="py-6 text-center space-y-5">
            <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center justify-center mx-auto text-amber-500 shadow-lg shadow-amber-500/10">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <div>
              <span className="text-[10px] font-mono font-bold text-amber-500 uppercase tracking-widest bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
                Pedido Registado com Sucesso
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-white mt-3">
                Sua Encomenda foi Enviada!
              </h3>
              <p className="text-zinc-400 text-xs sm:text-sm max-w-md mx-auto mt-2">
                Os dados da sua produção personalizada foram salvos. Para acelerar o início do seu beat, confirme os detalhes diretamente no nosso WhatsApp.
              </p>
            </div>

            {/* Receipt Summary Box */}
            <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4 text-left max-w-lg mx-auto space-y-2 text-xs">
              <div className="flex justify-between items-center pb-2 border-b border-zinc-800">
                <span className="text-zinc-400">Licença Selecionada:</span>
                <span className="font-bold text-amber-400">{getLicenseLabel(licenseType)}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-zinc-800">
                <span className="text-zinc-400">Valor da Licença:</span>
                <span className="font-bold text-white font-mono text-sm">{currentPrice.toLocaleString()} Kz</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-zinc-800">
                <span className="text-zinc-400">Estilo & BPM:</span>
                <span className="font-medium text-zinc-200">{finalGenre} • {bpm} BPM ({finalDuration})</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-zinc-400">Música de Referência:</span>
                <span className="font-medium text-zinc-200 truncate max-w-[200px]">{referenceSongName}</span>
              </div>
            </div>

            {/* Vocal Notice Reminder Box */}
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 text-left max-w-lg mx-auto">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-zinc-300 space-y-1">
                  <p className="font-bold text-amber-400">Lembrete Importante:</p>
                  <p className="text-zinc-300 leading-relaxed">
                    Se você possui uma <strong>gravação de voz, guia vocal ou acapella</strong>, envie o arquivo de áudio ou gravação de voz diretamente no WhatsApp da Omni Sounds logo a seguir para acertarmos a tonalidade exata.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
              <a
                href={generateWhatsAppUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs sm:text-sm px-6 py-3.5 rounded-xl transition-all shadow-lg shadow-emerald-500/15 flex items-center justify-center gap-2 cursor-pointer"
              >
                <MessageCircle className="w-4 h-4 fill-black" />
                <span>Conversar no WhatsApp Agora</span>
              </a>
              <button
                onClick={handleResetAndClose}
                className="bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-semibold text-xs sm:text-sm px-6 py-3.5 rounded-xl transition-colors cursor-pointer border border-zinc-800"
              >
                Fechar
              </button>
            </div>
          </div>
        ) : (
          /* Main Order Form */
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Modal Header */}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="p-1.5 bg-amber-500/10 rounded-lg text-amber-500 border border-amber-500/20">
                  <Sparkles className="w-4 h-4" />
                </div>
                <span className="text-[11px] font-mono font-bold text-amber-500 uppercase tracking-wider">
                  Produção Sob Medida
                </span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-white">
                Encomendar Beat Personalizado
              </h3>
              <p className="text-zinc-400 text-xs sm:text-sm mt-1">
                Crie um instrumental exclusivo construído do zero de acordo com a sua visão artística, ritmo e referências.
              </p>
            </div>

            {formError && (
              <div className="p-3 bg-red-950/60 border border-red-800/80 rounded-xl text-red-200 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {/* Step 1: License Selection & Pricing */}
            <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-xl p-4 space-y-3.5">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-amber-500 uppercase tracking-wider font-mono flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5" />
                  <span>1. Escolha a Licença Desejada *</span>
                </h4>
                <span className="text-[10px] font-mono text-zinc-400">
                  Total: <strong className="text-amber-400 font-bold">{currentPrice.toLocaleString()} Kz</strong>
                </span>
              </div>

              <div className="space-y-3">
                {/* MP3 License */}
                <div
                  onClick={() => handleSelectLicense('mp3')}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                    licenseType === 'mp3'
                      ? 'bg-amber-500/10 border-amber-500 ring-1 ring-amber-500/40'
                      : 'bg-zinc-900/70 border-zinc-800/90 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded-lg ${licenseType === 'mp3' ? 'bg-amber-500 text-black' : 'bg-zinc-800 text-amber-400'}`}>
                        <Music className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <span className="font-bold text-xs text-white block">Licença MP3 Sob Medida</span>
                        <span className="text-[10px] text-zinc-400">Áudio MP3 masterizado (320kbps)</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs text-amber-400">
                        {customPrices.mp3.toLocaleString()} Kz
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

                  <div className="flex items-center justify-between mt-2">
                    <p className="text-[10px] text-zinc-400">
                      Uso comercial padrão para streaming e redes sociais.
                    </p>
                    {!expandedLicenses.mp3 && (
                      <button
                        type="button"
                        onClick={(e) => handleToggleExpandLicense(e, 'mp3')}
                        className="text-[10px] text-amber-500/80 hover:text-amber-400 font-mono underline flex-shrink-0 ml-2"
                      >
                        Ver detalhes
                      </button>
                    )}
                  </div>

                  {/* Specific Details for MP3 Custom Beat shown when expanded */}
                  {expandedLicenses.mp3 && (
                    <div className="mt-3 pt-3 border-t border-zinc-800 space-y-1.5 text-[11px] bg-zinc-950/80 p-3 rounded-lg border border-zinc-800/60">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1">
                          <Shield className="w-3 h-3 text-amber-500" />
                          Termos & Direitos inclusos no Beat MP3 Sob Medida:
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
                        <span><strong>Direito de uso:</strong> Beat exclusivo produzido de acordo com a sua referência e estilo</span>
                      </div>
                      <div className="flex items-start gap-2 text-zinc-300">
                        <Check className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
                        <span><strong>Formato:</strong> Arquivo de áudio em formato MP3 (320kbps)</span>
                      </div>
                      <div className="flex items-start gap-2 text-zinc-300">
                        <Check className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
                        <span><strong>Distribuição em streaming:</strong> Até 5.000 reproduções comerciais</span>
                      </div>
                      <div className="flex items-start gap-2 text-zinc-300">
                        <Check className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
                        <span><strong>Autoria & Créditos:</strong> Uso com créditos de produção ao produtor</span>
                      </div>
                      <div className="flex items-start gap-2 text-zinc-300">
                        <Check className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
                        <span><strong>Entrega:</strong> Envio de prévia pelo WhatsApp/E-mail + entrega do arquivo final</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Premium License */}
                <div
                  onClick={() => handleSelectLicense('premium')}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all relative ${
                    licenseType === 'premium'
                      ? 'bg-amber-500/10 border-amber-500 ring-1 ring-amber-500/40 shadow-sm shadow-amber-500/10'
                      : 'bg-zinc-900/70 border-zinc-800/90 hover:border-zinc-700'
                  }`}
                >
                  <div className="absolute -top-2 right-3">
                    <span className="bg-amber-500 text-black text-[8px] font-mono font-extrabold uppercase px-1.5 py-0.2 rounded-full shadow">
                      Popular
                    </span>
                  </div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded-lg ${licenseType === 'premium' ? 'bg-amber-500 text-black' : 'bg-zinc-800 text-amber-400'}`}>
                        <Disc className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <span className="font-bold text-xs text-white block">Licença Premium (MP3 + WAV)</span>
                        <span className="text-[10px] text-zinc-400">WAV Master 24-bit/48kHz + MP3</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs text-amber-400">
                        {customPrices.premium.toLocaleString()} Kz
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

                  <div className="flex items-center justify-between mt-2">
                    <p className="text-[10px] text-zinc-400">
                      Lançamento comercial ilimitado, rádio e videoclipe oficial.
                    </p>
                    {!expandedLicenses.premium && (
                      <button
                        type="button"
                        onClick={(e) => handleToggleExpandLicense(e, 'premium')}
                        className="text-[10px] text-amber-500/80 hover:text-amber-400 font-mono underline flex-shrink-0 ml-2"
                      >
                        Ver detalhes
                      </button>
                    )}
                  </div>

                  {/* Specific Details for Premium Custom Beat shown when expanded */}
                  {expandedLicenses.premium && (
                    <div className="mt-3 pt-3 border-t border-zinc-800 space-y-1.5 text-[11px] bg-zinc-950/80 p-3 rounded-lg border border-zinc-800/60">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-400 block mb-1.5 flex items-center gap-1">
                          <Shield className="w-3 h-3 text-amber-500" />
                          Termos & Direitos inclusos no Beat Premium:
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
                        <span><strong>Direito de uso:</strong> Lançamento comercial em todas as plataformas digitais (Spotify, Apple Music, YouTube)</span>
                      </div>
                      <div className="flex items-start gap-2 text-zinc-300">
                        <Check className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
                        <span><strong>Formato:</strong> Arquivo MP3 320kbps + WAV Master sem perda (24-bit/48kHz)</span>
                      </div>
                      <div className="flex items-start gap-2 text-zinc-300">
                        <Check className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
                        <span><strong>Performances:</strong> Direitos para shows ao vivo, apresentações e videoclipe oficial</span>
                      </div>
                      <div className="flex items-start gap-2 text-zinc-300">
                        <Check className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
                        <span><strong>Revisões:</strong> Ajustes na estrutura ou arranjo do beat sob sua orientação</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Stems / Trackouts License */}
                <div
                  onClick={() => handleSelectLicense('stems')}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                    licenseType === 'stems'
                      ? 'bg-amber-500/10 border-amber-500 ring-1 ring-amber-500/40'
                      : 'bg-zinc-900/70 border-zinc-800/90 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded-lg ${licenseType === 'stems' ? 'bg-amber-500 text-black' : 'bg-zinc-800 text-amber-400'}`}>
                        <Layers className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <span className="font-bold text-xs text-white block">Licença Stems / Trackouts</span>
                        <span className="text-[10px] text-zinc-400">Pistas Separadas em WAV + Master</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs text-amber-400">
                        {customPrices.stems.toLocaleString()} Kz
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

                  <div className="flex items-center justify-between mt-2">
                    <p className="text-[10px] text-zinc-400">
                      Pistas individuais (808, bateria, synths, melodias) para mixagem livre.
                    </p>
                    {!expandedLicenses.stems && (
                      <button
                        type="button"
                        onClick={(e) => handleToggleExpandLicense(e, 'stems')}
                        className="text-[10px] text-amber-500/80 hover:text-amber-400 font-mono underline flex-shrink-0 ml-2"
                      >
                        Ver detalhes
                      </button>
                    )}
                  </div>

                  {/* Specific Details for Stems Custom Beat shown when expanded */}
                  {expandedLicenses.stems && (
                    <div className="mt-3 pt-3 border-t border-zinc-800 space-y-1.5 text-[11px] bg-zinc-950/80 p-3 rounded-lg border border-zinc-800/60">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-400 block mb-1.5 flex items-center gap-1">
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
                        <span><strong>Direito de uso:</strong> Liberdade total para mixar, cortar e alterar arranjos na sua DAW</span>
                      </div>
                      <div className="flex items-start gap-2 text-zinc-300">
                        <Check className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
                        <span><strong>Formato:</strong> Pistas individuais separadas (808, Bateria, Teclados, Samples, Efeitos)</span>
                      </div>
                      <div className="flex items-start gap-2 text-zinc-300">
                        <Check className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
                        <span><strong>Engenharia de Som:</strong> Perfeito para estúdios externos que desejam mixar a voz com canais abertos</span>
                      </div>
                      <div className="flex items-start gap-2 text-zinc-300">
                        <Check className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
                        <span><strong>Entrega:</strong> Pacote ZIP com todas as faixas organizadas e identificadas</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Exclusive + Mix License */}
                <div
                  onClick={() => handleSelectLicense('exclusive')}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all relative ${
                    licenseType === 'exclusive'
                      ? 'bg-amber-500/10 border-amber-500 ring-1 ring-amber-500/40'
                      : 'bg-zinc-900/70 border-zinc-800/90 hover:border-zinc-700'
                  }`}
                >
                  <div className="absolute -top-2 right-3">
                    <span className="bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[8px] font-mono font-extrabold uppercase px-1.5 py-0.2 rounded-full">
                      VIP
                    </span>
                  </div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded-lg ${licenseType === 'exclusive' ? 'bg-amber-500 text-black' : 'bg-zinc-800 text-amber-400'}`}>
                        <Sparkles className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <span className="font-bold text-xs text-white block">Licença Exclusivo + Mix Sob Medida</span>
                        <span className="text-[10px] text-zinc-400">100% Exclusivo + Mixagem & Master da sua Voz</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs text-amber-400">
                        {customPrices.exclusive.toLocaleString()} Kz
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

                  <div className="flex items-center justify-between mt-2">
                    <p className="text-[10px] text-zinc-400">
                      Exclusividade total + mix e masterização profissional da sua voz inclusa.
                    </p>
                    {!expandedLicenses.exclusive && (
                      <button
                        type="button"
                        onClick={(e) => handleToggleExpandLicense(e, 'exclusive')}
                        className="text-[10px] text-amber-500/80 hover:text-amber-400 font-mono underline flex-shrink-0 ml-2"
                      >
                        Ver detalhes
                      </button>
                    )}
                  </div>

                  {/* Specific Details for Exclusive Custom Beat shown when expanded */}
                  {expandedLicenses.exclusive && (
                    <div className="mt-3 pt-3 border-t border-zinc-800 space-y-1.5 text-[11px] bg-zinc-950/80 p-3 rounded-lg border border-zinc-800/60">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-400 block mb-1.5 flex items-center gap-1">
                          <Shield className="w-3 h-3 text-amber-500" />
                          Termos & Direitos inclusos na Licença Exclusiva + Mix:
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
                        <span><strong>Direito de uso:</strong> 100% Exclusivo. O instrumental nunca será vendido a outro artista</span>
                      </div>
                      <div className="flex items-start gap-2 text-zinc-300">
                        <Check className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
                        <span><strong>Serviço de Produção Inclusa:</strong> Mixagem e Masterização completa dos seus vocais no instrumental</span>
                      </div>
                      <div className="flex items-start gap-2 text-zinc-300">
                        <Check className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
                        <span><strong>Formato & Master:</strong> Stems completos WAV 24-bit + Master final pronta para rádio e TV</span>
                      </div>
                      <div className="flex items-start gap-2 text-zinc-300">
                        <Check className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
                        <span><strong>Monetização:</strong> Reproduções e transmissões 100% ilimitadas sem restrições</span>
                      </div>
                      <div className="flex items-start gap-2 text-zinc-300">
                        <Check className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
                        <span><strong>Acompanhamento VIP:</strong> Atendimento prioritário e direto com o produtor musical</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Step 2: Musical Characteristics */}
            <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-xl p-4 space-y-4">
              <h4 className="text-xs font-bold text-amber-500 uppercase tracking-wider font-mono flex items-center gap-1.5">
                <Disc className="w-3.5 h-3.5" />
                <span>2. Características do Beat</span>
              </h4>

              {/* Genre / Style Selection */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  Estilo / Gênero Musical *
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {GENRE_PRESETS.map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setGenre(g)}
                      className={`text-left px-3 py-2 rounded-lg text-xs font-medium transition-all border cursor-pointer ${
                        genre === g
                          ? 'bg-amber-500/15 border-amber-500 text-amber-400 font-bold ring-1 ring-amber-500/30'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
                {genre === 'Outro (Personalizado)' && (
                  <input
                    type="text"
                    placeholder="Especifique o seu estilo (ex: Afro-House, R&B Melódico, Indie, etc.)..."
                    value={customGenre}
                    onChange={(e) => setCustomGenre(e.target.value)}
                    className="w-full mt-2 bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2 text-zinc-200 text-xs focus:outline-none focus:border-amber-500/50"
                  />
                )}
              </div>

              {/* BPM and Duration Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {/* BPM */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                      <Sliders className="w-3.5 h-3.5 text-amber-500" />
                      <span>BPM (Andamento) *</span>
                    </label>
                    <span className="text-xs font-mono font-bold text-amber-400">{bpm} BPM</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min="60"
                      max="180"
                      value={bpm}
                      onChange={(e) => setBpm(e.target.value)}
                      className="w-full accent-amber-500 h-2 bg-zinc-800 rounded-lg cursor-pointer"
                    />
                    <input
                      type="number"
                      min="50"
                      max="220"
                      value={bpm}
                      onChange={(e) => setBpm(e.target.value)}
                      className="w-16 bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-1 text-center text-xs font-mono text-zinc-200 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div className="flex gap-1.5 mt-2 overflow-x-auto pb-1">
                    {['90', '110', '125', '130', '140', '150', '160'].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setBpm(preset)}
                        className={`px-2 py-0.5 text-[10px] font-mono rounded border transition-colors cursor-pointer ${
                          bpm === preset
                            ? 'bg-amber-500 text-black font-bold border-amber-500'
                            : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                        }`}
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Duration */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-amber-500" />
                    <span>Duração do Beat *</span>
                  </label>
                  <select
                    value={beatDuration}
                    onChange={(e) => setBeatDuration(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-200 text-xs focus:outline-none focus:border-amber-500/50"
                  >
                    {DURATION_PRESETS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                  {beatDuration === 'Outra duração' && (
                    <input
                      type="text"
                      placeholder="Ex: 5 minutos ou versão estendida..."
                      value={customDuration}
                      onChange={(e) => setCustomDuration(e.target.value)}
                      className="w-full mt-2 bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2 text-zinc-200 text-xs focus:outline-none focus:border-amber-500/50"
                    />
                  )}
                </div>
              </div>

              {/* Reference Song Name and URL */}
              <div className="space-y-3 pt-1 border-t border-zinc-800/60">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Nome da Música de Referência *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Travis Scott - Butterfly Effect ou Burna Boy - Last Last"
                    value={referenceSongName}
                    onChange={(e) => setReferenceSongName(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-zinc-200 text-xs focus:outline-none focus:border-amber-500/50 placeholder:text-zinc-600"
                  />
                  <p className="text-[10px] text-zinc-500 mt-1">
                    Diga qual música, artista ou atmosfera sonora serve de inspiração para a sua ideia.
                  </p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                      <LinkIcon className="w-3 h-3 text-zinc-400" />
                      <span>Link da Música de Referência</span>
                    </label>
                    <span className="text-[10px] font-mono text-zinc-500 uppercase bg-zinc-800/80 px-2 py-0.5 rounded">
                      Opcional
                    </span>
                  </div>
                  <input
                    type="url"
                    placeholder="Ex: https://youtube.com/watch?v=... ou link do Spotify / Soundcloud"
                    value={referenceSongUrl}
                    onChange={(e) => setReferenceSongUrl(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-zinc-200 text-xs focus:outline-none focus:border-amber-500/50 placeholder:text-zinc-600 font-mono text-[11px]"
                  />
                </div>
              </div>
            </div>

            {/* Step 3: Vocal and Extra Notes */}
            <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-xl p-4 space-y-3">
              <h4 className="text-xs font-bold text-amber-500 uppercase tracking-wider font-mono flex items-center gap-1.5">
                <Mic2 className="w-3.5 h-3.5" />
                <span>3. Gravação de Voz & Detalhes Adicionais</span>
              </h4>

              {/* Vocal checkbox / selector */}
              <div
                onClick={() => setHasVocal(!hasVocal)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                  hasVocal
                    ? 'bg-amber-500/10 border-amber-500/60 ring-1 ring-amber-500/30'
                    : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${hasVocal ? 'bg-amber-500 text-black' : 'bg-zinc-800 text-zinc-400'}`}>
                    <Mic2 className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-zinc-200">
                      Você já tem uma gravação de voz / vocal gravado para este beat?
                    </p>
                    <p className="text-[10px] text-zinc-400 mt-0.5">
                      Marque se já tiver um áudio de guia, acapella ou ideia gravada no telemóvel.
                    </p>
                  </div>
                </div>
                <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
                  hasVocal ? 'bg-amber-500 border-amber-500 text-black' : 'border-zinc-700 bg-zinc-800'
                }`}>
                  {hasVocal && <CheckCircle2 className="w-4 h-4 stroke-[3px]" />}
                </div>
              </div>

              {/* Extra Notes */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Observações Extras (Tom, Instrumentos específicos, Estrutura)
                </label>
                <textarea
                  rows={2}
                  placeholder="Ex: Quero um piano marcante na introdução, 808 agressivo no refrão, tom triste / melancólico..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2 text-zinc-200 text-xs focus:outline-none focus:border-amber-500/50 placeholder:text-zinc-600 resize-none"
                />
              </div>
            </div>

            {/* Step 4: Contact Info */}
            <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-xl p-4 space-y-3">
              <h4 className="text-xs font-bold text-amber-500 uppercase tracking-wider font-mono">
                4. Seus Dados de Contato
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-mono text-zinc-400 mb-1">Nome Completo *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Manuel Silva"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-200 text-xs focus:outline-none focus:border-amber-500/50"
                  />
                </div>
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-[11px] font-mono text-zinc-400">Gmail / E-mail</label>
                    <span className="text-[10px] text-zinc-500 font-mono">Opcional</span>
                  </div>
                  <input
                    type="email"
                    placeholder="Ex: manuel@gmail.com (opcional)"
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-200 text-xs focus:outline-none focus:border-amber-500/50"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-mono text-zinc-400 mb-1">WhatsApp / Telefone *</label>
                  <input
                    type="tel"
                    required
                    placeholder="Ex: +244 923 000 000"
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-200 text-xs focus:outline-none focus:border-amber-500/50"
                  />
                </div>
              </div>
            </div>

            {/* MANDATORY NOTICE AT THE BOTTOM */}
            <div className="bg-amber-500/10 border-2 border-amber-500/40 rounded-xl p-3.5 sm:p-4 text-left shadow-lg shadow-amber-500/5">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-amber-500/20 text-amber-400 rounded-lg flex-shrink-0 mt-0.5">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div className="space-y-1 text-xs">
                  <h5 className="font-bold text-amber-400 uppercase tracking-wider text-[11px] font-mono">
                    Comunicado Importante para a Produção
                  </h5>
                  <p className="text-zinc-200 leading-relaxed text-xs">
                    <strong>Se tiver uma gravação ou guia de voz (vocal / acapella)</strong>, você deve enviá-la diretamente no <strong>WhatsApp da Omni Sounds</strong> após o envio deste formulário para alinharmos a harmonia, tom e ritmo exatos do seu instrumental.
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={handleResetAndClose}
                className="flex-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 text-xs font-semibold py-3 rounded-xl transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex-2 bg-amber-500 hover:bg-amber-400 text-black text-xs sm:text-sm font-extrabold py-3 rounded-xl transition-all shadow-lg shadow-amber-500/15 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>Enviar Encomenda ({currentPrice.toLocaleString()} Kz)</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
