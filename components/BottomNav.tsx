
import React from 'react';
import { View } from '../types';

interface BottomNavProps {
  currentView: View;
  setView: (view: View) => void;
}

const BottomNav: React.FC<BottomNavProps> = ({ currentView, setView }) => {
  const navItems: { id: View; label: string; icon: string }[] = [
    { id: 'reports', label: 'الرئيسية', icon: 'fa-home' },
    { id: 'idp-list', label: 'النازحين', icon: 'fa-users' },
    { id: 'messages', label: 'الرسائل', icon: 'fa-comment-dots' },
    { id: 'aid-services', label: 'المساعدات', icon: 'fa-hand-holding-heart' },
    { id: 'dashboard', label: 'الخريطة', icon: 'fa-map-location-dot' },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 glass border-t border-white/10 z-50 flex justify-around items-center h-16 px-2">
      {navItems.map((item) => (
        <button
          key={item.id}
          onClick={() => setView(item.id)}
          className={`flex flex-col items-center justify-center gap-1 transition-all ${
            currentView === item.id ? 'text-purple-400 scale-110' : 'text-gray-500'
          }`}
        >
          <i className={`fas ${item.icon} text-lg`}></i>
          <span className="text-[10px] font-bold">{item.label}</span>
        </button>
      ))}
    </div>
  );
};

export default BottomNav;
