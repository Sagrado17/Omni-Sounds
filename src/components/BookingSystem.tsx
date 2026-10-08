import React, { useState } from 'react';
import { Calendar, Clock, User, Mail, Phone, FileText, CheckCircle2, History, AlertCircle, Sparkles } from 'lucide-react';
import { StudioSession, StudioSettings, DEFAULT_STUDIO_RATES } from '../types';

interface BookingSystemProps {
  onAddBooking: (booking: Omit<StudioSession, 'id' | 'status'>) => void;
  myBookings: StudioSession[];
  settings?: StudioSettings;
}

const TIME_SLOTS = [
  'Manhã (09:00 - 13:00)',
  'Tarde (14:00 - 18:00)',
  'Noite (19:00 - 23:00)'
];

function BookingStatusBadge({ status }: { status: StudioSession['status'] }) {
  if (status === 'Confirmado') {
    return (
      <span
        className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-sm"
        title="Agendamento confirmado pela equipe"
      >
        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
        <span>Confirmado</span>
      </span>
    );
  }

  if (status === 'Concluído') {
    return (
      <span
        className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-blue-500/15 text-blue-400 border border-blue-500/30 shadow-sm"
        title="Sessão concluída com sucesso"
      >
        <Sparkles className="w-3 h-3 text-blue-400" />
        <span>Concluído</span>
      </span>
    );
  }

  // Default: Pendente
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30 shadow-sm"
      title="Aguardando confirmação do estúdio"
    >
      <span className="relative flex h-1.5 w-1.5">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-500"></span>
      </span>
      <span>Pendente</span>
    </span>
  );
}

