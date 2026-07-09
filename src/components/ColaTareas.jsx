import React, { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { Clock, Play, Trash2, XCircle, CheckCircle } from 'lucide-react';

const socket = io('http://localhost:3000');

const ColaTareas = () => {
    const [cola, setCola] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchCola = async () => {
        try {
            const response = await fetch('http://localhost:3000/api/queue');
            const data = await response.json();
            if (data.success) {
                setCola(data.queue);
            }
        } catch (error) {
            console.error("Error al obtener la cola de tareas:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCola();
        socket.on('cola_actualizada', () => {
            fetchCola();
        });
        return () => {
            socket.off('cola_actualizada');
        };
    }, []);

    const cancelarTarea = async (id) => {
        if (!window.confirm('¿Estás seguro de que deseas cancelar esta tarea pendiente?')) return;
        try {
            const response = await fetch(`http://localhost:3000/api/queue/cancel/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' }
            });
            const data = await response.json();
            if (!data.success) {
                alert(data.message || 'No se pudo cancelar la tarea.');
            }
        } catch (error) {
            console.error("Error al cancelar la tarea:", error);
            alert('Ocurrió un error en la conexión con el servidor.');
        }
    };

    // Función auxiliar para los badges dinámicos de estado
    const renderStatusBadge = (status) => {
        if (status === 'Ejecutando') {
            return (
                <span className="flex items-center gap-1 text-green-400 bg-green-400/10 px-2 py-1 rounded-full text-xs font-medium border border-green-400/20 w-max animate-pulse">
                    <Play size={14} fill="currentColor" /> {status}
                </span>
            );
        }
        return (
            <span className="flex items-center gap-1 text-yellow-400 bg-yellow-400/10 px-2 py-1 rounded-full text-xs font-medium border border-yellow-400/20 w-max">
                <Clock size={14} /> {status}
            </span>
        );
    };

    return (
        <div className="p-8 w-full">
            {/* Cabecera idéntica al Historial */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="text-3xl font-bold text-white mb-2">Cola de Tareas Actual</h2>
                    <p className="text-gray-400">Flujo de automatizaciones en espera o ejecución por dispositivo.</p>
                </div>
                <div className="bg-[#1e293b] border border-[#334155] px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm">
                    <span className="text-gray-400 text-sm font-medium">Pendientes:</span>
                    <span className="text-blue-400 font-bold text-lg">{cola.length}</span>
                </div>
            </div>

            {/* Contenedor principal idéntico al Historial */}
            <div className="bg-[#111827] border border-[#1e293b] rounded-xl overflow-hidden shadow-2xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-[#1e293b] text-gray-400 text-xs uppercase tracking-wider border-b border-[#334155]">
                                <th className="p-4 font-medium w-16 text-center">Pos.</th>
                                <th className="p-4 font-medium">Dispositivo</th>
                                <th className="p-4 font-medium">Acción</th>
                                <th className="p-4 font-medium">Enlace / Destino</th>
                                <th className="p-4 font-medium">Estado</th>
                                <th className="p-4 font-medium text-center">Gestión</th>
                            </tr>
                        </thead>
                        
                        <tbody className="divide-y divide-[#1e293b]">
                            {loading ? (
                                <tr>
                                    <td colSpan="6" className="p-8 text-center text-gray-500">
                                        Cargando cola de tareas...
                                    </td>
                                </tr>
                            ) : cola.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="p-12 text-center">
                                        <div className="flex flex-col items-center justify-center text-gray-500">
                                            <div className="bg-[#1e293b] p-4 rounded-full mb-3">
                                                <CheckCircle size={32} className="text-gray-400" />
                                            </div>
                                            <p className="text-base font-medium text-gray-400">No hay tareas pendientes</p>
                                            <p className="text-sm mt-1">¡Todos los dispositivos están libres!</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                cola.map((tarea, index) => (
                                    <tr key={tarea.id} className="hover:bg-[#1f2937]/50 transition-colors">
                                        <td className="p-4 text-center">
                                            <span className="text-sm font-bold text-gray-500 bg-[#1e293b] px-2 py-1 rounded-md">
                                                #{index + 1}
                                            </span>
                                        </td>
                                        
                                        <td className="p-4">
                                            <div className="text-sm text-white font-medium">{tarea.deviceName || 'Desconocido'}</div>
                                            <div className="text-xs text-gray-500">{tarea.deviceId}</div>
                                        </td>
                                        
                                        <td className="p-4 text-sm text-blue-400 font-medium">
                                            {tarea.action}
                                        </td>
                                        
                                        <td className="p-4">
                                            <div className="text-sm text-gray-400 max-w-[250px] truncate" title={tarea.url}>
                                                {tarea.url}
                                            </div>
                                            {tarea.comment && (
                                                <div className="text-xs text-purple-400 mt-1 italic truncate max-w-[250px]">
                                                    💬 "{tarea.comment}"
                                                </div>
                                            )}
                                        </td>
                                        
                                        <td className="p-4">
                                            {renderStatusBadge(tarea.status)}
                                        </td>
                                        
                                        <td className="p-4 text-center">
                                            {tarea.status === 'En cola' ? (
                                                <button 
                                                    onClick={() => cancelarTarea(tarea.id)}
                                                    className="inline-flex items-center gap-1.5 text-xs font-medium text-red-400 hover:text-white border border-red-400/30 hover:bg-red-500/80 px-3 py-1.5 rounded-lg transition-all"
                                                >
                                                    <Trash2 size={14} /> Cancelar
                                                </button>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                                                    <XCircle size={14} /> Bloqueado
                                                </span>
                                            )}
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
};

export default ColaTareas;