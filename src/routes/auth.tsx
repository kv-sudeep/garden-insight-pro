import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { Leaf, LogOut } from "lucide-react";
import { toast } from "sonner";
import { MobileLayout } from "@/components/MobileLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [
    { title: "Sign in — KrushiMitra AI" },
    { name: "description", content: "Sign in or create your KrushiMitra AI account." },
    { property: "og:title", content: "Sign in — KrushiMitra AI" },
    { property: "og:description", content: "Access your KrushiMitra AI account." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }),
  component: AuthPage,
});

type Mode = "signin" | "signup" | "forgot" | "code";

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [user, setUser] = useState<{ email?: string; name?: string } | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => data.user && setUser({ email: data.user.email, name: data.user.user_metadata?.full_name }));
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setUser(s?.user ? { email: s.user.email, name: s.user.user_metadata?.full_name } : null));
    return () => data.subscription.unsubscribe();
  }, []);

  async function submit(e: FormEvent) {
    e.preventDefault(); setBusy(true);
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Welcome back!"); navigate({ to: "/" });
      } else if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin, data: { full_name: name } } });
        if (error) throw error;
        if (data.session) { toast.success("Account created!"); navigate({ to: "/" }); }
        else { toast.success("Check your email to confirm your account."); setMode("signin"); }
      } else if (mode === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` });
        if (error) throw error;
        toast.success("Reset email sent. Enter the code or tap the link in the email."); setMode("code");
      } else {
        const { error } = await supabase.auth.verifyOtp({ email, token: code.trim(), type: "recovery" });
        if (error) throw error;
        navigate({ to: "/reset-password" });
      }
    } catch (err) { toast.error(err instanceof Error ? err.message : "Something went wrong"); }
    finally { setBusy(false); }
  }

  const titles: Record<Mode, string> = { signin: "Sign in", signup: "Create account", forgot: "Forgot password", code: "Enter reset code" };

  if (user) return <MobileLayout><div className="px-5 pt-16 text-center">
    <Leaf className="neon-icon mx-auto h-10 w-10"/>
    <h1 className="mt-4 text-xl font-bold">Hi {user.name || "there"}</h1>
    <p className="mt-1 text-sm text-muted-foreground">{user.email}</p>
    <Button className="blue-button mt-6 w-full" onClick={async () => { await supabase.auth.signOut(); navigate({ to: "/auth", replace: true }); }}><LogOut className="h-4 w-4"/> Sign out</Button>
  </div></MobileLayout>;

  return <MobileLayout><div className="px-5 pt-12">
    <Leaf className="neon-icon mx-auto h-10 w-10"/>
    <h1 className="mt-4 text-center text-2xl font-bold">{titles[mode]}</h1>
    <form onSubmit={submit} className="glass-panel mt-6 space-y-3 rounded-2xl p-5">
      {mode === "signup" && <Input required placeholder="Your name" value={name} onChange={e => setName(e.target.value)}/>}
      <Input required type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)}/>
      {(mode === "signin" || mode === "signup") && <Input required type="password" minLength={6} placeholder="Password" value={password} onChange={e => setPassword(e.target.value)}/>}
      {mode === "code" && <Input required inputMode="numeric" placeholder="Code from email" value={code} onChange={e => setCode(e.target.value)}/>}
      <Button type="submit" disabled={busy} className="blue-button w-full">{busy ? "Please wait…" : mode === "forgot" ? "Send reset email" : mode === "code" ? "Verify code" : titles[mode]}</Button>
      {mode === "signin" && <button type="button" onClick={() => setMode("forgot")} className="w-full text-xs text-accent">Forgot password?</button>}
    </form>
    <p className="mt-5 text-center text-sm text-muted-foreground">
      {mode === "signup" ? <>Have an account? <button className="text-accent" onClick={() => setMode("signin")}>Sign in</button></>
        : mode === "signin" ? <>New here? <button className="text-accent" onClick={() => setMode("signup")}>Sign up</button></>
        : <button className="text-accent" onClick={() => setMode("signin")}>Back to sign in</button>}
    </p>
    <p className="mt-3 text-center text-xs"><Link to="/" className="text-muted-foreground">Continue without account</Link></p>
  </div></MobileLayout>;
}
