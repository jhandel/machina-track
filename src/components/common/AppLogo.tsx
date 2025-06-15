import { Factory } from 'lucide-react';
import { APP_NAME } from '@/lib/constants';

interface AppLogoProps {
  className?: string;
  iconSize?: number;
  textSize?: string;
  showText?: boolean;
}

export function AppLogo({ className, iconSize = 24, textSize = "text-xl", showText = true }: AppLogoProps) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Factory size={iconSize} className="text-primary" />
      {showText && <span className={`font-bold ${textSize} text-primary`}>{APP_NAME}</span>}
    </div>
  );
}
