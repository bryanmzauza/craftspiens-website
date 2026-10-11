export const SITE_DESCRIPTION =
  "O Maior Metaverso Educacional do Mundo. Aulas reais, gamificação e comunidade no Minecraft.";

export const SERVER_IP = "jogar.craftsapiens.com.br";
// Minecraft Bedrock (celular, tablet e Windows): mesmo endereço, porta UDP 19132
export const BEDROCK_PORT = 19132;
export const CONTACT_EMAIL = "contato@craftsapiens.com.br";
export const CONTACT_PHONE = "(41) 9 9587-1942";
export const CONTACT_WHATSAPP = "5541995871942";
export const CONTACT_WHATSAPP_URL = `https://wa.me/${CONTACT_WHATSAPP}`;

export const NAV_LINKS = [
  { label: "SOBRE", href: "/sobre" },
  { label: "AULAS", href: "/aulas" },
  { label: "CRONOGRAMA", href: "/cronograma" },
  { label: "LOJA", href: "/loja" },
  { label: "COMUNIDADE", href: "/comunidade" },
] as const;

// Código do convite permanente do servidor do Discord
export const DISCORD_INVITE_CODE = "craftsapiens";

export const SOCIAL_LINKS = {
  discord: "https://discord.gg/craftsapiens",
  youtube: "https://youtube.com/channel/UCdea6doNy_AypHr4S2tPUTw",
  instagram: "https://instagram.com/universidadecraftsapiens",
  tiktok: "https://tiktok.com/@craftsapiens",
  twitter: "https://twitter.com/craftsapiens",
  facebook: "https://facebook.com/UniversidadeCraftSapiens",
  telegram: "https://t.me/craftsapiens",
} as const;

export const DISCLAIMER =
  "Não afiliado à Mojang Studios. Minecraft é marca registrada de Mojang Synergies AB.";
export const COPYRIGHT = `© ${new Date().getFullYear()} CRAFTSAPIENS. Todos os direitos reservados.`;
