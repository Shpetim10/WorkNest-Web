import { X } from 'lucide-react';

interface GradientModalHeaderProps {
  title: string;
  subtitle?: string;
  onClose: () => void;
}

export function GradientModalHeader({ title, subtitle, onClose }: GradientModalHeaderProps) {
  return (
    <div
      className="px-6 py-5 flex items-center justify-between"
      style={{ background: 'linear-gradient(135deg, #2563EB 0%, #0EA5E9 50%, #10B981 100%)' }}
    >
      <div className="space-y-1">
        <h2 className="text-2xl font-bold leading-7 text-white tracking-tight">{title}</h2>
        {subtitle && (
          <p className="text-sm font-medium leading-5 text-white/75">
            {subtitle}
          </p>
        )}
      </div>
      <button
        type="button"
        onClick={onClose}
        className="text-white/80 hover:text-white transition-colors"
        aria-label="Close"
      >
        <X size={18} />
      </button>
    </div>
  );
}
