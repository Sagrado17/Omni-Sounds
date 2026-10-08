import React from 'react';
import { Check, Music, Layers, Sparkles, Shield, Disc, ArrowRight } from 'lucide-react';

export interface PricingPlan {
  id: 'mp3' | 'premium' | 'stems' | 'exclusive';
  option: string;
  badge?: string;
  popular?: boolean;
  receives: string;
  usageRights: string;
  icon: React.ComponentType<{ className?: string }>;
  features: string[];
}

export const PRICING_TIERS: PricingPlan[] = [
  {
    id: 'mp3',
    option: 'Licença MP3',
    receives: 'Beat em MP3 Masterizado (320kbps)',
    usageRights: 'Uso comercial básico conforme contrato',
    icon: Music,
    features: [
      'Direito de uso: Uso comercial conforme contrato',
      'Arquivo de áudio em formato MP3 (320kbps)',
      'Distribuição em streaming até 5.000 reproduções',
      'Uso não-exclusivo com créditos ao produtor',
      'Liberação rápida por link protegido'
    ]
  },
  {
    id: 'premium',
    option: 'Licença Premium (MP3 + WAV)',
    badge: 'Mais Popular',
    popular: true,
    receives: 'MP3 + Arquivo WAV Master (24-bit / 48kHz)',
    usageRights: 'Lançamento comercial em todas as plataformas',
    icon: Disc,
    features: [
      'Direito de uso: Pode lançar música comercialmente',
      'Arquivo MP3 + WAV Master sem compressão (24-bit/48kHz)',
      'Direitos de apresentação ao vivo e videoclipe oficial',
      'Entrega de alta fidelidade para estúdio de gravação'
    ]
  },
  {
    id: 'stems',
    option: 'Licença Stems / Trackouts',
    receives: 'Cada instrumento separado em pistas WAV',
    usageRights: 'Mais liberdade para mixar, cortar e editar arranjos',
    icon: Layers,
    features: [
      'Direito de uso: Liberdade total para mixagem e edição',
      'Pistas individuais separadas (Bateria, 808, Melodia, FX, Synths)',
      'Ajuste total de equilíbrio e arranjo na sua DAW',
      'Arquivos WAV organizados em ZIP + Contrato de licença estendida'
    ]
  },
  {
    id: 'exclusive',
    option: 'Licença Exclusiva + Mix Profissional',
    badge: 'Tratamento VIP',
    receives: 'Beat exclusivo + tratamento e mixagem da música',
    usageRights: 'Exclusividade total + serviço de produção de engenharia',
    icon: Sparkles,
    features: [
      'Direito de uso: 100% Exclusivo (o beat é retirado da loja)',
      'Tratamento e mixagem profissional da sua voz com o instrumental',
      'Stems completos + masterização final pronta para rádio e streaming',
      'Monetização e reproduções ilimitadas em todas as plataformas',
      'Suporte direto de engenharia de som do Omni Sounds'
    ]
  }
];

interface PricingTableProps {
  onSelectOption?: (optionId: string) => void;
  title?: string;
  subtitle?: string;
  showContactAction?: boolean;
  onContactClick?: () => void;
}

