import React from 'react';
import { Type, Sparkles, Check, Sliders } from 'lucide-react';

export type FontStyleType = 'modern' | 'urban' | 'cyber' | 'elegant' | 'street';

export interface FontOption {
  id: FontStyleType;
  name: string;
  category: string;
  headingFont: string;
  bodyFont: string;
  preview: string;
  description: string;
}

export const FONT_OPTIONS: FontOption[] = [
  {
    id: 'modern',
    name: 'Modern Studio (Padrão)',
    category: 'Clean & Tech',
    headingFont: 'Space Grotesk',
    bodyFont: 'Inter',
    preview: 'OMNI SOUNDS',
    description: 'Visual moderno, equilibrado e tecnológico.'
  },
  {
    id: 'urban',
    name: 'Urban Trap & Drill',
    category: 'Vibrante & Ousado',
    headingFont: 'Syne',
    bodyFont: 'Outfit',
    preview: 'OMNI SOUNDS',
    description: 'Tipografia artística e marcante de produtores urbanos.'
  },
  {
    id: 'cyber',
    name: 'Cyber Synth Pro',
    category: 'Futurista & Digital',
    headingFont: 'Orbitron',
    bodyFont: 'JetBrains Mono',
    preview: 'OMNI SOUNDS',
    description: 'Estilo workstation digital e interfaces sintetizadas.'
  },
  {
    id: 'elegant',
    name: 'R&B / Soul Elegante',
    category: 'Sofisticado & Editorial',
    headingFont: 'Playfair Display',
    bodyFont: 'Plus Jakarta Sans',
    preview: 'Omni Sounds',
    description: 'Serifas refinadas com calor e prestígio acústico.'
  },
  {
    id: 'street',
    name: 'Street Heavy',
    category: 'Forte & Condensado',
    headingFont: 'Oswald',
    bodyFont: 'Inter',
    preview: 'OMNI SOUNDS',
    description: 'Impacto visual com letras condensadas e imponentes.'
  }
];

interface FontSwitcherProps {
  currentFont: FontStyleType;
  onSelectFont: (font: FontStyleType) => void;
  isOpen?: boolean;
  onClose?: () => void;
}

export default function FontSwitcher({
  currentFont,
  onSelectFont,
  isOpen,
  onClose
}: FontSwitcherProps) {
  // If isOpen is explicitly passed and is false, don't render
  if (isOpen === false) return null;

  const content = (
    <div className="space-y-2.5 overflow-y-auto pr-1 flex-1 max-h-[60vh]">
      {FONT_OPTIONS.map((font) => {
        const isSelected = currentFont === font.id;
        return (
          <div
            key={font.id}
            onClick={() => {
              onSelectFont(font.id);
            }}
            className={`p-3 rounded-xl border cursor-pointer transition-all ${
              isSelected
                ? 'bg-amber-500/10 border-amber-500 shadow-md shadow-amber-500/5 ring-1 ring-amber-500/40'
                : 'bg-zinc-900/40 border-zinc-800/80 hover:border-zinc-700 hover:bg-zinc-900/70'
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold text-white font-heading truncate">
                    {font.name}
                  </span>
                  <span className="text-[9px] bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded font-mono">
                    {font.category}
                  </span>
                </div>

                {/* Preview box */}
                <div className="bg-zinc-950/80 border border-zinc-900 rounded-lg px-2.5 py-1.5 my-1.5 flex items-center justify-between">
                  <span
                    className={`text-xs sm:text-sm font-bold text-amber-500 ${
                      font.id === 'modern' ? 'font-sans' :
                      font.id === 'urban' ? 'font-style-urban' :
                      font.id === 'cyber' ? 'font-style-cyber' :
                      font.id === 'elegant' ? 'font-style-elegant' : 'font-style-street'
                    }`}
                  >
                    {font.preview}
                  </span>
                  <span className="text-[9px] text-zinc-500 font-mono">
                    {font.headingFont} + {font.bodyFont}
                  </span>
                </div>

                <p className="text-[10px] text-zinc-400 leading-tight">
                  {font.description}
                </p>
              </div>

              <div className="pt-1">
                {isSelected ? (
                  <div className="w-5 h-5 rounded-full bg-amber-500 text-black flex items-center justify-center flex-shrink-0">
                    <Check className="w-3.5 h-3.5 stroke-[3px]" />
                  </div>
                ) : (
                  <div className="w-5 h-5 rounded-full border border-zinc-700 flex-shrink-0" />
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );

  // If used as a standalone modal (isOpen and onClose provided)
  if (isOpen !== undefined && onClose) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-md p-4 sm:p-6 relative shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-zinc-900 mb-3 sm:mb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-500">
                <Type className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-white font-heading">
                  Estilo de Letra (Tipografia)
                </h3>
                <p className="text-[10px] sm:text-xs text-zinc-400">
                  Personalize a fonte e atmosfera de todo o Omni Sounds
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-zinc-500 hover:text-white p-1 rounded-lg hover:bg-zinc-900 transition-colors cursor-pointer text-xs"
            >
              ✕
            </button>
          </div>

          {/* Options List */}
          {content}

          {/* Footer */}
          <div className="pt-3 sm:pt-4 border-t border-zinc-900 mt-3 sm:mt-4 flex justify-end">
            <button
              onClick={onClose}
              className="w-full sm:w-auto bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-amber-500/10 cursor-pointer text-center"
            >
              Aplicar & Fechar
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Otherwise return inline content
  return content;
}
