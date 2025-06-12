import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, Plus, AlertCircle, Pencil } from 'lucide-react';
import CaritaMagica from '@/components/CaritaMagica';
import AdminLogin from '@/components/AdminLogin';
import { useToast } from "@/components/ui/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { 
  getEmojiConfig, 
  updateEmojiName, 
  addEmoji, 
  deleteEmoji, 
  uploadEmojiImage,
  updateEmojiImageFromPublic
} from '@/lib/api';
import type { EmojiConfig } from '@/types/supabase';

const AdminImagenes = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [newEmoji, setNewEmoji] = useState('');
  const [newEmojiName, setNewEmojiName] = useState('');
  const [showEmojiError, setShowEmojiError] = useState(false);
  const [emojiToDelete, setEmojiToDelete] = useState<string | null>(null);
  const [editingEmoji, setEditingEmoji] = useState<EmojiConfig | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [emojis, setEmojis] = useState<EmojiConfig[]>([]);
  const { toast } = useToast();
  const ADMIN_PASSWORD = 'admin123';

  useEffect(() => {
    if (isAuthenticated) {
      loadEmojis();
      // Update bee emoji with Alejandra's image
      const beeEmoji = emojis.find(e => e.emoji === '🐝');
      if (beeEmoji) {
        updateBeeEmoji(beeEmoji.id);
      }
    }
  }, [isAuthenticated]);

  const loadEmojis = async () => {
    try {
      const data = await getEmojiConfig();
      setEmojis(data);
    } catch (error) {
      console.error('Error loading emojis:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los emojis",
        variant: "destructive"
      });
    }
  };

  const handleLogin = (password: string): boolean => {
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      return true;
    }
    return false;
  };

  const handleAddEmoji = async () => {
    setIsLoading(true);
    try {
      const emojiRegex = /\p{Emoji}/u;
      if (!emojiRegex.test(newEmoji)) {
        setShowEmojiError(true);
        return;
      }

      if (newEmoji && !emojis.some(e => e.emoji === newEmoji)) {
        await addEmoji(newEmoji, newEmojiName || newEmoji);
        await loadEmojis();
        setNewEmoji('');
        setNewEmojiName('');
        setShowEmojiError(false);
        toast({
          title: "Éxito",
          description: "Emoji agregado correctamente"
        });
      }
    } catch (error) {
      console.error('Error adding emoji:', error);
      toast({
        title: "Error",
        description: "No se pudo agregar el emoji",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteEmoji = (emoji: EmojiConfig) => {
    setEmojiToDelete(emoji.id);
  };

  const confirmDelete = async () => {
    if (emojiToDelete) {
      setIsLoading(true);
      try {
        await deleteEmoji(emojiToDelete);
        await loadEmojis();
        setEmojiToDelete(null);
        toast({
          title: "Éxito",
          description: "Emoji eliminado correctamente"
        });
      } catch (error) {
        console.error('Error deleting emoji:', error);
        toast({
          title: "Error",
          description: "No se pudo eliminar el emoji",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleEditName = (emoji: EmojiConfig) => {
    setEditingEmoji(emoji);
  };

  const handleSaveEdit = async () => {
    if (editingEmoji) {
      setIsLoading(true);
      try {
        await updateEmojiName(editingEmoji.id, editingEmoji.name);
        await loadEmojis();
        setEditingEmoji(null);
        toast({
          title: "Éxito",
          description: "Nombre actualizado correctamente"
        });
      } catch (error) {
        console.error('Error updating emoji name:', error);
        toast({
          title: "Error",
          description: "No se pudo actualizar el nombre",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleImageUpload = async (file: File, emojiId: string) => {
    setIsLoading(true);
    try {
      await uploadEmojiImage(file, emojiId);
      await loadEmojis();
      toast({
        title: "Éxito",
        description: "Imagen subida correctamente"
      });
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: "Error",
        description: "No se pudo subir la imagen",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateBeeEmoji = async (emojiId: string) => {
    try {
      await updateEmojiImageFromPublic(emojiId, 'caritas/Alejandra Carrillo Jimenez.jpg');
      await loadEmojis();
      toast({
        title: "Éxito",
        description: "Imagen de la abeja actualizada correctamente"
      });
    } catch (error) {
      console.error('Error updating bee emoji:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar la imagen de la abeja",
        variant: "destructive"
      });
    }
  };

  if (!isAuthenticated) {
    return <AdminLogin onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-amber-800 mb-8 text-center">
          Administración de Imágenes
        </h1>

        <Card className="bg-white/50 backdrop-blur mb-8">
          <CardHeader>
            <CardTitle className="text-2xl text-amber-700">
              Agregar Nueva Carita Mágica
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4">
              <div className="flex gap-4 items-start">
                <div className="flex-1">
                  <Input
                    type="text"
                    value={newEmoji}
                    onChange={(e) => setNewEmoji(e.target.value)}
                    placeholder="Pega un emoji aquí..."
                    className="text-2xl"
                    disabled={isLoading}
                  />
                  {showEmojiError && (
                    <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      Por favor ingresa un emoji válido
                    </p>
                  )}
                </div>
                <Button 
                  onClick={handleAddEmoji}
                  className="bg-green-600 hover:bg-green-700"
                  disabled={isLoading}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Agregar
                </Button>
              </div>
              <Input
                type="text"
                value={newEmojiName}
                onChange={(e) => setNewEmojiName(e.target.value)}
                placeholder="Nombre descriptivo del emoji (opcional)"
                className="flex-1"
                disabled={isLoading}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/50 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-2xl text-amber-700">
              Gestión de Caritas Mágicas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-amber-700 mb-6">
              Haz clic en cualquier carita para subir o cambiar su imagen.
              Para editar el nombre o eliminar una carita, usa los botones correspondientes.
            </p>

            <div className="grid grid-cols-4 gap-8">
              {emojis.map((emojiData) => (
                <div key={emojiData.id} className="flex flex-col items-center gap-2">
                  <div className="relative group">
                    <CaritaMagica
                      defaultEmoji={emojiData.emoji}
                      imageUrl={emojiData.image_url}
                      isAdmin={true}
                      onImageChange={(file) => handleImageUpload(file, emojiData.id)}
                    />
                    <div className="absolute -top-2 -right-2 flex gap-1">
                      <Button
                        variant="secondary"
                        size="icon"
                        className="w-6 h-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => handleEditName(emojiData)}
                        disabled={isLoading}
                      >
                        <Pencil className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="icon"
                        className="w-6 h-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => handleDeleteEmoji(emojiData)}
                        disabled={isLoading}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                  <div className="text-center">
                    <span className="text-sm text-gray-600 block">
                      {emojiData.name}
                    </span>
                    <span className="text-xs text-gray-400 block">
                      {emojiData.emoji}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={!!emojiToDelete} onOpenChange={() => setEmojiToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará la carita mágica y no se podrá deshacer.
              Las asignaciones existentes que usen esta carita podrían verse afectadas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete} 
              className="bg-red-600 hover:bg-red-700"
              disabled={isLoading}
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={!!editingEmoji} onOpenChange={() => setEditingEmoji(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Nombre de la Carita</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <div className="flex items-center gap-4 mb-4">
              <span className="text-4xl">{editingEmoji?.emoji}</span>
              <Input
                value={editingEmoji?.name || ''}
                onChange={(e) => setEditingEmoji(prev => 
                  prev ? { ...prev, name: e.target.value } : null
                )}
                placeholder="Nombre descriptivo"
                disabled={isLoading}
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setEditingEmoji(null)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleSaveEdit}
              disabled={isLoading}
            >
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminImagenes; 