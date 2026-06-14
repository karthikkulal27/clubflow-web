import type { InputHTMLAttributes, ReactNode } from 'react';
import { forwardRef, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, leftIcon, rightIcon, className = '', type, ...rest }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const isPassword = type === 'password';
    const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

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
            type={inputType}
            {...rest}
            className={`flex-1 text-[15px] text-slate-900 placeholder:text-slate-400 outline-none bg-transparent py-3 ${
              leftIcon ? 'pl-2' : 'px-4'
            } ${(rightIcon || isPassword) ? 'pr-2' : 'pr-4'} ${className}`}
          />
          {isPassword && (
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="mr-3 text-slate-400 flex-shrink-0 flex items-center hover:text-slate-600"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          )}
          {!isPassword && rightIcon && (
            <span className="mr-3 text-slate-400 flex-shrink-0 flex items-center">{rightIcon}</span>
          )}
        </div>
        {error && <p className="text-[11px] text-danger">{error}</p>}
      </div>
    );
  }
);
