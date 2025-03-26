"use client";

import { useEffect, useState } from "react";
import { createClient } from "../../../../supabase/client";
import DashboardNavbar from "@/components/dashboard-navbar";
import Footer from "@/components/footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { updateOrderStatusAction } from "@/app/actions";
import { format } from "date-fns";

type Order = {
  id: string;
  product_a_quantity: number;
  product_b_quantity: number;
  production_time_a: number;
  production_time_b: number;
  daily_capacity: number;
  total_days: number;
  estimated_completion_date: string;
  status: string;
  created_at: string;
  completed_at: string | null;
  notes: string | null;
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("pending");
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = async (status: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/orders?status=${status}`);

      if (!response.ok) {
        throw new Error("Falha ao carregar pedidos");
      }

      const data = await response.json();
      setOrders(data.orders || []);
    } catch (err) {
      console.error("Error fetching orders:", err);
      setError(
        "Não foi possível carregar os pedidos. Tente novamente mais tarde.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders(activeTab);

    // Set up realtime subscription
    const supabase = createClient();

    const subscription = supabase
      .channel("orders-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
        },
        () => {
          fetchOrders(activeTab);
        },
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [activeTab]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    fetchOrders(value);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardNavbar />

      <div className="container mx-auto py-12 px-4">
        <h1 className="text-3xl font-bold mb-8">Gerenciamento de Pedidos</h1>

        <Tabs defaultValue="pending" onValueChange={handleTabChange}>
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="pending">Pendentes</TabsTrigger>
            <TabsTrigger value="in_progress">Em Produção</TabsTrigger>
            <TabsTrigger value="completed">Concluídos</TabsTrigger>
          </TabsList>

          <TabsContent value="pending">
            <OrdersList
              orders={orders}
              loading={loading}
              error={error}
              status="pending"
              title="Pedidos Pendentes"
              emptyMessage="Não há pedidos pendentes na fila."
            />
          </TabsContent>

          <TabsContent value="in_progress">
            <OrdersList
              orders={orders}
              loading={loading}
              error={error}
              status="in_progress"
              title="Pedidos Em Produção"
              emptyMessage="Não há pedidos em produção no momento."
            />
          </TabsContent>

          <TabsContent value="completed">
            <OrdersList
              orders={orders}
              loading={loading}
              error={error}
              status="completed"
              title="Pedidos Concluídos"
              emptyMessage="Não há pedidos concluídos."
            />
          </TabsContent>
        </Tabs>
      </div>

      <Footer />
    </div>
  );
}

function OrdersList({
  orders,
  loading,
  error,
  status,
  title,
  emptyMessage,
}: {
  orders: Order[];
  loading: boolean;
  error: string | null;
  status: string;
  title: string;
  emptyMessage: string;
}) {
  if (loading) {
    return <div className="text-center py-12">Carregando pedidos...</div>;
  }

  if (error) {
    return <div className="text-center py-12 text-red-500">{error}</div>;
  }

  if (orders.length === 0) {
    return <div className="text-center py-12">{emptyMessage}</div>;
  }

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">{title}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {orders.map((order) => (
          <OrderCard key={order.id} order={order} status={status} />
        ))}
      </div>
    </div>
  );
}

function OrderCard({ order, status }: { order: Order; status: string }) {
  const [notes, setNotes] = useState(order.notes || "");

  const getStatusActions = () => {
    switch (status) {
      case "pending":
        return (
          <form action={updateOrderStatusAction}>
            <input type="hidden" name="orderId" value={order.id} />
            <input type="hidden" name="status" value="in_progress" />
            <input type="hidden" name="notes" value={notes} />
            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              Iniciar Produção
            </Button>
          </form>
        );
      case "in_progress":
        return (
          <form action={updateOrderStatusAction}>
            <input type="hidden" name="orderId" value={order.id} />
            <input type="hidden" name="status" value="completed" />
            <input type="hidden" name="notes" value={notes} />
            <Button
              type="submit"
              className="w-full bg-green-600 hover:bg-green-700"
            >
              Marcar como Concluído
            </Button>
          </form>
        );
      default:
        return null;
    }
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 pb-2">
        <CardTitle className="text-lg">
          Pedido #{order.id.substring(0, 8)}
        </CardTitle>
        <div className="text-sm text-gray-500">
          Criado em: {format(new Date(order.created_at), "dd/MM/yyyy")}
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-blue-50 p-3 rounded-lg">
            <div className="text-sm text-blue-800">Produto A</div>
            <div className="text-xl font-bold">{order.product_a_quantity}</div>
          </div>
          <div className="bg-purple-50 p-3 rounded-lg">
            <div className="text-sm text-purple-800">Produto B</div>
            <div className="text-xl font-bold">{order.product_b_quantity}</div>
          </div>
        </div>

        <div className="mb-4">
          <div className="text-sm font-medium mb-1">Prazo de Produção</div>
          <div className="flex justify-between">
            <div>
              <span className="text-gray-600">Dias:</span>
              <span className="font-bold ml-1">{order.total_days}</span>
            </div>
            <div>
              <span className="text-gray-600">Conclusão:</span>
              <span className="font-bold ml-1">
                {format(
                  new Date(order.estimated_completion_date),
                  "dd/MM/yyyy",
                )}
              </span>
            </div>
          </div>
        </div>

        {status !== "completed" && (
          <div className="mb-4">
            <label className="text-sm font-medium mb-1 block">
              Observações
            </label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="text-sm"
              rows={2}
            />
          </div>
        )}

        {status === "completed" && order.notes && (
          <div className="mb-4">
            <div className="text-sm font-medium mb-1">Observações</div>
            <div className="text-sm bg-gray-50 p-2 rounded">{order.notes}</div>
          </div>
        )}

        {status === "completed" && (
          <div className="text-sm text-green-600 font-medium">
            Concluído em:{" "}
            {order.completed_at
              ? format(new Date(order.completed_at), "dd/MM/yyyy")
              : "N/A"}
          </div>
        )}

        {getStatusActions()}
      </CardContent>
    </Card>
  );
}
