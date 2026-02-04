
import React, { useEffect, useRef, useState } from 'react';

interface WebRTCPlayerProps {
    streamUrl: string; // URL do stream no go2rtc (ex: 'demo_pattern' ou 'minha_camera')
    go2rtcServer?: string; // Endereço do servidor go2rtc (padrão: http://localhost:1984)
    className?: string;
    muted?: boolean;
}

/**
 * Componente WebRTCPlayer
 * Integração com o servidor go2rtc para streaming de baixa latência.
 */
const WebRTCPlayer: React.FC<WebRTCPlayerProps> = ({
    streamUrl,
    go2rtcServer = 'http://127.0.0.1:1984',

    className = '',
    muted = true
}) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const pcRef = useRef<RTCPeerConnection | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;

        async function startStreaming() {
            try {
                setIsLoading(true);
                setError(null);

                const pc = new RTCPeerConnection({
                    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
                });

                pcRef.current = pc;

                pc.ontrack = (event) => {
                    if (videoRef.current && event.streams[0]) {
                        videoRef.current.srcObject = event.streams[0];
                    }
                };

                pc.oniceconnectionstatechange = () => {
                    if (pc.iceConnectionState === 'failed') {
                        setError('Falha na conexão WebRTC');
                    }
                };

                // Adiciona transceiver apenas para vídeo (mais estável para testes)
                pc.addTransceiver('video', { direction: 'recvonly' });

                const offer = await pc.createOffer();
                await pc.setLocalDescription(offer);

                const response = await fetch(`${go2rtcServer}/api/webrtc?src=${encodeURIComponent(streamUrl)}&medias=video`, {
                    method: 'POST',
                    body: offer.sdp
                });


                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`Servidor: ${response.status} - ${errorText || response.statusText}`);
                }

                const answerSdp = await response.text();
                if (isMounted) {
                    await pc.setRemoteDescription(new RTCSessionDescription({ type: 'answer', sdp: answerSdp }));
                    setIsLoading(false);
                }
            } catch (err: any) {
                console.error('Erro WebRTC:', err);
                if (isMounted) {
                    setError(err.message || 'Erro ao conectar ao stream');
                    setIsLoading(false);
                }
            }
        }

        startStreaming();

        return () => {
            isMounted = false;
            if (pcRef.current) {
                pcRef.current.close();
            }
        };
    }, [streamUrl, go2rtcServer]);

    return (
        <div className={`relative bg-black group ${className}`}>
            <video
                ref={videoRef}
                autoPlay
                playsInline
                muted={muted}
                className="w-full h-full object-cover"
            />

            {isLoading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm transition-opacity">
                    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                    <span className="mt-2 text-[10px] font-black text-white uppercase tracking-widest opacity-50">Conectando...</span>
                </div>
            )}

            {error ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-500/10 backdrop-blur-[2px] p-4 text-center">
                    <span className="material-symbols-outlined text-red-500 text-2xl mb-2">signal_disconnected</span>
                    <p className="text-[9px] font-bold text-red-400 uppercase tracking-tighter max-w-[150px] line-clamp-2">
                        {error}
                    </p>
                    <button
                        onClick={() => window.location.reload()}
                        className="mt-2 px-3 py-1 bg-red-500/20 hover:bg-red-500/40 text-red-500 text-[8px] font-black uppercase rounded border border-red-500/30 transition-all"
                    >
                        Reconectar
                    </button>
                </div>
            ) : (
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="px-1.5 py-0.5 bg-green-500/20 border border-green-500/30 rounded text-[7px] font-black text-green-400 uppercase tracking-widest">
                        LIVE WebRTC
                    </div>
                </div>
            )}
        </div>
    );
};

export default WebRTCPlayer;
