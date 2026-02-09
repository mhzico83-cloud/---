
import React from 'react';
import { View } from '../types';
import Logo from './Logo';

interface SidebarProps {
  currentView: View;
  setView: (view: View) => void;
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, setView, onLogout }) => {
  const menuItems: { id: View; label: string; icon: string }[] = [
    { id: 'dashboard', label: 'الخريطة الميدانية', icon: 'fa-map-location-dot' },
    { id: 'reports', label: 'التحليل الذكي والتقارير', icon: 'fa-microchip' },
    { id: 'idp-list', label: 'إدارة المسجلين', icon: 'fa-users-line' },
    { id: 'aid-services', label: 'تقديم المساعدات', icon: 'fa-hand-holding-heart' },
    { id: 'messages', label: 'مركز الرسائل', icon: 'fa-comment-dots' },
  ];

  return (
    <div className="hidden md:flex w-64 glass h-screen flex-col p-6 sticky top-0 border-l border-white/10">
      <div className="flex items-center gap-3 mb-10 px-2">
        <Logo size="sm" />
        <h1 className="text-xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">مخيمي</h1>
      </div>

      <nav className="flex-1 space-y-2">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setView(item.id)}
            className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-300 ${
              currentView === item.id
                ? 'bg-purple-600/20 text-purple-400 border border-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.15)]'
                : 'text-gray-400 hover:bg-white/5 hover:text-white'
            }`}
          >
            <i className={`fas ${item.icon} text-lg`}></i>
            <span className="font-medium">{item.label}</span>
          </button>
        ))}
      </nav>

      <button
        onClick={onLogout}
        className="mt-auto flex items-center gap-4 px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 transition-colors"
      >
        <i className="fas fa-sign-out-alt"></i>
        <span>تسجيل الخروج</span>
      </button>
    </div>
  );
};

export default Sidebar;
