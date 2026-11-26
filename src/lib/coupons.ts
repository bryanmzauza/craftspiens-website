// =============================================================================
// Cupons: regra de quais produtos aceitam o desconto (funções puras)
// =============================================================================

/** Lista vazia vale para todos os produtos; com lista, só para os listados */
export function couponAppliesTo(productIds: readonly string[], productId: string): boolean {
  return productIds.length === 0 || productIds.includes(productId);
}

/** Texto curto da restrição: "todos os produtos", "VIP e Premium", "VIP, Premium e mais 2" */
export function couponProductsLabel(productIds: readonly string[], names: ReadonlyMap<string, string>): string {
  if (productIds.length === 0) return "todos os produtos";

  // Produtos excluídos deixam de aparecer no mapa e são ignorados
  const list = productIds.flatMap((id) => {
    const name = names.get(id);
    return name === undefined ? [] : [name];
  });

  if (list.length === 0) return "nenhum produto disponível";
  if (list.length === 1) return list[0];
  if (list.length === 2) return `${list[0]} e ${list[1]}`;
  if (list.length === 3) return `${list[0]}, ${list[1]} e ${list[2]}`;
  return `${list[0]}, ${list[1]} e mais ${list.length - 2}`;
}
