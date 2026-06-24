import React from 'react';
import Sidebar from '../components/Sidebar'; 

export default function DashboardLayout({ children, devices, isScanning, onScan, onGlobalExecute }) {
  return (
    <div className="flex bg-[#0f111a] min-h-screen text-white">
      {/* 🚀 Pasamos la función global al Sidebar */}
      <Sidebar 
        devices={devices} 
        isScanning={isScanning} 
        onScan={onScan} 
        onGlobalExecute={onGlobalExecute}
      />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}