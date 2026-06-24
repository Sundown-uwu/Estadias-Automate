import { useState } from 'react';
import { Battery, ChevronDown, Heart, MessageCircle, UserPlus, Rss, Play, Loader2 } from 'lucide-react';
import LinkModal from './LinkModal';

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

export default function DeviceCard({ name, active, battery, action, status, onToggle, onSetAction, onExecute }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState('');

  const toggleExpand = () => setIsExpanded(!isExpanded);

  const handleOpenTask = (taskName) => {
    setSelectedTask(taskName);
    setIsModalOpen(true);
  };

  const handleConfirmTask = (taskName, url, comment) => {
    if (onSetAction) onSetAction(taskName, url, comment);
  };

  // Helper dinámico para cambiar el color de la píldora inferior según el flujo de Figma
  const getStatusStyles = () => {
    if (status === "Ejecutando") return "bg-[#2563eb]/20 text-[#60a5fa] border border-[#2563eb]/40 animate-pulse";
    if (status === "Hecho!") return "bg-[#16a34a]/20 text-[#4ade80] border border-[#16a34a]/40";
    return "bg-[#1f2937] text-gray-300"; // En espera
  };

  const isRunning = status === "Ejecutando";

  return (
    <>
      <div className="bg-[#12151c] border border-[#1e293b] rounded-2xl w-full max-w-[350px] overflow-hidden transition-all duration-300 shadow-xl relative">
        <div className="p-5 pb-0">
          <div className="flex justify-between items-start mb-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-xl font-bold text-white">{name}</h3>
                <div className={`w-2.5 h-2.5 rounded-full ${active ? 'bg-green-500' : 'bg-gray-600'}`}></div>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <span className="text-gray-400 font-medium">{active ? 'Activo' : 'Inactivo'}</span>
                {battery ? (
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
            <div onClick={!isRunning ? onToggle : null} className={`w-[48px] h-6 flex items-center rounded-full p-1 transition-colors duration-300 ${active ? 'bg-[#5e5c8a]' : 'bg-[#374151]'} ${isRunning ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}>
              <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${active ? 'translate-x-6' : ''}`}></div>
            </div>
          </div>
        </div>

        <div className={`grid transition-all duration-300 ease-in-out px-5 ${isExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
          <div className="overflow-hidden">
            <div className="border-t border-[#1e293b] my-4"></div>
            <h4 className="text-xs font-bold text-gray-500 tracking-wider mb-4 uppercase">Seleccione una tarea</h4>
            
            <div className="grid grid-cols-2 gap-3 mb-5">
              <TaskButton icon={Heart} text="Reaccionar a un post" iconColor="text-red-400" onClick={() => handleOpenTask("Reaccionar a un post")} disabled={isRunning} />
              <TaskButton icon={MessageCircle} text="Comentar en un post" iconColor="text-blue-400" onClick={() => handleOpenTask("Comentar en un post")} disabled={isRunning} />
              <TaskButton icon={UserPlus} text="Seguir cuenta" iconColor="text-purple-400" onClick={() => handleOpenTask("Seguir cuenta")} disabled={isRunning} />
              <TaskButton icon={Rss} text="Mirar transmisión" iconColor="text-yellow-400" onClick={() => handleOpenTask("Mirar transmisión")} disabled={isRunning} />
            </div>

            {/* BOTÓN DE DISPARO CON CONEXIÓN BACKEND */}
            <button 
              onClick={onExecute}
              disabled={!action || isRunning || !active}
              className={`w-full flex items-center justify-center gap-2.5 font-semibold py-3.5 rounded-xl transition-colors mb-5 ${
                isRunning 
                  ? 'bg-[#2563eb] text-white cursor-wait' 
                  : action && active
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
                  {action ? (active ? 'Ejecutar tarea' : 'Active el dispositivo') : 'Configurar tarea primero'}
                </>
              )}
            </button>
          </div>
        </div>

        <div className="bg-[#0e1117] px-5 py-3 border-t border-[#1e293b] flex items-center justify-between">
          <div className="flex gap-2.5">
            {/* Píldora de estado dinámica ajustada al diseño exacto de Figma */}
            <span className={`text-xs px-3.5 py-1.5 rounded-full font-semibold transition-all duration-300 ${getStatusStyles()}`}>
              {status}
            </span>
            {action && <span className="bg-[#3b82f6]/10 text-[#60a5fa] border border-[#3b82f6]/20 text-xs px-3.5 py-1.5 rounded-full font-semibold">{action}</span>}
          </div>
          <button onClick={toggleExpand} className="p-1 rounded-full hover:bg-[#1a2233] transition-colors group">
            <ChevronDown size={20} className={`text-gray-500 group-hover:text-white transition-transform duration-300 ${isExpanded ? 'rotate-180 text-white' : ''}`} />
          </button>
        </div>
      </div>

<LinkModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        taskName={selectedTask}
        // Usamos la función que ya creaste arriba, la cual ya sabe cómo comunicarse con el Dashboard
        onConfirm={handleConfirmTask} 
      />
    </>
  );
}