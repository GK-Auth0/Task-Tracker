interface RingLoaderProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function RingLoader({ size = 'md', className = '' }: RingLoaderProps) {
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-12 h-12 text-sm',
    lg: 'w-16 h-16 text-base'
  };

  return (
    <div className={`relative inline-flex items-center justify-center ${sizeClasses[size]} ${className}`}>
      <div className="absolute inset-0 border-2 border-blue-200 rounded-full animate-spin border-t-blue-600"></div>
      <span className="font-bold text-blue-600">TT</span>
    </div>
  );
}