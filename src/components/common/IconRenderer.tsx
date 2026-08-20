import React from 'react';
import * as LucideIcons from 'lucide-react';

interface IconRendererProps {
  name: string;
  className?: string;
  size?: number;
}

export const IconRenderer: React.FC<IconRendererProps> = ({ name, className = 'w-5 h-5', size }) => {
  // Try direct match or camelized match
  const icons = LucideIcons as Record<string, React.ElementType>;
  
  let IconComponent = icons[name];
  
  if (!IconComponent) {
    // Map common aliases
    const aliases: Record<string, string> = {
      Drama: 'Drama',
      Store: 'Store',
      GraduationCap: 'GraduationCap',
      Sparkles: 'Sparkles',
      Trophy: 'Trophy',
      HeartHandshake: 'HeartHandshake',
      CalendarDays: 'CalendarDays',
      Sliders: 'Sliders',
      Boxes: 'Boxes',
      Users: 'Users',
      Megaphone: 'Megaphone',
      Camera: 'Camera',
      Award: 'Award',
      ShieldCheck: 'ShieldCheck',
      MapPin: 'MapPin',
      Zap: 'Zap',
      Trash2: 'Trash2',
      BookOpen: 'BookOpen',
      QrCode: 'QrCode',
      MonitorPlay: 'MonitorPlay',
      Utensils: 'Utensils',
      CheckCircle2: 'CheckCircle2',
      Clock: 'Clock',
      AlertTriangle: 'AlertTriangle',
    };

    const targetKey = aliases[name] || 'FolderKanban';
    IconComponent = icons[targetKey] || LucideIcons.FolderKanban;
  }

  return <IconComponent className={className} size={size} />;
};
