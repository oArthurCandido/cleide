"use server";

import { encodedRedirect } from "@/utils/utils";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "../../supabase/server";
import { addBusinessDays, format } from "date-fns";

export const signUpAction = async (formData: FormData) => {
  const email = formData.get("email")?.toString();
  const password = formData.get("password")?.toString();
  const fullName = formData.get("full_name")?.toString() || "";
  const supabase = await createClient();
  const origin = headers().get("origin");

  if (!email || !password) {
    return encodedRedirect(
      "error",
      "/sign-up",
      "Email and password are required",
    );
  }

  const {
    data: { user },
    error,
  } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
      data: {
        full_name: fullName,
        email: email,
      },
    },
  });

  console.log("After signUp", error);

  if (error) {
    console.error(error.code + " " + error.message);
    return encodedRedirect("error", "/sign-up", error.message);
  }

  if (user) {
    try {
      const { error: updateError } = await supabase.from("users").insert({
        id: user.id,
        name: fullName,
        full_name: fullName,
        email: email,
        user_id: user.id,
        token_identifier: user.id,
        created_at: new Date().toISOString(),
      });

      if (updateError) {
        console.error("Error updating user profile:", updateError);
      }
    } catch (err) {
      console.error("Error in user profile creation:", err);
    }
  }

  return encodedRedirect(
    "success",
    "/sign-up",
    "Thanks for signing up! Please check your email for a verification link.",
  );
};

export const signInAction = async (formData: FormData) => {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return encodedRedirect("error", "/sign-in", error.message);
  }

  return redirect("/dashboard");
};

export const forgotPasswordAction = async (formData: FormData) => {
  const email = formData.get("email")?.toString();
  const supabase = await createClient();
  const origin = headers().get("origin");
  const callbackUrl = formData.get("callbackUrl")?.toString();

  if (!email) {
    return encodedRedirect("error", "/forgot-password", "Email is required");
  }

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?redirect_to=/protected/reset-password`,
  });

  if (error) {
    console.error(error.message);
    return encodedRedirect(
      "error",
      "/forgot-password",
      "Could not reset password",
    );
  }

  if (callbackUrl) {
    return redirect(callbackUrl);
  }

  return encodedRedirect(
    "success",
    "/forgot-password",
    "Check your email for a link to reset your password.",
  );
};

export const resetPasswordAction = async (formData: FormData) => {
  const supabase = await createClient();

  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!password || !confirmPassword) {
    encodedRedirect(
      "error",
      "/protected/reset-password",
      "Password and confirm password are required",
    );
  }

  if (password !== confirmPassword) {
    encodedRedirect(
      "error",
      "/dashboard/reset-password",
      "Passwords do not match",
    );
  }

  const { error } = await supabase.auth.updateUser({
    password: password,
  });

  if (error) {
    encodedRedirect(
      "error",
      "/dashboard/reset-password",
      "Password update failed",
    );
  }

  encodedRedirect("success", "/protected/reset-password", "Password updated");
};

export const signOutAction = async () => {
  const supabase = await createClient();
  await supabase.auth.signOut();
  return redirect("/sign-in");
};

export const createOrderAction = async (formData: FormData) => {
  const supabase = await createClient();

  // Get user session
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return encodedRedirect(
      "error",
      "/calculator",
      "Você precisa estar logado para criar um pedido",
    );
  }

  // Get form data
  const productAQuantity = parseInt(
    formData.get("quantityA")?.toString() || "0",
  );
  const productBQuantity = parseInt(
    formData.get("quantityB")?.toString() || "0",
  );
  const productionTimeA = parseInt(
    formData.get("productionTimeA")?.toString() || "30",
  );
  const productionTimeB = parseInt(
    formData.get("productionTimeB")?.toString() || "45",
  );
  const dailyCapacity = parseInt(
    formData.get("dailyCapacity")?.toString() || "480",
  );
  const notes = formData.get("notes")?.toString() || "";

  // Calculate total production time in minutes
  const totalTimeA = productAQuantity * productionTimeA;
  const totalTimeB = productBQuantity * productionTimeB;
  const totalProductionTime = totalTimeA + totalTimeB;

  // Calculate number of days needed (rounded up)
  const totalDays = Math.ceil(totalProductionTime / dailyCapacity);

  // Calculate completion date (adding business days)
  const today = new Date();
  const completionDate = addBusinessDays(today, totalDays);

  // Insert order into database
  const { data, error } = await supabase
    .from("orders")
    .insert({
      user_id: session.user.id,
      product_a_quantity: productAQuantity,
      product_b_quantity: productBQuantity,
      production_time_a: productionTimeA,
      production_time_b: productionTimeB,
      daily_capacity: dailyCapacity,
      total_days: totalDays,
      estimated_completion_date: format(completionDate, "yyyy-MM-dd"),
      status: "pending",
      notes: notes,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating order:", error);
    return encodedRedirect(
      "error",
      "/calculator",
      "Erro ao criar pedido: " + error.message,
    );
  }

  return encodedRedirect(
    "success",
    "/calculator",
    "Pedido criado com sucesso e adicionado à fila de produção!",
  );
};

export const updateOrderStatusAction = async (formData: FormData) => {
  const supabase = await createClient();

  // Get user session
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return encodedRedirect(
      "error",
      "/dashboard",
      "Você precisa estar logado para atualizar um pedido",
    );
  }

  const orderId = formData.get("orderId")?.toString();
  const status = formData.get("status")?.toString();
  const notes = formData.get("notes")?.toString();

  if (!orderId || !status) {
    return encodedRedirect(
      "error",
      "/dashboard",
      "ID do pedido e status são obrigatórios",
    );
  }

  const updateData: any = { status };

  // If status is completed, add completion date
  if (status === "completed") {
    updateData.completed_at = new Date().toISOString();
  }

  // Add notes if provided
  if (notes) {
    updateData.notes = notes;
  }

  const { error } = await supabase
    .from("orders")
    .update(updateData)
    .eq("id", orderId);

  if (error) {
    console.error("Error updating order:", error);
    return encodedRedirect(
      "error",
      "/dashboard",
      "Erro ao atualizar pedido: " + error.message,
    );
  }

  return encodedRedirect(
    "success",
    "/dashboard",
    status === "completed"
      ? "Pedido marcado como concluído!"
      : "Status do pedido atualizado!",
  );
};
