import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Download,
  FileText,
  History,
  LogOut,
  Plus,
  RotateCcw,
  Search,
  ShieldCheck,
  Trash2,
  Upload,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

type Role = "admin" | "dirigeant";
type StatutLicence = "Valide" | "En attente" | "À renouveler" | "Refusée";

type Player = {
  id: string;
  nom: string;
  prenom: string;
  equipe: string;
  poste: string;
  numeroLicence: string;
  statut: StatutLicence;
  dateDemande: string;
  dateExpiration: string;
  certificatMedical: boolean;
  photoIdentite: boolean;
  pieceIdentite: boolean;
  assurance: boolean;
  notes: string;
  deletedAt?: string;
  deletedBy?: string;
};

type SessionUser = {
  nom: string;
  role: Role;
};

type LoginForm = {
  identifiant: string;
  motDePasse: string;
};

type ActivityEntry = {
  id: string;
  action: string;
  cible: string;
  details: string;
  utilisateur: string;
  role: Role;
  date: string;
};

type FormState = Omit<Player, "id" | "deletedAt" | "deletedBy">;

type StatCard = {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
};

const STORAGE_KEY = "foot-licences-app-v2";
const TRASH_KEY = "foot-licences-trash-v2";
const LOG_KEY = "foot-licences-log-v2";

function createId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

const initialPlayers: Player[] = [
  {
    id: createId(),
    nom: "Martin",
    prenom: "Lucas",
    equipe: "U17",
    poste: "Milieu",
    numeroLicence: "FFF-2026-001",
    statut: "Valide",
    dateDemande: "2026-01-10",
    dateExpiration: "2026-09-30",
    certificatMedical: true,
    photoIdentite: true,
    pieceIdentite: true,
    assurance: true,
    notes: "Dossier complet",
  },
  {
    id: createId(),
    nom: "Diallo",
    prenom: "Ibrahima",
    equipe: "Seniors",
    poste: "Défenseur",
    numeroLicence: "FFF-2026-002",
    statut: "À renouveler",
    dateDemande: "2025-09-02",
    dateExpiration: "2026-04-15",
    certificatMedical: true,
    photoIdentite: false,
    pieceIdentite: true,
    assurance: true,
    notes: "Photo manquante",
  },
  {
    id: createId(),
    nom: "Rossi",
    prenom: "Enzo",
    equipe: "U15",
    poste: "Gardien",
    numeroLicence: "FFF-2026-003",
    statut: "En attente",
    dateDemande: "2026-03-01",
    dateExpiration: "2026-08-31",
    certificatMedical: false,
    photoIdentite: true,
    pieceIdentite: true,
    assurance: false,
    notes: "Certificat et assurance à fournir",
  },
];

const emptyForm: FormState = {
  nom: "",
  prenom: "",
  equipe: "",
  poste: "",
  numeroLicence: "",
  statut: "En attente",
  dateDemande: "",
  dateExpiration: "",
  certificatMedical: false,
  photoIdentite: false,
  pieceIdentite: false,
  assurance: false,
  notes: "",
};

function daysUntil(dateString: string): number | null {
  if (!dateString) return null;
  const now = new Date();
  const target = new Date(dateString);
  if (Number.isNaN(target.getTime())) return null;
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function statusColor(statut: StatutLicence): string {
  switch (statut) {
    case "Valide":
      return "bg-green-100 text-green-700 border-green-200";
    case "En attente":
      return "bg-amber-100 text-amber-700 border-amber-200";
    case "Refusée":
      return "bg-red-100 text-red-700 border-red-200";
    case "À renouveler":
      return "bg-orange-100 text-orange-700 border-orange-200";
    default:
      return "bg-slate-100 text-slate-700 border-slate-200";
  }
}

function completionRate(player: Pick<Player, "certificatMedical" | "photoIdentite" | "pieceIdentite" | "assurance">): number {
  const docs = [player.certificatMedical, player.photoIdentite, player.pieceIdentite, player.assurance];
  const completed = docs.filter(Boolean).length;
  return Math.round((completed / docs.length) * 100);
}

function safeParseArray<T>(value: string | null, fallback: T[]): T[] {
  if (!value) return fallback;
  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed) ? (parsed as T[]) : fallback;
  } catch {
    return fallback;
  }
}

