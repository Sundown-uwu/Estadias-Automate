import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { RefreshCw, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

export default function Historial() {
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchHistory = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get('http://192.168.1.253:3000/api/history');
      if (response.data.success) {
        setLogs(response.data.history);
      }
    } catch (error) {
      console.error("Error al obtener el historial:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  // Función auxiliar para renderizar el badge de estado
  const renderStatusBadge = (status) => {
    if (status === 'Éxito') {
      return (
        <span className="flex items-center gap-1 text-green-400 bg-green-400/10 px-2 py-1 rounded-full text-xs font-medium border border-green-400/20 w-max">
          <CheckCircle size={14} /> Éxito
        </span>
      );
    }
    if (status === 'Fallido') {
      return (
        <span className="flex items-center gap-1 text-yellow-400 bg-yellow-400/10 px-2 py-1 rounded-full text-xs font-medium border border-yellow-400/20 w-max">
          <AlertTriangle size={14} /> Fallido
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1 text-red-400 bg-red-400/10 px-2 py-1 rounded-full text-xs font-medium border border-red-400/20 w-max">
        <XCircle size={14} /> Error
      </span>
    );
  };

  return (
    <div className="p-8 w-full">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">Historial de Tareas</h2>
          <p className="text-gray-400">Registro en tiempo real de todas las automatizaciones ejecutadas.</p>
        </div>
        <button 
          onClick={fetchHistory}
          disabled={isLoading}
          className="flex items-center gap-2 bg-[#1e293b] hover:bg-[#334155] text-white px-4 py-2 rounded-lg transition border border-[#334155]"
        >
          <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
          {isLoading ? 'Actualizando...' : 'Actualizar'}
        </button>
      </div>

      <div className="bg-[#111827] border border-[#1e293b] rounded-xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#1e293b] text-gray-400 text-xs uppercase tracking-wider border-b border-[#334155]">
                <th className="p-4 font-medium">Fecha</th>
                <th className="p-4 font-medium">Dispositivo</th>
                <th className="p-4 font-medium">Acción</th>
                <th className="p-4 font-medium">Objetivo</th>
                <th className="p-4 font-medium">Estado</th>
                <th className="p-4 font-medium">Mensaje del sistema</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e293b]">
              {logs.length === 0 && !isLoading ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-gray-500">
                    No hay registros en la base de datos todavía.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-[#1f2937]/50 transition-colors">
                    <td className="p-4 text-sm text-gray-300 whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="p-4">
                      <div className="text-sm text-white font-medium">{log.deviceName}</div>
                      <div className="text-xs text-gray-500">{log.deviceId}</div>
                    </td>
                    <td className="p-4 text-sm text-blue-400 font-medium">
                      {log.action}
                    </td>
                    <td className="p-4 text-sm text-gray-400 max-w-[200px] truncate" title={log.url}>
                      {log.url}
                    </td>
                    <td className="p-4">
                      {renderStatusBadge(log.status)}
                    </td>
                    <td className="p-4 text-xs text-gray-400 max-w-[250px] truncate" title={log.mensaje}>
                      {log.mensaje}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}