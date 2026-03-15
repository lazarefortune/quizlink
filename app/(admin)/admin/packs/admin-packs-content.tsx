"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import {
  Plus,
  Edit2,
  Trash2,
  Loader2,
  ArrowLeft,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Link from "next/link";

type CoinPack = {
  id: string;
  name: string;
  displayName: string;
  coins: number;
  price: number;
  stripePriceId: string | null;
  isActive: boolean;
  isPopular: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
};

export function AdminPacksContent() {
  const { showToast } = useToast();
  const [packs, setPacks] = useState<CoinPack[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [packToDelete, setPackToDelete] = useState<CoinPack | null>(null);
  const [editingPack, setEditingPack] = useState<CoinPack | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    displayName: "",
    coins: "",
    price: "",
    stripePriceId: "",
    order: "0",
    isActive: true,
    isPopular: false,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchPacks();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fetchPacks is stable, mount-only init
  }, []);

  const fetchPacks = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/admin/coin-packs");
      if (response.ok) {
        const data = await response.json();
        setPacks(data.packs || []);
      } else {
        showToast("Erreur lors du chargement des packs", "error");
      }
    } catch {
      showToast("Erreur lors du chargement des packs", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingPack(null);
    setFormData({
      name: "",
      displayName: "",
      coins: "",
      price: "",
      stripePriceId: "",
      order: "0",
      isActive: true,
      isPopular: false,
    });
    setIsDialogOpen(true);
  };

  const handleEdit = (pack: CoinPack) => {
    setEditingPack(pack);
    setFormData({
      name: pack.name,
      displayName: pack.displayName,
      coins: pack.coins.toString(),
      price: pack.price.toString(),
      stripePriceId: pack.stripePriceId || "",
      order: pack.order.toString(),
      isActive: pack.isActive,
      isPopular: pack.isPopular,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (pack: CoinPack) => {
    setPackToDelete(pack);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!packToDelete) return;

    try {
      setIsDeleting(true);
      const response = await fetch(
        `/api/admin/coin-packs/${packToDelete.id}`,
        { method: "DELETE" }
      );

      if (response.ok) {
        showToast("Pack supprimé avec succès", "success");
        setIsDeleteDialogOpen(false);
        setPackToDelete(null);
        fetchPacks();
      } else {
        const data = await response.json();
        showToast(data.error || "Erreur lors de la suppression", "error");
      }
    } catch {
      showToast("Erreur lors de la suppression", "error");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSave = async () => {
    if (
      !formData.name ||
      !formData.displayName ||
      !formData.coins ||
      !formData.price
    ) {
      showToast("Remplis tous les champs obligatoires", "error");
      return;
    }

    if (parseInt(formData.coins) <= 0 || parseFloat(formData.price) <= 0) {
      showToast("Les coins et le prix doivent être positifs", "error");
      return;
    }

    try {
      setIsSaving(true);
      const url = editingPack
        ? `/api/admin/coin-packs/${editingPack.id}`
        : "/api/admin/coin-packs";
      const method = editingPack ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          displayName: formData.displayName,
          coins: parseInt(formData.coins),
          price: parseFloat(formData.price),
          stripePriceId: formData.stripePriceId || null,
          order: parseInt(formData.order) || 0,
          isActive: formData.isActive,
          isPopular: formData.isPopular,
        }),
      });

      if (response.ok) {
        showToast(
          editingPack
            ? "Pack mis à jour avec succès"
            : "Pack créé avec succès",
          "success"
        );
        setIsDialogOpen(false);
        fetchPacks();
      } else {
        const data = await response.json();
        showToast(data.error || "Erreur lors de la sauvegarde", "error");
      }
    } catch {
      showToast("Erreur lors de la sauvegarde", "error");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-5 md:p-6 lg:p-8">
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <Button variant="ghost" size="sm" asChild className="-ml-2 mb-2">
              <Link href="/admin" className="text-muted-foreground">
                <ArrowLeft className="h-4 w-4 mr-1" />
                Dashboard admin
              </Link>
            </Button>
            <h1 className="text-2xl sm:text-3xl font-bold">
              Gestion des Packs
            </h1>
            <p className="text-muted-foreground mt-1">
              Crée et gère les packs de coins disponibles
            </p>
          </div>
          <Button onClick={handleCreate} className="shrink-0">
            <Plus className="h-4 w-4" />
            Créer un pack
          </Button>
        </div>

        {/* Pack cards */}
        {packs.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-10 text-center text-muted-foreground">
              Aucun pack créé. Clique sur &quot;Créer un pack&quot; pour
              commencer.
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {packs.map((pack) => (
              <Card key={pack.id} className="relative">
                {pack.isPopular && (
                  <Badge className="absolute -top-2.5 left-1/2 -translate-x-1/2 z-10">
                    Populaire
                  </Badge>
                )}
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-base">
                        {pack.displayName}
                      </p>
                      <p className="text-xs text-muted-foreground font-mono">
                        {pack.name}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleEdit(pack)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() => handleDelete(pack)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold">{pack.price}€</span>
                    <span className="text-muted-foreground text-sm">
                      / {pack.coins} coins
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2 text-xs">
                    <Badge variant={pack.isActive ? "default" : "secondary"}>
                      {pack.isActive ? "Actif" : "Inactif"}
                    </Badge>
                    {pack.stripePriceId && (
                      <Badge variant="outline">Stripe</Badge>
                    )}
                    <Badge variant="outline">
                      Ordre: {pack.order}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Create/Edit Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingPack ? "Modifier le pack" : "Créer un nouveau pack"}
              </DialogTitle>
              <DialogDescription>
                {editingPack
                  ? "Modifie les informations du pack"
                  : "Remplis les informations pour créer un nouveau pack"}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label htmlFor="name">Nom (ID unique) *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      name: e.target.value.toUpperCase(),
                    })
                  }
                  disabled={!!editingPack}
                />
                <p className="text-xs text-muted-foreground">
                  Identifiant unique (ex: STARTER, BOOST, PRO)
                </p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="displayName">Nom d&apos;affichage *</Label>
                <Input
                  id="displayName"
                  value={formData.displayName}
                  onChange={(e) =>
                    setFormData({ ...formData, displayName: e.target.value })
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="coins">Coins *</Label>
                  <Input
                    id="coins"
                    type="number"
                    min="1"
                    value={formData.coins}
                    onChange={(e) =>
                      setFormData({ ...formData, coins: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="price">Prix (€) *</Label>
                  <Input
                    id="price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) =>
                      setFormData({ ...formData, price: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="stripePriceId">Stripe Price ID</Label>
                <Input
                  id="stripePriceId"
                  value={formData.stripePriceId}
                  onChange={(e) =>
                    setFormData({ ...formData, stripePriceId: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="order">Ordre d&apos;affichage</Label>
                <Input
                  id="order"
                  type="number"
                  value={formData.order}
                  onChange={(e) =>
                    setFormData({ ...formData, order: e.target.value })
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="isActive">Pack actif</Label>
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, isActive: checked })
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="isPopular">Pack populaire</Label>
                <Switch
                  id="isPopular"
                  checked={formData.isPopular}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, isPopular: checked })
                  }
                />
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button
                variant="secondary"
                onClick={() => setIsDialogOpen(false)}
              >
                Annuler
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Enregistrement...
                  </>
                ) : (
                  "Enregistrer"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <Dialog
          open={isDeleteDialogOpen}
          onOpenChange={setIsDeleteDialogOpen}
        >
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Supprimer le pack</DialogTitle>
              <DialogDescription>
                Tu es sûr de vouloir supprimer le pack &quot;
                {packToDelete?.displayName}&quot; ? Cette action est
                irréversible.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2">
              <Button
                variant="secondary"
                onClick={() => {
                  setIsDeleteDialogOpen(false);
                  setPackToDelete(null);
                }}
                disabled={isDeleting}
              >
                Annuler
              </Button>
              <Button
                variant="destructive"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Suppression...
                  </>
                ) : (
                  "Supprimer"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
