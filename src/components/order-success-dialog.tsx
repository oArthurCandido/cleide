"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CheckCircle2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export function OrderSuccessDialog() {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [orderId, setOrderId] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const success = searchParams.get("success");
    const newOrderId = searchParams.get("orderId");

    if (success && success.includes("Pedido criado com sucesso")) {
      setMessage(success);
      setOrderId(newOrderId);
      setOpen(true);

      // Clean up URL without refreshing the page
      const url = new URL(window.location.href);
      url.searchParams.delete("success");
      url.searchParams.delete("orderId");
      window.history.replaceState({}, "", url);
    }
  }, [searchParams]);

  const handleClose = () => {
    setOpen(false);
  };

  const viewOrder = () => {
    router.push("/dashboard/orders?tab=pending");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-center mb-4">
            <CheckCircle2 className="h-12 w-12 text-green-500" />
          </div>
          <DialogTitle className="text-center text-xl">
            Pedido Criado com Sucesso!
          </DialogTitle>
          <DialogDescription className="text-center">
            {message}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:justify-center mt-4">
          <Button variant="outline" onClick={handleClose}>
            Fechar
          </Button>
          <Button onClick={viewOrder} className="bg-blue-600 hover:bg-blue-700">
            Ver Meus Pedidos
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
