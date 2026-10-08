export interface BeatPurchase {
  id: string;
  beatId: string;
  beatTitle: string;
  licenseType: 'mp3' | 'premium' | 'stems' | 'exclusive' | 'basic' | string;
  pricePaid: number;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  timestamp: number;
  status: 'Pendente' | 'Concluído' | 'Cancelado';
}

export interface CustomBeatLicensePrices {
  mp3: number;
  premium: number;
  stems: number;
  exclusive: number;
}

export const DEFAULT_CUSTOM_BEAT_PRICES: CustomBeatLicensePrices = {
  mp3: 15000,
  premium: 25000,
  stems: 45000,
  exclusive: 75000
};

export interface CustomBeatOrder {
  id: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  genre: string; // estilo musical
  bpm: number | string; // BPM
  referenceSongName: string; // nome da música de referência
  referenceSongUrl?: string; // link da música de referência (opcional)
  beatDuration: string; // duração do beat
  hasVocal: boolean; // se tem vocal/gravação de voz para enviar
  notes?: string; // detalhes ou observações extras
  licenseType: 'mp3' | 'premium' | 'stems' | 'exclusive' | string; // Licença selecionada
  licensePrice: number; // Preço em Kz da licença escolhida
  timestamp: number;
  status: 'Pendente' | 'Em Produção' | 'Prévia Enviada' | 'Concluído' | 'Cancelado';
}

export interface Beat {
  id: string;
  title: string;
  producer: string;
  genre: string;
  bpm: number;
  key: string;
  // Preços configuráveis por licença para cada beat individual:
  priceBasic: number; // Fallback / Preço MP3
  pricePremium: number; // Preço Premium (MP3+WAV)
  priceMp3?: number; // Preço Licença MP3 específico
  priceStems?: number; // Preço Licença Stems/Trackouts específico
  priceExclusive?: number; // Preço Licença Exclusiva + Mix específico
  audioUrl?: string; // Can be a drive link or simulated audio synth
  coverUrl: string;
  tags: string[];
}

export function getBeatLicensePrice(beat: Beat, license: 'mp3' | 'premium' | 'stems' | 'exclusive' | string): number {
  switch (license) {
    case 'mp3':
      return beat.priceMp3 !== undefined && beat.priceMp3 !== null ? beat.priceMp3 : (beat.priceBasic || 4000);
    case 'premium':
      return beat.pricePremium !== undefined && beat.pricePremium !== null ? beat.pricePremium : 7000;
    case 'stems':
      return beat.priceStems !== undefined && beat.priceStems !== null
        ? beat.priceStems
        : (beat.pricePremium ? Math.round(beat.pricePremium * 1.4) : 10000);
    case 'exclusive':
      return beat.priceExclusive !== undefined && beat.priceExclusive !== null
        ? beat.priceExclusive
        : (beat.pricePremium ? Math.round(beat.pricePremium * 2.2) : 15000);
    default:
      return beat.pricePremium || 7000;
  }
}

export interface StudioSession {
  id: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  serviceType: 'Gravação' | 'Mixagem' | 'Masterização' | 'Produção Completa';
  date: string;
  timeSlot: string;
  notes?: string;
  status: 'Pendente' | 'Confirmado' | 'Concluído';
  estimatedCost: number;
}

export interface StudioProject {
  id: string;
  title: string;
  artist: string;
  type: string;
  youtubeId: string; // YouTube video ID or full link
  driveFolderUrl?: string; // Google drive delivery folder link
  spotifyUrl?: string;
  instagramUrl?: string;
  coverImage: string;
  releaseDate: string;
}

export interface StudioHourlyRates {
  recordingPerHour: number; // Preço fixo por cada 1h de gravação de voz / instrumentos
  mixingPerSong?: number; // Preço de mixagem
  masteringPerSong?: number; // Preço de masterização
  fullProductionPerSong?: number; // Preço produção completa
}

export const DEFAULT_STUDIO_RATES: StudioHourlyRates = {
  recordingPerHour: 30000,
  mixingPerSong: 80000,
  masteringPerSong: 40000,
  fullProductionPerSong: 250000
};

export interface StudioSettings {
  studioName: string;
  slogan: string;
  aboutText: string;
  contactEmail: string;
  contactPhone: string;
  instagramUrl: string;
  youtubeUrl: string;
  drivePortfolioUrl: string;
  address: string;
  logoUrl?: string; // URL da imagem do logotipo oficial (Google Drive ou link web)
  customBeatPrices?: CustomBeatLicensePrices;
  studioRates?: StudioHourlyRates;
}

export function transformGoogleDriveUrl(url: string): string {
  if (!url) return '';
  
  let fileId = '';
  const dPattern = /\/d\/([a-zA-Z0-9_-]+)/;
  const idPattern = /[?&]id=([a-zA-Z0-9_-]+)/;
  
  const dMatch = url.match(dPattern);
  if (dMatch && dMatch[1]) {
    fileId = dMatch[1];
  } else {
    const idMatch = url.match(idPattern);
    if (idMatch && idMatch[1]) {
      fileId = idMatch[1];
    }
  }
  
  if (fileId) {
    return `https://drive.google.com/thumbnail?id=${fileId}&sz=w1200`;
  }
  
  return url;
}

export function transformGoogleDriveAudioUrl(url: string): string {
  if (!url) return '';
  
  let fileId = '';
  const dPattern = /\/d\/([a-zA-Z0-9_-]+)/;
  const idPattern = /[?&]id=([a-zA-Z0-9_-]+)/;
  const openPattern = /\/open\?id=([a-zA-Z0-9_-]+)/;
  const ucPattern = /uc\?id=([a-zA-Z0-9_-]+)/;
  
  const dMatch = url.match(dPattern);
  const idMatch = url.match(idPattern);
  const openMatch = url.match(openPattern);
  const ucMatch = url.match(ucPattern);
  
  if (dMatch && dMatch[1]) {
    fileId = dMatch[1];
  } else if (idMatch && idMatch[1]) {
    fileId = idMatch[1];
  } else if (openMatch && openMatch[1]) {
    fileId = openMatch[1];
  } else if (ucMatch && ucMatch[1]) {
    fileId = ucMatch[1];
  }
  
  if (fileId) {
    return `https://docs.google.com/uc?export=download&id=${fileId}`;
  }
  
  return url;
}

