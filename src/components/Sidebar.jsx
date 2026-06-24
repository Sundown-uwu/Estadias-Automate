import React, { useState } from 'react';
import { RefreshCw, Play } from 'lucide-react';

export default function Sidebar({ devices = [], isScanning = false, onScan, onGlobalExecute }) {
  
  // 📊 Cálculos en tiempo real
  const totalDevices = devices.length;
  const activeDevices = devices.filter(d => d.active).length;
  const selectedDevices = devices.filter(d => d.action !== null).length;

  // 🎛️ Estado local para el formulario de Tarea Global
  const [globalTask, setGlobalTask] = useState('');
  const [globalUrl, setGlobalUrl] = useState('');
  const [globalComment, setGlobalComment] = useState('');

  const handleGlobalSubmit = () => {
    if (!globalTask || !globalUrl) {
      return alert("Por favor selecciona una tarea e ingresa una URL.");
    }
    // Disparamos la función maestra que viene desde App.jsx
    onGlobalExecute(globalTask, globalUrl, globalComment);
    
    // Limpiamos los campos después de enviar
    setGlobalTask('');
    setGlobalUrl('');
    setGlobalComment('');
  };

  return (
    <aside className="w-[320px] bg-[#090b10] border-r border-[#1e293b] flex flex-col p-8 h-screen sticky top-0 overflow-y-auto custom-scrollbar">
      <div className="flex-1">
        <h1 className="text-3xl font-bold mb-1 text-white">AutoControl</h1>
        <p className="text-sm text-gray-400 mb-8">
          Dashboard de automatización<br />de interacciones
        </p>

        <h3 className="text-xs font-bold text-gray-500 tracking-wider mb-4 uppercase">Resumen</h3>
        <div className="space-y-4 text-base mb-8">
          <div className="flex justify-between items-center">
            <span className="text-gray-300">Dispositivos totales</span>
            <span className="font-bold text-white">{totalDevices}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-300">Activos</span>
            <span className="font-bold text-green-500">{activeDevices}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-300">En ejecución</span>
            <span className="font-bold text-[#3b82f6]">{selectedDevices}</span>
          </div>
        </div>

        {/* 🔥 NUEVA SECCIÓN: TAREA GLOBAL */}
        <div className="pt-6 border-t border-[#1e293b]">
          <h3 className="text-xs font-bold text-gray-500 tracking-wider mb-4 uppercase text-center">Tarea Global</h3>
          <p className="text-xs text-gray-400 mb-4 text-center">Aplica a todos los dispositivos activos</p>
          
          <div className="space-y-3">
            <select 
              className="w-full bg-[#111827] border border-[#334155] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
              value={globalTask}
              onChange={(e) => setGlobalTask(e.target.value)}
            >
              <option value="" disabled>Seleccionar tarea...</option>
              <option value="Seguir cuenta">Seguir cuenta</option>
              <option value="Reaccionar a un post">Reaccionar a un post</option>
              <option value="Comentar en un post">Comentar en un post</option>
              <option value="Mirar transmisión">Mirar transmisión (Prueba)</option>
            </select>

            <input 
              type="text" 
              placeholder="https://instagram.com/..." 
              className="w-full bg-[#111827] border border-[#334155] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
              value={globalUrl}
              onChange={(e) => setGlobalUrl(e.target.value)}
            />

            {globalTask === 'Comentar en un post' && (
              <textarea 
                placeholder="Escribe tu comentario aquí..." 
                className="w-full bg-[#111827] border border-[#334155] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 resize-none h-16"
                value={globalComment}
                onChange={(e) => setGlobalComment(e.target.value)}
              />
            )}

            <button 
              onClick={handleGlobalSubmit}
              disabled={activeDevices === 0 || !globalTask || !globalUrl}
              className={`w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-500 text-white font-medium py-2 rounded-lg transition shadow-lg shadow-green-900/20 mt-2 ${
                (activeDevices === 0 || !globalTask || !globalUrl) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
              }`}
            >
              <Play size={16} fill="currentColor" />
              Ejecutar en {activeDevices} equipos
            </button>
          </div>
        </div>
      </div>

      <div className="pt-8 mt-auto">
        <button 
          onClick={onScan}
          disabled={isScanning}
          className={`w-full flex items-center justify-center gap-2 bg-[#3b82f6] hover:bg-[#2563eb] text-white font-medium py-3 rounded-lg transition mb-4 shadow-lg shadow-blue-500/10 ${
            isScanning ? 'opacity-50 cursor-wait' : 'cursor-pointer'
          }`}
        >
          <RefreshCw size={16} className={isScanning ? 'animate-spin' : ''} />
          {isScanning ? 'Buscando...' : 'Escanear Dispositivos'}
        </button>
        <p className="text-xs text-gray-600 text-center">AutoControl v 0.2</p>
      </div>
    </aside>
  );
}