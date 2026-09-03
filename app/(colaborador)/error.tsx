"use client";

import { useEffect } from "react";
import { ErrorState } from "@/components/ui/error-state";

export default function CollaboratorError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <ErrorState
      title="Não foi possível carregar esta página"
      description="Tente novamente em instantes. Se o problema persistir, contate o suporte."
      onRetry={reset}
    />
  );
}
