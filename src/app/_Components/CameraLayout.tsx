// app/page.tsx
'use client';
import { useState } from 'react';
import CameraGrid from '../_Components/CamerGrid';
import OrgGymSelector from '../_Components/OrgGymSelector';
import { Settings, Grid2X2, Grid3X3, Square, Grid, Video, Wifi } from 'lucide-react';

export default function CameraLayout() {
  const [layout, setLayout] = useState<'1x1' | '2x2' | '3x3' | '4x4'>('2x2');
  const [selectedOrg, setSelectedOrg] = useState<number | null>(null);
  const [selectedGym, setSelectedGym] = useState<number | null>(null);
  const [useDirectStream, setUseDirectStream] = useState(true); // NEW: Toggle streaming mode

  const handleSelectionChange = (orgId: number | null, gymId: number | null) => {
    setSelectedOrg(orgId);
    setSelectedGym(gymId);
  };

  return (
    <div className="h-screen flex flex-col bg-gray-900">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 p-4">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Video size={28} className="text-blue-500" />
            Camera Management System
          </h1>
          
          {/* Streaming Mode Toggle */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-gray-700 rounded-lg p-1">
              <button
                onClick={() => setUseDirectStream(true)}
                className={`flex items-center gap-2 px-3 py-2 rounded transition-colors ${
                  useDirectStream 
                    ? 'bg-green-600 text-white' 
                    : 'text-gray-300 hover:text-white'
                }`}
                title="Direct MJPEG Streaming - Real-time, no buffering"
              >
                <Wifi size={16} />
                <span className="text-sm font-medium">Direct Stream</span>
              </button>
              
              <button
                onClick={() => setUseDirectStream(false)}
                className={`flex items-center gap-2 px-3 py-2 rounded transition-colors ${
                  !useDirectStream 
                    ? 'bg-blue-600 text-white' 
                    : 'text-gray-300 hover:text-white'
                }`}
                title="HLS Streaming - Buffered, recorded streams"
              >
                <Video size={16} />
                <span className="text-sm font-medium">HLS Stream</span>
              </button>
            </div>
            
            <button className="p-2 bg-gray-700 rounded hover:bg-gray-600 transition-colors">
              <Settings size={20} className="text-white" />
            </button>
          </div>
        </div>
        
        {/* Organization/Gym Selector and Layout Buttons */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <OrgGymSelector onSelectionChange={handleSelectionChange} />
            
            {/* Stream Info */}
            <div className="text-sm text-gray-400">
              {useDirectStream ? (
                <span className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  Live Direct Streaming (MJPEG)
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  HLS Streaming (Recorded)
                </span>
              )}
            </div>
          </div>
          
          {/* Layout Selector */}
          <div className="flex gap-2">
            <button
              onClick={() => setLayout('1x1')}
              className={`p-2 rounded transition-colors ${
                layout === '1x1' 
                  ? 'bg-blue-600 hover:bg-blue-500' 
                  : 'bg-gray-700 hover:bg-gray-600'
              }`}
              title="Single View"
            >
              <Square size={20} className="text-white" />
            </button>
            
            <button
              onClick={() => setLayout('2x2')}
              className={`p-2 rounded transition-colors ${
                layout === '2x2' 
                  ? 'bg-blue-600 hover:bg-blue-500' 
                  : 'bg-gray-700 hover:bg-gray-600'
              }`}
              title="2x2 Grid"
            >
              <Grid2X2 size={20} className="text-white" />
            </button>
            
            <button
              onClick={() => setLayout('3x3')}
              className={`p-2 rounded transition-colors ${
                layout === '3x3' 
                  ? 'bg-blue-600 hover:bg-blue-500' 
                  : 'bg-gray-700 hover:bg-gray-600'
              }`}
              title="3x3 Grid"
            >
              <Grid3X3 size={20} className="text-white" />
            </button>
            
            <button
              onClick={() => setLayout('4x4')}
              className={`p-2 rounded transition-colors ${
                layout === '4x4' 
                  ? 'bg-blue-600 hover:bg-blue-500' 
                  : 'bg-gray-700 hover:bg-gray-600'
              }`}
              title="4x4 Grid"
            >
              <Grid size={20} className="text-white" />
            </button>
          </div>
        </div>
      </header>

      {/* Camera Grid */}
      <main className="flex-1 overflow-hidden">
        <CameraGrid 
          layout={layout} 
          organizationId={selectedOrg}
          gymId={selectedGym}
          useDirectStream={useDirectStream}
        />
      </main>
    </div>
  );
}