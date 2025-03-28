"use server";

import { encodedRedirect } from "@/utils/utils";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "../../supabase/server";
import { addBusinessDays, format } from "date-fns";

// Helper function to recalculate deadlines for all pending and in-progress orders
async function recalculateOrderDeadlines(supabase: any) {
  try {
    // Get all pending and in-progress orders ordered by creation date
    const { data: activeOrders, error: fetchError } = await supabase
      .from("orders")
      .select("*")
      .in("status", ["pending", "in_progress"])
      .order("created_at", { ascending: true });

    if (fetchError || !activeOrders) {
      console.error("Error fetching active orders:", fetchError);
      return;
    }

    // Start with today's date
    let currentDate = new Date();

    // Process each order and update its deadline
    for (let i = 0; i < activeOrders.length; i++) {
      const order = activeOrders[i];

      // Calculate production time for this order
      const totalTimeA = order.product_a_quantity * order.production_time_a;
      const totalTimeB = order.product_b_quantity * order.production_time_b;
      const totalProductionTime = totalTimeA + totalTimeB;

      // Calculate days needed for this order
      const orderDays = Math.ceil(totalProductionTime / order.daily_capacity);

      // Calculate new completion date based on current date
      const newCompletionDate = addBusinessDays(currentDate, orderDays);

      // Update the order with new completion date
      const { error: updateError } = await supabase
        .from("orders")
        .update({
          estimated_completion_date: format(newCompletionDate, "yyyy-MM-dd"),
          total_days: orderDays,
        })
        .eq("id", order.id);

      if (updateError) {
        console.error(`Error updating order ${order.id}:`, updateError);
      }

      // Move current date forward for the next order
      currentDate = addBusinessDays(currentDate, orderDays);
    }
  } catch (error) {
    console.error("Error in recalculateOrderDeadlines:", error);
  }
}

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

  // Validate input
  if (productAQuantity === 0 && productBQuantity === 0) {
    return encodedRedirect(
      "error",
      "/calculator",
      "É necessário informar a quantidade de pelo menos um produto",
    );
  }

  // Get existing orders that are pending or in progress
  const { data: existingOrders, error: fetchError } = await supabase
    .from("orders")
    .select("*")
    .in("status", ["pending", "in_progress"])
    .order("created_at", { ascending: true });

  if (fetchError) {
    console.error("Error fetching existing orders:", fetchError);
    return encodedRedirect(
      "error",
      "/calculator",
      "Erro ao verificar pedidos existentes: " + fetchError.message,
    );
  }

  // Calculate total production time for new order in minutes
  const totalTimeA = productAQuantity * productionTimeA;
  const totalTimeB = productBQuantity * productionTimeB;
  const totalProductionTime = totalTimeA + totalTimeB;

  // Calculate number of days needed for this order (rounded up)
  const orderDays = Math.ceil(totalProductionTime / dailyCapacity);

  // Calculate total days considering existing orders
  let totalDays = orderDays;
  let startDate = new Date();

  if (existingOrders && existingOrders.length > 0) {
    // Calculate total production time of existing orders
    let existingOrdersDays = 0;

    for (const order of existingOrders) {
      // For each order, calculate its remaining production time
      const orderTotalTime =
        order.product_a_quantity * order.production_time_a +
        order.product_b_quantity * order.production_time_b;

      const orderDays = Math.ceil(orderTotalTime / order.daily_capacity);
      existingOrdersDays += orderDays;
    }

    // Add the days from existing orders to our new order's start date
    startDate = addBusinessDays(startDate, existingOrdersDays);

    // The total days is now the existing orders plus this new order
    totalDays = existingOrdersDays + orderDays;
  }

  // Calculate completion date based on the adjusted start date
  const completionDate = addBusinessDays(startDate, orderDays);

  // Get product names from settings
  const { data: settingsData } = await supabase
    .from("settings")
    .select("*")
    .single();

  const productAName = settingsData?.product_a_name || "Produto A";
  const productBName = settingsData?.product_b_name || "Produto B";

  // Insert order into database
  const { data, error } = await supabase
    .from("orders")
    .insert({
      user_id: session.user.id,
      product_a_quantity: productAQuantity,
      product_b_quantity: productBQuantity,
      product_a_name: productAName,
      product_b_name: productBName,
      production_time_a: productionTimeA,
      production_time_b: productionTimeB,
      daily_capacity: dailyCapacity,
      total_days: orderDays,
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

  // Success! Now update all other pending orders to recalculate their deadlines
  await recalculateOrderDeadlines(supabase);

  return encodedRedirect(
    "success",
    `/calculator?orderId=${data.id}&success=true`,
    "✅ Pedido criado com sucesso! Seu pedido foi adicionado à fila de produção com conclusão prevista para " +
      format(completionDate, "dd/MM/yyyy"),
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
      "/dashboard/orders",
      "Você precisa estar logado para atualizar um pedido",
    );
  }

  const orderId = formData.get("orderId")?.toString();
  const status = formData.get("status")?.toString();
  const notes = formData.get("notes")?.toString();

  if (!orderId || !status) {
    return encodedRedirect(
      "error",
      "/dashboard/orders",
      "ID do pedido e status são obrigatórios",
    );
  }

  // Get the current order to know its previous status
  const { data: currentOrder, error: fetchError } = await supabase
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .single();

  if (fetchError) {
    console.error("Error fetching order:", fetchError);
    return encodedRedirect(
      "error",
      "/dashboard/orders",
      "Erro ao buscar informações do pedido: " + fetchError.message,
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
      "/dashboard/orders",
      "❌ Erro ao atualizar pedido: " + error.message,
    );
  }

  // If the status changed, recalculate deadlines for all pending and in-progress orders
  if (currentOrder.status !== status) {
    await recalculateOrderDeadlines(supabase);
  }

  // Determine which tab to return to
  const returnTab =
    status === "completed"
      ? "completed"
      : status === "in_progress"
        ? "in_progress"
        : "pending";

  // Create appropriate success message based on the status change
  let successMessage = "";
  if (status === "completed") {
    successMessage = "✅ Pedido marcado como concluído com sucesso!";
  } else if (status === "in_progress") {
    successMessage = "🔄 Pedido movido para produção com sucesso!";
  } else if (status === "pending") {
    successMessage = "⏳ Pedido movido para pendentes com sucesso!";
  } else if (status === "canceled") {
    successMessage = "❌ Pedido cancelado com sucesso!";
  } else {
    successMessage = "Status do pedido atualizado com sucesso!";
  }

  return encodedRedirect(
    "success",
    `/dashboard/orders?tab=${returnTab}`,
    successMessage,
  );
};
