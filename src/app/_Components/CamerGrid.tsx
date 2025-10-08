// app/_Components/CameraGrid.tsx
'use client';
import { useState, useEffect } from 'react';
import { cameraAPI } from '../api/api';
import CameraViewer from './CameraViewer';
import { Camera } from '../api/types';

interface CameraGridProps {
  layout?: '1x1' | '2x2' | '3x3' | '4x4';
  organizationId?: number | null;
  gymId?: number | null;
  useDirectStream?: boolean; // NEW: Toggle between direct MJPEG and HLS
}

export default function CameraGrid({ 
  layout = '2x2', 
  organizationId, 
  gymId,
  useDirectStream = true // Default to direct streaming
}: CameraGridProps) {
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCamera, setSelectedCamera] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCameras();
    const interval = setInterval(fetchCameras, 10000); // Refresh every 10 seconds
    return () => clearInterval(interval);
  }, [organizationId, gymId]);

  const fetchCameras = async () => {
    try {
      setError(null);
      let response;
      
      if (useDirectStream) {
        // NEW: Use direct camera streaming API
        response = await cameraAPI.getLiveCameras('192.168.0.');
        
        // Transform the response to match Camera interface
        const liveCameras = response.data.cameras.map((cam: any) => ({
          id: cam.id,
          name: cam.name,
          ip_address: cam.ip_address,
          zone: cam.zone,
          gym_name: cam.gym_name,
          organization_name: cam.organization_name,
          status: cam.status,
          is_streaming: true,
          direct_stream_url: cam.direct_stream_url,
          rtsp_url: cam.rtsp_url,
          has_ptz: cam.has_ptz,
          resolution: cam.resolution,
          // Add other required Camera fields with defaults
          gym: 0,
          rtsp_port: 554,
          rtsp_path: '/stream1',
          username: 'admin',
          has_audio: true,
          created_at: new Date().toISOString(),
          is_active: true,
        }));
        
        setCameras(liveCameras);
      } else {
        // Use the existing database-backed API with HLS
        if (gymId) {
          response = await cameraAPI.getGridStatus(gymId, null);
        } else if (organizationId) {
          response = await cameraAPI.getGridStatus(null, organizationId);
        } else {
          response = await cameraAPI.getGridStatus();
        }
        
        setCameras(response.data);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch cameras:', error);
      setError('Failed to load cameras');
      setLoading(false);
    }
  };

  const getGridClass = () => {
    switch (layout) {
      case '1x1': return 'grid-cols-1';
      case '2x2': return 'grid-cols-2';
      case '3x3': return 'grid-cols-3';
      case '4x4': return 'grid-cols-4';
      default: return 'grid-cols-2';
    }
  };

  const handleStartStream = async (cameraId: number) => {
    try {
      if (useDirectStream) {
        // Direct streaming doesn't need to "start" - it's always live
        console.log('Direct streaming - always live');
        await fetchCameras(); // Just refresh
      } else {
        // Legacy HLS streaming
        await cameraAPI.startStream(cameraId);
        await fetchCameras();
      }
    } catch (error) {
      console.error('Failed to start stream:', error);
    }
  };

  const handleStopStream = async (cameraId: number) => {
    try {
      if (useDirectStream) {
        // Direct streaming can't be "stopped" from frontend
        console.log('Direct streaming - cannot stop from frontend');
      } else {
        // Legacy HLS streaming
        await cameraAPI.stopStream(cameraId);
        await fetchCameras();
      }
    } catch (error) {
      console.error('Failed to stop stream:', error);
    }
  };

  const handleSnapshot = async (cameraId: number) => {
    try {
      if (useDirectStream) {
        // Use quick snapshot endpoint
        const snapshotUrl = cameraAPI.getQuickSnapshot(cameraId);
        window.open(snapshotUrl, '_blank');
      } else {
        // Legacy snapshot method
        const response = await cameraAPI.getSnapshot(cameraId);
        if (typeof response === 'string') {
          window.open(response, '_blank');
        } else {
          const url = window.URL.createObjectURL(new Blob([response.data]));
          const link = document.createElement('a');
          link.href = url;
          link.download = `camera_${cameraId}_snapshot_${Date.now()}.jpg`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
        }
      }
    } catch (error) {
      console.error('Failed to get snapshot:', error);
      alert('Failed to capture snapshot');
    }
  };

  const handleRecord = async (camera: Camera) => {
    try {
      if (useDirectStream) {
        // Direct streaming doesn't have recording yet
        alert('Recording feature coming soon for direct streaming');
      } else {
        if (camera.is_streaming) {
          await handleStopStream(camera.id);
        } else {
          await handleStartStream(camera.id);
        }
      }
    } catch (error) {
      console.error('Failed to toggle recording:', error);
    }
  };

  const handleRestart = async (cameraId: number) => {
    if (confirm('Restart this camera stream?')) {
      try {
        if (useDirectStream) {
          // For direct streaming, just refresh the camera
          await fetchCameras();
        } else {
          // For HLS, stop and restart
          await handleStopStream(cameraId);
          setTimeout(() => {
            handleStartStream(cameraId);
          }, 2000);
        }
      } catch (error) {
        console.error('Failed to restart camera:', error);
      }
    }
  };

  const handleDiscoverCameras = async () => {
    try {
      setLoading(true);
      const response = await cameraAPI.discoverCameras('192.168.0.');
      alert(`Discovery complete!\nFound: ${response.data.discovered} live cameras\nOffline: ${response.data.offline} cameras`);
      await fetchCameras();
    } catch (error) {
      console.error('Failed to discover cameras:', error);
      alert('Failed to discover cameras');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white mx-auto mb-4"></div>
          <div className="text-white text-xl">Loading cameras...</div>
          {organizationId && <div className="text-gray-400 text-sm mt-2">Organization selected</div>}
          {gymId && <div className="text-gray-400 text-sm mt-2">Gym selected</div>}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-900">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">{error}</div>
          <div className="flex gap-2 justify-center">
            <button
              onClick={fetchCameras}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Retry
            </button>
            {useDirectStream && (
              <button
                onClick={handleDiscoverCameras}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
              >
                Discover Cameras
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (cameras.length === 0) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-900">
        <div className="text-center">
          <div className="text-gray-400 text-xl mb-4">No cameras found</div>
          {useDirectStream ? (
            <div className="space-y-3">
              <div className="text-gray-500 text-sm">
                No live cameras detected on network
              </div>
              <button
                onClick={handleDiscoverCameras}
                className="px-6 py-3 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
              >
                Scan Network for Cameras
              </button>
            </div>
          ) : organizationId || gymId ? (
            <div className="text-gray-500 text-sm">
              {gymId ? 'No cameras in selected gym' : 'No cameras in selected organization'}
            </div>
          ) : (
            <div className="text-gray-500 text-sm">
              Please select an organization or gym to view cameras
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-black p-1">
      {/* Action Bar */}
      {useDirectStream && (
        <div className="bg-gray-800 px-4 py-2 flex justify-between items-center mb-1">
          <div className="text-white text-sm">
            <span className="font-semibold">{cameras.length}</span> Live Cameras
          </div>
          <button
            onClick={handleDiscoverCameras}
            className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
          >
            Scan Network
          </button>
        </div>
      )}

      <div className={`grid ${getGridClass()} gap-1 h-full`}>
        {cameras.map((camera) => {
          // Normalize status: convert 'live' to 'online'
          const normalizedStatus: 'online' | 'offline' | 'recording' | 'maintenance' | 'error' | 'live' = 
            ((camera as any).status === 'live' || camera.status === 'online') ? 'online' : camera.status;
          
          return (
            <div
              key={camera.id}
              className={`relative cursor-pointer ${
                selectedCamera === camera.id.toString() ? 'col-span-2 row-span-2 z-10' : ''
              }`}
              onClick={() => setSelectedCamera(
                selectedCamera === camera.id.toString() ? null : camera.id.toString()
              )}
            >
              <CameraViewer
                camera={{
                  id: camera.id,
                  name: camera.name,
                  location: camera.zone || camera.gym_name,
                  status: normalizedStatus,
                  stream_url: camera.hls_stream_url || null,
                  ip_address: camera.ip_address,
                  direct_stream_url: (camera as any).direct_stream_url || cameraAPI.getLiveStreamUrl(camera.id),
                }}
                isSelected={selectedCamera === camera.id.toString()}
                onSnapshot={() => handleSnapshot(camera.id)}
                onRecord={() => handleRecord(camera)}
                onRestart={() => handleRestart(camera.id)}
                useDirectStream={useDirectStream}
              />
              
              {/* Camera Info Overlay */}
              <div className="absolute top-2 right-2 bg-black bg-opacity-50 rounded px-2 py-1 text-xs text-white">
                <div>{camera.gym_name}</div>
                <div className="text-gray-300">{camera.organization_name}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}