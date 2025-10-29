// app/_Components/CameraViewer.tsx
'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Hls from 'hls.js';
import { 
  Camera as CameraIcon, 
  Circle, 
  RotateCw, 
  Maximize2,
  Volume2,
  VolumeX 
} from 'lucide-react';

interface CameraViewerData {
  id: string | number;
  name: string;
  location?: string;
  status: 'online' | 'offline' | 'recording' | 'maintenance' | 'error' | 'live';
  stream_url?: string | null;
  ip_address?: string;
  direct_stream_url?: string; 
}

interface CameraViewerProps {
  camera: CameraViewerData;
  isSelected?: boolean;
  onSnapshot: () => void;
  onRecord: () => void;
  onRestart: () => void;
  useDirectStream?: boolean; 
}

export default function CameraViewer({
  camera,
  isSelected = false,
  onSnapshot,
  onRecord,
  onRestart,
  useDirectStream = true, 
}: CameraViewerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // NEW: Initialize MJPEG stream
  const initializeMJPEGStream = useCallback(() => {
    if (!imgRef.current || !camera.direct_stream_url) return;

    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://192.168.0.104:8000';
    const streamUrl = camera.direct_stream_url.startsWith('http') 
      ? camera.direct_stream_url 
      : `${baseUrl}${camera.direct_stream_url}`;
    
    console.log('MJPEG Stream URL:', streamUrl);

    const img = imgRef.current;
    
    img.onload = () => {
      setIsLoading(false);
      setHasError(false);
    };

    img.onerror = () => {
      console.error('MJPEG Stream Error');
      setHasError(true);
      setIsLoading(false);
      
      // Retry after 5 seconds
      setTimeout(() => {
        if (imgRef.current) {
          imgRef.current.src = `${streamUrl}?t=${Date.now()}`;
        }
      }, 5000);
    };

    img.src = streamUrl;
  }, [camera.direct_stream_url]);

  const initializeHLSStream = useCallback(() => {
    if (!videoRef.current || !camera.stream_url) return;

    const video = videoRef.current;
    const baseUrl = process.env.NEXT_PUBLIC_MEDIA_URL || 'http://192.168.0.122:8000';
    const streamUrl = `${baseUrl}${camera.stream_url}`;
    
    console.log('HLS Stream URL:', streamUrl);

    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 90,
      });

      hls.loadSource(streamUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().catch(err => {
          console.error('Error playing video:', err);
        });
        setIsLoading(false);
        setHasError(false);
      });

      hls.on(Hls.Events.ERROR, (event, data) => {
        console.error('HLS Error:', data);
        if (data.fatal) {
          setHasError(true);
          setIsLoading(false);
          
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              console.log('Fatal network error encountered, trying to recover...');
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              console.log('Fatal media error encountered, trying to recover...');
              hls.recoverMediaError();
              break;
            default:
              console.log('Fatal error, reinitializing in 5 seconds...');
              hls.destroy();
              setTimeout(() => {
                initializeHLSStream();
              }, 5000);
              break;
          }
        }
      });

      hlsRef.current = hls;
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // For Safari
      video.src = streamUrl;
      video.addEventListener('loadedmetadata', () => {
        video.play().catch(err => {
          console.error('Error playing video:', err);
        });
        setIsLoading(false);
      });
      
      video.addEventListener('error', () => {
        setHasError(true);
        setIsLoading(false);
        setTimeout(() => {
          initializeHLSStream();
        }, 5000);
      });
    }
  }, [camera.stream_url]);

  useEffect(() => {
    if (useDirectStream && camera.direct_stream_url) {
      initializeMJPEGStream();
    } else if (camera.stream_url) {
      initializeHLSStream();
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [initializeMJPEGStream, initializeHLSStream, useDirectStream, camera.direct_stream_url, camera.stream_url]);

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsMuted(videoRef.current.muted);
    }
  };

  const toggleFullscreen = async () => {
    const container = videoRef.current?.parentElement || imgRef.current?.parentElement;
    if (!container) return;

    try {
      if (!document.fullscreenElement) {
        await container.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (err) {
      console.error('Error toggling fullscreen:', err);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const getStatusColor = () => {
    switch (camera.status) {
      case 'online': return 'bg-green-500';
      case 'recording': return 'bg-red-500 animate-pulse';
      case 'offline': return 'bg-gray-500';
      case 'maintenance': return 'bg-yellow-500';
      case 'error': return 'bg-red-600';
      default: return 'bg-gray-500';
    }
  };

  const retryConnection = () => {
    setIsLoading(true);
    setHasError(false);
    
    if (useDirectStream && camera.direct_stream_url) {
      initializeMJPEGStream();
    } else if (camera.stream_url) {
      initializeHLSStream();
    }
  };

  return (
    <div className="relative h-full bg-gray-900 border border-gray-800 group">
      {/* Camera Header */}
      <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/70 to-transparent p-2">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-white text-sm font-semibold">{camera.name}</h3>
            <p className="text-gray-300 text-xs">{camera.location}</p>
            {camera.ip_address && (
              <p className="text-gray-400 text-xs">{camera.ip_address}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {useDirectStream && <span className="text-xs text-blue-400">LIVE</span>}
            <div className={`w-3 h-3 rounded-full ${getStatusColor()}`} />
          </div>
        </div>
      </div>

      {/* Video/Image Element */}
      {camera.status !== 'offline' && (useDirectStream ? camera.direct_stream_url : camera.stream_url) ? (
        useDirectStream && camera.direct_stream_url ? (

          <img
            ref={imgRef}
            className="w-full h-full object-contain"
            alt={camera.name}
          />
        ) : (

          <video
            ref={videoRef}
            className="w-full h-full object-contain"
            muted={isMuted}
            autoPlay
            playsInline
            controls={false}
          />
        )
      ) : (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <p className="text-gray-500 mb-2">
              {camera.status === 'offline' ? 'Camera Offline' : 'No Stream Available'}
            </p>
            <button
              onClick={retryConnection}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Retry Connection
            </button>
          </div>
        </div>
      )}

      {/* Loading Indicator */}
      {isLoading && camera.status !== 'offline' && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white mx-auto mb-2"></div>
            <p className="text-white text-sm">Connecting to camera...</p>
          </div>
        </div>
      )}

      {/* Error Message */}
      {hasError && camera.status !== 'offline' && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <div className="text-center">
            <p className="text-red-500 mb-2">Stream Error</p>
            <p className="text-gray-300 text-sm mb-3">Unable to connect to camera</p>
            <button
              onClick={retryConnection}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Retry Now
            </button>
          </div>
        </div>
      )}

      {/* Control Buttons */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="flex justify-between items-end">
          <div className="flex gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSnapshot();
              }}
              className="p-2 bg-black/50 rounded hover:bg-black/70 transition-colors"
              title="Take Snapshot"
            >
              <CameraIcon size={16} className="text-white" />
            </button>
            
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRecord();
              }}
              className={`p-2 rounded transition-colors ${
                camera.status === 'recording' 
                  ? 'bg-red-600 hover:bg-red-700' 
                  : 'bg-black/50 hover:bg-black/70'
              }`}
              title={camera.status === 'recording' ? 'Stop Recording' : 'Start Recording'}
            >
              <Circle 
                size={16} 
                className="text-white"
                fill={camera.status === 'recording' ? 'white' : 'none'}
              />
            </button>
            
            {/* Only show mute for HLS video streams */}
            {!useDirectStream && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleMute();
                }}
                className="p-2 bg-black/50 rounded hover:bg-black/70 transition-colors"
                title={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted ? (
                  <VolumeX size={16} className="text-white" />
                ) : (
                  <Volume2 size={16} className="text-white" />
                )}
              </button>
            )}
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleFullscreen();
              }}
              className="p-2 bg-black/50 rounded hover:bg-black/70 transition-colors"
              title="Fullscreen"
            >
              <Maximize2 size={16} className="text-white" />
            </button>
            
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRestart();
              }}
              className="p-2 bg-black/50 rounded hover:bg-black/70 transition-colors"
              title="Restart Camera"
            >
              <RotateCw size={16} className="text-white" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}