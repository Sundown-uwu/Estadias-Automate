import React, { useState } from 'react';
import DashboardLayout from './layouts/DashboardLayout';
import Dashboard from './pages/Dashboard';
import axios from 'axios';

function App() {
  const [devices, setDevices] = useState([]);
  const [isScanning, setIsScanning] = useState(false);

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

  // 🔥 NUEVA FUNCIÓN: Ejecución Masiva
  const executeGlobalTask = async (taskName, targetUrl, commentText) => {
    const activeDevices = devices.filter(d => d.active);
    
    if (activeDevices.length === 0) {
      return alert("No hay dispositivos activos para ejecutar la tarea.");
    }

    // 1. Actualizamos la interfaz para que todos los activos muestren la tarea y digan "Ejecutando"
    setDevices(prev => prev.map(d => 
      d.active ? { ...d, action: taskName, url: targetUrl, comment: commentText, status: "Ejecutando" } : d
    ));

    // 2. Disparamos la orden a Appium para todos los dispositivos en paralelo
    activeDevices.forEach(async (device) => {
      try {
        const response = await axios.post('http://localhost:3000/api/execute-task', {
          deviceId: device.id,
          deviceName: device.name,
          action: taskName,
          url: targetUrl,
          comment: commentText
        });

        if (response.status === 200) {
          // Si termina bien, ponemos "Hecho!" y limpiamos a los 5 segundos
          setDevices(prev => prev.map(d => d.id === device.id ? { ...d, status: "Hecho!" } : d));
          setTimeout(() => {
            setDevices(prev => prev.map(d => d.id === device.id ? { ...d, status: "En espera", action: null, url: '', comment: '' } : d));
          }, 5000);
        }
      } catch (error) {
        console.error(`Error en dispositivo ${device.name}:`, error);
        setDevices(prev => prev.map(d => d.id === device.id ? { ...d, status: "Error" } : d));
      }
    });
  };

  return (
    // Pasamos la nueva función al Layout para que llegue al Sidebar
    <DashboardLayout devices={devices} isScanning={isScanning} onScan={scanDevices} onGlobalExecute={executeGlobalTask}>
      <Dashboard 
        devices={devices} 
        setDevices={setDevices} 
        isScanning={isScanning} 
        scanDevices={scanDevices} 
      />
    </DashboardLayout>
  );
}

export default App;