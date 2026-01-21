import { useThemeStore } from '../../store/themeStore';
import { cn } from '../../lib/utils';
import { CheckCircle, AlertTriangle, XCircle, LucideIcon } from 'lucide-react';

interface StatusCardProps {
  title: string;
  value: string | number;
  status?: 'healthy' | 'warning' | 'critical' | 'neutral';
  icon?: LucideIcon;
  subtitle?: string;
  className?: string;
}

export default function StatusCard({
  title,
  value,
  status = 'neutral',
  icon: Icon,
  subtitle,
  className
}: StatusCardProps) {
  const { isDark } = useThemeStore();

  const statusColors = {
    healthy: {
      bg: isDark ? 'bg-green-500/10' : 'bg-green-50',
      border: isDark ? 'border-green-500/30' : 'border-green-200',
      text: 'text-green-500',
      icon: CheckCircle
    },
    warning: {
      bg: isDark ? 'bg-yellow-500/10' : 'bg-yellow-50',
      border: isDark ? 'border-yellow-500/30' : 'border-yellow-200',
      text: 'text-yellow-500',
      icon: AlertTriangle
    },
    critical: {
      bg: isDark ? 'bg-red-500/10' : 'bg-red-50',
      border: isDark ? 'border-red-500/30' : 'border-red-200',
      text: 'text-red-500',
      icon: XCircle
    },
    neutral: {
      bg: isDark ? 'bg-gray-800' : 'bg-white',
      border: isDark ? 'border-gray-700' : 'border-gray-200',
      text: isDark ? 'text-gray-400' : 'text-gray-500',
      icon: null
    }
  };

  const colors = statusColors[status];
  const StatusIcon = colors.icon;

  return (
    <div
      className={cn(
        'p-4 rounded-xl border transition-all',
        colors.bg,
        colors.border,
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            {Icon && (
              <Icon className={cn('w-4 h-4', isDark ? 'text-gray-400' : 'text-gray-500')} />
            )}
            <span className={cn('text-sm font-medium', isDark ? 'text-gray-400' : 'text-gray-500')}>
              {title}
            </span>
          </div>
          <div className={cn('mt-2 text-2xl font-bold', isDark ? 'text-white' : 'text-gray-900')}>
            {value}
          </div>
          {subtitle && (
            <div className={cn('mt-1 text-xs', isDark ? 'text-gray-500' : 'text-gray-400')}>
              {subtitle}
            </div>
          )}
        </div>
        {StatusIcon && (
          <StatusIcon className={cn('w-6 h-6', colors.text)} />
        )}
      </div>
    </div>
  );
}
