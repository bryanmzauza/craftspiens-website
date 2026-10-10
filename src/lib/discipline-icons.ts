import {
  BookOpen,
  Calculator,
  Code,
  Dumbbell,
  Globe,
  GraduationCap,
  Languages,
  Microscope,
  Palette,
  type LucideIcon,
} from "lucide-react";

// O campo `icon` das disciplinas guarda o nome do ícone do Lucide (ex.: "Calculator")
export const DISCIPLINE_ICONS: Record<string, LucideIcon> = {
  Calculator,
  Microscope,
  Globe,
  BookOpen,
  Palette,
  Code,
  Languages,
  Dumbbell,
};

export function getDisciplineIcon(name: string): LucideIcon {
  return DISCIPLINE_ICONS[name] ?? GraduationCap;
}
