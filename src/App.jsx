import React, { useState } from 'react';
import DashboardLayout from './layouts/DashboardLayout';
import Dashboard from './pages/Dashboard';
import Historial from './pages/Historial'; // <-- Importamos la nueva página
import axios from 'axios';

function App() {
  const [devices, setDevices] = useState([]);
  const [isScanning, setIsScanning] = useState(false);
  
  // 🔥 ESTADO DE NAVEGACIÓN ('dashboard' o 'historial')
  const [currentView, setCurrentView] = useState('dashboard');

  const scanDevices = async () => {
    setIsScanning(true);
    try {
      const response = await axios.get('http://localhost:3000/api/scan-devices');
      if (response.data.success) {
        const nuevosDispositivos = response.data.devices;
        setDevices(prevDevices => {
          const filtrados = nuevosDispositivos.filter(
            nuevo => !prevDevices.some(actual => actual.udid === nuevo.udid)
          );
          return [...prevDevices, ...filtrados];
        });
      }
    } catch (error) {
      console.error("Error al escanear:", error);
    } finally {
      setIsScanning(false);
    }
  };

// ⏱️ Función auxiliar para crear la pausa (15000 ms = 15 segundos)
  const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const executeGlobalTask = async (taskName, targetUrl, commentText, delayString) => {
    const activeDevices = devices.filter(d => d.active);
    
    if (activeDevices.length === 0) {
      return alert("No hay dispositivos activos para ejecutar la tarea.");
    }

    // 🕒 NUEVA FUNCIÓN: Traduce "MM:SS" a milisegundos
    const calcularMilisegundos = (tiempoStr) => {
      if (!tiempoStr) return 15000; // 15 seg por defecto
      
      if (tiempoStr.includes(':')) {
        const [minutos, segundos] = tiempoStr.split(':');
        const totalSegundos = (parseInt(minutos || 0) * 60) + parseInt(segundos || 0);
        return totalSegundos * 1000;
      }
      
      // Por si el usuario solo escribe un número sin ":" (ej. "30")
      return (parseInt(tiempoStr) || 15) * 1000;
    };

    const tiempoDeEspera = calcularMilisegundos(delayString);

    setDevices(prev => prev.map(d => 
      d.active ? { ...d, action: taskName, url: targetUrl, comment: commentText, status: "En cola..." } : d
    ));

    for (let i = 0; i < activeDevices.length; i++) {
      const device = activeDevices[i];

      setDevices(prev => prev.map(d => d.id === device.id ? { ...d, status: "Ejecutando..." } : d));

      try {
        const response = await axios.post('http://localhost:3000/api/execute-task', {
          deviceId: device.id,
          deviceName: device.name,
          action: taskName,
          url: targetUrl,
          comment: commentText
        });

        if (response.status === 200) {
          setDevices(prev => prev.map(d => d.id === device.id ? { ...d, status: "Hecho!" } : d));
          setTimeout(() => {
            setDevices(prev => prev.map(d => d.id === device.id ? { ...d, status: "En espera", action: null, url: '', comment: '' } : d));
          }, 5000);
        }
      } catch (error) {
        console.error(`Error en dispositivo ${device.name}:`, error);
        setDevices(prev => prev.map(d => d.id === device.id ? { ...d, status: "Error" } : d));
      }

      if (i < activeDevices.length - 1) {
        console.log(`⏳ Esperando ${delayString} antes de lanzar el dispositivo: ${activeDevices[i + 1].name}`);
        await wait(tiempoDeEspera); 
      }
    }
    
    console.log("✅ ¡Toda la cola de tareas ha finalizado!");
  };

  return (
    <DashboardLayout 
      devices={devices} 
      isScanning={isScanning} 
      onScan={scanDevices} 
      onGlobalExecute={executeGlobalTask}
      currentView={currentView} // <-- Pasamos el estado
      setCurrentView={setCurrentView} // <-- Pasamos el actualizador
    >
      {/* RENDERIZADO CONDICIONAL DE VISTAS */}
      {currentView === 'dashboard' ? (
        <Dashboard 
          devices={devices} 
          setDevices={setDevices} 
          isScanning={isScanning} 
          scanDevices={scanDevices} 
        />
      ) : (
        <Historial />
      )}
    </DashboardLayout>
  );
}

export default App;