import { useState, useEffect } from 'react';
import { Battery, ChevronDown, Heart, MessageCircle, UserPlus, Rss, Play, Loader2, Edit2 } from 'lucide-react';
import LinkModal from './LinkModal';
import axios from 'axios';

const TaskButton = ({ icon: Icon, text, iconColor, onClick, disabled }) => (
  <button 
    onClick={onClick}
    disabled={disabled}
    className={`flex flex-col items-start gap-2 p-4 bg-[#0a0e12] border border-[#1e293b] rounded-xl transition-all w-full text-left group ${disabled ? 'opacity-40 cursor-not-allowed' : 'hover:border-[#3b82f6] hover:bg-[#111827]'}`}
  >
    <div className="p-2 rounded-lg bg-[#111827] group-hover:bg-[#1a2233]">
      <Icon size={20} className={iconColor} />
    </div>
    <span className="text-sm font-medium text-white">{text}</span>
  </button>
);

// 🔥 CORRECCIÓN 1: Agregamos "connected" a las propiedades para que coincida con el servidor
export default function DeviceCard({ id, udid, name, customName, connected, isConnected, active, battery, action, status, onToggle, onSetAction, onExecute, onRefresh }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState('');
  
  const [isEditing, setIsEditing] = useState(false);
  const [newName, setNewName] = useState(customName || name);
  const [localName, setLocalName] = useState(customName || name);

  // 🔥 CORRECCIÓN 2: Unificamos la validación. Si el servidor manda "connected", lo usamos. 
  // Si no, nos guiamos por el texto "Desconectado".
  const isOnline = connected ?? isConnected ?? status !== "Desconectado";

  useEffect(() => {
    setLocalName(customName || name);
  }, [customName, name]);

  const toggleExpand = () => setIsExpanded(!isExpanded);

  const handleOpenTask = (taskName) => {
    setSelectedTask(taskName);
    setIsModalOpen(true);
  };

  const handleConfirmTask = (taskName, url, comment) => {
    if (onSetAction) onSetAction(taskName, url, comment);
  };

  const handleRename = async () => {
    setIsEditing(false); 
    if (newName === localName) return; 

    setLocalName(newName);
    const identificador = udid || id; 

    try {
      await axios.put(`http://192.168.1.253:3000/api/devices/${identificador}/rename`, {
        customName: newName
      });
      if (onRefresh) onRefresh(); 
    } catch (error) {
      console.error("Error al renombrar el dispositivo:", error);
      setLocalName(customName || name);
    }
  };

  const getStatusStyles = () => {
    if (status === "Ejecutando") return "bg-[#2563eb]/20 text-[#60a5fa] border border-[#2563eb]/40 animate-pulse";
    if (status === "Hecho!") return "bg-[#16a34a]/20 text-[#4ade80] border border-[#16a34a]/40";
    if (!isOnline) return "bg-red-900/20 text-red-400 border border-red-900/40"; // Estilo rojo si está desconectado
    return "bg-[#1f2937] text-gray-300";
  };

  const isRunning = status === "Ejecutando";
  const displayName = localName; 

  return (
    <>
      <div className={`bg-[#12151c] border rounded-2xl w-full max-w-[350px] overflow-hidden transition-all duration-300 shadow-xl relative ${
        isOnline ? 'border-[#1e293b]' : 'border-red-900/30 opacity-60 grayscale'
      }`}>
        <div className="p-5 pb-0">
          <div className="flex justify-between items-start mb-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                
                {isEditing ? (
                  <input 
                    type="text" 
                    className="bg-[#1a2233] text-white px-2 py-0.5 rounded text-xl font-bold outline-none border border-[#3b82f6] w-[180px]"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    onBlur={handleRename}
                    onKeyDown={(e) => e.key === 'Enter' && handleRename()}
                    autoFocus
                  />
                ) : (
                  <>
                    <h3 className="text-xl font-bold text-white transition-colors">
                      {displayName}
                    </h3>
                    
                    {isOnline && (
                      <button 
                        onClick={() => {
                          setNewName(localName);
                          setIsEditing(true);
                        }}
                        className="text-gray-500 hover:text-[#3b82f6] transition-colors p-1"
                        title="Editar nombre"
                      >
                        <Edit2 size={16} />
                      </button>
                    )}
                  </>
                )}

                <div className={`w-2.5 h-2.5 rounded-full ${isOnline ? (active ? 'bg-green-500' : 'bg-gray-600') : 'bg-red-600'}`}></div>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <span className="text-gray-400 font-medium">{isOnline ? (active ? 'Activo' : 'Inactivo') : 'Desconectado'}</span>
                {battery && isOnline ? (
                  <div className="flex items-center gap-1.5 text-green-500 font-medium">
                    <Battery size={16} />
                    <span className="text-gray-300">{battery}%</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-gray-600">
                    <Battery size={16} />
                  </div>
                )}
              </div>
            </div>
            
            {/* 🔥 CORRECCIÓN 3: El switch ahora evalúa isOnline. Si no está en línea, no hace nada al hacer click */}
            <div 
              onClick={!isRunning && isOnline ? onToggle : undefined} 
              className={`w-[48px] h-6 flex items-center rounded-full p-1 transition-colors duration-300 ${active && isOnline ? 'bg-[#5e5c8a]' : 'bg-[#374151]'} ${isRunning || !isOnline ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
            >
              <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${active && isOnline ? 'translate-x-6' : ''}`}></div>
            </div>
          </div>
        </div>

        <div className={`grid transition-all duration-300 ease-in-out px-5 ${isExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
          <div className="overflow-hidden">
            <div className="border-t border-[#1e293b] my-4"></div>
            <h4 className="text-xs font-bold text-gray-500 tracking-wider mb-4 uppercase">Seleccione una tarea</h4>
            
            <div className="grid grid-cols-2 gap-3 mb-5">
              <TaskButton icon={Heart} text="Reaccionar a un post" iconColor="text-red-400" onClick={() => handleOpenTask("Reaccionar a un post")} disabled={isRunning || !isOnline} />
              <TaskButton icon={MessageCircle} text="Comentar en un post" iconColor="text-blue-400" onClick={() => handleOpenTask("Comentar en un post")} disabled={isRunning || !isOnline} />
              <TaskButton icon={UserPlus} text="Seguir cuenta" iconColor="text-purple-400" onClick={() => handleOpenTask("Seguir cuenta")} disabled={isRunning || !isOnline} />
              <TaskButton icon={Rss} text="Mirar transmisión" iconColor="text-yellow-400" onClick={() => handleOpenTask("Mirar transmisión")} disabled={isRunning || !isOnline} />
            </div>

            <button 
              onClick={onExecute}
              disabled={!action || isRunning || !active || !isOnline}
              className={`w-full flex items-center justify-center gap-2.5 font-semibold py-3.5 rounded-xl transition-colors mb-5 ${
                isRunning 
                  ? 'bg-[#2563eb] text-white cursor-wait' 
                  : action && active && isOnline
                    ? 'bg-[#3b82f6] hover:bg-[#2563eb] text-white cursor-pointer shadow-lg shadow-blue-500/20' 
                    : 'bg-[#1a2233] text-gray-500 cursor-not-allowed'
              }`}
            >
              {isRunning ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Ejecutando script...
                </>
              ) : (
                <>
                  <Play size={18} />
                  {action ? (active && isOnline ? 'Ejecutar tarea' : 'Active el dispositivo') : 'Configurar tarea primero'}
                </>
              )}
            </button>
          </div>
        </div>

        <div className="bg-[#0e1117] px-5 py-3 border-t border-[#1e293b] flex items-center justify-between">
          <div className="flex gap-2.5">
            <span className={`text-xs px-3.5 py-1.5 rounded-full font-semibold transition-all duration-300 ${getStatusStyles()}`}>
              {status}
            </span>
            {action && <span className="bg-[#3b82f6]/10 text-[#60a5fa] border border-[#3b82f6]/20 text-xs px-3.5 py-1.5 rounded-full font-semibold">{action}</span>}
          </div>
          <button onClick={toggleExpand} disabled={!isOnline} className={`p-1 rounded-full transition-colors group ${!isOnline ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[#1a2233]'}`}>
            <ChevronDown size={20} className={`text-gray-500 transition-transform duration-300 ${isExpanded ? 'rotate-180 text-white' : 'group-hover:text-white'}`} />
          </button>
        </div>
      </div>

      <LinkModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        taskName={selectedTask}
        onConfirm={handleConfirmTask} 
      />
    </>
  );
}