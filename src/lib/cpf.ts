// CPF: validação pelos dígitos verificadores e formatação

/** Mantém só os dígitos */
export function normalizeCpf(value: string): string {
  return value.replace(/\D/g, "");
}

export function isValidCpf(value: string): boolean {
  const cpf = normalizeCpf(value);
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;

  const digit = (length: number) => {
    let sum = 0;
    for (let i = 0; i < length; i++) sum += Number(cpf[i]) * (length + 1 - i);
    const rest = (sum * 10) % 11;
    return rest === 10 ? 0 : rest;
  };

  return digit(9) === Number(cpf[9]) && digit(10) === Number(cpf[10]);
}

/** 12345678909 -> 123.456.789-09 */
export function formatCpf(value: string): string {
  const cpf = normalizeCpf(value).slice(0, 11);
  return cpf
    .replace(/^(\d{3})(\d)/, "$1.$2")
    .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1-$2");
}

/** Exibe só o começo e o fim: 123.***.***-09 */
export function maskCpf(value: string): string {
  const cpf = normalizeCpf(value);
  return cpf.length === 11 ? `${cpf.slice(0, 3)}.***.***-${cpf.slice(9)}` : "";
}
