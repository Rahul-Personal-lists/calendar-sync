'use client';

import Image from 'next/image';

interface ProviderIconProps {
  provider: string;
  size?: number;
  className?: string;
  showText?: boolean;
}

export default function ProviderIcon({ provider, size = 24, className = '', showText = false }: ProviderIconProps) {
  const getIconSrc = (provider: string) => {
    switch (provider) {
      case 'google':
        return '/icons8-google-48.png';
      case 'outlook':
      case 'azure-ad':
        return '/icons8-outlook-48.png';
      case 'notion':
        return '/icons8-notion.gif';
      default:
        return '/icons8-google-48.png'; // fallback
    }
  };

  const getDisplayName = (provider: string) => {
    switch (provider) {
      case 'google':
        return 'Google';
      case 'outlook':
      case 'azure-ad':
        return 'Outlook';
      case 'notion':
        return 'Notion';
      default:
        return provider.charAt(0).toUpperCase() + provider.slice(1);
    }
  };

  return (
    <div className={`flex items-center ${showText ? 'space-x-2' : ''} ${className}`}>
      <Image
        src={getIconSrc(provider)}
        alt={`${getDisplayName(provider)} icon`}
        width={size}
        height={size}
        className="rounded"
      />
      {showText && (
        <span className="text-sm font-medium">{getDisplayName(provider)}</span>
      )}
    </div>
  );
} 