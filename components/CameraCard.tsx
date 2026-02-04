
import React from 'react';
import { Camera } from '../types';
import WebRTCPlayer from './WebRTCPlayer';

interface CameraCardProps {
  camera: Camera;
}

const CameraCard: React.FC<CameraCardProps> = ({ camera }) => {
  const statusColors = {
    online: 'bg-green-500',
    offline: 'bg-red-500',
    unstable: 'bg-yellow-500'
  };

  // Verifica se o ID da câmera parece ser um ID real de stream do go2rtc (ou demo)
  // No seu caso, vamos considerar que se a latência não for falsa (padrão 10-60), podemos tentar o WebRTC
  // Ou simplesmente usar o ID se for um dos IDs que você configurou no go2rtc.yaml
  const isDemo = camera.id === 'demo_pattern' || camera.id === 'demo_video';
  const hasStream = camera.status === 'online' && (isDemo || camera.ip);

  return (
    <div className="group relative aspect-video bg-black rounded-lg overflow-hidden border border-border-dark shadow-sm hover:border-primary/50 transition-all duration-300">
      {/* Feed Area */}
      {hasStream ? (
        <WebRTCPlayer
          streamUrl={camera.ip || camera.id}
          className="absolute inset-0 opacity-80 group-hover:opacity-100 transition-opacity"
        />
      ) : (


        /* Fallback Placeholder Image */
        <div
          className="absolute inset-0 bg-cover bg-center opacity-40 transition-transform duration-700 group-hover:scale-105 group-hover:opacity-60"
          style={{ backgroundImage: `url('https://picsum.photos/seed/${camera.id}/400/225')` }}
        />
      )}

      {/* Static Overlay (Minimalist) */}
      <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/80 to-transparent pointer-events-none transition-opacity duration-300 group-hover:opacity-0">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${statusColors[camera.status]} ${camera.status !== 'offline' ? 'animate-pulse' : ''} shadow-[0_0_8px_rgba(0,0,0,0.5)]`}></span>
          <p className="text-white text-[10px] font-medium truncate drop-shadow-md uppercase tracking-wide">
            {camera.name}
          </p>
        </div>
      </div>

      {/* Hover Overlay (Details) */}
      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-between p-3 backdrop-blur-[1px]">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-1.5 bg-white/10 px-2 py-1 rounded text-[9px] font-bold text-white uppercase backdrop-blur-md border border-white/10">
            <span className={`w-1.5 h-1.5 rounded-full ${statusColors[camera.status]}`}></span>
            {camera.status}
          </div>
          {camera.client && (
            <div className="bg-primary/80 text-white text-[8px] font-black px-2 py-1 rounded uppercase tracking-widest shadow-lg">
              {camera.client}
            </div>
          )}
        </div>

        <div className="space-y-1">
          <p className="text-white text-xs font-bold truncate border-l-2 border-primary pl-2">{camera.name}</p>
          <div className="flex items-center justify-between text-[9px] text-slate-300 font-medium">
            <span className="opacity-80">{camera.brand}</span>
            <div className="flex items-center gap-2">
              <span className="font-mono">{camera.ip}</span>
              {camera.status !== 'offline' && <span className="text-primary">{camera.latency}ms</span>}
            </div>
          </div>
        </div>
      </div>

      {/* Focus Ring */}
      <div className="absolute inset-0 ring-1 ring-white/10 group-hover:ring-primary/50 transition-all pointer-events-none rounded-lg"></div>
    </div>
  );
};

export default CameraCard;
