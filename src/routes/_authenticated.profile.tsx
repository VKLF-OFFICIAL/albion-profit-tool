import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Camera, KeyRound, Loader2, Save, User as UserIcon } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { PasswordStrength } from "@/components/password-strength";
import { isPasswordStrong } from "@/lib/password";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({ meta: [{ title: "Perfil · Albion M&C" }] }),
  component: ProfilePage,
});

async function resolveAvatarUrl(path: string | null): Promise<string | null> {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  const { data } = await supabase.storage.from("avatars").createSignedUrl(path, 3600);
  return data?.signedUrl ?? null;
}

function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [changingPwd, setChangingPwd] = useState(false);

  const [userId, setUserId] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [username, setUsername] = useState<string>("");
  const [avatarPath, setAvatarPath] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    (async () => {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;
      if (!user) return;
      setUserId(user.id);
      setEmail(user.email ?? "");
      const { data: prof } = await supabase
        .from("profiles")
        .select("username, avatar_url")
        .eq("id", user.id)
        .maybeSingle();
      if (prof) {
        setUsername(prof.username ?? "");
        setAvatarPath(prof.avatar_url);
        setAvatarUrl(await resolveAvatarUrl(prof.avatar_url));
      } else {
        setUsername(user.email?.split("@")[0] ?? "");
      }
      setLoading(false);
    })();
  }, []);

  async function saveProfile() {
    if (!username.trim()) return toast.error("El nombre no puede estar vacío");
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .upsert({ id: userId, username: username.trim(), avatar_url: avatarPath }, { onConflict: "id" });
    setSaving(false);
    if (error) return toast.error(error.message);
    window.dispatchEvent(new Event("profile:updated"));
    toast.success("Perfil actualizado");
  }

  async function downscaleImage(file: File, maxSize = 512): Promise<Blob> {
    const dataUrl: string = await new Promise((res, rej) => {
      const r = new FileReader();
      r.onload = () => res(r.result as string);
      r.onerror = rej;
      r.readAsDataURL(file);
    });
    const img: HTMLImageElement = await new Promise((res, rej) => {
      const i = new Image();
      i.onload = () => res(i);
      i.onerror = rej;
      i.src = dataUrl;
    });
    const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
    const w = Math.round(img.width * scale);
    const h = Math.round(img.height * scale);
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(img, 0, 0, w, h);
    return await new Promise<Blob>((res, rej) =>
      canvas.toBlob((b) => (b ? res(b) : rej(new Error("toBlob failed"))), "image/jpeg", 0.9),
    );
  }

  async function onPickAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) return toast.error("Selecciona una imagen");
    if (file.size > 10 * 1024 * 1024) return toast.error("Máx 10 MB");
    setUploading(true);
    try {
      const blob = await downscaleImage(file, 512);
      const path = `${userId}/avatar-${Date.now()}.jpg`;
      const { error: upErr } = await supabase.storage.from("avatars").upload(path, blob, {
        upsert: true,
        contentType: "image/jpeg",
      });
      if (upErr) throw upErr;
      if (avatarPath && !avatarPath.startsWith("http")) {
        await supabase.storage.from("avatars").remove([avatarPath]);
      }
      const { error: updErr } = await supabase
        .from("profiles")
        .upsert(
          { id: userId, username: username.trim() || email.split("@")[0], avatar_url: path },
          { onConflict: "id" },
        );
      if (updErr) throw updErr;
      setAvatarPath(path);
      setAvatarUrl(await resolveAvatarUrl(path));
      window.dispatchEvent(new Event("profile:updated"));
      toast.success("Foto actualizada");
    } catch (err: any) {
      toast.error(err?.message ?? "Error al subir la imagen");
    } finally {
      setUploading(false);
    }
  }

  async function changePassword() {
    if (newPassword.length < 6) return toast.error("Mínimo 6 caracteres");
    if (newPassword !== confirmPassword) return toast.error("Las contraseñas no coinciden");
    setChangingPwd(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setChangingPwd(false);
    if (error) return toast.error(error.message);
    setNewPassword("");
    setConfirmPassword("");
    toast.success("Contraseña actualizada");
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const initial = (username || email || "?").slice(0, 1).toUpperCase();

  return (
    <div className="mx-auto max-w-2xl space-y-6 pb-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Mi perfil</h1>
        <p className="text-sm text-muted-foreground">Gestiona tu cuenta y preferencias.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><UserIcon className="h-5 w-5" /> Información</CardTitle>
          <CardDescription>Tu nombre visible y foto de perfil.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Avatar className="h-20 w-20 border-2 border-primary/30">
                {avatarUrl ? <AvatarImage src={avatarUrl} alt={username} /> : null}
                <AvatarFallback className="bg-primary text-primary-foreground text-xl font-bold">
                  {initial}
                </AvatarFallback>
              </Avatar>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute -bottom-1 -right-1 grid h-8 w-8 place-items-center rounded-full bg-primary text-primary-foreground shadow-md hover:bg-primary/90"
                aria-label="Cambiar foto"
              >
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={onPickAvatar}
              />
            </div>
            <div className="text-sm text-muted-foreground">
              <p className="font-medium text-foreground">{email}</p>
              <p>JPG, PNG o WebP · máx 10 MB (se redimensiona automáticamente)</p>
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label htmlFor="username">Nombre de usuario</Label>
            <Input id="username" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Tu nombre" />
          </div>

          <Button onClick={saveProfile} disabled={saving} className="w-full sm:w-auto">
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Guardar cambios
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><KeyRound className="h-5 w-5" /> Cambiar contraseña</CardTitle>
          <CardDescription>Usa una contraseña segura de al menos 6 caracteres.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="new-pwd">Nueva contraseña</Label>
            <Input id="new-pwd" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-pwd">Confirmar contraseña</Label>
            <Input id="confirm-pwd" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
          </div>
          <Button onClick={changePassword} disabled={changingPwd} variant="secondary" className="w-full sm:w-auto">
            {changingPwd ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <KeyRound className="mr-2 h-4 w-4" />}
            Actualizar contraseña
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
