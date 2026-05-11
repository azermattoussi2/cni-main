import { useState } from 'react';

interface BrandLogoProps {
  className?: string;
  roundedClassName?: string;
}

export default function BrandLogo({ className = 'w-8 h-8', roundedClassName = '' }: BrandLogoProps) {
  const [failed, setFailed] = useState(false);

  if (!failed) {
    return (
      <img
        src="/logocni.png"
        alt="Logo CNI"
        className={`${className} object-contain ${roundedClassName}`.trim()}
        onError={() => setFailed(true)}
      />
    );
  }

  return (
    <div className={`${className} ${roundedClassName} bg-gradient-to-br from-cni-blue to-cni-orange flex items-center justify-center`.trim()}>
      <span className="text-white font-black text-[10px] leading-none">CNI</span>
    </div>
  );
}
