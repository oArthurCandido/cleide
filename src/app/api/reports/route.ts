import { createClient } from "../../../../supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    // Get user session
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Build query
    let query = supabase.from("orders").select("*").eq("status", "completed");

    // Add date filters if provided
    if (startDate) {
      query = query.gte("completed_at", `${startDate}T00:00:00`);
    }

    if (endDate) {
      query = query.lte("completed_at", `${endDate}T23:59:59`);
    }

    // Execute query
    const { data, error } = await query.order("completed_at", {
      ascending: false,
    });

    if (error) {
      console.error("Error fetching reports:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Calculate summary statistics
    const summary = {
      totalOrders: data.length,
      totalProductA: data.reduce(
        (sum, order) => sum + order.product_a_quantity,
        0,
      ),
      totalProductB: data.reduce(
        (sum, order) => sum + order.product_b_quantity,
        0,
      ),
      averageCompletionDays:
        data.length > 0
          ? data.reduce((sum, order) => sum + order.total_days, 0) / data.length
          : 0,
    };

    return NextResponse.json({
      orders: data,
      summary,
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
