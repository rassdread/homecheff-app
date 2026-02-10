'use client';

import { useGeolocation } from '@/hooks/useGeolocation';
import { useState } from 'react';

export default function GeolocationDebug() {
  const { coords, loading, error, supported, permission, getCurrentPosition, checkSupportAndPermission } = useGeolocation({
    enableHighAccuracy: true,
    timeout: 15000,
    maximumAge: 300000
  });

  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
  };

  const testGeolocation = async () => {
    addLog('Starting geolocation test...');
    
    // Browser detection
    const userAgent = navigator.userAgent.toLowerCase();
    const isMobile = /android|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
    const isChrome = /chrome/.test(userAgent) && /google inc/.test(navigator.vendor?.toLowerCase() || '');
    const isEdge = /edg/.test(userAgent);
    const isFirefox = /firefox/.test(userAgent);
    const isSamsungInternet = /samsungbrowser/.test(userAgent);
    const isAndroid = /android/.test(userAgent);
    const isIOS = /iphone|ipad|ipod/.test(userAgent);
    
    addLog(`Browser: ${isSamsungInternet ? 'Samsung Internet' : isChrome ? 'Chrome' : isEdge ? 'Edge' : isFirefox ? 'Firefox' : 'Other'}`);
    addLog(`Mobile: ${isMobile ? 'Yes' : 'No'}`);
    addLog(`Platform: ${isAndroid ? 'Android' : isIOS ? 'iOS' : 'Desktop'}`);
    addLog(`Supported: ${supported}`);
    addLog(`Permission: ${permission}`);
    addLog(`Current coords: ${coords ? `${coords.lat}, ${coords.lng}` : 'None'}`);
    addLog(`Loading: ${loading}`);
    addLog(`Error: ${error || 'None'}`);
    addLog(`HTTPS: ${window.location.protocol === 'https:' ? 'Yes' : 'No'}`);
    addLog(`Secure Context: ${window.isSecureContext ? 'Yes' : 'No'}`);
    
    // Test basic geolocation
    if (navigator.geolocation) {
      addLog('Testing basic geolocation...');
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          addLog(`✅ Basic geolocation success: ${pos.coords.latitude}, ${pos.coords.longitude}`);
          addLog(`Accuracy: ${pos.coords.accuracy}m`);
        },
        (err) => {
          addLog(`❌ Basic geolocation error: ${err.code} - ${err.message}`);
        },
        {
          enableHighAccuracy: false, // Use low accuracy for testing
          timeout: 15000,
          maximumAge: 0
        }
      );
    } else {
      addLog('❌ navigator.geolocation not available');
    }
  };

  const clearLogs = () => setLogs([]);

  return (
    <div className="fixed bottom-4 right-4 w-96 max-h-96 bg-white border border-gray-300 rounded-lg shadow-lg p-4 z-50">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-semibold text-sm">GPS Debug</h3>
        <div className="flex gap-2">
          <button
            onClick={testGeolocation}
            className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Test
          </button>
          <button
            onClick={getCurrentPosition}
            className="px-2 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600"
          >
            Get Location
          </button>
          <button
            onClick={clearLogs}
            className="px-2 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Clear
          </button>
        </div>
      </div>
      
      <div className="space-y-1 text-xs">
        <div>Supported: <span className={supported ? 'text-green-600' : 'text-red-600'}>{supported ? 'Yes' : 'No'}</span></div>
        <div>Permission: <span className="text-blue-600">{permission || 'Unknown'}</span></div>
        <div>Loading: <span className={loading ? 'text-yellow-600' : 'text-gray-600'}>{loading ? 'Yes' : 'No'}</span></div>
        <div>Coords: <span className={coords ? 'text-green-600' : 'text-gray-600'}>{coords ? `${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}` : 'None'}</span></div>
        {error && <div>Error: <span className="text-red-600">{error}</span></div>}
      </div>
      
      <div className="mt-2 max-h-32 overflow-y-auto">
        <div className="text-xs text-gray-600">Logs:</div>
        {logs.map((log, index) => (
          <div key={index} className="text-xs font-mono text-gray-700">{log}</div>
        ))}
      </div>
    </div>
  );
}
