import { useState } from 'react';
import { X, Link as LinkIcon, MessageSquare } from 'lucide-react';

export default function LinkModal({ isOpen, onClose, onConfirm, taskName }) {
  const [url, setUrl] = useState('');
  const [comment, setComment] = useState(''); // Nuevo estado para el comentario

  if (!isOpen) return null;

  const esComentar = taskName === 'Comentar en un post';
  const esPerfil = taskName === 'Seguir cuenta';
  
  // Validamos que el link no esté vacío, y si es comentario, que el comentario tampoco lo esté
  const isValid = url.trim().length > 0 && (!esComentar || comment.trim().length > 0);

  const handleConfirm = () => {
    if (isValid) {
      // Ahora enviamos 3 datos: nombre de tarea, link, y el comentario (si lo hay)
      onConfirm(taskName, url, comment);
      setUrl('');
      setComment('');
      onClose();
    }
  };

  const labelTexto = esPerfil ? 'Pegar enlace del perfil' : 'Pegar enlace de la publicación';
  const placeholderTexto = esPerfil 
    ? 'https://www.instagram.com/nombredeusuario/' 
    : 'https://www.instagram.com/p/...';

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
      <div className="bg-[#12151c] border border-[#1e293b] rounded-2xl w-full max-w-[400px] shadow-2xl overflow-hidden">
        
        <div className="flex justify-between items-center p-5 border-b border-[#1e293b]">
          <h3 className="text-lg font-bold text-white">{taskName}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-5">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            {labelTexto}
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <LinkIcon size={16} className="text-gray-500" />
            </div>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder={placeholderTexto}
              className="w-full bg-[#0a0e12] border border-[#1e293b] text-white text-sm rounded-xl focus:ring-1 focus:ring-[#3b82f6] focus:border-[#3b82f6] block pl-10 p-3 outline-none transition-colors"
            />
          </div>

          {/* NUEVO: Campo dinámico que solo sale para comentarios */}
          {esComentar && (
            <div className="mt-4 animate-in fade-in slide-in-from-top-2 duration-300">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                ¿Qué deseas comentar?
              </label>
              <div className="relative">
                <div className="absolute top-3 left-3 flex items-start pointer-events-none">
                  <MessageSquare size={16} className="text-gray-500" />
                </div>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="¡Excelente contenido! 🔥"
                  rows={3}
                  className="w-full bg-[#0a0e12] border border-[#1e293b] text-white text-sm rounded-xl focus:ring-1 focus:ring-[#3b82f6] focus:border-[#3b82f6] block pl-10 p-3 outline-none transition-colors resize-none"
                />
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-3 p-5 pt-0">
          <button onClick={onClose} className="flex-1 bg-[#1e293b] hover:bg-[#273549] text-white font-medium py-2.5 rounded-xl transition-colors">
            Cancelar
          </button>
          <button onClick={handleConfirm} disabled={!isValid} className={`flex-1 font-medium py-2.5 rounded-xl transition-colors ${isValid ? 'bg-green-600 hover:bg-green-500 text-white shadow-lg shadow-green-500/20' : 'bg-[#1a2233] text-gray-600 cursor-not-allowed'}`}>
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
}