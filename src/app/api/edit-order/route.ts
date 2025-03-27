import { createClient } from "../../../../supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get user session
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get request body
    const { orderId, productAQuantity, productBQuantity, notes } =
      await request.json();

    if (!orderId) {
      return NextResponse.json(
        { error: "Order ID is required" },
        { status: 400 },
      );
    }

    // Get the order to check if it can be edited
    const { data: order, error: fetchError } = await supabase
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .single();

    if (fetchError) {
      return NextResponse.json(
        { error: "Failed to fetch order" },
        { status: 500 },
      );
    }

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Only allow editing pending orders
    if (order.status !== "pending") {
      return NextResponse.json(
        { error: "Only pending orders can be edited" },
        { status: 400 },
      );
    }

    // Update the order
    const updateData: any = {};

    if (productAQuantity !== undefined) {
      updateData.product_a_quantity = productAQuantity;
    }

    if (productBQuantity !== undefined) {
      updateData.product_b_quantity = productBQuantity;
    }

    if (notes !== undefined) {
      updateData.notes = notes;
    }

    // Recalculate total days if quantities changed
    if (productAQuantity !== undefined || productBQuantity !== undefined) {
      const newProductAQuantity =
        productAQuantity !== undefined
          ? productAQuantity
          : order.product_a_quantity;
      const newProductBQuantity =
        productBQuantity !== undefined
          ? productBQuantity
          : order.product_b_quantity;

      // Calculate total production time in minutes
      const totalTimeA = newProductAQuantity * order.production_time_a;
      const totalTimeB = newProductBQuantity * order.production_time_b;
      const totalProductionTime = totalTimeA + totalTimeB;

      // Calculate number of days needed (rounded up)
      const totalDays = Math.ceil(totalProductionTime / order.daily_capacity);

      updateData.total_days = totalDays;
    }

    const { error: updateError } = await supabase
      .from("orders")
      .update(updateData)
      .eq("id", orderId);

    if (updateError) {
      return NextResponse.json(
        { error: "Failed to update order" },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
