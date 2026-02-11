"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/toast";
import { Plus, Edit2, Trash2, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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
  const [loading, setLoading] = useState(true);
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
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchPacks();
  }, []);

  const fetchPacks = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/coin-packs");
      if (response.ok) {
        const data = await response.json();
        setPacks(data.packs || []);
      } else {
        showToast("Erreur lors du chargement des packs", "error");
      }
    } catch (error) {
      console.error("[Admin Packs] Error fetching packs:", error);
      showToast("Erreur lors du chargement des packs", "error");
    } finally {
      setLoading(false);
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
    if (!packToDelete) {
      return;
    }

    try {
      setDeleting(true);
      const response = await fetch(`/api/admin/coin-packs/${packToDelete.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        showToast("Pack supprimé avec succès", "success");
        setIsDeleteDialogOpen(false);
        setPackToDelete(null);
        fetchPacks();
      } else {
        const data = await response.json();
        showToast(data.error || "Erreur lors de la suppression", "error");
      }
    } catch (error) {
      console.error("[Admin Packs] Error deleting pack:", error);
      showToast("Erreur lors de la suppression", "error");
    } finally {
      setDeleting(false);
    }
  };

  const handleSave = async () => {
    if (!formData.name || !formData.displayName || !formData.coins || !formData.price) {
      showToast("Remplis tous les champs obligatoires", "error");
      return;
    }

    if (parseInt(formData.coins) <= 0 || parseFloat(formData.price) <= 0) {
      showToast("Les coins et le prix doivent être positifs", "error");
      return;
    }

    try {
      setSaving(true);
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
          editingPack ? "Pack mis à jour avec succès" : "Pack créé avec succès",
          "success"
        );
        setIsDialogOpen(false);
        fetchPacks();
      } else {
        const data = await response.json();
        showToast(data.error || "Erreur lors de la sauvegarde", "error");
      }
    } catch (error) {
      console.error("[Admin Packs] Error saving pack:", error);
      showToast("Erreur lors de la sauvegarde", "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Gestion des Packs de Coins</h1>
            <p className="text-muted-foreground mt-2">
              Créez et gérez les packs de coins disponibles à l'achat
            </p>
          </div>
          <Button onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Créer un pack
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {packs.map((pack) => (
            <Card key={pack.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle>{pack.displayName}</CardTitle>
                    <CardDescription>{pack.name}</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(pack)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(pack)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Coins:</span>
                  <span className="font-semibold">{pack.coins}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Prix:</span>
                  <span className="font-semibold">{pack.price}€</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Stripe Price ID:</span>
                  <span className="font-mono text-xs">
                    {pack.stripePriceId || "Non configuré"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Actif:</span>
                  <Switch checked={pack.isActive} disabled />
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Populaire:</span>
                  <Switch checked={pack.isPopular} disabled />
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Ordre:</span>
                  <span className="font-semibold">{pack.order}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {packs.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">
                Aucun pack créé. Cliquez sur "Créer un pack" pour commencer.
              </p>
            </CardContent>
          </Card>
        )}

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingPack ? "Modifier le pack" : "Créer un nouveau pack"}
              </DialogTitle>
              <DialogDescription>
                {editingPack
                  ? "Modifiez les informations du pack"
                  : "Remplissez les informations pour créer un nouveau pack"}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nom (ID unique) *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value.toUpperCase() })}
                  disabled={!!editingPack}
                />
                <p className="text-xs text-muted-foreground">
                  Identifiant unique (ex: STARTER, BOOST, PRO)
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="displayName">Nom d'affichage *</Label>
                <Input
                  id="displayName"
                  value={formData.displayName}
                  onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="coins">Coins *</Label>
                  <Input
                    id="coins"
                    type="number"
                    min="1"
                    value={formData.coins}
                    onChange={(e) => setFormData({ ...formData, coins: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price">Prix (€) *</Label>
                  <Input
                    id="price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="stripePriceId">Stripe Price ID</Label>
                <Input
                  id="stripePriceId"
                  value={formData.stripePriceId}
                  onChange={(e) => setFormData({ ...formData, stripePriceId: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">
                  Laissez vide pour créer automatiquement via price_data
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="order">Ordre d'affichage</Label>
                <Input
                  id="order"
                  type="number"
                  value={formData.order}
                  onChange={(e) => setFormData({ ...formData, order: e.target.value })}
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
            <DialogFooter>
              <Button variant="secondary" onClick={() => setIsDialogOpen(false)}>
                Annuler
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Enregistrement...
                  </>
                ) : (
                  "Enregistrer"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Supprimer le pack</DialogTitle>
              <DialogDescription>
                Tu es sûr de vouloir supprimer le pack "{packToDelete?.displayName}" ?
                Cette action est irréversible et supprimera définitivement le pack.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="secondary"
                onClick={() => {
                  setIsDeleteDialogOpen(false);
                  setPackToDelete(null);
                }}
                disabled={deleting}
              >
                Annuler
              </Button>
              <Button
                variant="destructive"
                onClick={handleConfirmDelete}
                disabled={deleting}
              >
                {deleting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
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
