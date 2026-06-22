import React from 'react';
import { Link, useLocation } from 'react-router-dom';

function Sidebar({ selectedGroup }) {
  const location = useLocation();

  const links = [
    { to: '/', label: 'Chit Groups', icon: '🏠' },
    { to: '/dashboard', label: 'Dashboard', icon: '📊' },
    { to: '/members', label: 'Members', icon: '👥' },
    { to: '/payments', label: 'Payments', icon: '💰' },
    { to: '/auctions', label: 'Auctions', icon: '🏆' },
    { to: '/summary', label: 'Summary', icon: '📋' },
  ];

  return (
    <div className="fixed top-0 left-0 h-screen w-56 bg-gray-900 text-white flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-gray-700">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 text-white font-bold text-sm px-2 py-1 rounded-md">CF</div>
          <div>
            <p className="font-bold text-sm">CHIT FUND</p>
            <p className="text-gray-400 text-xs">MANAGER</p>
          </div>
        </div>
        {selectedGroup && (
          <div className="mt-3 bg-gray-800 rounded-lg px-3 py-2">
            <p className="text-xs text-gray-400">Active Group</p>
            <p className="text-sm text-white font-medium truncate">{selectedGroup.chitName}</p>
          </div>
        )}
      </div>

      {/* Links */}
      <nav className="flex-1 p-4 flex flex-col gap-1">
        {links.map(link => (
          <Link
            key={link.to}
            to={link.to}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
              location.pathname === link.to
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:bg-gray-800 hover:text-white'
            }`}
          >
            <span>{link.icon}</span>
            <span>{link.label}</span>
          </Link>
        ))}
      </nav>

      {/* Bottom */}
      <div className="p-4 border-t border-gray-700">
        <p className="text-gray-500 text-xs text-center">Chit Fund Manager v1.0</p>
      </div>
    </div>
  );
}

export default Sidebar;