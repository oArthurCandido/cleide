import Footer from "@/components/footer";
import Hero from "@/components/hero";
import Navbar from "@/components/navbar";
import DeadlineCalculator from "@/components/deadline-calculator";
import { ArrowUpRight, Calendar, Clock, Settings } from "lucide-react";
import { createClient } from "../../supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <Navbar />
      <Hero />

      {/* Calculator Section */}
      <section id="calculator" className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">
              Calculadora de Prazos de Produção
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Calcule facilmente os prazos de entrega para seus pedidos com base
              nas quantidades e tempos médios de produção.
            </p>
          </div>

          <DeadlineCalculator />
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Como Funciona</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Nossa calculadora de prazos considera diversos fatores para
              fornecer estimativas precisas.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: <Clock className="w-6 h-6" />,
                title: "Tempos de Produção",
                description:
                  "Configure os tempos médios de produção para cada tipo de produto",
              },
              {
                icon: <Settings className="w-6 h-6" />,
                title: "Capacidade Produtiva",
                description:
                  "Ajuste a capacidade diária de produção da sua empresa",
              },
              {
                icon: <Calendar className="w-6 h-6" />,
                title: "Datas Precisas",
                description:
                  "Obtenha datas de conclusão considerando apenas dias úteis",
              },
            ].map((feature, index) => (
              <div
                key={index}
                className="p-6 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="text-blue-600 mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-blue-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Otimize Sua Produção</h2>
          <p className="text-gray-100 mb-8 max-w-2xl mx-auto">
            Utilize nossa calculadora para planejar melhor sua produção e
            garantir prazos de entrega confiáveis para seus clientes.
          </p>
          <a
            href="#"
            className="inline-flex items-center px-6 py-3 text-blue-600 bg-white rounded-lg hover:bg-gray-100 transition-colors font-medium"
          >
            Saiba Mais
            <ArrowUpRight className="ml-2 w-4 h-4" />
          </a>
        </div>
      </section>

      <Footer />
    </div>
  );
}
