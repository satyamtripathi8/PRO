import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

interface BackButtonProps {
  label?: string;
  fallbackPath?: string;
  className?: string;
  size?: 'sm' | 'md';
}

/**
 * Smart back button:
 * - If user navigated here from within the app → go back
 * - If opened directly (new tab / direct URL) → go to fallback (dashboard)
 */
export default function BackButton({
  label,
  fallbackPath = '/Home',
  className = '',
  size = 'md',
}: BackButtonProps) {
  const navigate = useNavigate();

  const handleBack = () => {
    // If there's meaningful history (more than the initial page load), go back
    // window.history.length === 1 means direct navigation / new tab
    // window.history.length === 2 can also mean fresh tab with a redirect
    if (window.history.length > 2) {
      navigate(-1);
    } else {
      navigate(fallbackPath, { replace: true });
    }
  };

  const sizeClasses = size === 'sm'
    ? 'p-1.5 gap-1 text-xs'
    : 'p-2 gap-2 text-sm';

  return (
    <button
      onClick={handleBack}
      className={`
        inline-flex items-center font-medium text-gray-600 hover:text-gray-900
        hover:bg-gray-100 rounded-full transition-all duration-200
        active:scale-95
        ${sizeClasses}
        ${className}
      `}
      aria-label="Go back"
    >
      <ArrowLeft size={size === 'sm' ? 16 : 20} />
      {label && <span>{label}</span>}
    </button>
  );
}
