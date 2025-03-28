"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Button } from "./ui/button";
import { CalendarIcon, Clock, Settings, Save, Eye } from "lucide-react";
import { addBusinessDays, format } from "date-fns";
import { Textarea } from "./ui/textarea";
import { createOrderAction } from "@/app/actions";
import { createClient } from "../../supabase/client";
import { OrderSuccessDialog } from "./order-success-dialog";
import { useToast } from "./ui/use-toast";
import { useSearchParams, useRouter } from "next/navigation";

export default function DeadlineCalculator() {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams.get("orderId");
  const orderSuccess = searchParams.get("success");

  useEffect(() => {
    if (orderId && orderSuccess) {
      toast({
        title: "Pedido criado com sucesso!",
        description: "Seu pedido foi adicionado à fila de produção.",
        action: (
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-1"
            onClick={() => router.push(`/dashboard/orders?id=${orderId}`)}
          >
            <Eye size={14} />
            Ver pedido
          </Button>
        ),
      });
    }
  }, [orderId, orderSuccess, toast, router]);
  // Product names
  const [productAName, setProductAName] = useState("Produto A");
  const [productBName, setProductBName] = useState("Produto B");

  // Default production times (minutes per unit)
  const [productionTimeA, setProductionTimeA] = useState(30);
  const [productionTimeB, setProductionTimeB] = useState(45);

  // Default daily capacity (minutes per day)
  const [dailyCapacity, setDailyCapacity] = useState(480); // 8 hours = 480 minutes

  // Product quantities
  const [quantityA, setQuantityA] = useState(0);
  const [quantityB, setQuantityB] = useState(0);

  // Show advanced settings
  const [showSettings, setShowSettings] = useState(false);

  // Results
  const [totalDays, setTotalDays] = useState(0);
  const [completionDate, setCompletionDate] = useState<Date | null>(null);
  const [calculated, setCalculated] = useState(false);

  // Load settings from database
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("settings")
          .select("*")
          .single();

        if (data && !error) {
          setProductAName(data.product_a_name || "Produto A");
          setProductBName(data.product_b_name || "Produto B");
          setProductionTimeA(data.product_a_time || 30);
          setProductionTimeB(data.product_b_time || 45);
        }
      } catch (error) {
        console.error("Error loading settings:", error);
      }
    };

    loadSettings();
  }, []);

  const calculateDeadline = async () => {
    try {
      // Calculate total production time in minutes for this order
      const totalTimeA = quantityA * productionTimeA;
      const totalTimeB = quantityB * productionTimeB;
      const totalProductionTime = totalTimeA + totalTimeB;

      // Calculate number of days needed for this order (rounded up)
      const orderDays = Math.ceil(totalProductionTime / dailyCapacity);

      // Get existing orders to calculate actual completion date
      const supabase = createClient();
      const { data: existingOrders, error } = await supabase
        .from("orders")
        .select("*")
        .in("status", ["pending", "in_progress"])
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Error fetching existing orders:", error);
        // Continue with calculation without considering existing orders
        setTotalDays(orderDays);
        setCompletionDate(addBusinessDays(new Date(), orderDays));
        setCalculated(true);
        return;
      }

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
      const completion = addBusinessDays(startDate, orderDays);

      setTotalDays(totalDays);
      setCompletionDate(completion);
      setCalculated(true);
    } catch (error) {
      console.error("Error calculating deadline:", error);
      // Fallback to simple calculation
      const totalTimeA = quantityA * productionTimeA;
      const totalTimeB = quantityB * productionTimeB;
      const totalProductionTime = totalTimeA + totalTimeB;
      const days = Math.ceil(totalProductionTime / dailyCapacity);
      const today = new Date();
      const completion = addBusinessDays(today, days);

      setTotalDays(days);
      setCompletionDate(completion);
      setCalculated(true);
    }
  };

  return (
    <>
      <Card className="w-full max-w-3xl mx-auto bg-white shadow-lg">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 border-b">
          <CardTitle className="text-2xl font-bold text-center text-gray-800">
            Calculadora de Prazos de Produção
          </CardTitle>
          <CardDescription className="text-center text-gray-600">
            Calcule o prazo de entrega com base nas quantidades e tempos de
            produção
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-6 pb-2">
          <form action={createOrderAction}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Product A */}
              <div className="p-4 rounded-lg bg-blue-50 border border-blue-100">
                <Label
                  htmlFor="quantityA"
                  className="text-blue-800 font-medium block mb-2"
                >
                  Quantidade de {productAName}
                </Label>
                <Input
                  id="quantityA"
                  type="number"
                  min="0"
                  value={quantityA}
                  onChange={(e) => setQuantityA(parseInt(e.target.value) || 0)}
                  className="bg-white border-blue-200"
                />
                {showSettings && (
                  <div className="mt-4">
                    <Label
                      htmlFor="timeA"
                      className="text-blue-800 font-medium block mb-2"
                    >
                      Tempo médio de produção (minutos/unidade)
                    </Label>
                    <Input
                      id="timeA"
                      type="number"
                      min="1"
                      value={productionTimeA}
                      onChange={(e) =>
                        setProductionTimeA(parseInt(e.target.value) || 1)
                      }
                      className="bg-white border-blue-200"
                    />
                  </div>
                )}
              </div>

              {/* Product B */}
              <div className="p-4 rounded-lg bg-purple-50 border border-purple-100">
                <Label
                  htmlFor="quantityB"
                  className="text-purple-800 font-medium block mb-2"
                >
                  Quantidade de {productBName}
                </Label>
                <Input
                  id="quantityB"
                  type="number"
                  min="0"
                  value={quantityB}
                  onChange={(e) => setQuantityB(parseInt(e.target.value) || 0)}
                  className="bg-white border-purple-200"
                />
                {showSettings && (
                  <div className="mt-4">
                    <Label
                      htmlFor="timeB"
                      className="text-purple-800 font-medium block mb-2"
                    >
                      Tempo médio de produção (minutos/unidade)
                    </Label>
                    <Input
                      id="timeB"
                      type="number"
                      min="1"
                      value={productionTimeB}
                      onChange={(e) =>
                        setProductionTimeB(parseInt(e.target.value) || 1)
                      }
                      className="bg-white border-purple-200"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Advanced Settings */}
            <div className="mt-6">
              <Button
                variant="outline"
                onClick={() => setShowSettings(!showSettings)}
                className="w-full flex items-center justify-center gap-2 text-gray-600"
              >
                <Settings size={16} />
                {showSettings
                  ? "Ocultar Configurações Avançadas"
                  : "Mostrar Configurações Avançadas"}
              </Button>

              {showSettings && (
                <div className="mt-4 p-4 rounded-lg bg-gray-50 border border-gray-200">
                  <Label
                    htmlFor="capacity"
                    className="text-gray-800 font-medium block mb-2"
                  >
                    Capacidade produtiva diária (minutos/dia)
                  </Label>
                  <Input
                    id="capacity"
                    type="number"
                    min="60"
                    value={dailyCapacity}
                    onChange={(e) =>
                      setDailyCapacity(parseInt(e.target.value) || 60)
                    }
                    className="bg-white"
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    Padrão: 480 minutos (8 horas de trabalho por dia)
                  </p>
                </div>
              )}
            </div>

            {/* Notes Field */}
            {calculated && (
              <div className="mt-6">
                <Label
                  htmlFor="notes"
                  className="text-gray-800 font-medium block mb-2"
                >
                  Observações do Pedido
                </Label>
                <Textarea
                  id="notes"
                  name="notes"
                  placeholder="Adicione informações adicionais sobre o pedido..."
                  className="bg-white"
                />
              </div>
            )}

            {/* Hidden Fields for Form Submission */}
            <input type="hidden" name="quantityA" value={quantityA} />
            <input type="hidden" name="quantityB" value={quantityB} />
            <input
              type="hidden"
              name="productionTimeA"
              value={productionTimeA}
            />
            <input
              type="hidden"
              name="productionTimeB"
              value={productionTimeB}
            />
            <input type="hidden" name="dailyCapacity" value={dailyCapacity} />

            {/* Calculate Button */}
            <div className="mt-6 flex gap-4">
              <Button
                type="button"
                onClick={calculateDeadline}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-6"
                disabled={quantityA === 0 && quantityB === 0}
              >
                Calcular Prazo de Entrega
              </Button>

              {calculated && (
                <Button
                  type="submit"
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white py-6 flex items-center justify-center gap-2"
                >
                  <Save size={18} />
                  Salvar Pedido
                </Button>
              )}
            </div>

            {/* Results */}
            {calculated && (
              <div className="mt-8">
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg p-6 text-center">
                  <h3 className="text-xl font-semibold mb-2">
                    Resultado do Cálculo
                  </h3>
                  <div className="flex flex-col md:flex-row justify-center items-center gap-6 mt-4">
                    <div className="flex items-center gap-3">
                      <Clock className="w-8 h-8" />
                      <div>
                        <p className="text-sm text-blue-100">
                          Tempo Total de Produção
                        </p>
                        <p className="text-3xl font-bold">
                          {totalDays} {totalDays === 1 ? "dia" : "dias"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <CalendarIcon className="w-8 h-8" />
                      <div>
                        <p className="text-sm text-blue-100">
                          Data Prevista de Conclusão
                        </p>
                        <p className="text-3xl font-bold">
                          {completionDate
                            ? format(completionDate, "dd/MM/yyyy")
                            : "-"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </form>
        </CardContent>

        <CardFooter className="text-center text-xs text-gray-500 pt-2 pb-4">
          Os cálculos consideram apenas dias úteis e a capacidade produtiva
          configurada.
        </CardFooter>
      </Card>
    </>
  );
}
