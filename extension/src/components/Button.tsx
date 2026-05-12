// Lightweight Button — keeps consistent variants without overshadowing
// the CSS that does the heavy lifting in styles.css.
import React from 'react';

type Variant = 'default' | 'primary' | 'alarm' | 'ghost';
type Size = 'md' | 'lg';

export interface ButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'className'> {
  variant?: Variant;
  size?: Size;
  block?: boolean;
  className?: string;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'default',
  size = 'md',
  block = false,
  className = '',
  children,
  ...rest
}) => {
  const cls = [
    'btn',
    variant === 'primary' ? 'btn--primary' : '',
    variant === 'alarm' ? 'btn--alarm' : '',
    variant === 'ghost' ? 'btn--ghost' : '',
    size === 'lg' ? 'btn--lg' : '',
    block ? 'btn--block' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button className={cls} {...rest}>
      {children}
    </button>
  );
};

export default Button;
