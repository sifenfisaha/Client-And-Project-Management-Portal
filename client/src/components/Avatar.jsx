const getInitials = (name, email) => {
  const base = name || (email ? email.split('@')[0] : '');
  if (!base) return '?';
  const parts = base.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0][0]?.toUpperCase() || '?';
  const first = parts[0][0] || '';
  const last = parts[parts.length - 1][0] || '';
  return `${first}${last}`.toUpperCase() || '?';
};

const Avatar = ({ src, name, email, className = '' }) => {
  if (src) {
    return (
      <img src={src} alt={name || email || 'User'} className={className} />
    );
  }

  const initials = getInitials(name, email);

  return (
    <div
      className={`flex items-center justify-center bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 font-medium ${className}`}
      aria-label={name || email || 'User'}
    >
      <span className="text-[10px] leading-none">{initials}</span>
    </div>
  );
};

export default Avatar;
