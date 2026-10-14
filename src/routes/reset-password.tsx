import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { KeyRound } from "lucide-react";
import { toast } from "sonner";
import { MobileLayout } from "@/components/MobileLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  head: () => ({ meta: [
    { title: "Reset password — KrushiMitra AI" },
    { name: "description", content: "Choose a new password for your KrushiMitra AI account." },
    { property: "og:title", content: "Reset password — KrushiMitra AI" },
    { property: "og:description", content: "Set a new KrushiMitra AI password." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }),
  component: ResetPassword,
});

function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (password !== confirm) return toast.error("Passwords don't match");
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Password changed!"); navigate({ to: "/" });
  }

  return <MobileLayout><div className="px-5 pt-12">
    <KeyRound className="neon-icon mx-auto h-10 w-10"/>
    <h1 className="mt-4 text-center text-2xl font-bold">New password</h1>
    <form onSubmit={submit} className="glass-panel mt-6 space-y-3 rounded-2xl p-5">
      <Input required type="password" minLength={6} placeholder="New password" value={password} onChange={e => setPassword(e.target.value)}/>
      <Input required type="password" minLength={6} placeholder="Confirm password" value={confirm} onChange={e => setConfirm(e.target.value)}/>
      <Button type="submit" disabled={busy} className="blue-button w-full">{busy ? "Saving…" : "Change password"}</Button>
    </form>
  </div></MobileLayout>;
}