export default function PricingTable({
  onSelectOption,
  title = "Tabela de Licenças de Beats",
  subtitle = "Transparência total nos direitos de uso, formatos de entrega e limites de reprodução para cada tipo de licença.",
  showContactAction = false,
  onContactClick
}: PricingTableProps) {
  return (
    <div className="w-full space-y-6">
      {/* Header Info */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full text-amber-500 text-[10px] font-bold uppercase tracking-widest font-mono">
          <Shield className="w-3.5 h-3.5" />
          <span>Licenciamento Oficial Omni Sounds</span>
        </div>
        <h3 className="text-xl sm:text-2xl font-bold text-white font-sans tracking-tight">
          {title}
        </h3>
        <p className="text-zinc-400 text-xs sm:text-sm max-w-xl mx-auto">
          {subtitle}
        </p>
      </div>

      {/* Desktop / Tablet Structured Table View (Without Prices) */}
      <div className="hidden md:block bg-zinc-950/80 border border-zinc-900 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-900 bg-zinc-900/60 text-[11px] font-mono uppercase tracking-wider text-zinc-400">
                <th className="py-4 px-6 font-semibold w-1/4">Licença / Opção</th>
                <th className="py-4 px-6 font-semibold w-1/3">O que recebe (Arquivos & Formatos)</th>
                <th className="py-4 px-6 font-semibold w-5/12">Direitos de Uso & Condições</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-900/70 text-xs">
              {PRICING_TIERS.map((tier) => {
                const IconComponent = tier.icon;
                return (
                  <tr
                    key={tier.id}
                    className={`transition-colors hover:bg-zinc-900/40 ${
                      tier.popular ? 'bg-amber-500/[0.03]' : ''
                    }`}
                  >
                    {/* Option Column */}
                    <td className="py-5 px-6 align-top">
                      <div className="flex items-start gap-3">
                        <div
                          className={`p-2.5 rounded-xl border flex-shrink-0 ${
                            tier.popular
                              ? 'bg-amber-500 text-black border-amber-400 shadow-md shadow-amber-500/20'
                              : 'bg-zinc-900 text-amber-500 border-zinc-800'
                          }`}
                        >
                          <IconComponent className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-sm text-white font-sans">{tier.option}</span>
                            {tier.badge && (
                              <span className="text-[9px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
                                {tier.badge}
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] font-mono text-zinc-500 block mt-0.5">
                            ID: #{tier.id}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* What you receive Column */}
                    <td className="py-5 px-6 align-top">
                      <div className="font-semibold text-zinc-200 text-xs mb-2">
                        {tier.receives}
                      </div>
                      <div className="space-y-1.5">
                        {tier.features.slice(1, 3).map((feat, idx) => (
                          <div key={idx} className="flex items-start gap-1.5 text-[11px] text-zinc-400">
                            <Check className="w-3.5 h-3.5 text-amber-500/90 flex-shrink-0 mt-0.5" />
                            <span>{feat}</span>
                          </div>
                        ))}
                      </div>
                    </td>

                    {/* Usage rights Column */}
                    <td className="py-5 px-6 align-top">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-amber-400/90 font-medium text-xs mb-2">
                        <Shield className="w-3 h-3 text-amber-500 flex-shrink-0" />
                        <span>{tier.usageRights}</span>
                      </div>
                      <div className="space-y-1.5">
                        {tier.features.filter((_, idx) => idx !== 1 && idx !== 2).map((feat, idx) => (
                          <div key={idx} className="flex items-start gap-1.5 text-[11px] text-zinc-400">
                            <Check className="w-3.5 h-3.5 text-amber-500/90 flex-shrink-0 mt-0.5" />
                            <span>{feat}</span>
                          </div>
                        ))}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card-Based Grid View (Without Prices) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:hidden">
        {PRICING_TIERS.map((tier) => {
          const IconComponent = tier.icon;
          return (
            <div
              key={tier.id}
              className={`bg-zinc-950 border rounded-2xl p-5 flex flex-col justify-between relative transition-all ${
                tier.popular
                  ? 'border-amber-500/60 shadow-lg shadow-amber-500/5 bg-gradient-to-b from-zinc-950 via-zinc-950 to-amber-950/10'
                  : 'border-zinc-900 hover:border-zinc-800'
              }`}
            >
              {tier.badge && (
                <div className="absolute -top-3 right-4">
                  <span className="bg-amber-500 text-black text-[10px] font-bold font-mono uppercase tracking-wider px-2.5 py-0.5 rounded-full shadow-md">
                    {tier.badge}
                  </span>
                </div>
              )}

              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className={`p-2.5 rounded-xl border flex-shrink-0 ${
                      tier.popular
                        ? 'bg-amber-500 text-black border-amber-400'
                        : 'bg-zinc-900 text-amber-500 border-zinc-800'
                    }`}
                  >
                    <IconComponent className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm">{tier.option}</h4>
                    <span className="text-[10px] font-mono text-zinc-500 block">
                      #{tier.id}
                    </span>
                  </div>
                </div>

                <div className="space-y-2.5 my-3 pt-3 border-t border-zinc-900">
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 block">
                      O que recebe:
                    </span>
                    <p className="text-xs font-semibold text-zinc-200 mt-0.5">
                      {tier.receives}
                    </p>
                  </div>

                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 block">
                      Direito de uso:
                    </span>
                    <p className="text-xs text-amber-400/90 font-medium mt-0.5">
                      {tier.usageRights}
                    </p>
                  </div>

                  <ul className="space-y-1.5 pt-2 border-t border-zinc-900/60 text-[11px] text-zinc-400">
                    {tier.features.map((feat, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <Check className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {showContactAction && (
        <div className="text-center pt-2">
          <button
            onClick={onContactClick}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-zinc-900 hover:bg-amber-500 hover:text-black text-zinc-300 font-mono text-xs font-bold rounded-xl border border-zinc-800 hover:border-amber-500 transition-all cursor-pointer"
          >
            <span>Falar com o Produtor para Licenciamento Customizado</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
