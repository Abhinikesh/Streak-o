import React, { useState, useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const userName = user?.name || user?.firstName || '';
  const displayName = userName || user?.email?.split('@')[0] || 'U';
  const initChar = displayName.charAt(0).toUpperCase();

  // Close drawer on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  // Prevent body scroll when drawer is open
  useEffect(() => {
    document.body.style.overflow = isMobileMenuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isMobileMenuOpen]);

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      logout();
    }
  };

  const navLinks = [
    { name: 'Dashboard',      path: '/dashboard' },
    { name: 'Calendar',       path: '/calendar' },
    { name: 'Stats',          path: '/stats' },
    { name: 'Journal',        path: '/journal' },
    { name: 'Friends',        path: '/friends' },
    { name: '🏆 Leaderboard', path: '/leaderboard' },
  ];

  return (
    <>
      <nav className="sticky top-0 z-50 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-700 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="flex justify-between h-16">

            {/* Left Side */}
            <div className="flex items-center">
              <button
                onClick={() => navigate('/dashboard')}
                className="flex-shrink-0 flex items-center focus:outline-none"
              >
                <span className="text-xl sm:text-2xl font-extrabold text-indigo-600 dark:text-indigo-400 tracking-tight">
                  StreakBoard
                </span>
              </button>
              <div className="hidden md:ml-10 md:flex md:space-x-8 h-full">
                {navLinks.map((link) => {
                  const isActive = location.pathname.startsWith(link.path);
                  return (
                    <NavLink
                      key={link.name}
                      to={link.path}
                      className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-bold transition-colors ${
                        isActive
                          ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                          : 'border-transparent text-gray-500 dark:text-gray-300 hover:text-indigo-500 dark:hover:text-white hover:border-gray-300'
                      }`}
                    >
                      {link.name}
                    </NavLink>
                  );
                })}
              </div>
            </div>

            {/* Right Side — desktop */}
            <div className="hidden md:flex items-center gap-6">
              <button
                onClick={handleLogout}
                className="text-sm font-bold text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors"
              >
                Logout
              </button>
              <button
                onClick={() => navigate('/profile')}
                className="flex items-center outline-none ring-2 ring-transparent focus:ring-indigo-500 rounded-full transition-all hover:scale-105"
              >
                {user?.avatar || user?.avatarUrl ? (
                  <img src={user.avatar || user.avatarUrl} alt="Profile" className="w-9 h-9 rounded-full object-cover shadow-sm bg-gray-50" />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-indigo-100 dark:bg-indigo-700 text-indigo-700 dark:text-indigo-100 flex items-center justify-center font-bold text-sm shadow-sm ring-1 ring-indigo-200 dark:ring-indigo-600">
                    {initChar}
                  </div>
                )}
              </button>
            </div>

            {/* Hamburger — mobile */}
            <div className="flex items-center md:hidden">
              <button
                onClick={() => setIsMobileMenuOpen(v => !v)}
                className="inline-flex items-center justify-center w-11 h-11 rounded-xl text-gray-500 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500 transition-colors"
                aria-label="Toggle navigation menu"
              >
                {isMobileMenuOpen ? (
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Drawer — full-screen overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 md:hidden flex">
          {/* Backdrop — tap to close */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsMobileMenuOpen(false)}
            aria-hidden="true"
          />

          {/* Drawer panel — slides in from right */}
          <div className="relative ml-auto w-72 max-w-[85vw] h-full bg-white dark:bg-gray-900 shadow-2xl flex flex-col overflow-y-auto">

            {/* Drawer header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-700">
              <span className="text-lg font-extrabold text-indigo-600 dark:text-indigo-400 tracking-tight">
                StreakBoard
              </span>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="w-9 h-9 flex items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                aria-label="Close menu"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Nav links */}
            <nav className="flex-1 px-3 py-4 space-y-1">
              {navLinks.map((link) => {
                const isActive = location.pathname.startsWith(link.path);
                return (
                  <NavLink
                    key={link.name}
                    to={link.path}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center pl-3 pr-4 py-3 rounded-xl text-base font-bold transition-colors border-l-4 ${
                      isActive
                        ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-600 text-indigo-700 dark:text-indigo-400'
                        : 'border-transparent text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    {link.name}
                  </NavLink>
                );
              })}
            </nav>

            {/* Profile + Logout footer */}
            <div className="px-4 pb-6 pt-3 border-t border-gray-100 dark:border-gray-700 space-y-3">
              <div
                className="flex items-center gap-3 px-3 py-3 bg-gray-50 dark:bg-gray-800 rounded-xl cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                onClick={() => { setIsMobileMenuOpen(false); navigate('/profile'); }}
              >
                {user?.avatar || user?.avatarUrl ? (
                  <img src={user.avatar || user.avatarUrl} alt="Profile" className="w-10 h-10 rounded-full object-cover shadow-sm bg-white flex-shrink-0" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-700 text-indigo-700 dark:text-indigo-100 flex items-center justify-center font-bold shadow-sm ring-1 ring-indigo-200 dark:ring-indigo-600 flex-shrink-0">
                    {initChar}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-sm font-bold text-gray-800 dark:text-white leading-tight truncate">{displayName}</p>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400">View Profile →</p>
                </div>
              </div>

              <button
                onClick={() => { setIsMobileMenuOpen(false); handleLogout(); }}
                className="w-full text-center px-4 py-3 text-sm font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors min-h-[44px]"
              >
                Logout of StreakBoard
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