export default function BookingSystem({ onAddBooking, myBookings, settings }: BookingSystemProps) {
  const rates = settings?.studioRates || DEFAULT_STUDIO_RATES;
  const recordingPerHour = rates.recordingPerHour || 30000;
  const mixingPerSong = rates.mixingPerSong || 80000;
  const masteringPerSong = rates.masteringPerSong || 40000;
  const fullProductionPerSong = rates.fullProductionPerSong || 250000;

  const services = [
    { 
      name: 'Gravação de Voz/Instrumento', 
      rate: `${recordingPerHour.toLocaleString()} KZ / hora`, 
      type: 'Gravação', 
      basePrice: recordingPerHour, 
      isHourly: true 
    },
    { 
      name: 'Mixagem Digital', 
      rate: `${mixingPerSong.toLocaleString()} KZ / música`, 
      type: 'Mixagem', 
      basePrice: mixingPerSong, 
      isHourly: false 
    },
    { 
      name: 'Masterização Digital', 
      rate: `${masteringPerSong.toLocaleString()} KZ / música`, 
      type: 'Masterização', 
      basePrice: masteringPerSong, 
      isHourly: false 
    },
    { 
      name: 'Produção Completa de Faixa', 
      rate: `${fullProductionPerSong.toLocaleString()} KZ / faixa`, 
      type: 'Produção Completa', 
      basePrice: fullProductionPerSong, 
      isHourly: false 
    },
  ];

  const [formData, setFormData] = useState({
    clientName: '',
    clientEmail: '',
    clientPhone: '',
    serviceType: 'Gravação' as StudioSession['serviceType'],
    date: '',
    timeSlot: TIME_SLOTS[0],
    notes: '',
    hours: 2, // Default hours if recording
  });

  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [error, setError] = useState('');

  // Calculate dynamic price based on configured per-hour price
  const calculateEstimate = () => {
    const selectedService = services.find(s => s.type === formData.serviceType);
    if (!selectedService) return 0;
    if (selectedService.isHourly) {
      return recordingPerHour * (formData.hours || 1);
    }
    return selectedService.basePrice;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'hours' ? Math.max(1, Math.min(12, Number(value) || 1)) : value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.clientName || !formData.clientPhone || !formData.date) {
      setError('Por favor, preencha os campos obrigatórios (Nome, WhatsApp e Data).');
      return;
    }

    // Verify booking date is in the future
    const today = new Date();
    today.setHours(0,0,0,0);
    const selectedDate = new Date(formData.date);
    if (selectedDate < today) {
      setError('Por favor, selecione uma data futura para sua sessão.');
      return;
    }

    onAddBooking({
      clientName: formData.clientName,
      clientEmail: formData.clientEmail.trim() || '',
      clientPhone: formData.clientPhone,
      serviceType: formData.serviceType,
      date: formData.date,
      timeSlot: formData.timeSlot,
      notes: formData.notes,
      estimatedCost: calculateEstimate()
    });

    setBookingSuccess(true);
    // Reset form except customer info for convenience
    setFormData(prev => ({
      ...prev,
      date: '',
      notes: '',
    }));

    setTimeout(() => {
      setBookingSuccess(false);
    }, 5000);
  };

  return (
    <div id="booking-section" className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
      {/* Form Container */}
      <div className="lg:col-span-2 bg-zinc-950/90 border border-zinc-900 rounded-2xl p-4 sm:p-6 md:p-8 relative overflow-hidden">
        <h3 className="text-lg sm:text-xl font-bold text-white mb-1">Solicitar Agendamento</h3>
        <p className="text-zinc-400 text-xs sm:text-sm mb-4 sm:mb-6">Selecione o serviço ideal e reserve seu horário no nosso Sound Lab.</p>

        {error && (
          <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-red-950/50 border border-red-900/60 rounded-xl flex items-center gap-2.5 text-red-200 text-xs sm:text-sm">
            <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {bookingSuccess && (
          <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-emerald-950/50 border border-emerald-900/60 rounded-xl flex items-start gap-2.5 text-emerald-200 text-xs sm:text-sm animate-fade-in">
            <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 mt-0.5 text-emerald-400" />
            <div>
              <p className="font-bold">Solicitação de agendamento enviada!</p>
              <p className="text-xs text-emerald-300/85 mt-1">Sua sessão foi registrada e adicionada à lista local abaixo. Nossa equipe entrará em contato para confirmar.</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
          {/* Service & Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-[11px] sm:text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-1.5 sm:mb-2">
                Serviço Desejado
              </label>
              <select
                name="serviceType"
                value={formData.serviceType}
                onChange={handleInputChange}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 text-zinc-200 text-xs sm:text-sm focus:outline-none focus:border-amber-500/50"
              >
                <option value="Gravação">Gravação de Voz/Instrumentos ({recordingPerHour.toLocaleString()} KZ / hora)</option>
                <option value="Mixagem">Mixagem Digital de Pistas ({mixingPerSong.toLocaleString()} KZ / música)</option>
                <option value="Masterização">Masterização Digital ({masteringPerSong.toLocaleString()} KZ / música)</option>
                <option value="Produção Completa">Produção Completa de Faixa ({fullProductionPerSong.toLocaleString()} KZ / faixa)</option>
              </select>
            </div>

            {formData.serviceType === 'Gravação' && (
              <div>
                <div className="flex justify-between items-center mb-1.5 sm:mb-2">
                  <label className="block text-[11px] sm:text-xs font-semibold text-zinc-400 uppercase tracking-widest">
                    Duração Estimada (Horas)
                  </label>
                  <span className="text-[10px] font-mono text-amber-400 font-bold">
                    {recordingPerHour.toLocaleString()} KZ / h
                  </span>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    name="hours"
                    min="1"
                    max="12"
                    value={formData.hours}
                    onChange={handleInputChange}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 text-zinc-200 text-xs sm:text-sm focus:outline-none focus:border-amber-500/50 font-mono"
                  />
                  <span className="absolute right-3 top-2 sm:top-2.5 text-xs text-zinc-500 font-mono">
                    {formData.hours} {formData.hours === 1 ? 'hora' : 'horas'} = {(recordingPerHour * formData.hours).toLocaleString()} KZ
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Date & Time Slot */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-[11px] sm:text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-1.5 sm:mb-2 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-amber-500" />
                <span>Data</span>
              </label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleInputChange}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 text-zinc-200 text-xs sm:text-sm focus:outline-none focus:border-amber-500/50 font-mono"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] sm:text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-1.5 sm:mb-2 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-500" />
                <span>Período do Dia</span>
              </label>
              <select
                name="timeSlot"
                value={formData.timeSlot}
                onChange={handleInputChange}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 text-zinc-200 text-xs sm:text-sm focus:outline-none focus:border-amber-500/50"
              >
                {TIME_SLOTS.map(slot => (
                  <option key={slot} value={slot}>{slot}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="h-px bg-zinc-900 my-1 sm:my-2" />

          {/* Contact Details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
            <div>
              <label className="block text-[11px] sm:text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-1.5 sm:mb-2 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-amber-500" />
                <span>Seu Nome *</span>
              </label>
              <input
                type="text"
                name="clientName"
                placeholder="Ex: Gabriel Santos"
                value={formData.clientName}
                onChange={handleInputChange}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 text-zinc-200 text-xs sm:text-sm focus:outline-none focus:border-amber-500/50"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] sm:text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-1.5 sm:mb-2 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-amber-500" />
                  <span>Gmail / E-mail</span>
                </span>
                <span className="text-[10px] text-zinc-500 font-mono font-normal">Opcional</span>
              </label>
              <input
                type="email"
                name="clientEmail"
                placeholder="Ex: seu-nome@gmail.com (opcional)"
                value={formData.clientEmail}
                onChange={handleInputChange}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 text-zinc-200 text-xs sm:text-sm focus:outline-none focus:border-amber-500/50 font-mono"
              />
            </div>

            <div>
              <label className="block text-[11px] sm:text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-1.5 sm:mb-2 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-amber-500" />
                <span>WhatsApp / Telemóvel *</span>
              </label>
              <input
                type="tel"
                name="clientPhone"
                placeholder="Ex: +244 923 000 000"
                value={formData.clientPhone}
                onChange={handleInputChange}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 text-zinc-200 text-xs sm:text-sm focus:outline-none focus:border-amber-500/50 font-mono"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] sm:text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-1.5 sm:mb-2 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-amber-500" />
              <span>Instruções Especiais / Referências</span>
            </label>
            <textarea
              name="notes"
              rows={3}
              placeholder="Fale um pouco sobre a sua música, referências artísticas, link do Google Drive com guias ou instrumentos, etc..."
              value={formData.notes}
              onChange={handleInputChange}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 text-zinc-200 text-xs sm:text-sm focus:outline-none focus:border-amber-500/50 resize-none"
            />
          </div>

          {/* Pricing estimation widget */}
          <div className="bg-gradient-to-r from-zinc-900 to-black p-5 rounded-xl border border-zinc-800/80 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <span className="text-[10px] uppercase tracking-widest text-amber-500 font-mono font-semibold">Orçamento Estimado</span>
              <p className="text-2xl font-mono font-bold text-white mt-0.5">
                {calculateEstimate().toLocaleString()} KZ
              </p>
              <p className="text-[11px] text-zinc-500 mt-1">
                *O valor final pode variar de acordo com horas adicionais e complexidade.
              </p>
            </div>
            <button
              type="submit"
              className="w-full sm:w-auto bg-amber-500 hover:bg-amber-400 text-black font-bold px-6 py-3 rounded-xl transition-all shadow-lg shadow-amber-500/10 text-sm"
            >
              Confirmar Agendamento
            </button>
          </div>
        </form>
      </div>

      {/* Booking Side History Panel */}
      <div className="bg-zinc-950/40 border border-zinc-900/60 rounded-2xl p-6 relative flex flex-col h-full">
        <h3 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
          <History className="w-5 h-5 text-amber-500" />
          Seus Agendamentos
        </h3>
        <p className="text-zinc-500 text-xs mb-6">Abaixo estão listadas as sessões reservadas neste navegador.</p>

        <div className="flex-1 space-y-4 overflow-y-auto max-h-[420px] pr-1">
          {myBookings.length > 0 ? (
            myBookings.map(booking => (
              <div
                key={booking.id}
                className="bg-black/50 border border-zinc-900/80 rounded-xl p-4 flex flex-col gap-2 relative group hover:border-zinc-800 transition-colors"
              >
                <div className="flex justify-between items-start">
                  <span className="text-xs bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded font-medium">
                    {booking.serviceType}
                  </span>
                  <span className="text-[11px] text-zinc-500 font-mono">
                    {booking.date}
                  </span>
                </div>
                <h4 className="font-bold text-zinc-200 text-sm">{booking.clientName}</h4>
                <p className="text-zinc-400 text-xs truncate">{booking.timeSlot}</p>
                <div className="flex justify-between items-center mt-2 pt-2 border-t border-zinc-900/80 text-[11px]">
                  <span className="font-mono text-amber-500/90 font-bold">{booking.estimatedCost.toLocaleString()} KZ</span>
                  <BookingStatusBadge status={booking.status} />
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-16 flex flex-col items-center justify-center border border-dashed border-zinc-800 rounded-xl bg-black/20">
              <Calendar className="w-8 h-8 text-zinc-700 mb-2" />
              <p className="text-zinc-500 text-xs max-w-[180px]">Nenhum agendamento realizado até o momento.</p>
            </div>
          )}
        </div>

        {/* Status Legend */}
        {myBookings.length > 0 && (
          <div className="mt-4 pt-3 border-t border-zinc-900 flex flex-wrap items-center justify-between gap-2 text-[10px] text-zinc-400 font-mono">
            <span className="text-zinc-500 font-medium">Legenda:</span>
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1 text-amber-400">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                Pendente
              </span>
              <span className="inline-flex items-center gap-1 text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                Confirmado
              </span>
              <span className="inline-flex items-center gap-1 text-blue-400">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                Concluído
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
