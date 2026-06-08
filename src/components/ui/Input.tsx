import type { InputHTMLAttributes, ReactNode } from 'react';
import { forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

/* Exact values from mobile Input.tsx:
   container gap: spacing[1]+2 = 6px
   label: fontSize.sm=13px, fontWeight.medium
   wrapper: borderWidth 1.5, borderRadius radius.lg=14px, minHeight 52px
   input: fontSize.base=15px, px spacing[4]=16px, py spacing[3]=12px
   leftIcon: marginLeft spacing[4]=16px
   inputWithLeftIcon: paddingLeft spacing[2]=8px
   rightIcon: marginRight spacing[3]=12px
   error: fontSize.xs=11px                                              */
export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, leftIcon, rightIcon, className = '', ...rest }, ref) => {
    return (
      <div className="flex flex-col" style={{ gap: 6 }}>
        {label && (
          <label className="text-[13px] font-medium text-slate-600">{label}</label>
        )}
        <div
          className={`flex items-center min-h-[52px] rounded-[14px] border-[1.5px] bg-white transition-colors ${
            error ? 'border-danger' : 'border-slate-200 focus-within:border-primary'
          }`}
        >
          {leftIcon && (
            <span className="ml-4 text-slate-400 flex-shrink-0 flex items-center">{leftIcon}</span>
          )}
          <input
            ref={ref}
            {...rest}
            className={`flex-1 text-[15px] text-slate-900 placeholder:text-slate-400 outline-none bg-transparent py-3 ${
              leftIcon ? 'pl-2 pr-4' : 'px-4'
            } ${rightIcon ? 'pr-2' : ''} ${className}`}
          />
          {rightIcon && (
            <span className="mr-3 text-slate-400 flex-shrink-0 flex items-center">{rightIcon}</span>
          )}
        </div>
        {error && <p className="text-[11px] text-danger">{error}</p>}
      </div>
    );
  }
);
