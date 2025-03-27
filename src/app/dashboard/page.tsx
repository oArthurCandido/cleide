import DashboardNavbar from "@/components/dashboard-navbar";
import { InfoIcon, UserCircle, ClipboardList, BarChart3 } from "lucide-react";
import { redirect } from "next/navigation";
import { createClient } from "../../../supabase/server";
import Link from "next/link";
import Footer from "@/components/footer";

export default async function Dashboard() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }

  // Get order counts
  const { data: pendingOrders } = await supabase
    .from("orders")
    .select("id", { count: "exact" })
    .eq("status", "pending");

  const { data: inProgressOrders } = await supabase
    .from("orders")
    .select("id", { count: "exact" })
    .eq("status", "in_progress");

  const { data: completedOrders } = await supabase
    .from("orders")
    .select("id", { count: "exact" })
    .eq("status", "completed");

  const { data: canceledOrders } = await supabase
    .from("orders")
    .select("id", { count: "exact" })
    .eq("status", "canceled");

  const pendingCount = pendingOrders?.length || 0;
  const inProgressCount = inProgressOrders?.length || 0;
  const completedCount = completedOrders?.length || 0;
  const canceledCount = canceledOrders?.length || 0;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <DashboardNavbar />
      <main className="flex-grow">
        <div className="container mx-auto px-4 py-8 flex flex-col gap-8">
          {/* Header Section */}
          <header className="flex flex-col gap-4">
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <div className="bg-secondary/50 text-sm p-3 px-4 rounded-lg text-muted-foreground flex gap-2 items-center">
              <InfoIcon size="14" />
              <span>Bem-vindo ao seu painel de controle de produção</span>
            </div>
          </header>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Link
              href="/dashboard/orders?tab=pending"
              className="bg-blue-50 rounded-xl p-6 border border-blue-100 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-lg text-blue-800">
                    Pedidos Pendentes
                  </h3>
                  <p className="text-3xl font-bold text-blue-600 mt-2">
                    {pendingCount}
                  </p>
                </div>
                <div className="bg-blue-100 p-3 rounded-full">
                  <ClipboardList className="h-8 w-8 text-blue-600" />
                </div>
              </div>
            </Link>

            <Link
              href="/dashboard/orders?tab=in_progress"
              className="bg-purple-50 rounded-xl p-6 border border-purple-100 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-lg text-purple-800">
                    Em Produção
                  </h3>
                  <p className="text-3xl font-bold text-purple-600 mt-2">
                    {inProgressCount}
                  </p>
                </div>
                <div className="bg-purple-100 p-3 rounded-full">
                  <ClipboardList className="h-8 w-8 text-purple-600" />
                </div>
              </div>
            </Link>

            <Link
              href="/dashboard/orders?tab=completed"
              className="bg-green-50 rounded-xl p-6 border border-green-100 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-lg text-green-800">
                    Pedidos Concluídos
                  </h3>
                  <p className="text-3xl font-bold text-green-600 mt-2">
                    {completedCount}
                  </p>
                </div>
                <div className="bg-green-100 p-3 rounded-full">
                  <ClipboardList className="h-8 w-8 text-green-600" />
                </div>
              </div>
            </Link>

            <Link
              href="/dashboard/orders?tab=canceled"
              className="bg-red-50 rounded-xl p-6 border border-red-100 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-lg text-red-800">
                    Pedidos Cancelados
                  </h3>
                  <p className="text-3xl font-bold text-red-600 mt-2">
                    {canceledCount}
                  </p>
                </div>
                <div className="bg-red-100 p-3 rounded-full">
                  <ClipboardList className="h-8 w-8 text-red-600" />
                </div>
              </div>
            </Link>
          </div>

          {/* User Profile Section */}
          <section className="bg-card rounded-xl p-6 border shadow-sm">
            <div className="flex items-center gap-4 mb-6">
              <UserCircle size={48} className="text-primary" />
              <div>
                <h2 className="font-semibold text-xl">Perfil do Usuário</h2>
                <p className="text-sm text-muted-foreground">{user.email}</p>
              </div>
            </div>
            <div className="bg-muted/50 rounded-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Email</p>
                  <p className="font-medium">{user.email}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">ID</p>
                  <p className="font-medium">{user.id.substring(0, 8)}...</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Último login
                  </p>
                  <p className="font-medium">
                    {new Date(user.last_sign_in_at || "").toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
