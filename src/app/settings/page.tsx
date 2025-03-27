"use client";

import { useState, useEffect } from "react";
import DashboardNavbar from "@/components/dashboard-navbar";
import Footer from "@/components/footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { createClient } from "../../../supabase/client";
import { useRouter } from "next/navigation";

export default function SettingsPage() {
  const [productAName, setProductAName] = useState("Produto A");
  const [productBName, setProductBName] = useState("Produto B");
  const [productATime, setProductATime] = useState(30);
  const [productBTime, setProductBTime] = useState(45);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const router = useRouter();

  useEffect(() => {
    const loadSettings = async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("settings")
        .select("*")
        .single();

      if (data && !error) {
        setProductAName(data.product_a_name || "Produto A");
        setProductBName(data.product_b_name || "Produto B");
        setProductATime(data.product_a_time || 30);
        setProductBTime(data.product_b_time || 45);
      }
    };

    loadSettings();
  }, []);

  const saveSettings = async () => {
    setIsSaving(true);
    setMessage({ type: "", text: "" });

    try {
      const supabase = createClient();

      // Check if settings exist
      const { data: existingSettings } = await supabase
        .from("settings")
        .select("id")
        .single();

      if (existingSettings) {
        // Update existing settings
        const { error } = await supabase
          .from("settings")
          .update({
            product_a_name: productAName,
            product_b_name: productBName,
            product_a_time: productATime,
            product_b_time: productBTime,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingSettings.id);

        if (error) throw error;
      } else {
        // Create new settings
        const { error } = await supabase.from("settings").insert({
          product_a_name: productAName,
          product_b_name: productBName,
          product_a_time: productATime,
          product_b_time: productBTime,
          created_at: new Date().toISOString(),
        });

        if (error) throw error;
      }

      setMessage({
        type: "success",
        text: "Configurações salvas com sucesso!",
      });

      // Refresh the page to apply settings
      setTimeout(() => {
        router.refresh();
      }, 1500);
    } catch (error) {
      console.error("Error saving settings:", error);
      setMessage({
        type: "error",
        text: "Erro ao salvar configurações. Tente novamente.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardNavbar />

      <div className="container mx-auto py-12 px-4">
        <h1 className="text-3xl font-bold mb-8">Configurações</h1>

        <Card className="max-w-2xl mx-auto">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50">
            <CardTitle>Configurações de Produtos</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Product A Settings */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="productAName" className="font-medium">
                    Nome do Produto A
                  </Label>
                  <Input
                    id="productAName"
                    value={productAName}
                    onChange={(e) => setProductAName(e.target.value)}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="productATime" className="font-medium">
                    Tempo Padrão (minutos/unidade)
                  </Label>
                  <Input
                    id="productATime"
                    type="number"
                    min="1"
                    value={productATime}
                    onChange={(e) =>
                      setProductATime(parseInt(e.target.value) || 1)
                    }
                    className="mt-1"
                  />
                </div>
              </div>

              {/* Product B Settings */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="productBName" className="font-medium">
                    Nome do Produto B
                  </Label>
                  <Input
                    id="productBName"
                    value={productBName}
                    onChange={(e) => setProductBName(e.target.value)}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="productBTime" className="font-medium">
                    Tempo Padrão (minutos/unidade)
                  </Label>
                  <Input
                    id="productBTime"
                    type="number"
                    min="1"
                    value={productBTime}
                    onChange={(e) =>
                      setProductBTime(parseInt(e.target.value) || 1)
                    }
                    className="mt-1"
                  />
                </div>
              </div>
            </div>

            {message.text && (
              <div
                className={`mt-6 p-3 rounded-md ${message.type === "success" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
              >
                {message.text}
              </div>
            )}

            <div className="mt-6">
              <Button
                onClick={saveSettings}
                disabled={isSaving}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isSaving ? "Salvando..." : "Salvar Configurações"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Footer />
    </div>
  );
}
