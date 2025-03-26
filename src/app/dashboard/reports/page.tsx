"use client";

import { useEffect, useState } from "react";
import DashboardNavbar from "@/components/dashboard-navbar";
import Footer from "@/components/footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { format, subDays } from "date-fns";
import { DateRange } from "react-day-picker";
import { DatePickerWithRange } from "@/components/ui/date-picker-with-range";

type Order = {
  id: string;
  product_a_quantity: number;
  product_b_quantity: number;
  total_days: number;
  estimated_completion_date: string;
  created_at: string;
  completed_at: string;
};

type ReportSummary = {
  totalOrders: number;
  totalProductA: number;
  totalProductB: number;
  averageCompletionDays: number;
};

export default function ReportsPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [summary, setSummary] = useState<ReportSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 30),
    to: new Date(),
  });

  const fetchReports = async () => {
    try {
      setLoading(true);

      let url = "/api/reports";
      if (dateRange?.from) {
        url += `?startDate=${format(dateRange.from, "yyyy-MM-dd")}`;
        if (dateRange.to) {
          url += `&endDate=${format(dateRange.to, "yyyy-MM-dd")}`;
        }
      }

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error("Falha ao carregar relatórios");
      }

      const data = await response.json();
      setOrders(data.orders || []);
      setSummary(data.summary || null);
    } catch (err) {
      console.error("Error fetching reports:", err);
      setError(
        "Não foi possível carregar os relatórios. Tente novamente mais tarde.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleDateRangeChange = (range: DateRange | undefined) => {
    setDateRange(range);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardNavbar />

      <div className="container mx-auto py-12 px-4">
        <h1 className="text-3xl font-bold mb-8">Relatórios de Produção</h1>

        <div className="mb-8 flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-grow">
            <DatePickerWithRange
              date={dateRange}
              setDate={handleDateRangeChange}
            />
          </div>
          <Button
            onClick={fetchReports}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Gerar Relatório
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-12">Carregando relatórios...</div>
        ) : error ? (
          <div className="text-center py-12 text-red-500">{error}</div>
        ) : (
          <div className="space-y-8">
            {summary && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <SummaryCard
                  title="Total de Pedidos"
                  value={summary.totalOrders.toString()}
                  color="blue"
                />
                <SummaryCard
                  title="Total Produto A"
                  value={summary.totalProductA.toString()}
                  color="green"
                />
                <SummaryCard
                  title="Total Produto B"
                  value={summary.totalProductB.toString()}
                  color="purple"
                />
                <SummaryCard
                  title="Média de Dias"
                  value={summary.averageCompletionDays.toFixed(1)}
                  color="orange"
                />
              </div>
            )}

            <div>
              <h2 className="text-xl font-semibold mb-4">Pedidos Concluídos</h2>
              {orders.length === 0 ? (
                <div className="text-center py-12">
                  Nenhum pedido concluído no período selecionado.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full bg-white rounded-lg overflow-hidden">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="py-3 px-4 text-left">ID</th>
                        <th className="py-3 px-4 text-left">Data Criação</th>
                        <th className="py-3 px-4 text-left">Data Conclusão</th>
                        <th className="py-3 px-4 text-right">Produto A</th>
                        <th className="py-3 px-4 text-right">Produto B</th>
                        <th className="py-3 px-4 text-right">Dias</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map((order) => (
                        <tr key={order.id} className="border-t">
                          <td className="py-3 px-4">
                            {order.id.substring(0, 8)}
                          </td>
                          <td className="py-3 px-4">
                            {format(new Date(order.created_at), "dd/MM/yyyy")}
                          </td>
                          <td className="py-3 px-4">
                            {format(new Date(order.completed_at), "dd/MM/yyyy")}
                          </td>
                          <td className="py-3 px-4 text-right">
                            {order.product_a_quantity}
                          </td>
                          <td className="py-3 px-4 text-right">
                            {order.product_b_quantity}
                          </td>
                          <td className="py-3 px-4 text-right">
                            {order.total_days}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}

function SummaryCard({
  title,
  value,
  color,
}: {
  title: string;
  value: string;
  color: "blue" | "green" | "purple" | "orange";
}) {
  const colorClasses = {
    blue: "from-blue-500 to-blue-600",
    green: "from-green-500 to-green-600",
    purple: "from-purple-500 to-purple-600",
    orange: "from-orange-500 to-orange-600",
  };

  return (
    <Card>
      <CardHeader
        className={`bg-gradient-to-r ${colorClasses[color]} py-3 px-4`}
      >
        <CardTitle className="text-white text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent className="py-6 text-center">
        <div className="text-3xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
}
