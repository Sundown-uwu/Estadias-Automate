import { RefreshCw, Plus } from 'lucide-react'; // Iconos para el diseño
import DeviceCard from '../components/DeviceCard';
import axios from 'axios';

// 🔥 Ahora recibimos el estado global y la función de escaneo desde las Props (App.jsx)
export default function Dashboard({ devices, setDevices, isScanning, scanDevices }) {

  const toggleDevice = (id) => {
    setDevices(devices.map(device => 
      device.id === id ? { ...device, active: !device.active } : device
    ));
  };

  const setDeviceAction = (id, taskName, targetUrl, commentText) => {
    setDevices(devices.map(device => 
      device.id === id ? { ...device, action: taskName, url: targetUrl, comment: commentText } : device
    ));
  };

  const executeTask = async (id) => {
    const device = devices.find(d => d.id === id);
    if (!device || !device.action) return;

    setDevices(prev => prev.map(d => d.id === id ? { ...d, status: "Ejecutando" } : d));

    try {
      const response = await axios.post('http://localhost:3000/api/execute-task', {
        deviceId: device.id,
        deviceName: device.name,
        action: device.action,
        url: device.url,
        comment: device.comment
      });

      if (response.status === 200) {
        setDevices(prev => prev.map(d => d.id === id ? { ...d, status: "Hecho!" } : d));
        
        setTimeout(() => {
          setDevices(prev => prev.map(d => d.id === id ? { ...d, status: "En espera", action: null, url: '', comment: '' } : d));
        }, 5000);
      }
    } catch (error) {
      console.error("Error ejecutando la tarea en Appium:", error);
      alert(`No se pudo ejecutar la automatización en el ${device.name}.`);
      setDevices(prev => prev.map(d => d.id === id ? { ...d, status: "En espera" } : d));
    }
  };

  return (
    <div className="p-12">
      {/* 1. Encabezado estilizado y completamente limpio */}
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold text-white">Dispositivos</h2>
      </div>
      
      {/* 2. Grid de Tarjetas o Vista de Estado Vacío */}
      {devices.length === 0 ? (
        <div className="flex flex-col items-center justify-center border border-dashed border-[#1e293b] rounded-2xl p-16 text-center max-w-[400px] mx-auto mt-12">
          <div className="p-4 rounded-full bg-[#111827] text-gray-500 mb-4">
            <Plus size={32} />
          </div>
          <p className="text-gray-400 font-medium mb-1">No hay dispositivos cargados</p>
          <p className="text-xs text-gray-600 max-w-[280px] mb-6">
            Conecta tus celulares por USB con la depuración activa y presiona Escanear.
          </p>

          {/* Botón de escaneo intuitivo para cuando la lista está vacía */}
          <button
            onClick={scanDevices}
            disabled={isScanning}
            className={`flex items-center gap-2 bg-[#3b82f6] hover:bg-[#2563eb] text-white px-6 py-3 rounded-xl font-medium transition-all shadow-lg shadow-blue-500/10 ${isScanning ? 'opacity-50 cursor-wait' : 'cursor-pointer'}`}
          >
            <RefreshCw size={18} className={isScanning ? 'animate-spin' : ''} />
            {isScanning ? 'Buscando equipos...' : 'Escanear Dispositivos'}
          </button>
        </div>
      ) : (
        <div className="flex flex-wrap gap-6">
          {devices.map(device => (
            <DeviceCard 
              key={device.id}
              name={device.name}
              active={device.active}
              battery={device.battery}
              action={device.action}
              status={device.status}
              onToggle={() => toggleDevice(device.id)}
              onSetAction={(taskName, targetUrl, comment) => setDeviceAction(device.id, taskName, targetUrl, comment)}
              onExecute={() => executeTask(device.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}