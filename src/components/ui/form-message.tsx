import { AlertCircle, CheckCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "./alert";

type FormMessageProps = {
  type: "success" | "error" | "info";
  title?: string;
  message: string;
};

export function FormMessage({ type, title, message }: FormMessageProps) {
  if (!message) return null;

  const icons = {
    success: <CheckCircle className="h-4 w-4" />,
    error: <AlertCircle className="h-4 w-4" />,
    info: <AlertCircle className="h-4 w-4" />,
  };

  const variants = {
    success: "success",
    error: "destructive",
    info: "default",
  };

  const defaultTitles = {
    success: "Sucesso",
    error: "Erro",
    info: "Informação",
  };

  return (
    <Alert variant={variants[type] as "success" | "destructive" | "default"}>
      <div className="flex items-start gap-2">
        {icons[type]}
        <div>
          <AlertTitle>{title || defaultTitles[type]}</AlertTitle>
          <AlertDescription>{message}</AlertDescription>
        </div>
      </div>
    </Alert>
  );
}
