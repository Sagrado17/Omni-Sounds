import React, { useState, useEffect } from 'react';
import { 
  Music, Radio, Calendar, FolderOpen, Instagram, Youtube, Phone, Mail, MapPin, 
  ChevronRight, Disc, Play, Pause, Download, Volume2, Shield, Sparkles, Award,
  LogIn, LogOut, User, X, Plus, ArrowLeft, Type, Clock, Lock, ShieldCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { 
  collection, 
  doc, 
  onSnapshot, 
  setDoc, 
  deleteDoc, 
  getDoc, 
  getDocFromServer 
} from 'firebase/firestore';
import { auth, googleProvider, db } from './firebase';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Import Types and Components
import { Beat, StudioSession, StudioProject, StudioSettings, BeatPurchase, CustomBeatOrder, transformGoogleDriveUrl, transformGoogleDriveAudioUrl, DEFAULT_CUSTOM_BEAT_PRICES, DEFAULT_STUDIO_RATES, getBeatLicensePrice } from './types';
import BeatStore from './components/BeatStore';
import BookingSystem from './components/BookingSystem';
import Portfolio from './components/Portfolio';
import AdminPanel from './components/AdminPanel';
import PricingTable from './components/PricingTable';
import FontSwitcher, { FontStyleType } from './components/FontSwitcher';
import CustomBeatOrderModal from './components/CustomBeatOrderModal';

// Default static images (using the high-quality generated assets!)
// @ts-ignore
import HERO_BG from './assets/images/aegis_hero_banner_1783897073632.jpg';
// @ts-ignore
import BEAT_COVER_DEFAULT from './assets/images/aegis_beat_cover_1783897086619.jpg';

// Initial Mock Data to seed LocalStorage
const INITIAL_BEATS: Beat[] = [
  {
    id: 'beat-1',
    title: 'Omni Anthem',
    producer: 'Prod. Bernabé',
    genre: 'Trap',
    bpm: 130,
    key: 'Fá Menor (Fm)',
    priceMp3: 4000,
    priceBasic: 7000,
    pricePremium: 7000,
    priceStems: 10000,
    priceExclusive: 15000,
    coverUrl: BEAT_COVER_DEFAULT,
    tags: ['heavy', 'epic', 'gold'],
    audioUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
  },
  {
    id: 'beat-2',
    title: 'Midnight Legacy',
    producer: 'DJ Apex',
    genre: 'R&B',
    bpm: 95,
    key: 'Dó Menor (Cm)',
    priceMp3: 5000,
    priceBasic: 9000,
    pricePremium: 9000,
    priceStems: 14000,
    priceExclusive: 22000,
    coverUrl: 'https://picsum.photos/seed/midnight/400/400',
    tags: ['smooth', 'chill', 'late-night'],
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3'
  },
  {
    id: 'beat-3',
    title: 'Drill Protocol',
    producer: 'Omni Sounds',
    genre: 'Drill',
    bpm: 142,
    key: 'Sol Menor (Gm)',
    priceMp3: 4000,
    priceBasic: 7000,
    pricePremium: 7000,
    priceStems: 10000,
    priceExclusive: 16000,
    coverUrl: 'https://picsum.photos/seed/drill/400/400',
    tags: ['aggressive', 'dark', 'sliding-bass'],
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3'
  },
  {
    id: 'beat-4',
    title: 'Golden Waves',
    producer: 'Beatmaker Kronos',
    genre: 'Boom Bap',
    bpm: 88,
    key: 'La Menor (Am)',
    priceMp3: 6000,
    priceBasic: 10000,
    pricePremium: 10000,
    priceStems: 15000,
    priceExclusive: 25000,
    coverUrl: 'https://picsum.photos/seed/waves/400/400',
    tags: ['classic', 'vintage', 'vinyl'],
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3'
  }
];

const INITIAL_PROJECTS: StudioProject[] = [
  {
    id: 'proj-1',
    title: 'Luz da Noite (Clipe Oficial)',
    artist: 'Kailo feat. Sophia',
    type: 'Clipe',
    youtubeId: 'dQw4w9WgXcQ', // Placeholder Rick Astley for instant working player
    driveFolderUrl: 'https://drive.google.com/drive/folders/1a2b3c4d5e6f7g8h9i',
    coverImage: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?q=80&w=600&auto=format&fit=crop',
    releaseDate: '2026',
    instagramUrl: 'https://instagram.com',
    spotifyUrl: 'https://spotify.com'
  },
  {
    id: 'proj-2',
    title: 'Omni Sounds Vol. 1',
    artist: 'Artistas Vários',
    type: 'Álbum',
    youtubeId: 'dQw4w9WgXcQ',
    driveFolderUrl: 'https://drive.google.com/drive/folders/1a2b3c4d5e6f7g8h9i',
    coverImage: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=600&auto=format&fit=crop',
    releaseDate: '2025',
    instagramUrl: 'https://instagram.com'
  },
  {
    id: 'proj-3',
    title: 'Sombra e Ouro',
    artist: 'Drippy Kid',
    type: 'Single',
    youtubeId: 'dQw4w9WgXcQ',
    driveFolderUrl: 'https://drive.google.com/drive/folders/1a2b3c4d5e6f7g8h9i',
    coverImage: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=600&auto=format&fit=crop',
    releaseDate: '2026',
    spotifyUrl: 'https://spotify.com'
  }
];

const INITIAL_SETTINGS: StudioSettings = {
  studioName: 'Omni Sounds',
  slogan: 'Onde o som se torna legado',
  aboutText: 'No coração da Omni Sounds, projetamos ondas sonoras e esculpimos obras-primas audíveis. Equipado com engenharia digital de ponta e tecnologia de alta fidelidade, convertemos vibrações em patrimônio musical e eternizamos a essência de cada artista. Seja bem-vindo ao laboratório definitivo de áudio.',
  contactEmail: 'geral@omnisounds.com',
  contactPhone: '+351 912 345 678',
  instagramUrl: 'https://instagram.com',
  youtubeUrl: 'https://youtube.com',
  drivePortfolioUrl: 'https://drive.google.com',
  address: 'Avenida da Boavista, Porto, Portugal',
  customBeatPrices: DEFAULT_CUSTOM_BEAT_PRICES,
  studioRates: DEFAULT_STUDIO_RATES
};

export default function App() {
  const [activeTab, setActiveTab] = useState<'estudio' | 'beats' | 'projetos' | 'agendar'>('estudio');

  const changeTab = (tab: 'estudio' | 'beats' | 'projetos' | 'agendar') => {
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // User Authentication State
  const [userEmail, setUserEmail] = useState<string | null>(() => {
    return localStorage.getItem('aegis_user_email') || null;
  });
  const [userName, setUserName] = useState<string | null>(() => {
    return localStorage.getItem('aegis_user_name') || null;
  });
  const [userPhoto, setUserPhoto] = useState<string | null>(() => {
    return localStorage.getItem('aegis_user_photo') || null;
  });
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);

  // Close profile dropdown on click outside
  useEffect(() => {
    if (!isProfileDropdownOpen) return;
    const handleOutsideClick = () => {
      setIsProfileDropdownOpen(false);
    };
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, [isProfileDropdownOpen]);

  // Sync Firebase Auth State
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserEmail(user.email);
        setUserName(user.displayName);
        setUserPhoto(user.photoURL);
        
        if (user.email) {
          localStorage.setItem('aegis_user_email', user.email);
        } else {
          localStorage.removeItem('aegis_user_email');
        }
        
        if (user.displayName) {
          localStorage.setItem('aegis_user_name', user.displayName);
        } else {
          localStorage.removeItem('aegis_user_name');
        }
        
        if (user.photoURL) {
          localStorage.setItem('aegis_user_photo', user.photoURL);
        } else {
          localStorage.removeItem('aegis_user_photo');
        }
      } else {
        setUserEmail(null);
        setUserName(null);
        setUserPhoto(null);
        localStorage.removeItem('aegis_user_email');
        localStorage.removeItem('aegis_user_name');
        localStorage.removeItem('aegis_user_photo');
      }
    });
    return () => unsubscribe();
  }, []);

  const handleGoogleSignIn = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      if (user) {
        const lowerEmail = user.email ? user.email.toLowerCase() : '';
        if (lowerEmail === 'pascoalbernabe678@gamail.com' || lowerEmail === 'pascoalbernabe678@gmail.com') {
          showNotification('🎉 Bem-vindo de volta, Produtor Pascoal! Painel administrativo liberado via Google.');
        } else {
          showNotification(`Sessão iniciada como ${user.displayName || user.email} via Google.`);
        }
        setIsLoginModalOpen(false);
      }
    } catch (error: any) {
      console.error("Erro no login com Google:", error);
      showNotification(`Erro de autenticação: ${error.message || 'tente novamente.'}`);
    }
  };

  // Derive Admin Access
  const isAdmin = userEmail !== null && (
    userEmail.trim().toLowerCase() === 'pascoalbernabe678@gamail.com' ||
    userEmail.trim().toLowerCase() === 'pascoalbernabe678@gmail.com'
  );

  const handleLogout = async () => {
    try {
      await signOut(auth);
      showNotification('Sessão terminada com sucesso.');
    } catch (error: any) {
      console.error("Erro no logout:", error);
      showNotification('Erro ao encerrar sessão.');
    }
  };

  // State loaded from LocalStorage if available
  const [beats, setBeats] = useState<Beat[]>(() => {
    const saved = localStorage.getItem('aegis_beats');
    return saved ? JSON.parse(saved) : INITIAL_BEATS;
  });

  const [bookings, setBookings] = useState<StudioSession[]>(() => {
    const saved = localStorage.getItem('aegis_bookings');
    return saved ? JSON.parse(saved) : [];
  });

  const [projects, setProjects] = useState<StudioProject[]>(() => {
    const saved = localStorage.getItem('aegis_projects');
    return saved ? JSON.parse(saved) : INITIAL_PROJECTS;
  });

  const [purchases, setPurchases] = useState<BeatPurchase[]>([]);
  const [customOrders, setCustomOrders] = useState<CustomBeatOrder[]>(() => {
    const saved = localStorage.getItem('aegis_custom_orders');
    return saved ? JSON.parse(saved) : [];
  });
  const [isCustomOrderModalOpen, setIsCustomOrderModalOpen] = useState(false);

  const [settings, setSettings] = useState<StudioSettings>(() => {
    const saved = localStorage.getItem('aegis_settings');
    return saved ? JSON.parse(saved) : INITIAL_SETTINGS;
  });

  // Font Style selection state
  const [fontStyle, setFontStyle] = useState<FontStyleType>(() => {
    const saved = localStorage.getItem('aegis_font_style');
    return (saved as FontStyleType) || 'modern';
  });

  // Sync font class globally
  useEffect(() => {
    try {
      localStorage.setItem('aegis_font_style', fontStyle);
      const fontClasses = ['font-style-modern', 'font-style-urban', 'font-style-cyber', 'font-style-elegant', 'font-style-street'];
      fontClasses.forEach(cls => {
        document.body.classList.remove(cls);
        document.documentElement.classList.remove(cls);
      });
      document.body.classList.add(`font-style-${fontStyle}`);
      document.documentElement.classList.add(`font-style-${fontStyle}`);
    } catch (e) {
      console.warn("Could not set font style class:", e);
    }
  }, [fontStyle]);

  // Player state for beats store
  const [currentPlayingBeat, setCurrentPlayingBeat] = useState<Beat | null>(null);
  const [isBeatPlaying, setIsBeatPlaying] = useState(false);
  const [drivePlaybackFallback, setDrivePlaybackFallback] = useState(false);
  const [hideDrivePiP, setHideDrivePiP] = useState(false);
  const [playingVideoId, setPlayingVideoId] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  // Validate Connection to Firestore on boot
  useEffect(() => {
    async function testConnection() {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (error: any) {
        if (error) {
          const msg = error?.message || String(error);
          const code = error?.code || '';
          if (msg.includes('the client is offline') || msg.includes('unavailable') || code === 'unavailable') {
            console.info("Firestore connection: operating in offline-first mode, synchronizing when connection is available.");
          } else {
            console.debug("Firestore test connection check:", msg);
          }
        }
      }
    }
    testConnection();
  }, []);

  // Listen for real-time changes in Firestore (strictly mirror Firestore state)
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'beats'), (snapshot) => {
      const list: Beat[] = [];
      snapshot.forEach((docSnap) => {
        list.push(docSnap.data() as Beat);
      });
      setBeats(list);
      try {
        localStorage.setItem('aegis_beats', JSON.stringify(list));
      } catch (e) {
        console.warn("Storage save error:", e);
      }
    }, (error) => {
      console.error("Error listening to beats:", error);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'projects'), (snapshot) => {
      const list: StudioProject[] = [];
      snapshot.forEach((docSnap) => {
        list.push(docSnap.data() as StudioProject);
      });
      setProjects(list);
      try {
        localStorage.setItem('aegis_projects', JSON.stringify(list));
      } catch (e) {
        console.warn("Storage save error:", e);
      }
    }, (error) => {
      console.error("Error listening to projects:", error);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'settings', 'studio'), (docSnap) => {
      if (docSnap.exists()) {
        const studioData = docSnap.data() as StudioSettings;
        setSettings(studioData);
        try {
          localStorage.setItem('aegis_settings', JSON.stringify(studioData));
        } catch (e) {
          console.warn("Storage save error:", e);
        }
      }
    }, (error) => {
      console.error("Error listening to settings:", error);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!isAdmin) {
      try {
        const saved = localStorage.getItem('omni_bookings') || localStorage.getItem('aegis_bookings');
        if (saved) {
          setBookings(JSON.parse(saved));
        } else {
          setBookings([]);
        }
      } catch (e) {
        console.warn("Error reading local bookings:", e);
        setBookings([]);
      }
      return;
    }
    const unsubscribe = onSnapshot(collection(db, 'bookings'), (snapshot) => {
      const list: StudioSession[] = [];
      snapshot.forEach((docSnap) => {
        list.push(docSnap.data() as StudioSession);
      });
      setBookings(list);
    }, (error) => {
      console.error("Error listening to bookings:", error);
    });
    return () => unsubscribe();
  }, [isAdmin]);

  useEffect(() => {
    if (!isAdmin) {
      setPurchases([]);
      return;
    }
    const unsubscribe = onSnapshot(collection(db, 'purchases'), (snapshot) => {
      const list: BeatPurchase[] = [];
      snapshot.forEach((docSnap) => {
        list.push(docSnap.data() as BeatPurchase);
      });
      list.sort((a, b) => b.timestamp - a.timestamp);
      setPurchases(list);
    }, (error) => {
      console.error("Error listening to purchases:", error);
    });
    return () => unsubscribe();
  }, [isAdmin]);

  useEffect(() => {
    if (!isAdmin) {
      return;
    }
    const unsubscribe = onSnapshot(collection(db, 'custom_beats'), (snapshot) => {
      const list: CustomBeatOrder[] = [];
      snapshot.forEach((docSnap) => {
        list.push(docSnap.data() as CustomBeatOrder);
      });
      list.sort((a, b) => b.timestamp - a.timestamp);
      setCustomOrders(list);
      try {
        localStorage.setItem('aegis_custom_orders', JSON.stringify(list));
      } catch (e) {
        console.warn("Could not save custom orders to localStorage:", e);
      }
    }, (error) => {
      console.error("Error listening to custom_beats:", error);
    });
    return () => unsubscribe();
  }, [isAdmin]);

  useEffect(() => {
    if (userEmail) {
      localStorage.setItem('aegis_user_email', userEmail);
    } else {
      localStorage.removeItem('aegis_user_email');
    }
  }, [userEmail]);

  // Player states for HTML5 Audio
  const [audioCurrentTime, setAudioCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const [audioVolume, setAudioVolume] = useState(0.8);

  // Audio simulation or actual playback for Beat Playback
  const audioRef = React.useRef<HTMLAudioElement | null>(null);

  const isYoutubeUrl = (url?: string): boolean => {
    if (!url) return false;
    return url.includes('youtube.com') || url.includes('youtu.be');
  };

  const getYoutubeVideoId = (url?: string): string => {
    if (!url) return '';
    let id = url;
    if (url.includes('youtube.com/watch?v=')) {
      id = url.split('v=')[1]?.split('&')[0] || url;
    } else if (url.includes('youtu.be/')) {
      id = url.split('youtu.be/')[1]?.split('?')[0] || url;
    } else if (url.includes('youtube.com/embed/')) {
      id = url.split('youtube.com/embed/')[1]?.split('?')[0] || url;
    }
    return id;
  };

  const isGoogleDriveUrl = (url?: string): boolean => {
    if (!url) return false;
    return url.includes('drive.google.com') || url.includes('docs.google.com');
  };

  const getGoogleDriveFileId = (url?: string): string => {
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
    return fileId;
  };

  const handlePlayBeat = (beat: Beat) => {
    if (currentPlayingBeat?.id === beat.id) {
      setIsBeatPlaying(prev => !prev);
    } else {
      setCurrentPlayingBeat(beat);
      setIsBeatPlaying(true);
      setDrivePlaybackFallback(false);
      setHideDrivePiP(false);
      setPlayingVideoId(null); // Pause any running project video!
      showNotification(`A reproduzir demonstração: ${beat.title}`);
    }
  };

  const handleTimelineChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = Number(e.target.value);
    setAudioCurrentTime(newTime);
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
    }
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs)) return '0:00';
    const minutes = Math.floor(secs / 60);
    const seconds = Math.floor(secs % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  // Sync volume state with HTML5 audio element
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = audioVolume;
    }
  }, [audioVolume]);

  // Handle actual audio play/pause for standard audio and Google Drive tracks
  useEffect(() => {
    if (!audioRef.current) return;
    
    // Stop playing standard audio element if paused or if using YouTube stream
    if (!isBeatPlaying || !currentPlayingBeat || isYoutubeUrl(currentPlayingBeat.audioUrl)) {
      audioRef.current.pause();
      return;
    }
    
    // Format stream URL (works for direct audio or Google Drive shared links)
    const streamUrl = isGoogleDriveUrl(currentPlayingBeat.audioUrl)
      ? transformGoogleDriveAudioUrl(currentPlayingBeat.audioUrl)
      : (currentPlayingBeat.audioUrl || '');

    if (!streamUrl) return;
    
    // If the audio source changed, load the new source
    if (audioRef.current.src !== streamUrl) {
      audioRef.current.src = streamUrl;
      audioRef.current.load();
    }
    
    audioRef.current.play().catch(err => {
      console.warn("Direct stream autoplay notice: ", err);
      if (isGoogleDriveUrl(currentPlayingBeat.audioUrl)) {
        setDrivePlaybackFallback(true);
      }
    });
  }, [currentPlayingBeat, isBeatPlaying]);

  const getYoutubeEmbedUrl = (youtubeId: string) => {
    let id = youtubeId;
    if (youtubeId.includes('youtube.com/watch?v=')) {
      id = youtubeId.split('v=')[1]?.split('&')[0] || youtubeId;
    } else if (youtubeId.includes('youtu.be/')) {
      id = youtubeId.split('youtu.be/')[1]?.split('?')[0] || youtubeId;
    }
    return `https://www.youtube.com/embed/${id}`;
  };

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  // Helper to sanitize any payload before sending to Firestore
  const sanitizeFirestorePayload = <T,>(data: T): T => {
    return JSON.parse(JSON.stringify(data, (_, v) => (v === undefined ? '' : v)));
  };

  // Admin and management actions
  const handleAddBeat = async (newBeat: Beat) => {
    const cleanBeat = sanitizeFirestorePayload(newBeat);
    // Optimistic local state update
    setBeats(prev => [cleanBeat, ...prev.filter(b => b.id !== cleanBeat.id)]);
    try {
      localStorage.setItem('aegis_beats', JSON.stringify([cleanBeat, ...beats.filter(b => b.id !== cleanBeat.id)]));
    } catch (e) {
      console.warn("Storage save notice:", e);
    }

    try {
      await setDoc(doc(db, 'beats', cleanBeat.id), cleanBeat);
      showNotification(`Beat "${cleanBeat.title}" adicionado ao catálogo com sucesso!`);
    } catch (error) {
      console.error("Firestore error adding beat:", error);
      if (!auth.currentUser) {
        showNotification('⚠️ Beat salvo localmente. Para sincronizar na nuvem, inicie sessão como administrador.');
      } else {
        handleFirestoreError(error, OperationType.WRITE, `beats/${cleanBeat.id}`);
      }
    }
  };

  const handleUpdateBeat = async (updatedBeat: Beat) => {
    const cleanBeat = sanitizeFirestorePayload(updatedBeat);
    // Optimistic local state update
    setBeats(prev => prev.map(b => b.id === cleanBeat.id ? cleanBeat : b));
    try {
      localStorage.setItem('aegis_beats', JSON.stringify(beats.map(b => b.id === cleanBeat.id ? cleanBeat : b)));
    } catch (e) {
      console.warn("Storage save notice:", e);
    }

    try {
      await setDoc(doc(db, 'beats', cleanBeat.id), cleanBeat);
      showNotification(`Beat "${cleanBeat.title}" atualizado com sucesso!`);
    } catch (error) {
      console.error("Firestore error updating beat:", error);
      if (!auth.currentUser) {
        showNotification('⚠️ Alteração salva localmente. Para sincronizar na nuvem, inicie sessão como administrador.');
      } else {
        handleFirestoreError(error, OperationType.WRITE, `beats/${cleanBeat.id}`);
      }
    }
  };

  const handleDeleteBeat = async (id: string) => {
    // Optimistic local state update
    setBeats(prev => prev.filter(b => b.id !== id));
    try {
      localStorage.setItem('aegis_beats', JSON.stringify(beats.filter(b => b.id !== id)));
    } catch (e) {
      console.warn("Storage save notice:", e);
    }

    try {
      await deleteDoc(doc(db, 'beats', id));
      showNotification('Beat removido com sucesso.');
    } catch (error) {
      console.error("Firestore error deleting beat:", error);
      if (!auth.currentUser) {
        showNotification('⚠️ Removido localmente. Para remover da nuvem, inicie sessão como administrador.');
      } else {
        handleFirestoreError(error, OperationType.DELETE, `beats/${id}`);
      }
    }
  };

  const handleAddProject = async (newProject: StudioProject) => {
    const cleanProject = sanitizeFirestorePayload(newProject);
    // Optimistic local state update
    setProjects(prev => [cleanProject, ...prev.filter(p => p.id !== cleanProject.id)]);
    try {
      localStorage.setItem('aegis_projects', JSON.stringify([cleanProject, ...projects.filter(p => p.id !== cleanProject.id)]));
    } catch (e) {
      console.warn("Storage save notice:", e);
    }

    try {
      await setDoc(doc(db, 'projects', cleanProject.id), cleanProject);
      showNotification(`Projeto "${cleanProject.title}" adicionado à aba de projetos!`);
    } catch (error) {
      console.error("Firestore error adding project:", error);
      if (!auth.currentUser) {
        showNotification('⚠️ Projeto salvo localmente. Para sincronizar na nuvem, inicie sessão como administrador.');
      } else {
        handleFirestoreError(error, OperationType.WRITE, `projects/${cleanProject.id}`);
      }
    }
  };

  const handleUpdateProject = async (updatedProject: StudioProject) => {
    const cleanProject = sanitizeFirestorePayload(updatedProject);
    // Optimistic local state update
    setProjects(prev => prev.map(p => p.id === cleanProject.id ? cleanProject : p));
    try {
      localStorage.setItem('aegis_projects', JSON.stringify(projects.map(p => p.id === cleanProject.id ? cleanProject : p)));
    } catch (e) {
      console.warn("Storage save notice:", e);
    }

    try {
      await setDoc(doc(db, 'projects', cleanProject.id), cleanProject);
      showNotification(`Projeto "${cleanProject.title}" atualizado com sucesso!`);
    } catch (error) {
      console.error("Firestore error updating project:", error);
      if (!auth.currentUser) {
        showNotification('⚠️ Alteração salva localmente. Para sincronizar na nuvem, inicie sessão como administrador.');
      } else {
        handleFirestoreError(error, OperationType.WRITE, `projects/${cleanProject.id}`);
      }
    }
  };

  const handleDeleteProject = async (id: string) => {
    // Optimistic local state update
    setProjects(prev => prev.filter(p => p.id !== id));
    try {
      localStorage.setItem('aegis_projects', JSON.stringify(projects.filter(p => p.id !== id)));
    } catch (e) {
      console.warn("Storage save notice:", e);
    }

    try {
      await deleteDoc(doc(db, 'projects', id));
      showNotification('Projeto removido.');
    } catch (error) {
      console.error("Firestore error deleting project:", error);
      if (!auth.currentUser) {
        showNotification('⚠️ Removido localmente. Para remover da nuvem, inicie sessão como administrador.');
      } else {
        handleFirestoreError(error, OperationType.DELETE, `projects/${id}`);
      }
    }
  };

  const handleAddBooking = async (newBookingData: Omit<StudioSession, 'id' | 'status'>) => {
    const bookingId = 'book-' + Date.now();
    const newBooking: StudioSession = sanitizeFirestorePayload({
      ...newBookingData,
      id: bookingId,
      status: 'Pendente'
    });
    try {
      await setDoc(doc(db, 'bookings', bookingId), newBooking);
      // Fallback update local state for immediate response if needed
      if (!isAdmin) {
        setBookings(prev => {
          const updated = [newBooking, ...prev];
          try {
            localStorage.setItem('omni_bookings', JSON.stringify(updated));
          } catch (e) {
            console.warn("Storage save error:", e);
          }
          return updated;
        });
      }
      showNotification('Agendamento solicitado com sucesso! Confirme os detalhes na aba.');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `bookings/${bookingId}`);
    }
  };

  const handleUpdateBookingStatus = async (id: string, status: StudioSession['status']) => {
    try {
      const docRef = doc(db, 'bookings', id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const currentData = docSnap.data() as StudioSession;
        const cleanBooking = sanitizeFirestorePayload({ ...currentData, status });
        await setDoc(docRef, cleanBooking);
        showNotification(`Status do agendamento atualizado para "${status}".`);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `bookings/${id}`);
    }
  };

  const handleDeleteBooking = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'bookings', id));
      showNotification('Agendamento excluído.');
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `bookings/${id}`);
    }
  };

  const handleUpdateSettings = async (updatedSettings: StudioSettings) => {
    const cleanSettings = sanitizeFirestorePayload(updatedSettings);
    setSettings(cleanSettings);
    try {
      localStorage.setItem('aegis_settings', JSON.stringify(cleanSettings));
    } catch (e) {
      console.warn("Storage save notice:", e);
    }

    try {
      await setDoc(doc(db, 'settings', 'studio'), cleanSettings);
      showNotification('Configurações do estúdio atualizadas com sucesso.');
    } catch (error) {
      console.error("Firestore error updating settings:", error);
      if (!auth.currentUser) {
        showNotification('⚠️ Configurações salvas localmente. Para sincronizar na nuvem, inicie sessão como administrador.');
      } else {
        handleFirestoreError(error, OperationType.WRITE, 'settings/studio');
      }
    }
  };

  const handlePurchase = async (
    beat: Beat,
    license: 'mp3' | 'premium' | 'stems' | 'exclusive' | 'basic' | string,
    clientName: string,
    clientEmail: string,
    clientPhone: string
  ) => {
    const purchaseId = 'pur-' + Date.now();
    
    const validLicenseType = (license === 'mp3' || license === 'premium' || license === 'stems' || license === 'exclusive')
      ? license
      : 'premium';

    const pricePaid = getBeatLicensePrice(beat, validLicenseType);

    let licenseTitle = 'Licença Premium (MP3 + WAV)';
    let licensePoints: string[] = [];

    switch (validLicenseType) {
      case 'mp3':
        licenseTitle = 'Licença MP3';
        licensePoints = [
          '• Direito de uso: Uso comercial conforme contrato',
          '• Formato de áudio: MP3 Masterizado (320kbps)',
          '• Distribuição em streaming: Até 5.000 reproduções',
          '• Autoria: Uso não-exclusivo com créditos ao produtor',
          '• Entrega: Liberação rápida por link protegido'
        ];
        break;
      case 'premium':
        licenseTitle = 'Licença Premium (MP3 + WAV)';
        licensePoints = [
          '• Direito de uso: Lançamento comercial em todas as plataformas (Spotify, Apple, etc.)',
          '• Formato de áudio: MP3 + WAV Master sem compressão (24-bit/48kHz)',
          '• Apresentações: Direitos de apresentação ao vivo e videoclipe oficial',
          '• Entrega: Arquivos de alta fidelidade para estúdio de gravação'
        ];
        break;
      case 'stems':
        licenseTitle = 'Licença Stems / Trackouts';
        licensePoints = [
          '• Direito de uso: Liberdade total para mixar, cortar e editar arranjos',
          '• Formato de áudio: Pistas individuais separadas (Bateria, 808, Melodia, FX, Synths)',
          '• Ajustes na DAW: Equilíbrio e mixagem de cada canal',
          '• Entrega: Arquivos WAV organizados em ZIP + Contrato estendido'
        ];
        break;
      case 'exclusive':
        licenseTitle = 'Licença Exclusiva + Mix Profissional';
        licensePoints = [
          '• Direito de uso: 100% Exclusivo (o beat é retirado imediatamente da loja)',
          '• Serviço de Produção: Tratamento e mixagem profissional da sua voz com o instrumental',
          '• Formato & Master: Stems completos + masterização final para rádio e streaming',
          '• Monetização: Reproduções e vendas ilimitadas em todas as plataformas',
          '• Suporte: Suporte direto de engenharia de som da Omni Sounds'
        ];
        break;
    }

    const newPurchase: BeatPurchase = sanitizeFirestorePayload({
      id: purchaseId,
      beatId: beat.id,
      beatTitle: beat.title,
      licenseType: validLicenseType,
      pricePaid,
      clientName: clientName.trim(),
      clientEmail: clientEmail.trim() || '',
      clientPhone: clientPhone.trim(),
      timestamp: Date.now(),
      status: 'Pendente'
    });

    try {
      await setDoc(doc(db, 'purchases', purchaseId), newPurchase);
      
      showNotification(`🎉 Pedido registrado! A iniciar contacto via WhatsApp...`);

      const cleanPhone = settings.contactPhone.replace(/[^0-9+]/g, '');
      const termsText = licensePoints.join('\n');
      const text = `Olá Omni Sounds! Acabei de efetuar um pedido de compra no vosso site:
- Beat: "${beat.title}" (Produtor: ${beat.producer || 'Omni Sounds'} | ${beat.genre} - ${beat.bpm} BPM)
- Licença Selecionada: ${licenseTitle}
- Valor: ${pricePaid.toLocaleString()} KZ

📋 Termos & Direitos da Licença:
${termsText}

👤 Dados do Comprador:
- Nome: ${clientName}
- E-mail: ${clientEmail.trim() ? clientEmail.trim() : 'Não informado'}
- WhatsApp: ${clientPhone}
- ID do Pedido: ${purchaseId}

Por favor, enviem as instruções e dados para o pagamento. Obrigado!`;

      const waUrl = `https://api.whatsapp.com/send?phone=${encodeURIComponent(cleanPhone)}&text=${encodeURIComponent(text)}`;

      setTimeout(() => {
        window.open(waUrl, '_blank');
      }, 1200);

    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `purchases/${purchaseId}`);
    }
  };

  const handleUpdatePurchaseStatus = async (id: string, status: BeatPurchase['status']) => {
    try {
      const docRef = doc(db, 'purchases', id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const currentData = docSnap.data() as BeatPurchase;
        await setDoc(docRef, { ...currentData, status });
        showNotification(`Status do pedido atualizado para "${status}".`);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `purchases/${id}`);
    }
  };

  const handleDeletePurchase = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'purchases', id));
      showNotification('Pedido de compra excluído.');
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `purchases/${id}`);
    }
  };

  // Custom Beat Order Handlers
  const handleCreateCustomBeatOrder = async (orderData: Omit<CustomBeatOrder, 'id' | 'timestamp' | 'status'>) => {
    const orderId = `cbeat-${Date.now()}`;
    const newOrder: CustomBeatOrder = sanitizeFirestorePayload({
      ...orderData,
      clientEmail: (orderData.clientEmail || '').trim(),
      id: orderId,
      timestamp: Date.now(),
      status: 'Pendente'
    });

    try {
      await setDoc(doc(db, 'custom_beats', orderId), newOrder);
      
      // Update local state and backup in localStorage
      setCustomOrders(prev => {
        const updated = [newOrder, ...prev];
        try {
          localStorage.setItem('aegis_custom_orders', JSON.stringify(updated));
        } catch (e) {}
        return updated;
      });

      showNotification('🎉 Pedido de Beat Personalizado recebido! A redirecionar para o WhatsApp do produtor...');

      // Build WhatsApp message for the studio
      const studioPhone = settings.contactPhone.replace(/[^0-9+]/g, '');
      const refLinkText = newOrder.referenceSongUrl ? `\n- Link da Ref: ${newOrder.referenceSongUrl}` : '';
      const notesText = newOrder.notes ? `\n- Observações: ${newOrder.notes}` : '';
      const vocalText = newOrder.hasVocal ? `\n- Vocal: TENHO VOZ/VOCAL PARA GRAVAÇÃO (Vou enviar em anexo)` : '';
      const emailText = newOrder.clientEmail ? `\n- E-mail: ${newOrder.clientEmail}` : '\n- E-mail: Não informado';

      const waText = `Olá Omni Sounds! Acabei de enviar um pedido de Beat Personalizado pelo vosso site:
- Estilo/Gênero: ${newOrder.genre}
- BPM Desejado: ${newOrder.bpm}
- Duração: ${newOrder.beatDuration}
- Música de Referência: ${newOrder.referenceSongName}${refLinkText}
- Cliente: ${newOrder.clientName}${emailText}
- Telefone: ${newOrder.clientPhone}${vocalText}${notesText}
- ID do Pedido: ${newOrder.id}

Aguardo a confirmação e detalhes de início da produção!`;

      const waUrl = `https://api.whatsapp.com/send?phone=${encodeURIComponent(studioPhone)}&text=${encodeURIComponent(waText)}`;

      setTimeout(() => {
        window.open(waUrl, '_blank');
      }, 1200);

    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `custom_beats/${orderId}`);
    }
  };

  const handleUpdateCustomOrderStatus = async (id: string, status: CustomBeatOrder['status']) => {
    try {
      const docRef = doc(db, 'custom_beats', id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const currentData = docSnap.data() as CustomBeatOrder;
        await setDoc(docRef, { ...currentData, status });
        showNotification(`Status da encomenda de beat atualizado para "${status}".`);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `custom_beats/${id}`);
    }
  };

  const handleDeleteCustomOrder = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'custom_beats', id));
      setCustomOrders(prev => {
        const updated = prev.filter(item => item.id !== id);
        try {
          localStorage.setItem('aegis_custom_orders', JSON.stringify(updated));
        } catch (e) {}
        return updated;
      });
      showNotification('Encomenda de beat personalizada excluída.');
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `custom_beats/${id}`);
    }
  };

  return (
    <div className="bg-[#050505] text-[#F3F4F6] min-h-screen selection:bg-amber-500 selection:text-black">
      
      {/* Dynamic Pop-up Notification */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-amber-500 text-black px-6 py-3 rounded-full shadow-2xl font-bold text-xs uppercase tracking-wider flex items-center gap-2.5 border border-amber-400"
          >
            <Sparkles className="w-4 h-4 animate-spin-slow" />
            <span>{notification}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation Header */}
      <header className="sticky top-0 z-30 bg-black/70 backdrop-blur-md border-b border-zinc-900/80">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-14 sm:h-20 flex items-center justify-between">
          
          {/* Studio Brand Logo */}
          <div className="flex items-center gap-2 sm:gap-3 cursor-pointer" onClick={() => changeTab('estudio')}>
            {settings.logoUrl ? (
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="h-9 sm:h-11 max-w-[140px] sm:max-w-[180px] flex items-center justify-center">
                  <img
                    src={transformGoogleDriveUrl(settings.logoUrl)}
                    alt={settings.studioName || "Omni Sounds"}
                    referrerPolicy="no-referrer"
                    className="h-9 sm:h-11 w-auto object-contain rounded-lg shadow-sm"
                    onError={(e) => {
                      (e.currentTarget as HTMLElement).style.display = 'none';
                    }}
                  />
                </div>
                <div>
                  <span className="font-sans font-extrabold text-white text-xs sm:text-base tracking-widest block uppercase leading-none">
                    {settings.studioName || 'Omni Sounds'}
                  </span>
                  <span className="text-[8px] sm:text-[10px] text-zinc-500 font-bold uppercase tracking-[0.25em] block font-mono mt-0.5">
                    {settings.slogan || 'ESTÚDIO DE GRAVAÇÃO'}
                  </span>
                </div>
              </div>
            ) : (
              <>
                <div className="relative p-1.5 sm:p-2.5 bg-gradient-to-br from-amber-500 to-amber-600 rounded-lg sm:rounded-xl shadow-lg shadow-amber-500/10 flex items-center justify-center flex-shrink-0">
                  <Radio className="w-4 h-4 sm:w-5 sm:h-5 text-black" />
                  <div className="absolute inset-0 border border-amber-400/40 rounded-lg sm:rounded-xl animate-ping scale-[1.05]" />
                </div>
                <div>
                  <span className="font-sans font-extrabold text-white text-xs sm:text-base tracking-widest block uppercase leading-none">Omni</span>
                  <span className="text-[8px] sm:text-[10px] text-zinc-500 font-bold uppercase tracking-[0.25em] block font-mono mt-0.5">SOUNDS</span>
                </div>
              </>
            )}
          </div>

          {/* Desktop Nav menu */}
          <nav className="hidden md:flex items-center gap-1.5 bg-zinc-950/80 border border-zinc-900/80 p-1 rounded-xl">
            <button 
              onClick={() => changeTab('estudio')} 
              className={`text-xs font-semibold px-4 py-2 rounded-lg transition-all ${activeTab === 'estudio' ? 'bg-amber-500 text-black font-bold' : 'text-zinc-400 hover:text-zinc-200'}`}
            >
              O Estúdio
            </button>
            <button 
              onClick={() => changeTab('beats')} 
              className={`text-xs font-semibold px-4 py-2 rounded-lg transition-all ${activeTab === 'beats' ? 'bg-amber-500 text-black font-bold' : 'text-zinc-400 hover:text-zinc-200'}`}
            >
              Compra de Beats
            </button>
            <button 
              onClick={() => changeTab('projetos')} 
              className={`text-xs font-semibold px-4 py-2 rounded-lg transition-all ${activeTab === 'projetos' ? 'bg-amber-500 text-black font-bold' : 'text-zinc-400 hover:text-zinc-200'}`}
            >
              Projetos
            </button>
            <button 
              onClick={() => changeTab('agendar')} 
              className={`text-xs font-semibold px-4 py-2 rounded-lg transition-all ${activeTab === 'agendar' ? 'bg-amber-500 text-black font-bold' : 'text-zinc-400 hover:text-zinc-200'}`}
            >
              Agendamentos
            </button>
            <button
              onClick={() => setIsCustomOrderModalOpen(true)}
              className="text-xs font-extrabold px-3.5 py-2 rounded-lg transition-all bg-amber-500/10 hover:bg-amber-500 text-amber-400 hover:text-black border border-amber-500/30 flex items-center gap-1.5 cursor-pointer ml-1 shadow-sm"
              title="Encomendar instrumental sob medida com seu BPM e estilo"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Beat Sob Medida</span>
            </button>
          </nav>

          {/* Controls: User Auth */}
          <div className="flex items-center gap-1.5 sm:gap-3 relative">
            {userEmail ? (
              <div className="relative">
                {/* User avatar button (Photo or initial) */}
                <button
                  id="user-profile-button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsProfileDropdownOpen(!isProfileDropdownOpen);
                  }}
                  className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full border border-zinc-800 hover:border-amber-500/50 focus:outline-none transition-all cursor-pointer overflow-hidden bg-zinc-900 shadow-md hover:shadow-amber-500/10"
                  title={userName || userEmail}
                >
                  {userPhoto ? (
                    <img 
                      src={userPhoto} 
                      alt={userName || "Utilizador"} 
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-amber-500 to-amber-600 text-black font-extrabold flex items-center justify-center text-xs sm:text-sm uppercase">
                      {(userName || userEmail).charAt(0).toUpperCase()}
                    </div>
                  )}
                </button>

                {/* Profile drop-down menu */}
                <AnimatePresence>
                  {isProfileDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-2 w-60 sm:w-64 bg-zinc-950 border border-zinc-900 rounded-2xl shadow-2xl p-3.5 sm:p-4 z-50 space-y-3"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {/* User basic info */}
                      <div className="flex items-center gap-3 pb-3 border-b border-zinc-900">
                        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full overflow-hidden border border-zinc-800 bg-zinc-900 flex-shrink-0">
                          {userPhoto ? (
                            <img 
                              src={userPhoto} 
                              alt={userName || "Utilizador"} 
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-amber-500 to-amber-600 text-black font-extrabold flex items-center justify-center text-xs sm:text-sm uppercase">
                              {(userName || userEmail).charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs text-white font-bold truncate">
                            {userName || 'Utilizador'}
                          </p>
                          <p className="text-[10px] text-zinc-500 font-mono truncate" title={userEmail}>
                            {userEmail}
                          </p>
                        </div>
                      </div>

                      {/* Options / Action list */}
                      <div className="space-y-1">
                        {isAdmin && (
                          <div className="px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-lg text-[10px] text-amber-500 font-bold uppercase tracking-wider text-center flex items-center justify-center gap-1.5">
                            <Shield className="w-3.5 h-3.5" />
                            <span>Produtor Pascoal (Admin)</span>
                          </div>
                        )}
                        
                        <p className="text-[10px] text-zinc-500 font-mono px-2 py-0.5">
                          {settings.studioName || 'Omni Sounds Studio'}
                        </p>
                      </div>

                      {/* Log out action */}
                      <button
                        onClick={() => {
                          setIsProfileDropdownOpen(false);
                          handleLogout();
                        }}
                        className="w-full flex items-center justify-center gap-2 bg-zinc-900 hover:bg-red-500/10 hover:text-red-400 border border-zinc-800 hover:border-red-500/20 py-2 rounded-xl transition-all text-xs font-semibold text-zinc-400 cursor-pointer"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Terminar Sessão</span>
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <button
                onClick={() => setIsLoginModalOpen(true)}
                className="flex items-center gap-1.5 bg-zinc-950 hover:bg-zinc-900 border border-zinc-850 hover:border-zinc-800 text-[11px] sm:text-xs text-zinc-300 hover:text-amber-500 font-bold px-3 py-1.5 sm:px-4 sm:py-2.5 rounded-lg sm:rounded-xl transition-all cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span>Entrar</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Nav Submenu (Horizontal Scroll - Compact) */}
      <div className="md:hidden sticky top-14 z-20 bg-zinc-950/95 backdrop-blur-md border-b border-zinc-900 overflow-x-auto flex items-center gap-1.5 p-2">
        <button 
          onClick={() => changeTab('estudio')} 
          className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg flex-shrink-0 transition-all ${activeTab === 'estudio' ? 'bg-amber-500 text-black' : 'bg-zinc-900/70 border border-zinc-800 text-zinc-400'}`}
        >
          O Estúdio
        </button>
        <button 
          onClick={() => changeTab('beats')} 
          className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg flex-shrink-0 transition-all ${activeTab === 'beats' ? 'bg-amber-500 text-black' : 'bg-zinc-900/70 border border-zinc-800 text-zinc-400'}`}
        >
          Beats & Preços
        </button>
        <button 
          onClick={() => changeTab('projetos')} 
          className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg flex-shrink-0 transition-all ${activeTab === 'projetos' ? 'bg-amber-500 text-black' : 'bg-zinc-900/70 border border-zinc-800 text-zinc-400'}`}
        >
          Projetos
        </button>
        <button 
          onClick={() => changeTab('agendar')} 
          className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg flex-shrink-0 transition-all ${activeTab === 'agendar' ? 'bg-amber-500 text-black' : 'bg-zinc-900/70 border border-zinc-800 text-zinc-400'}`}
        >
          Agendar
        </button>
        <button
          onClick={() => setIsCustomOrderModalOpen(true)}
          className="text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg flex-shrink-0 transition-all bg-amber-500/15 border border-amber-500/40 text-amber-400 flex items-center gap-1"
        >
          <Sparkles className="w-3 h-3" />
          <span>Encomendar</span>
        </button>
      </div>

      {/* Main Container Sections based on activeTab */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }}
          transition={{ duration: 0.25 }}
          className="w-full"
        >
          {activeTab === 'estudio' && (
            <>
              {/* Hero Visual Area */}
              <section className="relative min-h-[45vh] sm:min-h-[70vh] flex items-center justify-center overflow-hidden py-8 sm:py-16 px-3 sm:px-4">
                {/* Dynamic Glowing Studio background */}
                <div className="absolute inset-0 bg-cover bg-center opacity-40 z-0 scale-105" style={{ backgroundImage: `url(${HERO_BG})` }} />
                {/* Shadow overlays */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/70 to-transparent z-10" />
                <div className="absolute inset-0 bg-black/40 z-10" />

                {/* Floating background soundwave visual art */}
                <div className="absolute bottom-0 left-0 right-0 h-24 sm:h-32 opacity-15 pointer-events-none z-10 overflow-hidden">
                  <svg viewBox="0 0 1440 320" className="w-full h-full text-amber-500 fill-current">
                    <path d="M0,288L24,256C48,224,96,160,144,149.3C192,139,240,181,288,208C336,235,384,245,432,213.3C480,181,528,107,576,96C624,85,672,139,720,170.7C768,203,816,213,864,224C912,235,960,245,1008,229.3C1056,213,1104,171,1152,144C1200,117,1248,107,1296,117.3C1344,128,1392,160,1416,176L1440,192L1440,320L1416,320C1392,320,1344,320,1296,320C1248,320,1200,320,1152,320C1104,320,1056,320,1008,320C960,320,912,320,864,320C816,320,768,320,720,320C672,320,624,320,576,320C528,320,480,320,432,320C384,320,336,320,288,320C240,320,192,320,144,320C96,320,48,320,24,320L0,320Z"></path>
                  </svg>
                </div>

                {/* Hero Content */}
                <div className="relative max-w-5xl mx-auto text-center z-20 space-y-4 sm:space-y-6">
                  
                  <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3 py-1 sm:px-3.5 sm:py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-full text-amber-500 text-[9px] sm:text-[10px] font-bold uppercase tracking-widest font-mono">
                    <Award className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                    <span>Engenharia & Produção de Alta Fidelidade</span>
                  </div>

                  <div className="space-y-2 sm:space-y-3">
                    <h1 className="text-3xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white leading-[1.1] font-sans">
                      {settings.studioName ? settings.studioName.toUpperCase() : 'OMNI SOUNDS'}
                    </h1>
                    <h2 className="text-sm sm:text-2xl text-amber-500 uppercase tracking-[0.2em] font-mono font-bold">
                      {settings.slogan}
                    </h2>
                  </div>

                  <p className="text-zinc-400 text-xs sm:text-sm max-w-2xl mx-auto leading-relaxed px-2">
                    {settings.aboutText}
                  </p>

                  {/* Vertical navigation buttons stacked one below the other with orange borders */}
                  <div className="flex flex-col items-center gap-2.5 sm:gap-3.5 max-w-xs mx-auto pt-2 sm:pt-4">
                    <button
                      onClick={() => setIsCustomOrderModalOpen(true)}
                      className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-extrabold px-5 py-2.5 sm:px-6 sm:py-3 rounded-xl transition-all text-xs uppercase tracking-widest font-mono flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.02] shadow-lg shadow-amber-500/20"
                    >
                      <Sparkles className="w-4 h-4 stroke-[2.5px]" />
                      <span>Encomendar Beat Sob Medida</span>
                    </button>
                    <button
                      onClick={() => changeTab('beats')}
                      className="w-full bg-zinc-950/80 hover:bg-amber-500/10 text-amber-500 font-bold border-2 border-amber-500 px-5 py-2.5 sm:px-6 sm:py-3 rounded-xl transition-all text-xs uppercase tracking-widest font-mono flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.02]"
                    >
                      <Disc className="w-4 h-4" />
                      <span>Catálogo de Beats</span>
                    </button>
                    <button
                      onClick={() => changeTab('projetos')}
                      className="w-full bg-zinc-950/80 hover:bg-amber-500/10 text-amber-500 font-bold border-2 border-amber-500 px-5 py-2.5 sm:px-6 sm:py-3 rounded-xl transition-all text-xs uppercase tracking-widest font-mono flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.02]"
                    >
                      <FolderOpen className="w-4 h-4" />
                      <span>Projetos Realizados</span>
                    </button>
                    <button
                      onClick={() => changeTab('agendar')}
                      className="w-full bg-zinc-950/80 hover:bg-amber-500/10 text-amber-500 font-bold border-2 border-amber-500 px-5 py-2.5 sm:px-6 sm:py-3 rounded-xl transition-all text-xs uppercase tracking-widest font-mono flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.02]"
                    >
                      <Calendar className="w-4 h-4" />
                      <span>Agendar Sessão</span>
                    </button>
                  </div>
                </div>
              </section>

              {/* Presentation / Studio Features */}
              <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-10">
                <section className="bg-gradient-to-r from-zinc-950 to-neutral-900 border border-zinc-900 rounded-2xl p-4 sm:p-8 grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-8">
                  {/* Future Service: Mixagem Digital Avançada */}
                  <div className="space-y-2 sm:space-y-3 relative bg-zinc-900/30 border border-amber-500/20 p-4 sm:p-5 rounded-xl">
                    <div className="flex items-center justify-between">
                      <div className="p-2.5 sm:p-3 bg-amber-500/10 border border-amber-500/20 w-fit rounded-xl">
                        <Volume2 className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500" />
                      </div>
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono tracking-wider bg-amber-500/15 text-amber-400 border border-amber-500/30 uppercase">
                        <Clock className="w-3 h-3" /> Disponível no Futuro
                      </span>
                    </div>
                    <h4 className="font-bold text-white text-sm sm:text-base">Mixagem Digital Avançada</h4>
                    <p className="text-zinc-400 text-xs leading-relaxed">
                      Oferecemos mixagem 100% digital com a mais moderna tecnologia de processamento de áudio, garantindo nitidez e potência excepcionais para a sua música.
                    </p>
                  </div>

                  <div className="space-y-2 sm:space-y-3 p-4 sm:p-5">
                    <div className="p-2.5 sm:p-3 bg-amber-500/10 border border-amber-500/20 w-fit rounded-xl">
                      <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500" />
                    </div>
                    <h4 className="font-bold text-white text-sm sm:text-base">Produção Musical Sob Medida</h4>
                    <p className="text-zinc-400 text-xs leading-relaxed">
                      Instrumentais exclusivos, harmonias sob medida e acompanhamento técnico dedicado para construir faixas lendárias no seu gênero.
                    </p>
                  </div>

                  <div className="space-y-2 sm:space-y-3 p-4 sm:p-5">
                    <div className="p-2.5 sm:p-3 bg-amber-500/10 border border-amber-500/20 w-fit rounded-xl">
                      <Disc className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500" />
                    </div>
                    <h4 className="font-bold text-white text-sm sm:text-base">Legado Audiovisual Completo</h4>
                    <p className="text-zinc-400 text-xs leading-relaxed">
                      Acompanhamos a sua obra desde a primeira nota no piano até a publicação de clipes no YouTube e distribuição do áudio nas principais redes de streaming.
                    </p>
                  </div>
                </section>
              </div>

              {/* Recepção: 2 Projetos mais recentes e 2 Beats mais recentes */}
              <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-8 sm:space-y-12">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
                  {/* Column 1: Recent Projects */}
                  <div className="space-y-3 sm:space-y-4">
                    <div className="flex items-center justify-between border-b border-zinc-900 pb-2.5 sm:pb-3">
                      <div className="flex items-center gap-2">
                        <FolderOpen className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500 animate-pulse" />
                        <h3 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider font-sans">Projetos Recentes</h3>
                      </div>
                      <button 
                        onClick={() => changeTab('projetos')} 
                        className="text-[10px] uppercase font-mono tracking-widest text-amber-500 hover:text-amber-400 flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        Ver todos <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      {projects.slice(0, 2).map((project) => (
                        <div key={project.id} className="bg-zinc-950 border border-zinc-900/80 p-3 sm:p-3.5 rounded-xl flex flex-col gap-2.5 sm:gap-3 hover:border-amber-500/30 transition-all group">
                          <div className="relative aspect-video w-full rounded-lg overflow-hidden bg-zinc-900 group/cover">
                            {playingVideoId === project.id && project.youtubeId ? (
                              <div className="absolute inset-0 w-full h-full">
                                <iframe
                                  src={`${getYoutubeEmbedUrl(project.youtubeId)}?autoplay=1`}
                                  title={project.title}
                                  frameBorder="0"
                                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                  allowFullScreen
                                  className="w-full h-full"
                                />
                                <button
                                  onClick={() => setPlayingVideoId(null)}
                                  className="absolute top-2 right-2 z-20 bg-black/80 hover:bg-black text-white text-[9px] font-bold px-2 py-1 rounded border border-zinc-800/80 transition-all cursor-pointer"
                                >
                                  Fechar ✕
                                </button>
                              </div>
                            ) : (
                              <div
                                onClick={() => {
                                  if (project.youtubeId) {
                                    setPlayingVideoId(project.id);
                                    setIsBeatPlaying(false); // Stop any playing beat store audio
                                  }
                                }}
                                className={`w-full h-full relative ${project.youtubeId ? 'cursor-pointer' : ''}`}
                                title={project.youtubeId ? "Assistir no YouTube (reproduzir aqui)" : ""}
                              >
                                <img 
                                  src={transformGoogleDriveUrl(project.coverImage)} 
                                  alt={project.title} 
                                  referrerPolicy="no-referrer"
                                  className="w-full h-full object-cover group-hover/cover:scale-105 transition-transform duration-300" 
                                />
                                {project.youtubeId && (
                                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/cover:opacity-100 transition-opacity flex items-center justify-center">
                                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-red-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg transform group-hover/cover:scale-110 transition-transform">
                                      <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-current ml-0.5" />
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <span className="text-[9px] font-mono font-bold bg-zinc-900 border border-zinc-800 text-amber-500 px-2 py-0.5 rounded-full uppercase tracking-wider">
                              {project.type}
                            </span>
                            <h4 className="font-bold text-white text-xs truncate mt-1.5">{project.title}</h4>
                            <p className="text-zinc-500 text-[11px] truncate mt-0.5">{project.artist}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Column 2: Recent Beats */}
                  <div className="space-y-3 sm:space-y-4">
                    <div className="flex items-center justify-between border-b border-zinc-900 pb-2.5 sm:pb-3">
                      <div className="flex items-center gap-2">
                        <Disc className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500 animate-pulse" />
                        <h3 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider font-sans">Beats Recentes</h3>
                      </div>
                      <button 
                        onClick={() => changeTab('beats')} 
                        className="text-[10px] uppercase font-mono tracking-widest text-amber-500 hover:text-amber-400 flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        Ver todos <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      {beats.slice(0, 2).map((beat) => (
                        <div key={beat.id} className="bg-zinc-950 border border-zinc-900/80 p-3 sm:p-3.5 rounded-xl flex flex-col gap-2.5 sm:gap-3 hover:border-amber-500/30 transition-all group">
                          <div className="relative aspect-square w-full rounded-lg overflow-hidden bg-zinc-900">
                            <img 
                              src={transformGoogleDriveUrl(beat.coverUrl || BEAT_COVER_DEFAULT)} 
                              alt={beat.title} 
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                            />
                            <button
                              onClick={() => handlePlayBeat(beat)}
                              className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
                            >
                              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-amber-500 rounded-full flex items-center justify-center text-black font-bold shadow-lg">
                                {currentPlayingBeat?.id === beat.id && isBeatPlaying ? (
                                  <Pause className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />
                                ) : (
                                  <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-current ml-0.5" />
                                )}
                              </div>
                            </button>
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-bold text-white text-xs truncate">{beat.title}</h4>
                            <p className="text-zinc-400 text-[10px] truncate mt-0.5">
                              <span className="text-zinc-500 font-mono">Produtor:</span> <span className="text-amber-400 font-semibold">{beat.producer || 'Omni Sounds'}</span>
                            </p>
                            <p className="text-zinc-500 text-[10px] font-mono mt-0.5">{beat.genre} • {beat.bpm} BPM</p>
                            <div className="flex justify-between items-center mt-2 pt-2 border-t border-zinc-900">
                              <span className="text-[11px] font-bold text-amber-500 font-mono">
                                {beat.priceBasic.toLocaleString()} KZ
                              </span>
                              <button
                                onClick={() => changeTab('beats')}
                                className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 hover:text-amber-500 transition-colors"
                              >
                                Ver Licenças
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Quick actions for Studio navigation */}
                <div className="border-t border-zinc-900/80 pt-6 sm:pt-8 flex flex-wrap justify-center items-center gap-3 sm:gap-4">
                  <button
                    onClick={() => changeTab('beats')}
                    className="bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold px-5 py-2.5 sm:px-6 sm:py-3 rounded-xl transition-all shadow-lg shadow-amber-500/10 flex items-center gap-2 cursor-pointer"
                  >
                    <Disc className="w-4 h-4" />
                    <span>Explorar Catálogo de Beats</span>
                  </button>
                  <button
                    onClick={() => changeTab('agendar')}
                    className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 text-xs font-bold px-5 py-2.5 sm:px-6 sm:py-3 rounded-xl transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <Calendar className="w-4 h-4 text-amber-500" />
                    <span>Agendar Sessão de Gravação</span>
                  </button>
                </div>
              </div>
            </>
          )}

          {activeTab === 'beats' && (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
              <div className="text-center mb-8">
                <div className="flex justify-center items-center gap-2 mb-2">
                  <Disc className="w-5 h-5 text-amber-500" />
                  <span className="text-xs font-mono font-bold text-amber-500/80 uppercase tracking-widest">Omni Beat Store</span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-white font-sans">
                  Beats Exclusivos
                </h3>
                <p className="text-zinc-400 text-xs sm:text-sm mt-2 max-w-xl mx-auto">
                  Adquira licenças para gravar seus vocais sobre produções profissionais criadas no nosso laboratório. WAV, MP3 e Stems multipistas inclusos.
                </p>
              </div>

              <BeatStore
                beats={beats}
                onPlayBeat={handlePlayBeat}
                currentPlayingBeat={currentPlayingBeat}
                isPlaying={isBeatPlaying}
                onPurchase={handlePurchase}
                onOpenCustomOrder={() => setIsCustomOrderModalOpen(true)}
              />
            </div>
          )}

          {activeTab === 'projetos' && (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
              <div className="text-center mb-8">
                <div className="flex justify-center items-center gap-2 mb-2">
                  <FolderOpen className="w-5 h-5 text-amber-500" />
                  <span className="text-xs font-mono font-bold text-amber-500/80 uppercase tracking-widest">Trabalho Consagrado</span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-white font-sans">
                  Projetos Omni Sounds
                </h3>
                <p className="text-zinc-400 text-xs sm:text-sm mt-2 max-w-xl mx-auto">
                  Descubra os lançamentos mundiais, videoclipes, faixas de estúdio e álbuns inteiramente concebidos e moldados pelo nosso selo.
                </p>
              </div>

              <Portfolio projects={projects} isAdmin={isAdmin} />
            </div>
          )}

          {activeTab === 'agendar' && (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
              <div className="text-center mb-8">
                <div className="flex justify-center items-center gap-2 mb-2">
                  <Calendar className="w-5 h-5 text-amber-500" />
                  <span className="text-xs font-mono font-bold text-amber-500/80 uppercase tracking-widest">Estúdio de Gravação</span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-white font-sans">
                  Marcar Sessão de Estúdio
                </h3>
                <p className="text-zinc-400 text-xs sm:text-sm mt-2 max-w-xl mx-auto">
                  Reserve uma sessão profissional de gravação de voz ou instrumentos, mixagem e masterização digital. Planeje suas datas no calendário interativo.
                </p>
              </div>

              <BookingSystem
                onAddBooking={handleAddBooking}
                myBookings={bookings}
                settings={settings}
              />
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Styled Footer */}
      <footer className="bg-black border-t border-zinc-900 pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          
          {/* Logo brand */}
          <div className="space-y-4 md:col-span-2">
            <div className="flex items-center gap-3">
              {settings.logoUrl ? (
                <div className="flex items-center gap-3">
                  <img
                    src={transformGoogleDriveUrl(settings.logoUrl)}
                    alt={settings.studioName || "Omni Sounds"}
                    referrerPolicy="no-referrer"
                    className="h-8 sm:h-10 w-auto object-contain rounded"
                    onError={(e) => {
                      (e.currentTarget as HTMLElement).style.display = 'none';
                    }}
                  />
                  <span className="font-sans font-bold text-white tracking-widest uppercase">{settings.studioName || "Omni Sounds"}</span>
                </div>
              ) : (
                <>
                  <div className="p-2 bg-amber-500 rounded-lg">
                    <Radio className="w-4 h-4 text-black" />
                  </div>
                  <span className="font-sans font-bold text-white tracking-widest uppercase">{settings.studioName || "Omni Sounds"}</span>
                </>
              )}
            </div>
            <p className="text-zinc-500 text-xs max-w-sm leading-relaxed">
              {settings.aboutText}
            </p>
            {/* Social shares */}
            <div className="flex items-center gap-3 pt-2">
              <a href={settings.instagramUrl} target="_blank" rel="noopener noreferrer" className="p-2.5 bg-zinc-950 hover:bg-zinc-900 border border-zinc-900 rounded-xl text-zinc-400 hover:text-amber-500 transition-colors">
                <Instagram className="w-4 h-4" />
              </a>
              <a href={settings.youtubeUrl} target="_blank" rel="noopener noreferrer" className="p-2.5 bg-zinc-950 hover:bg-zinc-900 border border-zinc-900 rounded-xl text-zinc-400 hover:text-amber-500 transition-colors">
                <Youtube className="w-4 h-4" />
              </a>
              <a href={settings.drivePortfolioUrl} target="_blank" rel="noopener noreferrer" className="p-2.5 bg-zinc-950 hover:bg-zinc-900 border border-zinc-900 rounded-xl text-zinc-400 hover:text-amber-500 transition-colors" title="Google Drive Geral">
                <FolderOpen className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Contact Details Column */}
          <div className="space-y-4">
            <h4 className="text-xs uppercase font-bold tracking-widest text-zinc-400 font-mono font-bold">Contato Comercial</h4>
            <ul className="space-y-2 text-zinc-500 text-xs">
              <li className="flex items-center gap-2 font-semibold">
                <Mail className="w-4 h-4 text-amber-500 flex-shrink-0" />
                <span>{settings.contactEmail}</span>
              </li>
              <li className="flex items-center gap-2 font-mono">
                <Phone className="w-4 h-4 text-amber-500 flex-shrink-0" />
                <span>{settings.contactPhone}</span>
              </li>
              <li className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-amber-500 flex-shrink-0" />
                <span>{settings.address}</span>
              </li>
            </ul>
          </div>

          {/* Quick Links Column */}
          <div className="space-y-4">
            <h4 className="text-xs uppercase font-bold tracking-widest text-zinc-400 font-mono font-bold">Navegação</h4>
            <ul className="space-y-2 text-zinc-500 text-xs">
              <li><button onClick={() => changeTab('estudio')} className="hover:text-amber-500 transition-colors text-left">Sobre a Omni Sounds</button></li>
              <li><button onClick={() => changeTab('beats')} className="hover:text-amber-500 transition-colors text-left">Loja de Beats</button></li>
              <li><button onClick={() => changeTab('projetos')} className="hover:text-amber-500 transition-colors text-left">Projetos</button></li>
              <li><button onClick={() => changeTab('agendar')} className="hover:text-amber-500 transition-colors text-left">Agendar Gravação</button></li>
            </ul>
          </div>
        </div>

        {/* Legal copyrights */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-zinc-900/60 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-zinc-600 font-mono">
          <span>© 2026 Omni Sounds. Todos os direitos reservados.</span>
          <span>Desenvolvido na plataforma de workspace de áudio digital.</span>
        </div>
      </footer>

      {/* Embedded Admin Panel */}
      {isAdmin && (
        <AdminPanel
          beats={beats}
          onAddBeat={handleAddBeat}
          onDeleteBeat={handleDeleteBeat}
          onUpdateBeat={handleUpdateBeat}
          bookings={bookings}
          onUpdateBookingStatus={handleUpdateBookingStatus}
          onDeleteBooking={handleDeleteBooking}
          projects={projects}
          onAddProject={handleAddProject}
          onDeleteProject={handleDeleteProject}
          onUpdateProject={handleUpdateProject}
          settings={settings}
          onUpdateSettings={handleUpdateSettings}
          purchases={purchases}
          onUpdatePurchaseStatus={handleUpdatePurchaseStatus}
          onDeletePurchase={handleDeletePurchase}
          customOrders={customOrders}
          onUpdateCustomOrderStatus={handleUpdateCustomOrderStatus}
          onDeleteCustomOrder={handleDeleteCustomOrder}
          currentFont={fontStyle}
          onSelectFont={setFontStyle}
        />
      )}

      {/* Custom Beat Order Modal */}
      <CustomBeatOrderModal
        isOpen={isCustomOrderModalOpen}
        onClose={() => setIsCustomOrderModalOpen(false)}
        onSubmitOrder={handleCreateCustomBeatOrder}
        settings={settings}
      />

      {/* Login Modal */}
      <AnimatePresence>
        {isLoginModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsLoginModalOpen(false)}
              className="absolute inset-0 bg-black/85 backdrop-blur-md"
            />

            {/* Modal Body */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.2 }}
              className="relative w-full max-w-md bg-zinc-950 border border-zinc-900 rounded-2xl p-8 shadow-2xl z-10 space-y-6 overflow-hidden"
            >
              {/* Background decorative element */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

              {/* Close Button */}
              <button
                onClick={() => setIsLoginModalOpen(false)}
                className="absolute top-4 right-4 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white p-2 rounded-xl transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Modal Header */}
              <div className="space-y-2 text-center">
                <div className="inline-flex p-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-amber-500">
                  <User className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-white tracking-tight font-sans">Iniciar Sessão</h3>
                <p className="text-zinc-400 text-xs max-w-xs mx-auto">
                  Aceda à plataforma Omni Sounds. Não é necessário iniciar sessão para navegar.
                </p>
              </div>

              {/* Google Sign-In Button */}
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  className="w-full bg-white hover:bg-zinc-100 text-zinc-950 font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2.5 text-xs cursor-pointer shadow-lg shadow-white/5"
                >
                  <svg className="w-4.5 h-4.5" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v3.9h6.6c-.28 1.5-1.11 2.76-2.36 3.61v3h3.8c2.2-2.02 3.5-5 3.5-8.44z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 24c3.24 0 5.97-1.08 7.96-2.91l-3.8-3c-1.05.7-2.4 1.11-4.16 1.11-3.2 0-5.91-2.16-6.88-5.06H1.2v3.1C3.18 21.3 7.31 24 12 24z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.12 14.14A7.16 7.16 0 0 1 4.8 12c0-.75.13-1.47.32-2.14V6.76H1.2A11.94 11.94 0 0 0 0 12c0 1.92.45 3.74 1.2 5.39l3.92-3.25z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.43-3.43C17.95 1.19 15.24 0 12 0 7.31 0 3.18 2.7 1.2 6.76l3.92 3.25c.97-2.9 3.68-5.06 6.88-5.06z"
                    />
                  </svg>
                  <span>Continuar com o Google</span>
                </button>
                <p className="text-[10px] font-mono text-zinc-500 text-center">
                  Acesso rápido e seguro através da sua conta Google.
                </p>
              </div>

              {/* Separator */}
              <div className="relative flex items-center justify-center py-1">
                <div className="absolute inset-x-0 h-px bg-zinc-900" />
                <span className="relative bg-zinc-950 px-3 text-[10px] font-mono text-zinc-500 uppercase">Ou Aceder com E-mail</span>
              </div>

              {/* Form */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const form = e.currentTarget;
                  const formData = new FormData(form);
                  const emailVal = (formData.get('email') as string || '').trim();
                  const passwordVal = (formData.get('password') as string || '').trim();
                  if (!emailVal) return;

                  const normalizedEmail = emailVal.toLowerCase();
                  const isAdminEmail = normalizedEmail === 'pascoalbernabe678@gamail.com' || normalizedEmail === 'pascoalbernabe678@gmail.com';

                  if (isAdminEmail) {
                    if (passwordVal !== 'omni2026' && passwordVal !== 'aegis2026') {
                      showNotification('❌ Palavra-passe incorreta para a conta de Administrador.');
                      return;
                    }
                    setUserEmail(emailVal);
                    setIsLoginModalOpen(false);
                    showNotification('🎉 Sessão de Administrador iniciada com sucesso. Painel liberado.');
                  } else {
                    setUserEmail(emailVal);
                    setIsLoginModalOpen(false);
                    showNotification(`Sessão iniciada como ${emailVal}.`);
                  }
                }}
                className="space-y-4 text-left"
              >
                {/* Email Field */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block font-mono">
                    Endereço de E-mail
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    <input
                      name="email"
                      type="email"
                      required
                      autoComplete="off"
                      placeholder="seu-email@dominio.com"
                      className="w-full bg-zinc-900/60 border border-zinc-900 rounded-xl pl-11 pr-4 py-3 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-amber-500/50 transition-colors"
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block font-mono">
                    Palavra-passe (Opcional)
                  </label>
                  <div className="relative">
                    <Shield className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    <input
                      name="password"
                      type="password"
                      autoComplete="new-password"
                      placeholder="••••••••"
                      className="w-full bg-zinc-900/60 border border-zinc-900 rounded-xl pl-11 pr-4 py-3 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-amber-500/50 transition-colors"
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  className="w-full bg-amber-500 hover:bg-amber-400 text-black font-extrabold py-3.5 rounded-xl shadow-lg shadow-amber-500/10 transition-all flex items-center justify-center gap-2 text-xs uppercase tracking-wider cursor-pointer font-mono"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Entrar com E-mail</span>
                </button>
              </form>

              {/* Helper Footer */}
              <div className="text-center pt-1">
                <span className="text-[10px] font-mono text-zinc-500 block leading-relaxed">
                  Autenticação segura via Google disponível para a equipe e parceiros da Omni Sounds.
                </span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Global Audio Component */}
      <audio
        ref={audioRef}
        onTimeUpdate={() => {
          if (audioRef.current) {
            setAudioCurrentTime(audioRef.current.currentTime);
          }
        }}
        onLoadedMetadata={() => {
          if (audioRef.current) {
            setAudioDuration(audioRef.current.duration);
          }
        }}
        onEnded={() => {
          setIsBeatPlaying(false);
          setAudioCurrentTime(0);
        }}
        onError={() => {
          // Switch to fallback embedded player for Google Drive streams when direct audio encounters CORS or format restrictions
          if (currentPlayingBeat && isGoogleDriveUrl(currentPlayingBeat.audioUrl)) {
            setDrivePlaybackFallback(true);
          } else if (currentPlayingBeat && !isYoutubeUrl(currentPlayingBeat.audioUrl)) {
            console.warn("Direct audio failed to load:", currentPlayingBeat.audioUrl);
            setIsBeatPlaying(false);
            showNotification("Aviso: Não foi possível reproduzir este arquivo de áudio diretamente.");
          }
        }}
      />

      {/* Global Floating Player Bar */}
      <AnimatePresence>
        {currentPlayingBeat && (
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className="fixed bottom-0 left-0 right-0 z-40 bg-zinc-950/95 border-t border-zinc-900 shadow-2xl backdrop-blur-md px-3 py-2 sm:px-4 sm:py-3.5 flex items-center justify-between gap-2 sm:gap-4"
          >
            {/* Left side: Beat info & animated visualizer */}
            <div className="flex items-center gap-2 sm:gap-3 w-auto max-w-[40%] sm:max-w-none md:w-1/3 min-w-0">
              <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-lg overflow-hidden flex-shrink-0 border border-zinc-800">
                <img
                  src={transformGoogleDriveUrl(currentPlayingBeat.coverUrl)}
                  alt={currentPlayingBeat.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <h4 className="font-bold text-white text-[11px] sm:text-sm truncate">{currentPlayingBeat.title}</h4>
                  <span className="hidden sm:inline bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[9px] px-1.5 py-0.2 rounded font-mono uppercase">
                    {currentPlayingBeat.genre}
                  </span>
                </div>
                <p className="text-zinc-400 text-[9px] sm:text-[11px] truncate mt-0.5">
                  <span className="text-zinc-500">Produtor:</span> <span className="text-amber-400 font-semibold">{currentPlayingBeat.producer || 'Omni Sounds'}</span> • {currentPlayingBeat.bpm} BPM • {currentPlayingBeat.key}
                </p>
              </div>

              {/* Staggered animated bars visualizer */}
              {isBeatPlaying && (
                <div className="hidden sm:flex items-end gap-0.5 h-4 w-6 flex-shrink-0">
                  <span className="w-1 bg-amber-500 rounded-full animate-bounce" style={{ height: '60%', animationDelay: '0.1s', animationDuration: '0.8s' }} />
                  <span className="w-1 bg-amber-500 rounded-full animate-bounce" style={{ height: '100%', animationDelay: '0.3s', animationDuration: '0.6s' }} />
                  <span className="w-1 bg-amber-500 rounded-full animate-bounce" style={{ height: '40%', animationDelay: '0.5s', animationDuration: '0.9s' }} />
                  <span className="w-1 bg-amber-500 rounded-full animate-bounce" style={{ height: '80%', animationDelay: '0.2s', animationDuration: '0.7s' }} />
                </div>
              )}
            </div>

            {/* Middle side: Player controls (Play/Pause, scrub slider, timers) */}
            <div className="flex flex-col items-center gap-1 flex-1 max-w-xs md:max-w-md">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsBeatPlaying(!isBeatPlaying)}
                  className="w-8 h-8 sm:w-10 sm:h-10 bg-amber-500 hover:bg-amber-400 text-black rounded-full flex items-center justify-center transition-all hover:scale-105 cursor-pointer shadow-lg shadow-amber-500/15"
                >
                  {isBeatPlaying ? (
                    <Pause className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-current text-black" />
                  ) : (
                    <Play className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-current text-black ml-0.5" />
                  )}
                </button>
              </div>

              {/* Progress Bar (Render slider for direct audio & Google Drive, or streaming badge for YouTube/fallback) */}
              {isYoutubeUrl(currentPlayingBeat.audioUrl) ? (
                <div className="flex items-center justify-center gap-1.5 text-[9px] sm:text-[10px] font-mono text-amber-500/90 tracking-wide">
                  <span className="inline-block w-1.5 h-1.5 bg-red-600 rounded-full animate-ping" />
                  <span>YouTube Stream</span>
                </div>
              ) : drivePlaybackFallback ? (
                <div className="flex items-center justify-center gap-1.5 text-[9px] sm:text-[10px] font-mono text-amber-500/90 tracking-wide">
                  <span className="inline-block w-1.5 h-1.5 bg-amber-500 rounded-full animate-ping" />
                  <span>clique no play assim</span>
                </div>
              ) : (
                <div className="hidden sm:flex items-center gap-2 w-full text-[10px] font-mono text-zinc-500">
                  <span>{formatTime(audioCurrentTime)}</span>
                  <input
                    type="range"
                    min="0"
                    max={audioDuration || 0}
                    value={audioCurrentTime}
                    onChange={handleTimelineChange}
                    className="flex-1 accent-amber-500 h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer"
                  />
                  <span>{formatTime(audioDuration)}</span>
                </div>
              )}
            </div>

            {/* Right side: Volume slider, PiP video player if YouTube / Google Drive fallback, and close button */}
            <div className="flex items-center justify-end gap-2 sm:gap-4 flex-shrink-0">
              {/* Simple Volume control for HTML5 audio */}
              {!isYoutubeUrl(currentPlayingBeat.audioUrl) && !drivePlaybackFallback && (
                <div className="hidden md:flex items-center gap-2 text-zinc-500 hover:text-zinc-300 transition-colors">
                  <Volume2 className="w-4 h-4 text-zinc-400" />
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={audioVolume}
                    onChange={(e) => setAudioVolume(Number(e.target.value))}
                    className="w-16 accent-amber-500 h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
              )}

              {/* Mini Google Drive PiP Player floating overlay (when in fallback mode) */}
              {isGoogleDriveUrl(currentPlayingBeat.audioUrl) && drivePlaybackFallback && !hideDrivePiP && (
                <div className="fixed bottom-20 right-3 sm:right-4 z-50 w-56 sm:w-64 aspect-video bg-black rounded-xl border border-amber-500/40 shadow-2xl overflow-hidden group">
                  {isBeatPlaying ? (
                    <div className="relative w-full h-full overflow-hidden">
                      {getGoogleDriveFileId(currentPlayingBeat.audioUrl) ? (
                        <iframe
                          src={`https://drive.google.com/file/d/${getGoogleDriveFileId(currentPlayingBeat.audioUrl)}/preview`}
                          title={currentPlayingBeat.title}
                          frameBorder="0"
                          allow="autoplay; encrypted-media"
                          className="w-full h-full bg-zinc-950"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs text-zinc-500 font-mono">
                          Link do Drive inválido
                        </div>
                      )}

                      {/* Header overlay: Completely covers Google Drive's top bar (title and expand/pop-out icon) */}
                      <div className="absolute top-0 left-0 right-0 h-11 bg-zinc-950/95 border-b border-zinc-800/90 px-2.5 py-1.5 flex items-center justify-between z-20 pointer-events-auto select-none shadow-md">
                        <div className="flex items-center gap-1.5 min-w-0 pr-1">
                          <Lock className="w-3 h-3 text-amber-500 flex-shrink-0" />
                          <span className="text-[10px] font-mono text-zinc-200 font-bold truncate">
                            {currentPlayingBeat.title}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <span className="text-[8px] bg-amber-500/15 border border-amber-500/30 text-amber-400 font-mono font-bold px-1.5 py-0.5 rounded flex items-center gap-1">
                            <ShieldCheck className="w-2.5 h-2.5 text-amber-400" />
                            <span>Protegido</span>
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setHideDrivePiP(true);
                            }}
                            className="text-zinc-400 hover:text-white p-0.5 rounded hover:bg-zinc-800 transition-colors cursor-pointer"
                            title="Ocultar janela flutuante"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      {/* Dedicated Click Shield: completely intercepts any clicks in the top-right area where Google Drive's pop-out/expand button is */}
                      <div 
                        className="absolute top-0 right-0 w-28 h-12 z-30 cursor-not-allowed bg-transparent"
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          showNotification("🔒 Redirecionamento bloqueado. Para baixar o beat completo (WAV / Stems), adquira a licença na loja.");
                        }}
                        title="Download bloqueado. Adquira a licença para receber os arquivos originais."
                      />
                    </div>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-950 border border-zinc-900 rounded-xl relative">
                      <img
                        src={transformGoogleDriveUrl(currentPlayingBeat.coverUrl)}
                        alt="Beat Cover"
                        referrerPolicy="no-referrer"
                        className="absolute inset-0 w-full h-full object-cover opacity-20 blur-[1px]"
                      />
                      <Play className="w-6 h-6 text-zinc-600 relative z-10" />
                      <span className="text-[9px] font-mono text-zinc-500 mt-1 relative z-10">Pausado</span>
                    </div>
                  )}
                </div>
              )}

              {/* Mini YouTube PiP Player floating overlay */}
              {isYoutubeUrl(currentPlayingBeat.audioUrl) && (
                <div className="fixed bottom-20 right-3 sm:right-4 z-50 w-36 sm:w-56 aspect-video bg-black rounded-xl border border-zinc-900 shadow-2xl overflow-hidden group">
                  {isBeatPlaying ? (
                    <iframe
                      src={`${getYoutubeEmbedUrl(getYoutubeVideoId(currentPlayingBeat.audioUrl))}?autoplay=1&mute=0&controls=0&modestbranding=1`}
                      title={currentPlayingBeat.title}
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      className="w-full h-full"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-950 border border-zinc-900 rounded-xl relative">
                      <img
                        src={transformGoogleDriveUrl(currentPlayingBeat.coverUrl)}
                        alt="Beat Cover"
                        referrerPolicy="no-referrer"
                        className="absolute inset-0 w-full h-full object-cover opacity-20 blur-[1px]"
                      />
                      <Play className="w-6 h-6 text-zinc-600 relative z-10" />
                      <span className="text-[9px] font-mono text-zinc-500 mt-1 relative z-10">Pausado</span>
                    </div>
                  )}
                  {/* PiP title banner */}
                  <div className="absolute top-0 left-0 right-0 bg-black/80 backdrop-blur-sm px-2 py-1 flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-[9px] font-mono text-zinc-300 truncate">{currentPlayingBeat.title}</span>
                    <span className="text-[8px] bg-red-600 font-bold px-1 rounded text-white font-sans uppercase">YouTube</span>
                  </div>
                </div>
              )}

              {/* Close Button to stop beat player */}
              <button
                onClick={() => {
                  setIsBeatPlaying(false);
                  setCurrentPlayingBeat(null);
                }}
                className="bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white p-1.5 sm:p-2 rounded-lg sm:rounded-xl border border-zinc-850 transition-all cursor-pointer"
                title="Fechar Player"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
