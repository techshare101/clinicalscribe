'use client';

import { Loader2 } from 'lucide-react';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
}

export default function Spinner({ size = 'md', text }: SpinnerProps) {
  const sizeMap = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
  };

  return (
    <div className="flex items-center gap-2">
      <Loader2 className={`${sizeMap[size]} animate-spin text-primary`} />
      {text && <span className="text-sm font-medium">{text}</span>}
    </div>
  );
}