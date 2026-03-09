import { HTMLAttributes, ReactNode } from 'react';
import { clsx } from 'clsx';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  children: ReactNode;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info';
  size?: 'sm' | 'md' | 'lg';
}

export function Badge({
  children,
  variant = 'default',
  size = 'md',
  className,
  ...props
}: BadgeProps) {
  const baseStyles =
    'inline-flex items-center font-medium rounded-full';

  const variantStyles = {
    default:
      'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
    primary:
      'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    success:
      'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    warning:
      'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
    danger:
      'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
    info:
      'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-300',
  };

  const sizeStyles = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
    lg: 'px-3 py-1.5 text-base',
  };

  return (
    <span
      className={clsx(
        baseStyles,
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
