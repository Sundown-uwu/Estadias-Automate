import React, { useState } from 'react';
import { RefreshCw, Play, LayoutDashboard, List, Clock } from 'lucide-react';

export default function Sidebar({ 
  devices = [], 
  isScanning = false, 
  onScan, 
  onGlobalExecute,
  currentView,     
  setCurrentView   
}) {
  
  // 📊 Cálculos en tiempo real
  const totalDevices = devices.length;
  const activeDevices = devices.filter(d => d.active).length;
  const selectedDevices = devices.filter(d => d.action !== null).length;

  // 🎛️ Estado local para el formulario de Tarea Global
  const [globalTask, setGlobalTask] = useState('');
  const [globalUrl, setGlobalUrl] = useState('');
  const [globalComments, setGlobalComments] = useState([]); // Arreglo de frases
  const [inputValue, setInputValue] = useState(''); // Lo que el usuario está escribiendo
  const [globalDelay, setGlobalDelay] = useState('00:15'); // 15 segundos por defecto

  // Función para hacer capturar el "Enter" o la "Coma"
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const newComment = inputValue.trim();
      
      if (newComment && !globalComments.includes(newComment)) {
        setGlobalComments([...globalComments, newComment]);
      }
      setInputValue(''); 
    }
  };

  // Función para eliminar un comentario al dar clic en la "X"
  const removeComment = (indexToRemove) => {
    setGlobalComments(globalComments.filter((_, index) => index !== indexToRemove));
  };

  // 🔥 NUEVA FUNCIÓN: Formatea el tiempo a MM:SS automáticamente
  const handleTimeChange = (e) => {
    // 1. Capturamos el valor y eliminamos todo lo que NO sea un número
    let rawValue = e.target.value.replace(/\D/g, '');

    // 2. Limitamos a un máximo de 4 dígitos (MMSS)
    rawValue = rawValue.slice(0, 4);

    // 3. Si ya hay más de 2 dígitos, inyectamos los ':' en medio
    if (rawValue.length > 2) {
      rawValue = rawValue.slice(0, 2) + ':' + rawValue.slice(2);
    }

    // 4. Actualizamos el estado
    setGlobalDelay(rawValue); 
  };

  const handleGlobalSubmit = () => {
    if (!globalTask || !globalUrl) {
      return alert("Por favor selecciona una tarea e ingresa una URL.");
    }
    if (globalTask === 'Comentar en un post' && globalComments.length === 0) {
      return alert("Por favor añade al menos un comentario a la lista.");
    }

    onGlobalExecute(globalTask, globalUrl, globalComments, globalDelay);
    
    setGlobalTask('');
    setGlobalUrl('');
    setGlobalComments([]);
    setInputValue('');
  };

  return (
    <aside className="w-[320px] bg-[#090b10] border-r border-[#1e293b] flex flex-col p-8 h-screen sticky top-0 overflow-y-auto custom-scrollbar">
      <div className="flex-1">
        <h1 className="text-3xl font-bold mb-1 text-white">AutoControl</h1>
        <p className="text-sm text-gray-400 mb-8">
          Dashboard de automatización<br />de interacciones
        </p>

        {/* 🔥 NAVEGACIÓN ACTUALIZADA CON COLA DE TAREAS 🔥 */}
        <div className="space-y-2 mb-8">
          <button 
            onClick={() => setCurrentView('dashboard')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              currentView === 'dashboard' 
                ? 'bg-blue-600/10 text-blue-500 border border-blue-500/20' 
                : 'text-gray-400 hover:bg-[#1e293b] hover:text-white'
            }`}
          >
            <LayoutDashboard size={18} />
            Dispositivos
          </button>
          
          <button 
            onClick={() => setCurrentView('historial')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              currentView === 'historial' 
                ? 'bg-blue-600/10 text-blue-500 border border-blue-500/20' 
                : 'text-gray-400 hover:bg-[#1e293b] hover:text-white'
            }`}
          >
            <List size={18} />
            Historial de Tareas
          </button>

          {/* 🔥 NUEVO BOTÓN: COLA DE TAREAS */}
          <button 
            onClick={() => setCurrentView('cola')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              currentView === 'cola' 
                ? 'bg-blue-600/10 text-blue-500 border border-blue-500/20' 
                : 'text-gray-400 hover:bg-[#1e293b] hover:text-white'
            }`}
          >
            <Clock size={18} />
            Cola de Tareas
          </button>
        </div>
        {/* =========================================== */}

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

        {/* SECCIÓN DE TAREA GLOBAL */}
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

            {/* 🔥 CONTROL DE ESPERA ACTUALIZADO */}
            <div className="flex items-center justify-between bg-[#111827] border border-[#334155] rounded-lg px-3 py-2">
              <span className="text-sm text-gray-300">Espera (MM:SS):</span>
              <input 
                type="text" 
                placeholder="00:15"
                maxLength={5}
                className="w-16 bg-[#272727] text-center text-sm text-white rounded border border-[#3f3f3f] focus:outline-none focus:border-blue-500 tracking-widest"
                value={globalDelay}
                onChange={handleTimeChange} // <-- Inyectamos la magia aquí
              />
            </div>

            {globalTask === 'Comentar en un post' && (
              <div className="flex flex-col gap-1">
                <div 
                  className="w-full bg-[#111827] border border-[#334155] rounded-lg p-2 flex flex-wrap gap-2 focus-within:border-blue-500 transition-colors min-h-[80px] max-h-[150px] overflow-y-auto custom-scrollbar"
                >
                  {globalComments.map((comment, index) => (
                    <span 
                      key={index} 
                      className="flex items-center gap-2 bg-[#272727] text-white text-xs font-medium px-3 py-1.5 rounded-full border border-[#3f3f3f]"
                    >
                      {comment}
                      <button 
                        type="button" 
                        onClick={() => removeComment(index)}
                        className="hover:text-red-400 transition-colors focus:outline-none"
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                  
                  <input 
                    type="text" 
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={globalComments.length === 0 ? "Escribe un comentario..." : "Añadir otro..."}
                    className="flex-1 bg-transparent text-sm text-white focus:outline-none min-w-[140px] py-1 px-1"
                  />
                </div>
                <span className="text-[10px] text-gray-500 ml-1">Introduce una coma o presiona Enter detrás de cada etiqueta</span>
              </div>
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