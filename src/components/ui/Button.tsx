import type { ReactNode, ButtonHTMLAttributes } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

const variantCls: Record<Variant, string> = {
  primary:   'bg-primary text-white hover:bg-primary-dark',
  secondary: 'bg-primary-light text-primary border border-primary hover:bg-blue-100',
  ghost:     'bg-transparent text-primary hover:bg-primary-light',
  danger:    'bg-danger text-white hover:bg-red-600',
};

/* Exact values from mobile spacing.ts:
   sm → paddingVertical spacing[2]=8px, paddingHorizontal spacing[4]=16px, radius md=10px
   md → paddingVertical spacing[3]+2=14px, paddingHorizontal spacing[6]=24px, radius lg=14px
   lg → paddingVertical spacing[4]=16px, paddingHorizontal spacing[8]=32px, radius lg=14px  */
const sizeCls: Record<Size, string> = {
  sm: 'py-2 px-4 text-[13px] rounded-[10px]',
  md: 'py-[14px] px-6 text-[15px] rounded-[14px]',
  lg: 'py-4 px-8 text-base rounded-[14px]',
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
  loading?: boolean;
  children: ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  loading = false,
  children,
  className = '',
  disabled,
  ...rest
}: ButtonProps) {
  return (
    <button
      {...rest}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed active:opacity-80 ${variantCls[variant]} ${sizeCls[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
    >
      {loading && (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      )}
      {children}
    </button>
  );
}
