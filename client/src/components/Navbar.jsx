import { SearchIcon, PanelLeft, Settings, LogOut } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { toggleTheme } from '../features/themeSlice';
import { MoonIcon, SunIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import Avatar from './Avatar';
import { logout } from '../features/authSlice';
import { useWorkspaceContext } from '../context/workspaceContext';

const Navbar = ({ setIsSidebarOpen }) => {
  const dispatch = useDispatch();
  const { theme } = useSelector((state) => state.theme);
  const { user } = useSelector((state) => state.auth);
  const { searchQuery, setSearchQuery, currentWorkspace } =
    useWorkspaceContext();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const memberRole = currentWorkspace?.members?.find(
    (member) => member.user?.id === user?.id
  )?.role;
  const roleLabel =
    user?.role === 'ADMIN'
      ? 'Global Admin'
      : user?.role === 'CLIENT'
        ? 'Client'
        : memberRole === 'ADMIN'
          ? 'Workspace Admin'
          : 'User';

  useEffect(() => {
    if (!isMenuOpen) return;

    const handleClick = (event) => {
      if (!menuRef.current?.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') setIsMenuOpen(false);
    };

    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isMenuOpen]);

  return (
    <div className="w-full bg-white dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-800 px-6 xl:px-16 py-3 shrink-0">
      <div className="flex items-center justify-between max-w-6xl mx-auto">
        {/* Left section */}
        <div className="flex items-center gap-4 min-w-0 flex-1">
          {/* Sidebar Trigger */}
          <button
            onClick={() => setIsSidebarOpen((prev) => !prev)}
            className="sm:hidden p-2 rounded-lg transition-colors text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-zinc-800"
          >
            <PanelLeft size={20} />
          </button>

          {/* Search Input */}
          <div className="relative flex-1 max-w-[14rem] sm:max-w-sm">
            <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-zinc-400 size-3.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search workspace"
              className="pl-8 pr-4 py-2 w-full bg-white dark:bg-zinc-900 border border-gray-300 dark:border-zinc-700 rounded-md text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition"
            />
          </div>
        </div>

        {/* Right section */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center gap-2" ref={menuRef}>
            <div className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-300">
              <span className="hidden sm:inline">
                {user?.name || user?.email}
              </span>
              <span className="hidden sm:inline text-[10px] uppercase px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800">
                {roleLabel}
              </span>
            </div>
            <button
              onClick={() => setIsMenuOpen((prev) => !prev)}
              className="size-8 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-haspopup="menu"
              aria-expanded={isMenuOpen}
              aria-label="Open profile menu"
              type="button"
            >
              <Avatar
                src={user?.image}
                name={user?.name}
                email={user?.email}
                className="size-7 rounded-full"
              />
            </button>

            {isMenuOpen ? (
              <div className="absolute right-0 top-full mt-2 w-48 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-lg p-1 z-50">
                <Link
                  to="/settings"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  <Settings className="size-4 text-zinc-500 dark:text-zinc-300" />
                  Settings
                </Link>
                <button
                  onClick={() => {
                    dispatch(toggleTheme());
                    setIsMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  type="button"
                >
                  {theme === 'light' ? (
                    <MoonIcon className="size-4 text-zinc-600 dark:text-zinc-300" />
                  ) : (
                    <SunIcon className="size-4 text-yellow-400" />
                  )}
                  {theme === 'light' ? 'Dark mode' : 'Light mode'}
                </button>
                <button
                  onClick={() => {
                    dispatch(logout());
                    setIsMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2 text-left px-3 py-2 text-sm rounded-lg text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30"
                  type="button"
                >
                  <LogOut className="size-4" />
                  Sign out
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Navbar;
