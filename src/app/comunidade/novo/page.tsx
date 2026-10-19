import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { NovoTopicoContent } from "@/components/comunidade/NovoTopicoContent";

export const metadata: Metadata = {
  title: "Novo post — CraftSapiens | Comunidade",
  description: "Crie um post na comunidade CraftSapiens.",
  robots: { index: false },
};

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

function first(value: string | string[] | undefined): string | null {
  const v = Array.isArray(value) ? value[0] : value;
  return v && v.length <= 300 ? v : null;
}

// /comunidade/novo?categoria=slug  ou, numa denúncia, ?denunciar=<tópico>&comentario=<id>
export default async function NovoTopicoPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const categoria = first(params.categoria);
  const denunciar = first(params.denunciar);
  const comentario = first(params.comentario);
  const membro = first(params.membro);

  // Todo post nasce dentro de uma categoria: o botão fica na página de cada uma
  if (!categoria && !denunciar && !membro) redirect("/comunidade");

  const session = await auth();
  if (!session?.user) {
    const query = new URLSearchParams();
    if (categoria) query.set("categoria", categoria);
    if (denunciar) query.set("denunciar", denunciar);
    if (comentario) query.set("comentario", comentario);
    if (membro) query.set("membro", membro);
    const back = `/comunidade/novo${query.size > 0 ? `?${query}` : ""}`;
    redirect(`/login?redirect=${encodeURIComponent(back)}`);
  }

  return <NovoTopicoContent categoriaSlug={categoria} denunciar={denunciar} comentario={comentario} membro={membro} />;
}
