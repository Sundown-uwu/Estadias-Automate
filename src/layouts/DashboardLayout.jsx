import Sidebar from '../components/Sidebar'; 

export default function DashboardLayout({ 
  children, 
  devices, 
  isScanning, 
  onScan, 
  onGlobalExecute,
  currentView,     // <-- 1. Recibimos el estado de App.jsx
  setCurrentView   // <-- 2. Recibimos la función para cambiar de vista
}) {
  return (
    <div className="flex bg-[#0f111a] min-h-screen text-white">
      <Sidebar 
        devices={devices} 
        isScanning={isScanning} 
        onScan={onScan} 
        onGlobalExecute={onGlobalExecute}
        currentView={currentView}       // <-- 3. Se lo pasamos al Sidebar
        setCurrentView={setCurrentView} // <-- 4. Se lo pasamos al Sidebar
      />
      
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}