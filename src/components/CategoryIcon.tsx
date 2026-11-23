import {
  Armchair,
  Bike,
  BookOpen,
  Building2,
  Car,
  DoorOpen,
  Hammer,
  Home,
  Laptop,
  Paintbrush,
  Refrigerator,
  Ruler,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Tv,
  Users,
  Wind,
  Wrench,
  Zap,
} from 'lucide-react';

interface CategoryIconProps {
  name?: string;
  className?: string;
}

export function CategoryIcon({
  name = 'Wrench',
  className = 'h-5 w-5',
}: CategoryIconProps) {
  switch (name) {
    case 'Zap':
      return <Zap className={className} aria-hidden="true" />;
    case 'Wind':
      return <Wind className={className} aria-hidden="true" />;
    case 'Paintbrush':
      return <Paintbrush className={className} aria-hidden="true" />;
    case 'Car':
      return <Car className={className} aria-hidden="true" />;
    case 'Sparkles':
      return <Sparkles className={className} aria-hidden="true" />;
    case 'Laptop':
      return <Laptop className={className} aria-hidden="true" />;
    case 'BookOpen':
      return <BookOpen className={className} aria-hidden="true" />;
    case 'Hammer':
      return <Hammer className={className} aria-hidden="true" />;
    case 'Ruler':
      return <Ruler className={className} aria-hidden="true" />;
    case 'Refrigerator':
      return <Refrigerator className={className} aria-hidden="true" />;
    case 'ShieldCheck':
      return <ShieldCheck className={className} aria-hidden="true" />;
    case 'Home':
      return <Home className={className} aria-hidden="true" />;
    case 'Users':
      return <Users className={className} aria-hidden="true" />;
    case 'DoorOpen':
      return <DoorOpen className={className} aria-hidden="true" />;
    case 'Building2':
      return <Building2 className={className} aria-hidden="true" />;
    case 'Smartphone':
      return <Smartphone className={className} aria-hidden="true" />;
    case 'Armchair':
      return <Armchair className={className} aria-hidden="true" />;
    case 'Tv':
      return <Tv className={className} aria-hidden="true" />;
    case 'Bike':
      return <Bike className={className} aria-hidden="true" />;
    case 'Wrench':
    default:
      return <Wrench className={className} aria-hidden="true" />;
  }
}
