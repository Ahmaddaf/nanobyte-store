"use client";

import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { isConfigured } from "./config";
import { supabase } from "./supabase";

export type Role = "admin" | "staff";

export interface StaffState {
  loading: boolean;
  session: Session | null;
  role: Role | null;
  name: string | null;
  email: string | null;
}

/** Current login + staff role. The role is only for showing the right screens;
 *  the database (RLS) enforces every permission on its own. */
export function useStaff(): StaffState & { reload: () => void } {
  const [state, setState] = useState<StaffState>({ loading: isConfigured, session: null, role: null, name: null, email: null });
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!isConfigured) return;
    const sb = supabase();
    let alive = true;

    async function load(session: Session | null) {
      if (!session) {
        if (alive) setState({ loading: false, session: null, role: null, name: null, email: null });
        return;
      }
      let { data } = await sb.from("staff").select("role,name,email").eq("user_id", session.user.id).maybeSingle();
      if (!data) {
        // maybe invited again after being removed
        const { data: role } = await sb.rpc("claim_invite");
        if (role) ({ data } = await sb.from("staff").select("role,name,email").eq("user_id", session.user.id).maybeSingle());
      }
      if (alive)
        setState({
          loading: false,
          session,
          role: (data?.role as Role) ?? null,
          name: data?.name ?? null,
          email: session.user.email ?? null,
        });
    }

    sb.auth.getSession().then(({ data }) => load(data.session));
    const { data: sub } = sb.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "USER_UPDATED") void load(session);
    });
    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
  }, [tick]);

  return { ...state, reload: () => setTick((t) => t + 1) };
}

export async function signIn(email: string, password: string) {
  const { error } = await supabase().auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
  if (error) throw new Error(authError(error.message));
}

/** Only emails invited from the dashboard can create an account (enforced in the database). */
export async function signUp(email: string, password: string): Promise<"signed_in" | "check_email"> {
  const { data, error } = await supabase().auth.signUp({ email: email.trim().toLowerCase(), password });
  if (error) throw new Error(authError(error.message));
  return data.session ? "signed_in" : "check_email";
}

export async function signOut() {
  await supabase().auth.signOut();
}

export async function changePassword(password: string) {
  const { error } = await supabase().auth.updateUser({ password });
  if (error) throw new Error(authError(error.message));
}

export function authError(msg: string): string {
  const m = msg.toLowerCase();
  if (m.includes("invalid login")) return "الإيميل أو كلمة السر غير صحيحة.";
  if (m.includes("email not confirmed")) return "الحساب لسه ما اتأكد. راجع بريدك أو تواصل مع المدير.";
  if (m.includes("database error saving new user") || m.includes("signup_not_allowed"))
    return "الإيميل ده ما عنده دعوة. اطلب من المدير يضيفك من لوحة التحكم أولاً.";
  if (m.includes("already registered") || m.includes("already been registered")) return "عندك حساب بالإيميل ده. استخدم «دخول».";
  if (m.includes("password") && (m.includes("6") || m.includes("8") || m.includes("short") || m.includes("weak")))
    return "كلمة السر ضعيفة. استخدم 8 أحرف أو أكثر.";
  if (m.includes("rate limit") || m.includes("too many")) return "محاولات كتيرة. انتظر دقيقة وحاول تاني.";
  if (m.includes("failed to fetch") || m.includes("network")) return "مشكلة في الاتصال بالإنترنت. حاول تاني.";
  return "حصل خطأ: " + msg;
}
