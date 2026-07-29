import { useState, useEffect } from 'react';
import DashboardLayout from './layouts/DashboardLayout';
import Dashboard from './pages/Dashboard';
import Historial from './pages/Historial';
import ColaTareas from './components/ColaTareas'; 
import axios from 'axios';
import { io } from 'socket.io-client';

const socket = io('http://192.168.1.253:3000');

// Función auxiliar para mezclar un arreglo aleatoriamente
const mezclarArreglo = (array) => {
  if (!Array.isArray(array)) return [];
  const copia = [...array];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
};

function App() {
  const [devices, setDevices] = useState([]);
  const [isScanning, setIsScanning] = useState(false);
  const [currentView, setCurrentView] = useState('dashboard');

  useEffect(() => {
    // 📡 Escuchamos los cambios en tiempo real únicamente vía WebSockets
    socket.on('dispositivos_actualizados', (dispositivosMagicos) => {
      setDevices(prev => {
        return dispositivosMagicos.map(nuevoDev => {
          const prevDev = prev.find(d => d.id === nuevoDev.id);
          
          if (prevDev) {
            // CORRECCIÓN: Respetamos SIEMPRE la posición del switch (encendido/apagado) 
            let devActualizado = { ...nuevoDev, active: prevDev.active };
            
            if (nuevoDev.status === "Desconectado" || nuevoDev.connected === false) {
              devActualizado.active = false;
            }
            
            if (prevDev.status === "En espera" && nuevoDev.status === "En espera") {
              if (prevDev.action || prevDev.url) {
                devActualizado.action = prevDev.action;
                devActualizado.url = prevDev.url;
                devActualizado.comment = prevDev.comment;
              }
            }
            return devActualizado;
          }
          
          return nuevoDev;
        });
      });
    });

    socket.on('estado_dispositivo', (data) => {
      setDevices(prev => prev.map(d => d.id === data.id ? { ...d, status: data.status } : d));
    });

    return () => {
      socket.off('dispositivos_actualizados');
      socket.off('estado_dispositivo');
    };
  }, []);

  useEffect(() => {
    const cargarDispositivosIniciales = async () => {
      try {
        const response = await axios.get('http://192.168.1.253:3000/api/devices');
        if (response.data.success) setDevices(response.data.devices); 
      } catch (error) { console.error("Error al cargar dispositivos iniciales:", error); }
    };
    cargarDispositivosIniciales();
  }, []);

  const scanDevices = async () => {
    setIsScanning(true);
    try {
      const response = await axios.get('http://192.168.1.253:3000/api/devices');
      if (response.data.success) setDevices(response.data.devices);
    } catch (error) { console.error("Error al escanear:", error); } 
    finally { setIsScanning(false); }
  };

  const executeGlobalTask = async (taskName, targetUrl, commentText, delayString) => {

    console.log(" [Tarea Global] Intentando ejecutar con datos:", {
      taskName,
      targetUrl,
      commentText,
      delayString
    });

    const activeDevices = devices.filter(d => d.active && d.status !== "Desconectado" && d.connected !== false);
    console.log(" [Tarea Global] Equipos activos detectados en memoria:", activeDevices);

    if (activeDevices.length === 0) {
      alert("No hay dispositivos activos marcados para recibir la tarea global.");
      return;
    }

    const calcularMilisegundos = (tiempoStr) => {
      if (!tiempoStr) return 15000;
      if (typeof tiempoStr === 'string' && tiempoStr.includes(':')) {
        const [minutos, segundos] = tiempoStr.split(':');
        return ((parseInt(minutos || 0, 10) * 60) + parseInt(segundos || 0, 10)) * 1000;
      }
      return (parseInt(tiempoStr, 10) || 15) * 1000;
    };

    const tiempoDeEspera = calcularMilisegundos(delayString);

    // PREPARACIÓN DE COMENTARIOS ÚNICOS
    let comentariosMezclados = [];
    if (Array.isArray(commentText) && commentText.length > 0) {
      comentariosMezclados = mezclarArreglo(commentText);
    } else if (typeof commentText === 'string' && commentText.trim().length > 0) {
      comentariosMezclados = [commentText.trim()];
    }

    // Cambiamos de vista a la cola inmediatamente
    setCurrentView('cola');

    // Despachamos las tareas a la base de datos asignando un comentario único a cada equipo
    for (let i = 0; i < activeDevices.length; i++) {
      const device = activeDevices[i];

      // Asignamos comentario único por índice.
      // Si hay más teléfonos que comentarios, el % cicla los comentarios de forma ordenada.
      let comentarioIndividual = "";
      if (comentariosMezclados.length > 0) {
        comentarioIndividual = comentariosMezclados[i % comentariosMezclados.length];
      }

      console.log(`[Tarea Global] Despachando a la cola para: ${device.name} | Comentario: "${comentarioIndividual}"`);

      try {
        const response = await axios.post('http://192.168.1.253:3000/api/execute-task', {
          deviceId: device.id,
          deviceName: device.name,
          action: taskName,
          url: targetUrl,
          comment: comentarioIndividual, // <--- Enviamos la cadena única
          delayMs: tiempoDeEspera
        });
        console.log(`[Tarea Global] Servidor aceptó la tarea de ${device.name}:`, response.data);
      } catch (error) { 
        console.error(`[Tarea Global] Error en la petición para ${device.name}:`, error); 
      }
    }
  };

  return (
    <DashboardLayout 
      devices={devices} isScanning={isScanning} onScan={scanDevices} 
      onGlobalExecute={executeGlobalTask} currentView={currentView} setCurrentView={setCurrentView}
    >
      {currentView === 'dashboard' && <Dashboard devices={devices} setDevices={setDevices} isScanning={isScanning} scanDevices={scanDevices} />}
      {currentView === 'historial' && <Historial />}
      {currentView === 'cola' && <ColaTareas />}
    </DashboardLayout>
  );
}

export default App;