import React, { useState } from 'react';
import { Play, ExternalLink, Instagram, Music, Disc, FolderOpen } from 'lucide-react';
import { StudioProject, transformGoogleDriveUrl } from '../types';

interface PortfolioProps {
  projects: StudioProject[];
  isAdmin?: boolean;
}

export default function Portfolio({ projects, isAdmin = false }: PortfolioProps) {
  const [activeType, setActiveType] = useState('Todos');
  const [playingProjectId, setPlayingProjectId] = useState<string | null>(null);

  const projectTypes = ['Todos', 'Single', 'Álbum', 'Clipe', 'Beats'];

  const filteredProjects = projects.filter(project => {
    return activeType === 'Todos' || project.type === activeType;
  });

  // Extract video ID if user pasted full YouTube link, otherwise use direct ID
  const getEmbedUrl = (youtubeId: string) => {
    let id = youtubeId;
    if (youtubeId.includes('youtube.com/watch?v=')) {
      id = youtubeId.split('v=')[1]?.split('&')[0] || youtubeId;
    } else if (youtubeId.includes('youtu.be/')) {
      id = youtubeId.split('youtu.be/')[1]?.split('?')[0] || youtubeId;
    }
    return `https://www.youtube.com/embed/${id}`;
  };

  return (
    <div id="portfolio-section" className="py-4">
      {/* Category filter */}
      <div className="flex flex-wrap gap-2 mb-8 justify-center">
        {projectTypes.map(type => (
          <button
            key={type}
            onClick={() => setActiveType(type)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-300 ${
              activeType === type
                ? 'bg-amber-500 text-black shadow-md shadow-amber-500/10'
                : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800 border border-zinc-800/40'
            }`}
          >
            {type}
          </button>
        ))}
      </div>

      {/* Grid of Projects */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProjects.map(project => (
          <div
            key={project.id}
            className="bg-zinc-950/80 border border-zinc-900 rounded-xl overflow-hidden hover:border-amber-500/30 transition-all duration-300 flex flex-col group"
          >
            {/* Visual Aspect / Cover or YouTube Frame */}
            <div 
              className="relative aspect-video bg-zinc-900 overflow-hidden border-b border-zinc-900 group/cover"
            >
              {playingProjectId === project.id && project.youtubeId ? (
                <div className="absolute inset-0 w-full h-full">
                  <iframe
                    src={`${getEmbedUrl(project.youtubeId)}?autoplay=1`}
                    title={project.title}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    className="w-full h-full"
                  />
                  {/* Small absolute inline overlay button to close/stop video */}
                  <button
                    onClick={() => setPlayingProjectId(null)}
                    className="absolute top-2 right-2 z-20 bg-black/80 hover:bg-black text-white text-[9px] font-bold px-2 py-1 rounded border border-zinc-800/80 transition-all"
                  >
                    Fechar ✕
                  </button>
                </div>
              ) : (
                <div 
                  onClick={() => project.youtubeId && setPlayingProjectId(project.id)}
                  className={`w-full h-full relative ${project.youtubeId ? 'cursor-pointer' : ''}`}
                >
                  <img
                    src={transformGoogleDriveUrl(project.coverImage)}
                    alt={project.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  
                  {/* Play Overlay (shown on hover) */}
                  {project.youtubeId && (
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/cover:opacity-100 flex items-center justify-center transition-opacity duration-300">
                      <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center text-white shadow-xl transform scale-90 group-hover/cover:scale-100 transition-transform duration-300">
                        <Play className="w-5 h-5 fill-current ml-0.5" />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Drive Folder access link strictly reserved for administrator */}
              {isAdmin && project.driveFolderUrl && (
                <div className="absolute bottom-3 right-3 z-10">
                  <a
                    href={project.driveFolderUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()} // Prevent triggering YouTube overlay player
                    className="bg-amber-500 hover:bg-amber-400 text-black p-2 rounded-full shadow-lg transition-transform hover:scale-110 flex items-center justify-center cursor-pointer"
                    title="Acessar Pasta Google Drive de Entrega (Acesso Restrito: Administrador)"
                  >
                    <FolderOpen className="w-4 h-4" />
                  </a>
                </div>
              )}

              {/* Tag style type badge */}
              <span className="absolute top-3 left-3 bg-black/60 backdrop-blur-md text-amber-500 text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded border border-amber-500/20 font-mono">
                {project.type}
              </span>
            </div>

            {/* Project Content Info */}
            <div className="p-5 flex-1 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block mb-1">
                  {project.releaseDate}
                </span>
                
                {/* Horizontal layout with song name and YouTube watch button */}
                <div className="flex justify-between items-start gap-4">
                  <div className="min-w-0">
                    <h4 className="font-bold text-white text-base group-hover:text-amber-500 transition-colors truncate" title={project.title}>
                      {project.title}
                    </h4>
                    <p className="text-zinc-400 text-sm mt-1 font-medium truncate">{project.artist}</p>
                  </div>
                  
                  {/* Dedicated YouTube watch button right after the song name */}
                  {project.youtubeId && (
                    <button
                      onClick={() => setPlayingProjectId(playingProjectId === project.id ? null : project.id)}
                      className={`flex-shrink-0 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg border transition-all cursor-pointer hover:scale-105 ${
                        playingProjectId === project.id 
                          ? 'bg-zinc-800 hover:bg-zinc-700 text-amber-500 border-zinc-700 shadow-md' 
                          : 'bg-red-600 hover:bg-red-500 text-white border-red-500/20 shadow-md shadow-red-600/10'
                      }`}
                      title={playingProjectId === project.id ? "Parar Reprodução" : "Assistir Vídeo no YouTube"}
                    >
                      <Play className="w-3 h-3 fill-current" />
                      <span>{playingProjectId === project.id ? "Parar" : "Assistir"}</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Social and Delivery Actions */}
              <div className="flex items-center justify-between mt-5 pt-4 border-t border-zinc-900/80">
                <span className="text-xs text-zinc-500 font-mono">produzido por Omni Sounds</span>
                
                <div className="flex items-center gap-2.5">
                  {project.instagramUrl && (
                    <a
                      href={project.instagramUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-zinc-500 hover:text-amber-500 transition-colors"
                      title="Instagram do Artista"
                    >
                      <Instagram className="w-4 h-4" />
                    </a>
                  )}
                  {project.spotifyUrl && (
                    <a
                      href={project.spotifyUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-zinc-500 hover:text-amber-500 transition-colors"
                      title="Spotify"
                    >
                      <Disc className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
