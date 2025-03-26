import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import DeadlineCalculator from "@/components/deadline-calculator";

export default function CalculatorPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <Navbar />

      <div className="py-16 container mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">
            Calculadora de Prazos de Produção
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Calcule facilmente os prazos de entrega para seus pedidos com base
            nas quantidades e tempos médios de produção.
          </p>
        </div>

        <DeadlineCalculator />

        <div className="mt-16 max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold mb-4">
            Como Utilizar a Calculadora
          </h2>
          <ol className="list-decimal pl-6 space-y-4 text-gray-700">
            <li>
              <strong>Insira as quantidades:</strong> Informe a quantidade de
              unidades para o Produto A e Produto B que você precisa produzir.
            </li>
            <li>
              <strong>Configure os tempos de produção (opcional):</strong> Se
              necessário, ajuste os tempos médios de produção para cada tipo de
              produto nas configurações avançadas.
            </li>
            <li>
              <strong>Defina a capacidade produtiva (opcional):</strong> Ajuste
              a capacidade produtiva diária da sua empresa nas configurações
              avançadas.
            </li>
            <li>
              <strong>Calcule o prazo:</strong> Clique no botão "Calcular Prazo
              de Entrega" para obter o resultado.
            </li>
            <li>
              <strong>Analise o resultado:</strong> Verifique o número total de
              dias necessários e a data prevista de conclusão da produção.
            </li>
          </ol>
        </div>
      </div>

      <Footer />
    </div>
  );
}
