"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import {
  User,
  Lock,
  Bell,
  Eye,
  AlertTriangle,
  Save,
  Check,
  Mail,
  Calendar,
  FileText,
  Trash2,
  Power,
  Loader2,
} from "lucide-react";
import { PageHero } from "@/components/ui/PageHero";

type Tab = "dados" | "senha" | "notificacoes" | "privacidade" | "perigo";

const TABS: { id: Tab; label: string; icon: typeof User }[] = [
  { id: "dados", label: "Dados Pessoais", icon: User },
  { id: "senha", label: "Alterar Senha", icon: Lock },
  { id: "notificacoes", label: "Notificações", icon: Bell },
  { id: "privacidade", label: "Privacidade", icon: Eye },
  { id: "perigo", label: "Zona de Perigo", icon: AlertTriangle },
];

type ProfileData = {
  username: string;
  email: string;
  birthDate: string | null;
  profile: {
    bio: string | null;
    perfilPublico: boolean;
    mostrarTempoOnline: boolean;
    mostrarAtividade: boolean;
    notifForumRespostas: string;
    notifLembretesAulas: string;
    notifNovidades: string;
    notifResumoSemanal: string;
  } | null;
};

export function ConfiguracoesContent() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState<Tab>("dados");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  // Profile data
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [bio, setBio] = useState("");
  const [birthDate, setBirthDate] = useState("");

  // Password
  const [senhaAtual, setSenhaAtual] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [senhaError, setSenhaError] = useState("");
  const [senhaSaved, setSenhaSaved] = useState(false);

  // Notifications
  const [notifForum, setNotifForum] = useState<string>("email");
  const [notifAulas, setNotifAulas] = useState<string>("email");
  const [notifNovidades, setNotifNovidades] = useState<string>("off");
  const [notifResumo, setNotifResumo] = useState<string>("off");

  // Privacy
  const [perfilPublico, setPerfilPublico] = useState(true);
  const [mostrarTempo, setMostrarTempo] = useState(true);
  const [mostrarAtividade, setMostrarAtividade] = useState(true);

  // Danger zone
  const [confirmDelete, setConfirmDelete] = useState("");

  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await fetch("/api/perfil");
        if (!res.ok) return;
        const data: ProfileData = await res.json();

        setUsername(data.username);
        setEmail(data.email);
        setBio(data.profile?.bio || "");
        setBirthDate(
          data.birthDate
            ? new Date(data.birthDate).toLocaleDateString("pt-BR")
            : "Não informada"
        );

        if (data.profile) {
          setPerfilPublico(data.profile.perfilPublico);
          setMostrarTempo(data.profile.mostrarTempoOnline);
          setMostrarAtividade(data.profile.mostrarAtividade);
          setNotifForum(data.profile.notifForumRespostas);
          setNotifAulas(data.profile.notifLembretesAulas);
          setNotifNovidades(data.profile.notifNovidades);
          setNotifResumo(data.profile.notifResumoSemanal);
        }
      } catch {
        // Will show with defaults
      } finally {
        setLoading(false);
      }
    }
    if (session?.user) fetchProfile();
  }, [session]);

  const showSaved = useCallback(() => {
    setSaved(true);
    setError("");
    setTimeout(() => setSaved(false), 2000);
  }, []);

  const handleSaveDados = async () => {
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/perfil", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, bio }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Erro ao salvar.");
        return;
      }
      showSaved();
    } catch {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSenha = async () => {
    setSaving(true);
    setSenhaError("");
    try {
      const res = await fetch("/api/perfil/senha", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: senhaAtual, newPassword: novaSenha }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSenhaError(data.error || "Erro ao alterar senha.");
        return;
      }
      setSenhaAtual("");
      setNovaSenha("");
      setConfirmarSenha("");
      setSenhaSaved(true);
      setTimeout(() => setSenhaSaved(false), 2000);
    } catch {
      setSenhaError("Erro de conexão. Tente novamente.");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveNotificacoes = async () => {
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/perfil/configuracoes", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          notifForumRespostas: notifForum,
          notifLembretesAulas: notifAulas,
          notifNovidades,
          notifResumoSemanal: notifResumo,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Erro ao salvar.");
        return;
      }
      showSaved();
    } catch {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setSaving(false);
    }
  };

  const handleSavePrivacidade = async () => {
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/perfil/configuracoes", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          perfilPublico,
          mostrarTempoOnline: mostrarTempo,
          mostrarAtividade,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Erro ao salvar.");
        return;
      }
      showSaved();
    } catch {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <>
        <PageHero
          title="CONFIGURAÇÕES"
          breadcrumbs={[
            { label: "Home", href: "/" },
            { label: "Perfil", href: "/perfil" },
            { label: "Configurações" },
          ]}
        />
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-green-cs" />
        </div>
      </>
    );
  }

  return (
    <>
      <PageHero
        title="CONFIGURAÇÕES"
        subtitle="Gerencie dados da conta, senha, notificações e privacidade."
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Perfil", href: "/perfil" },
          { label: "Configurações" },
        ]}
      />

      <div className="mx-auto max-w-7xl px-4 pb-16 lg:px-6">
        <div className="flex flex-col gap-8 lg:flex-row">
          {/* Sidebar de tabs */}
          <nav className="shrink-0 lg:w-56">
            <div className="flex gap-1 overflow-x-auto lg:flex-col">
              {TABS.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                      activeTab === tab.id
                        ? tab.id === "perigo"
                          ? "bg-error/10 text-error"
                          : "bg-green-cs/10 text-green-cs"
                        : "text-[#A0A0A0] hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    <Icon size={16} />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </nav>

          {/* Conteúdo */}
          <div className="min-w-0 flex-1">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-white/10 bg-bg-card/50 p-6"
            >
              {activeTab === "dados" && (
                <div className="space-y-4">
                  <h2 className="text-lg font-bold text-white">Dados Pessoais</h2>

                  {error && (
                    <p className="rounded-lg bg-error/10 px-3 py-2 text-sm text-error">{error}</p>
                  )}

                  <div>
                    <label className="mb-1 block text-sm font-medium text-[#E0E0E0]">Username</label>
                    <p className="rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-[#A0A0A0]">
                      {username}
                    </p>
                    <p className="mt-1 text-xs text-[#A0A0A0]">O username não pode ser alterado.</p>
                  </div>

                  <div>
                    <label htmlFor="email" className="mb-1 block text-sm font-medium text-[#E0E0E0]">
                      <Mail size={14} className="mr-1 inline" />
                      Email
                    </label>
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full rounded-lg border border-white/20 bg-white/5 px-4 py-2.5 text-sm text-white focus:border-green-cs focus:outline-none"
                    />
                    <p className="mt-1 text-xs text-[#A0A0A0]">Alterações requerem confirmação por email.</p>
                  </div>

                  <div>
                    <label htmlFor="bio" className="mb-1 block text-sm font-medium text-[#E0E0E0]">
                      <FileText size={14} className="mr-1 inline" />
                      Bio
                    </label>
                    <textarea
                      id="bio"
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      maxLength={500}
                      rows={3}
                      className="w-full rounded-lg border border-white/20 bg-white/5 px-4 py-2.5 text-sm text-white focus:border-green-cs focus:outline-none"
                    />
                    <p className="mt-1 text-xs text-[#A0A0A0]">{bio.length}/500 caracteres</p>
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-[#E0E0E0]">
                      <Calendar size={14} className="mr-1 inline" />
                      Data de Nascimento
                    </label>
                    <p className="rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-[#A0A0A0]">
                      {birthDate}
                    </p>
                    <p className="mt-1 text-xs text-[#A0A0A0]">Não pode ser alterada após o registro.</p>
                  </div>

                  <button
                    onClick={handleSaveDados}
                    disabled={saving}
                    className="flex items-center gap-1.5 rounded-lg bg-green-cs px-6 py-2.5 text-sm font-bold text-white transition-all hover:bg-green-dark disabled:opacity-40"
                  >
                    {saving ? <Loader2 size={16} className="animate-spin" /> : saved ? <Check size={16} /> : <Save size={16} />}
                    {saved ? "Salvo!" : "Salvar Alterações"}
                  </button>
                </div>
              )}

              {activeTab === "senha" && (
                <div className="space-y-4">
                  <h2 className="text-lg font-bold text-white">Alterar Senha</h2>
                  <p className="text-sm text-[#A0A0A0]">
                    Ao alterar sua senha aqui, ela também será atualizada no servidor Minecraft (nLogin).
                  </p>

                  {senhaError && (
                    <p className="rounded-lg bg-error/10 px-3 py-2 text-sm text-error">{senhaError}</p>
                  )}

                  <div>
                    <label htmlFor="senhaAtual" className="mb-1 block text-sm font-medium text-[#E0E0E0]">
                      Senha Atual
                    </label>
                    <input
                      id="senhaAtual"
                      type="password"
                      value={senhaAtual}
                      onChange={(e) => setSenhaAtual(e.target.value)}
                      className="w-full rounded-lg border border-white/20 bg-white/5 px-4 py-2.5 text-sm text-white focus:border-green-cs focus:outline-none"
                    />
                  </div>

                  <div>
                    <label htmlFor="novaSenha" className="mb-1 block text-sm font-medium text-[#E0E0E0]">
                      Nova Senha
                    </label>
                    <input
                      id="novaSenha"
                      type="password"
                      value={novaSenha}
                      onChange={(e) => setNovaSenha(e.target.value)}
                      className="w-full rounded-lg border border-white/20 bg-white/5 px-4 py-2.5 text-sm text-white focus:border-green-cs focus:outline-none"
                    />
                    {novaSenha && (novaSenha.length < 8 || !/[a-zA-Z]/.test(novaSenha) || !/\d/.test(novaSenha)) && (
                      <p className="mt-1 text-xs text-warning">Mínimo 8 caracteres, com letra e número.</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="confirmarSenha" className="mb-1 block text-sm font-medium text-[#E0E0E0]">
                      Confirmar Nova Senha
                    </label>
                    <input
                      id="confirmarSenha"
                      type="password"
                      value={confirmarSenha}
                      onChange={(e) => setConfirmarSenha(e.target.value)}
                      className="w-full rounded-lg border border-white/20 bg-white/5 px-4 py-2.5 text-sm text-white focus:border-green-cs focus:outline-none"
                    />
                    {confirmarSenha && novaSenha !== confirmarSenha && (
                      <p className="mt-1 text-xs text-error">As senhas não coincidem.</p>
                    )}
                  </div>

                  <button
                    onClick={handleSaveSenha}
                    disabled={
                      saving ||
                      !senhaAtual ||
                      !novaSenha ||
                      novaSenha !== confirmarSenha ||
                      novaSenha.length < 8 ||
                      !/[a-zA-Z]/.test(novaSenha) ||
                      !/\d/.test(novaSenha)
                    }
                    className="flex items-center gap-1.5 rounded-lg bg-green-cs px-6 py-2.5 text-sm font-bold text-white transition-all hover:bg-green-dark disabled:opacity-40"
                  >
                    {saving ? <Loader2 size={16} className="animate-spin" /> : senhaSaved ? <Check size={16} /> : <Lock size={16} />}
                    {senhaSaved ? "Senha Atualizada!" : "Alterar Senha"}
                  </button>
                </div>
              )}

              {activeTab === "notificacoes" && (
                <div className="space-y-6">
                  <h2 className="text-lg font-bold text-white">Notificações</h2>

                  {error && (
                    <p className="rounded-lg bg-error/10 px-3 py-2 text-sm text-error">{error}</p>
                  )}

                  {[
                    { label: "Respostas no fórum", value: notifForum, set: setNotifForum, options: ["email", "site", "off"] },
                    { label: "Lembretes de aulas", value: notifAulas, set: setNotifAulas, options: ["email", "site", "off"] },
                    { label: "Novidades e promoções", value: notifNovidades, set: setNotifNovidades, options: ["email", "off"] },
                    { label: "Resumo semanal", value: notifResumo, set: setNotifResumo, options: ["email", "off"] },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center justify-between gap-4">
                      <span className="text-sm text-white">{item.label}</span>
                      <select
                        value={item.value}
                        onChange={(e) => item.set(e.target.value)}
                        className="rounded-lg border border-white/20 bg-white/5 px-3 py-1.5 text-sm text-white focus:border-green-cs focus:outline-none"
                      >
                        {item.options.map((opt) => (
                          <option key={opt} value={opt} className="bg-bg-primary">
                            {opt === "email" ? "Email" : opt === "site" ? "Apenas no site" : "Desligado"}
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}

                  <button
                    onClick={handleSaveNotificacoes}
                    disabled={saving}
                    className="flex items-center gap-1.5 rounded-lg bg-green-cs px-6 py-2.5 text-sm font-bold text-white transition-all hover:bg-green-dark disabled:opacity-40"
                  >
                    {saving ? <Loader2 size={16} className="animate-spin" /> : saved ? <Check size={16} /> : <Save size={16} />}
                    {saved ? "Salvo!" : "Salvar Preferências"}
                  </button>
                </div>
              )}

              {activeTab === "privacidade" && (
                <div className="space-y-6">
                  <h2 className="text-lg font-bold text-white">Privacidade</h2>

                  {error && (
                    <p className="rounded-lg bg-error/10 px-3 py-2 text-sm text-error">{error}</p>
                  )}

                  {[
                    { label: "Perfil público no ranking", desc: "Outros jogadores podem ver seu perfil", value: perfilPublico, set: setPerfilPublico },
                    { label: "Exibir tempo online", desc: "Mostrar quantas horas você jogou", value: mostrarTempo, set: setMostrarTempo },
                    { label: "Exibir atividade recente", desc: "Mostrar suas últimas ações no perfil público", value: mostrarAtividade, set: setMostrarAtividade },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-sm font-medium text-white">{item.label}</p>
                        <p className="text-xs text-[#A0A0A0]">{item.desc}</p>
                      </div>
                      <button
                        onClick={() => item.set(!item.value)}
                        className={`relative h-6 w-11 rounded-full transition-colors ${
                          item.value ? "bg-green-cs" : "bg-white/20"
                        }`}
                      >
                        <span
                          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                            item.value ? "left-[22px]" : "left-0.5"
                          }`}
                        />
                      </button>
                    </div>
                  ))}

                  <button
                    onClick={handleSavePrivacidade}
                    disabled={saving}
                    className="flex items-center gap-1.5 rounded-lg bg-green-cs px-6 py-2.5 text-sm font-bold text-white transition-all hover:bg-green-dark disabled:opacity-40"
                  >
                    {saving ? <Loader2 size={16} className="animate-spin" /> : saved ? <Check size={16} /> : <Save size={16} />}
                    {saved ? "Salvo!" : "Salvar Preferências"}
                  </button>
                </div>
              )}

              {activeTab === "perigo" && (
                <div className="space-y-6">
                  <h2 className="text-lg font-bold text-error">Zona de Perigo</h2>

                  <div className="rounded-xl border border-warning/30 bg-warning/5 p-4">
                    <div className="flex items-start gap-3">
                      <Power size={20} className="mt-0.5 shrink-0 text-warning" />
                      <div>
                        <h3 className="font-bold text-white">Desativar Conta</h3>
                        <p className="mt-1 text-sm text-[#A0A0A0]">
                          Desativa sua conta no site. Seus dados são preservados e você pode reativar fazendo login novamente.
                        </p>
                        <button className="mt-3 rounded-lg border border-warning px-4 py-2 text-sm font-bold text-warning transition-colors hover:bg-warning/10">
                          Desativar Conta
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-error/30 bg-error/5 p-4">
                    <div className="flex items-start gap-3">
                      <Trash2 size={20} className="mt-0.5 shrink-0 text-error" />
                      <div className="flex-1">
                        <h3 className="font-bold text-white">Excluir Conta Permanentemente</h3>
                        <p className="mt-1 text-sm text-[#A0A0A0]">
                          Remove todos os seus dados do site. Dados do servidor Minecraft são mantidos conforme os Termos e Condições.
                          Esta ação é irreversível.
                        </p>
                        <div className="mt-3">
                          <label htmlFor="confirmDelete" className="mb-1 block text-xs text-[#A0A0A0]">
                            Digite seu username seguido de CONFIRMAR para prosseguir:
                          </label>
                          <input
                            id="confirmDelete"
                            type="text"
                            value={confirmDelete}
                            onChange={(e) => setConfirmDelete(e.target.value)}
                            placeholder={`${username} CONFIRMAR`}
                            className="w-full rounded-lg border border-error/30 bg-white/5 px-4 py-2 text-sm text-white placeholder:text-white/20 focus:border-error focus:outline-none"
                          />
                        </div>
                        <button
                          disabled={confirmDelete !== `${username} CONFIRMAR`}
                          className="mt-3 rounded-lg bg-error px-4 py-2 text-sm font-bold text-white transition-all hover:bg-red-700 disabled:opacity-30"
                        >
                          Excluir Conta Permanentemente
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </>
  );
}
