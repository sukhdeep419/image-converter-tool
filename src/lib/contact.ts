import { supabase } from "./supabase";

export const submitContactForm = async (
  name: string,
  email: string,
  message: string,
  website = ""
) => {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const response = await fetch("/api/contact", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(session?.access_token
        ? { Authorization: `Bearer ${session.access_token}` }
        : {}),
    },
    body: JSON.stringify({ name, email, message, website }),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    return {
      data: null,
      error: {
        message: data?.error ?? "Contact submission failed.",
      },
    };
  }

  return { data, error: null };
};

export const getContactSubmissions = async (userId: string) => {
  const { data, error } = await supabase
    .from("contact_submissions")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  return { data, error };
};
