"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import NextImage from "next/image";
import { motion } from "framer-motion";
import Cropper from "react-easy-crop";
import { Sparkles, Eye, EyeOff, Camera, User, X, ZoomIn, CheckCircle2 } from "lucide-react";
import AuthCard from "../components/AuthCard";
import { useAuthStore } from "@/app/store/authStore";

type CropperArea = { x: number; y: number; width: number; height: number };

function blobToDataURL(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

async function getCroppedImg(
  imageSrc: string,
  croppedAreaPixels: CropperArea,
  width = 400,
  height = 400,
): Promise<Blob> {
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Impossible de charger l'image"));
    img.src = imageSrc;
  });

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas non supporté");

  ctx.drawImage(
    image,
    croppedAreaPixels.x,
    croppedAreaPixels.y,
    croppedAreaPixels.width,
    croppedAreaPixels.height,
    0,
    0,
    width,
    height,
  );

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Échec de l'export de l'image"));
    }, "image/png");
  });
}

export default function InscriptionPage() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [avatar, setAvatar] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const register = useAuthStore((s) => s.register);

  // ====== États recadrage photo ======
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [lastRaw, setLastRaw] = useState<string | null>(null); // dernière image brute (pour re-recadrer sans la re-sélectionner)
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<CropperArea | null>(null);
  const [cropping, setCropping] = useState(false);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setSelectedImage(reader.result as string);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
    };
    reader.readAsDataURL(file);
    e.target.value = ""; // permet de re-sélectionner le même fichier
  };

  const onCropComplete = useCallback((_: CropperArea, croppedPixels: CropperArea) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  const handleApplyCrop = async () => {
    if (!selectedImage || !croppedAreaPixels) return;
    setCropping(true);
    try {
      const blob = await getCroppedImg(selectedImage, croppedAreaPixels);
      const url = await blobToDataURL(blob);
      setAvatar(url);
      // On garde l'image brute pour permettre de re-recadrer sans la re-sélectionner
      setLastRaw(selectedImage);
      setSelectedImage(null);
    } finally {
      setCropping(false);
    }
  };

  // Rouvre la modale de recadrage sur la dernière image brute (re-zoom/re-positionnement)
  const reopenCrop = () => {
    if (!lastRaw) return;
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setSelectedImage(lastRaw);
  };

  const handleRemovePhoto = () => {
    setAvatar(null);
    setSelectedImage(null);
  };

  // ✅ CORRIGÉ : pas de connexion auto — l'utilisateur retourne sur la page de connexion
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }
    if (password.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères.");
      return;
    }

    setLoading(true);
    
    // ✅ Appeler register avec le password et vérifier le résultat
    const result = register({ firstName, lastName, email, password, avatar });
    
    // Si result n'est pas true, c'est un message d'erreur
    if (result !== true) {
      setError(result as string);
      setLoading(false);
      return;
    }
    
    // ✅ Succès : rediriger vers la page de connexion (l'utilisateur n'est PAS connecté)
    router.push("/connexion?inscrit=1");
  };

  const inputStyle = {
    background: "var(--input-bg)",
    border: "1px solid var(--input-border)",
    color: "var(--text-primary)",
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.currentTarget.style.borderColor = "#056cf2";
    e.currentTarget.style.boxShadow = "0 0 20px var(--glow-pink)";
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    e.currentTarget.style.borderColor = "var(--input-border)";
    e.currentTarget.style.boxShadow = "none";
  };

  return (
    <div className="flex flex-col lg:flex-row items-stretch max-w-full w-full min-h-screen">
      {/* Visuel gauche */}
      <motion.div
        initial={{ x: -40, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="hidden lg:block lg:w-[60%] relative overflow-hidden min-h-screen"
      >
        <NextImage
          src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=1600&auto=format&fit=crop"
          alt="Travail d'équipe"
          fill
          style={{ objectFit: "cover" }}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to top, rgba(5,5,10,0.95) 0%, rgba(5,5,10,0.2) 50%, rgba(5,5,10,0.1) 100%)",
          }}
        />
        <div className="absolute bottom-0 left-0 right-0 p-8">
          <h2
            className="text-3xl font-bold mb-2"
            style={{
              backgroundImage: "linear-gradient(135deg, #0c79f2, #056cf2, #589bff)",
              backgroundClip: "text",
              WebkitBackgroundClip: "text",
              color: "transparent",
            }}
          >
            Rejoignez votre équipe
          </h2>
          <p className="text-white/80">
            {"Créez votre compte et commencez à gérer vos projets dès aujourd'hui."}
          </p>
        </div>
      </motion.div>

      {/* Formulaire droite */}
      <div className="lg:w-[40%] lg:min-h-screen flex items-center justify-center lg:pr-8 py-10 lg:py-0">
        <AuthCard>
          <div className="flex flex-col items-center">
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="flex items-center gap-2 mb-2"
            >
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center"
                style={{
                  background: "var(--gradient-primary)",
                  boxShadow: "0 0 30px var(--glow-pink)",
                }}
              >
                <Sparkles className="w-6 h-6 text-white" />
              </div>
            </motion.div>

            <motion.h1
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
              className="text-3xl font-bold text-center mb-1"
              style={{
                backgroundImage: "var(--gradient-primary)",
                backgroundSize: "200% 200%",
                backgroundClip: "text",
                WebkitBackgroundClip: "text",
                color: "transparent",
                animation: "gradient-shift 4s ease infinite",
              }}
            >
              Inscription
            </motion.h1>

            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
              className="text-sm mb-8"
              style={{ color: "var(--text-secondary)" }}
            >
              Créez votre compte gratuitement
            </motion.p>
          </div>

          {error && (
            <motion.p
              initial={{ y: -10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="text-sm mb-4"
              style={{ color: "var(--color-error)", animation: "shake 0.4s" }}
            >
              {error}
            </motion.p>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.25 }}
              className="flex flex-col items-center gap-2 mb-2"
            >
              <div className="relative">
<div
                  className={`w-20 h-20 rounded-full overflow-hidden flex items-center justify-center text-white${lastRaw ? " cursor-pointer" : ""}`}
                  style={{ background: "var(--gradient-primary)" }}
                  onClick={lastRaw ? reopenCrop : undefined}
                  role={lastRaw ? "button" : undefined}
                  title={lastRaw ? "Cliquer pour recadrer la photo" : undefined}
                >
                  {avatar ? (
                    <NextImage src={avatar} alt="Photo de profil" fill style={{ objectFit: "cover" }} />
                  ) : (
                    <User className="w-9 h-9 text-white/80" />
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  aria-label="Choisir une photo de profil"
                  className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full flex items-center justify-center text-white transition-transform hover:scale-110"
                  style={{ background: "var(--gradient-button)" }}
                >
                  <Camera className="w-4 h-4" />
                </button>
<input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs" style={{ color: "var(--text-secondary)" }}>Photo de profil (optionnel)</span>
                {avatar && (
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    className="text-xs font-semibold transition-colors hover:text-red-500"
                    style={{ color: "var(--color-error)" }}
                  >
                    Retirer
                  </button>
                )}
              </div>
            </motion.div>

            <div className="grid grid-cols-2 gap-4">
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <input
                  type="text"
                  placeholder="Prénom"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full rounded-xl px-4 py-3 transition-all focus:outline-none"
                  style={inputStyle}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                />
              </motion.div>
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.35 }}
              >
                <input
                  type="text"
                  placeholder="Nom"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full rounded-xl px-4 py-3 transition-all focus:outline-none"
                  style={inputStyle}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                />
              </motion.div>
            </div>

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <input
                type="email"
                placeholder="Email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl px-4 py-3 transition-all focus:outline-none"
                style={inputStyle}
                onFocus={handleFocus}
                onBlur={handleBlur}
              />
            </motion.div>

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="relative"
            >
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Mot de passe"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl px-4 py-3 pr-12 transition-all focus:outline-none"
                style={inputStyle}
                onFocus={handleFocus}
                onBlur={handleBlur}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors hover:text-blue-500"
                style={{ color: "var(--text-secondary)" }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </motion.div>

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.6 }}
              className="relative"
            >
              <input
                type={showConfirm ? "text" : "password"}
                placeholder="Confirmer le mot de passe"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full rounded-xl px-4 py-3 pr-12 transition-all focus:outline-none"
                style={inputStyle}
                onFocus={handleFocus}
                onBlur={handleBlur}
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors hover:text-blue-500"
                style={{ color: "var(--text-secondary)" }}
              >
                {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </motion.div>

            <motion.button
              type="submit"
              disabled={loading}
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.7, ease: "easeOut" }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-3 rounded-xl font-semibold text-white transition-all focus:outline-none"
              style={{
                background: "var(--gradient-button)",
                backgroundSize: "200% 200%",
                boxShadow: "0 10px 30px -10px rgba(5,108,242,0.55)",
                animation: "gradient-shift 3s ease infinite",
              }}
            >
              {loading ? "Création..." : "Créer mon compte"}
            </motion.button>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.8 }}
              className="text-sm text-center pt-2"
              style={{ color: "var(--text-secondary)" }}
            >
              Déjà un compte ?{" "}
              <Link
                href="/connexion"
                className="font-semibold"
                style={{
                  backgroundImage: "linear-gradient(135deg, #0c79f2, #056cf2)",
                  backgroundClip: "text",
                  WebkitBackgroundClip: "text",
                  color: "transparent",
                }}
              >
                Se connecter
              </Link>
            </motion.p>
          </form>
        </AuthCard>
      </div>

      {/* ====== MODAL DE RECADRAGE PHOTO ====== */}
      {selectedImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div
            className="w-full max-w-md rounded-2xl overflow-hidden"
            style={{ background: "var(--card-bg)", border: "1px solid var(--border-subtle)", boxShadow: "var(--shadow-card)" }}
          >
            <div className="flex items-center justify-between px-5 py-4">
              <h3 className="font-bold" style={{ color: "var(--text-primary)" }}>Recadrer la photo</h3>
              <button onClick={() => setSelectedImage(null)} aria-label="Fermer">
                <X className="w-5 h-5" style={{ color: "var(--text-secondary)" }} />
              </button>
            </div>

            <div className="relative h-72 md:h-80">
              <Cropper
                image={selectedImage}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape="round"
                showGrid
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            </div>

            <div className="px-5 py-4 space-y-4">
              <div className="flex items-center gap-3">
                <ZoomIn size={18} style={{ color: "var(--text-secondary)" }} />
                <input
                  type="range"
                  min={1}
                  max={3}
                  step={0.1}
                  value={zoom}
                  onChange={(e) => setZoom(Number(e.target.value))}
                  className="flex-1"
                />
              </div>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setSelectedImage(null)}
                  className="px-4 py-2 rounded-xl text-sm font-medium"
                  style={{ background: "var(--surface)", border: "1px solid var(--border-subtle)", color: "var(--text-secondary)" }}
                >
                  Annuler
                </button>
                <button
                  onClick={handleApplyCrop}
                  disabled={cropping}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-60"
                  style={{ background: "var(--gradient-button)", boxShadow: "0 5px 14px -5px rgba(37,99,235,0.4)" }}
                >
                  <CheckCircle2 size={15} /> {cropping ? "Traitement..." : "Valider"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
