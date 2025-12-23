import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function PageHeader({ title, children }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    const collapsed = localStorage.getItem('sidebarCollapsed') === 'true';
    setSidebarCollapsed(collapsed);
  }, []);

  const toggleSidebar = () => {
    const newState = !sidebarCollapsed;
    setSidebarCollapsed(newState);
    localStorage.setItem('sidebarCollapsed', newState);
    window.dispatchEvent(new Event('sidebarToggle'));
  };

  return (
    <div className="fixed top-8 left-0 right-0 z-[60] bg-black/95 backdrop-blur-xl border-b border-gray-800 shadow-lg">
      <div className="px-6 py-3 flex items-center justify-between">
        <button 
          onClick={toggleSidebar}
          className="flex items-center gap-3 hover:opacity-80 transition-opacity"
        >
          <img src="/Saitma-Meme-PNG-758x473-removebg-preview.png" alt="Logo" className="w-7 h-7 object-contain" />
          <h1 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500">crackvìnghèo</h1>
          {title && <span className="px-2 py-1 bg-gray-800 rounded-full text-xs">{title}</span>}
        </button>
        
        {children}
      </div>
    </div>
  );
}