function buildSelfTests(): string[] {
  const results: string[] = [];

  if (completionRate({ certificatMedical: true, photoIdentite: true, pieceIdentite: true, assurance: true }) === 100) {
    results.push("completionRate(100%) OK");
  }
  if (completionRate({ certificatMedical: true, photoIdentite: false, pieceIdentite: false, assurance: false }) === 25) {
    results.push("completionRate(25%) OK");
  }
  if (statusColor("Valide").includes("green")) {
    results.push("statusColor(Valide) OK");
  }
  if (daysUntil("") === null) {
    results.push("daysUntil(vide) OK");
  }

  return results;
}

export default function LogicielSuiviLicencesFoot(): JSX.Element {
  const [players, setPlayers] = useState<Player[]>([]);
  const [trash, setTrash] = useState<Player[]>([]);
  const [activityLog, setActivityLog] = useState<ActivityEntry[]>([]);
  const [currentRole, setCurrentRole] = useState<Role>("admin");
  const [authOpen, setAuthOpen] = useState<boolean>(false);
  const [loginForm, setLoginForm] = useState<LoginForm>({ identifiant: "", motDePasse: "" });
  const [sessionUser, setSessionUser] = useState<SessionUser>({ nom: "Administrateur club", role: "admin" });
  const [search, setSearch] = useState<string>("");
  const [teamFilter, setTeamFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [form, setForm] = useState<FormState>(emptyForm);

  useEffect(() => {
    setPlayers(safeParseArray<Player>(localStorage.getItem(STORAGE_KEY), initialPlayers));
    setTrash(safeParseArray<Player>(localStorage.getItem(TRASH_KEY), []));
    setActivityLog(safeParseArray<ActivityEntry>(localStorage.getItem(LOG_KEY), []));
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(players));
  }, [players]);

  useEffect(() => {
    localStorage.setItem(TRASH_KEY, JSON.stringify(trash));
  }, [trash]);

  useEffect(() => {
    localStorage.setItem(LOG_KEY, JSON.stringify(activityLog));
  }, [activityLog]);

  const teams = useMemo<string[]>(() => {
    return [...new Set(players.map((player) => player.equipe).filter(Boolean))].sort();
  }, [players]);

  const filteredPlayers = useMemo<Player[]>(() => {
    return players.filter((player) => {
      const haystack = `${player.nom} ${player.prenom} ${player.equipe} ${player.numeroLicence}`.toLowerCase();
      const matchesSearch = haystack.includes(search.toLowerCase());
      const matchesTeam = teamFilter === "all" || player.equipe === teamFilter;
      const matchesStatus = statusFilter === "all" || player.statut === statusFilter;
      return matchesSearch && matchesTeam && matchesStatus;
    });
  }, [players, search, teamFilter, statusFilter]);

  const stats = useMemo(() => {
    const valides = players.filter((player) => player.statut === "Valide").length;
    const attente = players.filter((player) => player.statut === "En attente").length;
    const renouveler = players.filter((player) => player.statut === "À renouveler").length;
    const expiresSoon = players.filter((player) => {
      const remaining = daysUntil(player.dateExpiration);
      return remaining !== null && remaining >= 0 && remaining <= 30;
    }).length;

    return {
      total: players.length,
      valides,
      attente,
      renouveler,
      expiresSoon,
      corbeille: trash.length,
    };
  }, [players, trash]);

  const statCards = useMemo<StatCard[]>(() => {
    return [
      { label: "Total licences", value: stats.total, icon: Users },
      { label: "Licences valides", value: stats.valides, icon: CheckCircle2 },
      { label: "En attente", value: stats.attente, icon: Clock3 },
      { label: "En corbeille", value: stats.corbeille, icon: Trash2 },
      { label: "Expiration < 30 jours", value: stats.expiresSoon, icon: AlertTriangle },
    ];
  }, [stats]);

  const selfTests = useMemo<string[]>(() => buildSelfTests(), []);

  function updateForm<K extends keyof FormState>(key: K, value: FormState[K]): void {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function addLog(action: string, cible: string, details = ""): void {
    const entry: ActivityEntry = {
      id: createId(),
      action,
      cible,
      details,
      utilisateur: sessionUser.nom,
      role: currentRole,
      date: new Date().toLocaleString("fr-FR"),
    };
    setActivityLog((prev) => [entry, ...prev].slice(0, 100));
  }

  function addPlayer(): void {
    if (currentRole !== "admin") return;
    if (!form.nom || !form.prenom || !form.equipe) return;

    const newPlayer: Player = {
      id: createId(),
      ...form,
    };

    setPlayers((prev) => [newPlayer, ...prev]);
    addLog("Création", `${form.prenom} ${form.nom}`, "Nouvelle licence créée");
    setForm(emptyForm);
    setIsOpen(false);
  }

  function deletePlayer(id: string): void {
    if (currentRole !== "admin") return;
    const player = players.find((entry) => entry.id === id);
    if (!player) return;

    const deletedItem: Player = {
      ...player,
      deletedAt: new Date().toLocaleString("fr-FR"),
      deletedBy: sessionUser.nom,
    };

    setTrash((prev) => [deletedItem, ...prev]);
    setPlayers((prev) => prev.filter((entry) => entry.id !== id));
    addLog("Suppression", `${player.prenom} ${player.nom}`, "Licence déplacée dans la corbeille");
  }

  function restorePlayer(id: string): void {
    if (currentRole !== "admin") return;
    const item = trash.find((entry) => entry.id === id);
    if (!item) return;

    const restored: Player = {
      ...item,
      deletedAt: undefined,
      deletedBy: undefined,
    };

    setPlayers((prev) => [restored, ...prev]);
    setTrash((prev) => prev.filter((entry) => entry.id !== id));
    addLog("Restauration", `${restored.prenom} ${restored.nom}`, "Licence restaurée depuis la corbeille");
  }

  function purgePlayer(id: string): void {
    if (currentRole !== "admin") return;
    const item = trash.find((entry) => entry.id === id);
    setTrash((prev) => prev.filter((entry) => entry.id !== id));
    if (item) {
      addLog("Suppression définitive", `${item.prenom} ${item.nom}`, "Licence effacée définitivement");
    }
  }

  function logout(): void {
    addLog("Déconnexion", "Session", "Utilisateur déconnecté");
    setCurrentRole("dirigeant");
    setSessionUser({ nom: "Session fermée", role: "dirigeant" });
  }

  function login(): void {
    const identifiant = loginForm.identifiant.trim().toLowerCase();
    const motDePasse = loginForm.motDePasse.trim();

    if (identifiant === "admin" && motDePasse === "admin123") {
      setCurrentRole("admin");
      setSessionUser({ nom: "Administrateur club", role: "admin" });
      setAuthOpen(false);
      setLoginForm({ identifiant: "", motDePasse: "" });
      addLog("Connexion", "Session admin", "Connexion administrateur réussie");
      return;
    }

    if (identifiant === "dirigeant" && motDePasse === "dirigeant123") {
      setCurrentRole("dirigeant");
      setSessionUser({ nom: "Dirigeant club", role: "dirigeant" });
      setAuthOpen(false);
      setLoginForm({ identifiant: "", motDePasse: "" });
      addLog("Connexion", "Session dirigeant", "Connexion dirigeant réussie");
      return;
    }

    window.alert("Identifiants incorrects");
  }

  function exportData(): void {
    const blob = new Blob([JSON.stringify(players, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "licences-foot.json";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  function importData(event: React.ChangeEvent<HTMLInputElement>): void {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      const content = loadEvent.target?.result;
      if (typeof content !== "string") {
        window.alert("Fichier invalide");
        return;
      }

      try {
        const data = JSON.parse(content) as unknown;
        if (Array.isArray(data)) {
          setPlayers(data as Player[]);
          addLog("Import", "Licences", "Import JSON effectué");
        } else {
          window.alert("Fichier invalide");
        }
      } catch {
        window.alert("Fichier invalide");
      }
    };
    reader.readAsText(file);
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between"
        >
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Suivi des licences de foot</h1>
            <p className="text-slate-600">Gestion des joueurs, dossiers administratifs et échéances.</p>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
              <Badge className="rounded-xl border bg-white text-slate-700">Utilisateur : {sessionUser.nom}</Badge>
              <Badge
                className={`rounded-xl border ${
                  currentRole === "admin"
                    ? "border-red-200 bg-red-50 text-red-700"
                    : "border-blue-200 bg-blue-50 text-blue-700"
                }`}
              >
                Rôle : {currentRole === "admin" ? "Administrateur" : "Dirigeant"}
              </Badge>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Dialog open={authOpen} onOpenChange={setAuthOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="rounded-2xl">
                  <ShieldCheck className="mr-2 h-4 w-4" />
                  {sessionUser.role === "admin" ? "Accès admin" : "Accès dirigeant"}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md rounded-2xl">
                <DialogHeader>
                  <DialogTitle>Connexion espace club</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Identifiant</Label>
                    <Input
                      value={loginForm.identifiant}
                      onChange={(e) => setLoginForm((prev) => ({ ...prev, identifiant: e.target.value }))}
                      placeholder="admin ou dirigeant"
                    />
                  </div>
                  <div>
                    <Label>Mot de passe</Label>
                    <Input
                      type="password"
                      value={loginForm.motDePasse}
                      onChange={(e) => setLoginForm((prev) => ({ ...prev, motDePasse: e.target.value }))}
                      placeholder="••••••••"
                    />
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-3 text-sm text-slate-600">
                    <p>
                      <strong>Admin</strong> : peut ajouter, supprimer, restaurer et effacer définitivement les licences.
                    </p>
                    <p className="mt-1">
                      <strong>Dirigeant</strong> : peut consulter, rechercher, filtrer, exporter et préparer les dossiers sans suppression.
                    </p>
                  </div>
                  <div className="flex justify-end">
                    <Button onClick={login} className="rounded-2xl">
                      Se connecter
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Button variant="outline" onClick={logout} className="rounded-2xl">
              <LogOut className="mr-2 h-4 w-4" /> Déconnexion
            </Button>

            <Button variant="outline" onClick={exportData} className="rounded-2xl">
              <Download className="mr-2 h-4 w-4" /> Exporter
            </Button>

            <label className="inline-flex cursor-pointer items-center rounded-2xl border bg-white px-4 py-2 text-sm font-medium shadow-sm">
              <Upload className="mr-2 h-4 w-4" /> Importer
              <input type="file" accept="application/json" className="hidden" onChange={importData} />
            </label>

            <Dialog open={isOpen} onOpenChange={setIsOpen}>
              <DialogTrigger asChild>
                <Button className="rounded-2xl" disabled={currentRole !== "admin"}>
                  <Plus className="mr-2 h-4 w-4" /> Nouvelle licence
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl rounded-2xl">
                <DialogHeader>
                  <DialogTitle>Ajouter un joueur</DialogTitle>
                </DialogHeader>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <Label>Nom</Label>
                    <Input value={form.nom} onChange={(e) => updateForm("nom", e.target.value)} />
                  </div>
                  <div>
                    <Label>Prénom</Label>
                    <Input value={form.prenom} onChange={(e) => updateForm("prenom", e.target.value)} />
                  </div>
                  <div>
                    <Label>Équipe</Label>
                    <Input
                      value={form.equipe}
                      onChange={(e) => updateForm("equipe", e.target.value)}
                      placeholder="U13, U15, Seniors..."
                    />
                  </div>
                  <div>
                    <Label>Poste</Label>
                    <Input value={form.poste} onChange={(e) => updateForm("poste", e.target.value)} />
                  </div>
                  <div>
                    <Label>Numéro de licence</Label>
                    <Input value={form.numeroLicence} onChange={(e) => updateForm("numeroLicence", e.target.value)} />
                  </div>
                  <div>
                    <Label>Statut</Label>
                    <Select value={form.statut} onValueChange={(value: StatutLicence) => updateForm("statut", value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="En attente">En attente</SelectItem>
                        <SelectItem value="Valide">Valide</SelectItem>
                        <SelectItem value="À renouveler">À renouveler</SelectItem>
                        <SelectItem value="Refusée">Refusée</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Date de demande</Label>
                    <Input type="date" value={form.dateDemande} onChange={(e) => updateForm("dateDemande", e.target.value)} />
                  </div>
                  <div>
                    <Label>Date d'expiration</Label>
                    <Input type="date" value={form.dateExpiration} onChange={(e) => updateForm("dateExpiration", e.target.value)} />
                  </div>
                  <div className="grid grid-cols-2 gap-3 rounded-2xl bg-slate-50 p-4 md:col-span-2">
                    {[
                      { key: "certificatMedical", label: "Certificat médical" },
                      { key: "photoIdentite", label: "Photo d'identité" },
                      { key: "pieceIdentite", label: "Pièce d'identité" },
                      { key: "assurance", label: "Assurance" },
                    ].map((item) => (
                      <label key={item.key} className="flex items-center gap-2 text-sm text-slate-700">
                        <input
                          type="checkbox"
                          checked={Boolean(form[item.key as keyof FormState])}
                          onChange={(e) => updateForm(item.key as keyof FormState, e.target.checked as never)}
                        />
                        {item.label}
                      </label>
                    ))}
                  </div>
                  <div className="md:col-span-2">
                    <Label>Notes</Label>
                    <Textarea value={form.notes} onChange={(e) => updateForm("notes", e.target.value)} />
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button onClick={addPlayer} className="rounded-2xl">
                    Enregistrer
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </motion.div>

        <Card className="rounded-3xl border-0 bg-gradient-to-r from-slate-900 to-slate-800 text-white shadow-sm">
          <CardContent className="flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-semibold">Connexion Footclubs</h2>
              <p className="mt-1 text-sm text-slate-200">
                Accès rapide à Footclubs et préparation des données de licences côté club.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button asChild variant="secondary" className="rounded-2xl">
                <a href="https://footclubs.fff.fr" target="_blank" rel="noreferrer">
                  Ouvrir Footclubs
                </a>
              </Button>
              <Button
                variant="outline"
                className="rounded-2xl border-white/30 bg-transparent text-white hover:bg-white/10 hover:text-white"
                onClick={exportData}
              >
                Exporter pour contrôle
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
          {statCards.map((item) => {
            const Icon = item.icon;
            return (
              <Card key={item.label} className="rounded-3xl border-0 shadow-sm">
                <CardContent className="flex items-center justify-between p-6">
                  <div>
                    <p className="text-sm text-slate-500">{item.label}</p>
                    <p className="mt-2 text-3xl font-bold text-slate-900">{item.value}</p>
                  </div>
                  <div className="rounded-2xl bg-slate-100 p-3">
                    <Icon className="h-6 w-6 text-slate-700" />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Tabs defaultValue="liste" className="space-y-4">
          <TabsList className="rounded-2xl">
            <TabsTrigger value="liste">Liste des licences</TabsTrigger>
            <TabsTrigger value="alertes">Alertes</TabsTrigger>
            <TabsTrigger value="corbeille">Corbeille</TabsTrigger>
            <TabsTrigger value="historique">Historique</TabsTrigger>
          </TabsList>

          <TabsContent value="liste" className="space-y-4">
            <Card className="rounded-3xl border-0 shadow-sm">
              <CardHeader>
                <CardTitle>Recherche et filtres</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                    <Input
                      className="pl-9"
                      placeholder="Nom, équipe, licence..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </div>

                  <Select value={teamFilter} onValueChange={setTeamFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Équipe" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toutes les équipes</SelectItem>
                      {teams.map((team) => (
                        <SelectItem key={team} value={team}>
                          {team}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Statut" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les statuts</SelectItem>
                      <SelectItem value="Valide">Valide</SelectItem>
                      <SelectItem value="En attente">En attente</SelectItem>
                      <SelectItem value="À renouveler">À renouveler</SelectItem>
                      <SelectItem value="Refusée">Refusée</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
              {filteredPlayers.map((player) => {
                const remaining = daysUntil(player.dateExpiration);
                const progress = completionRate(player);

                return (
                  <motion.div key={player.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                    <Card className="rounded-3xl border-0 shadow-sm">
                      <CardContent className="space-y-4 p-6">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h3 className="text-xl font-semibold text-slate-900">
                              {player.prenom} {player.nom}
                            </h3>
                            <p className="mt-1 text-sm text-slate-500">
                              {player.equipe} · {player.poste || "Poste non renseigné"}
                            </p>
                            <p className="mt-1 text-sm text-slate-500">Licence : {player.numeroLicence || "—"}</p>
                          </div>
                          <Badge className={`border ${statusColor(player.statut)}`}>{player.statut}</Badge>
                        </div>

                        <div className="grid grid-cols-2 gap-3 text-sm text-slate-600">
                          <div className="rounded-2xl bg-slate-50 p-3">
                            <p className="text-slate-400">Demande</p>
                            <p className="font-medium text-slate-800">{player.dateDemande || "—"}</p>
                          </div>
                          <div className="rounded-2xl bg-slate-50 p-3">
                            <p className="text-slate-400">Expiration</p>
                            <p className="font-medium text-slate-800">{player.dateExpiration || "—"}</p>
                          </div>
                        </div>

                        <div>
                          <div className="mb-2 flex items-center justify-between text-sm">
                            <span className="text-slate-600">Dossier complété</span>
                            <span className="font-medium text-slate-800">{progress}%</span>
                          </div>
                          <Progress value={progress} />
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-sm">
                          {[
                            { ok: player.certificatMedical, label: "Certificat médical" },
                            { ok: player.photoIdentite, label: "Photo" },
                            { ok: player.pieceIdentite, label: "Pièce d'identité" },
                            { ok: player.assurance, label: "Assurance" },
                          ].map((item) => (
                            <div
                              key={item.label}
                              className={`rounded-2xl p-2 ${item.ok ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}
                            >
                              {item.ok ? "✓" : "✗"} {item.label}
                            </div>
                          ))}
                        </div>

                        <div className="rounded-2xl bg-slate-50 p-3 text-sm text-slate-600">
                          <div className="mb-1 flex items-center gap-2 font-medium text-slate-800">
                            <FileText className="h-4 w-4" /> Notes
                          </div>
                          <p>{player.notes || "Aucune note"}</p>
                        </div>

                        <div className="flex items-center justify-between">
                          <p className="text-sm text-slate-500">
                            {remaining === null
                              ? "Pas de date d'expiration"
                              : remaining < 0
                                ? `Expirée depuis ${Math.abs(remaining)} jours`
                                : `Expire dans ${remaining} jours`}
                          </p>
                          <Button
                            variant="ghost"
                            disabled={currentRole !== "admin"}
                            className="rounded-2xl text-red-600 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                            onClick={() => deletePlayer(player.id)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" /> Supprimer
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="alertes">
            <Card className="rounded-3xl border-0 shadow-sm">
              <CardHeader>
                <CardTitle>Licences à surveiller</CardTitle>
                <p className="text-sm text-slate-500">
                  Les suppressions définitives des licences déjà faites sont réservées au profil administrateur.
                </p>
              </CardHeader>
              <CardContent className="space-y-3">
                {players
                  .filter((player) => {
                    const remaining = daysUntil(player.dateExpiration);
                    return player.statut !== "Valide" || (remaining !== null && remaining <= 30);
                  })
                  .map((player) => {
                    const remaining = daysUntil(player.dateExpiration);
                    return (
                      <div
                        key={player.id}
                        className="flex flex-col gap-2 rounded-2xl border p-4 md:flex-row md:items-center md:justify-between"
                      >
                        <div>
                          <p className="font-medium text-slate-900">
                            {player.prenom} {player.nom} — {player.equipe}
                          </p>
                          <p className="text-sm text-slate-500">
                            {player.statut} · {remaining !== null ? (remaining < 0 ? "expirée" : `expire dans ${remaining} jours`) : "pas de date"}
                          </p>
                        </div>
                        <Badge className={`w-fit border ${statusColor(player.statut)}`}>{player.statut}</Badge>
                      </div>
                    );
                  })}

                {!players.some((player) => {
                  const remaining = daysUntil(player.dateExpiration);
                  return player.statut !== "Valide" || ((remaining ?? 999) <= 30);
                }) && <div className="rounded-2xl bg-green-50 p-4 text-green-700">Aucune alerte en cours.</div>}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="corbeille">
            <Card className="rounded-3xl border-0 shadow-sm">
              <CardHeader>
                <CardTitle>Corbeille des licences</CardTitle>
                <p className="text-sm text-slate-500">
                  L’administrateur peut restaurer une licence supprimée ou l’effacer définitivement.
                </p>
              </CardHeader>
              <CardContent className="space-y-3">
                {trash.length === 0 && (
                  <div className="rounded-2xl bg-slate-50 p-4 text-slate-600">Aucune licence dans la corbeille.</div>
                )}

                {trash.map((player) => (
                  <div
                    key={player.id}
                    className="flex flex-col gap-3 rounded-2xl border p-4 lg:flex-row lg:items-center lg:justify-between"
                  >
                    <div>
                      <p className="font-medium text-slate-900">
                        {player.prenom} {player.nom} — {player.equipe}
                      </p>
                      <p className="text-sm text-slate-500">
                        Supprimée le {player.deletedAt || "—"} par {player.deletedBy || "—"}
                      </p>
                      <p className="text-sm text-slate-500">Licence : {player.numeroLicence || "—"}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        className="rounded-2xl"
                        disabled={currentRole !== "admin"}
                        onClick={() => restorePlayer(player.id)}
                      >
                        <RotateCcw className="mr-2 h-4 w-4" /> Restaurer
                      </Button>
                      <Button
                        variant="destructive"
                        className="rounded-2xl"
                        disabled={currentRole !== "admin"}
                        onClick={() => purgePlayer(player.id)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" /> Effacer définitivement
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="historique">
            <Card className="rounded-3xl border-0 shadow-sm">
              <CardHeader>
                <CardTitle>Historique des actions</CardTitle>
                <p className="text-sm text-slate-500">Journal des connexions, créations, suppressions et restaurations.</p>
              </CardHeader>
              <CardContent className="space-y-3">
                {activityLog.length === 0 && (
                  <div className="rounded-2xl bg-slate-50 p-4 text-slate-600">Aucune action enregistrée.</div>
                )}

                {activityLog.map((entry) => (
                  <div
                    key={entry.id}
                    className="flex flex-col gap-2 rounded-2xl border p-4 md:flex-row md:items-center md:justify-between"
                  >
                    <div className="flex items-start gap-3">
                      <div className="rounded-2xl bg-slate-100 p-2">
                        <History className="h-4 w-4 text-slate-700" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">
                          {entry.action} — {entry.cible}
                        </p>
                        <p className="text-sm text-slate-500">{entry.details}</p>
                      </div>
                    </div>
                    <div className="text-sm text-slate-500 md:text-right">
                      <p>
                        {entry.utilisateur} · {entry.role}
                      </p>
                      <p>{entry.date}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Card className="rounded-3xl border-dashed shadow-sm">
          <CardHeader>
            <CardTitle>Vérifications internes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-slate-600">
            {selfTests.map((result) => (
              <div key={result} className="rounded-xl bg-slate-50 p-2">
                {result}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
