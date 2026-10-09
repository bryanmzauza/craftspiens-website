import {
  Megaphone,
  MessageCircle,
  CircleHelp,
  Lightbulb,
  Bug,
  Hammer,
  Gamepad2,
  type LucideIcon,
} from "lucide-react";

// O campo `icon` das categorias do fórum guarda o nome do ícone do Lucide,
// no mesmo padrão das disciplinas (ex.: "Megaphone").
const ICON_MAP: Record<string, LucideIcon> = {
  Megaphone,
  MessageCircle,
  CircleHelp,
  Lightbulb,
  Bug,
  Hammer,
  Gamepad2,
};

export function CategoryIcon({ icon, size = 22 }: { icon: string | null; size?: number }) {
  const Icon = (icon && ICON_MAP[icon]) || MessageCircle;
  return <Icon size={size} className="text-green-cs" aria-hidden="true" />;
}
