import { useState } from "react";

type UseFormSubmitResult = {
  submit: () => Promise<void>;
  isSubmitting: boolean;
  error: string | null;
  clearError: () => void;
};

export function useFormSubmit(
  action: () => Promise<unknown>,
  onSuccess: () => void,
): UseFormSubmitResult {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      await action();
      onSuccess();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return { submit, isSubmitting, error, clearError: () => setError(null) };
}
