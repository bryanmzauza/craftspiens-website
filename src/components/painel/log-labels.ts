// Textos do registro de atividade do painel (ação gravada em panel_logs.action)
import {
  CalendarDays,
  CalendarX,
  Copy,
  KeyRound,
  Megaphone,
  Package,
  Percent,
  Star,
  Tag,
  TicketPercent,
  Truck,
  type LucideIcon,
} from "lucide-react";

const LABELS: Record<string, { label: string; icon: LucideIcon }> = {
  "acesso.entrar": { label: "abriu o painel", icon: KeyRound },
  "produto.criar": { label: "criou o produto", icon: Package },
  "produto.editar": { label: "editou o produto", icon: Package },
  "produto.preco": { label: "mudou o preço de", icon: Tag },
  "produto.promocao": { label: "colocou em promoção", icon: Percent },
  "produto.encerrarPromocao": { label: "encerrou a promoção de", icon: Percent },
  "produto.ativar": { label: "ativou na loja", icon: Package },
  "produto.desativar": { label: "tirou da loja", icon: Package },
  "produto.destaque": { label: "mudou o destaque de", icon: Star },
  "produto.ordem": { label: "reordenou os produtos", icon: Package },
  "produto.excluir": { label: "excluiu o produto", icon: Package },
  "cupom.criar": { label: "criou o cupom", icon: TicketPercent },
  "cupom.editar": { label: "editou o cupom", icon: TicketPercent },
  "cupom.ativar": { label: "ativou o cupom", icon: TicketPercent },
  "cupom.desativar": { label: "desativou o cupom", icon: TicketPercent },
  "cupom.excluir": { label: "excluiu o cupom", icon: TicketPercent },
  "entrega.reenviar": { label: "reenviou a entrega de", icon: Truck },
  "aula.criar": { label: "marcou a aula", icon: CalendarDays },
  "aula.editar": { label: "editou a aula", icon: CalendarDays },
  "aula.cancelar": { label: "cancelou a aula", icon: CalendarX },
  "aula.reativar": { label: "reativou a aula", icon: CalendarDays },
  "aula.excluir": { label: "excluiu a aula", icon: CalendarX },
  "aula.copiarSemana": { label: "copiou uma semana do cronograma", icon: Copy },
  "aula.aviso": { label: "publicou o aviso", icon: Megaphone },
  "aula.avisoRemovido": { label: "removeu o aviso do cronograma", icon: Megaphone },
};

export function describeLog(action: string): { label: string; icon: LucideIcon } {
  return LABELS[action] ?? { label: action, icon: Package };
}
