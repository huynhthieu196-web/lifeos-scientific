/**
 * Centralized toast notification utility for Life OS.
 *
 * Wraps `sonner` with semantic helpers so every user action
 * gets consistent, accessible feedback.
 *
 * Usage:
 *   import { notify } from "@/lib/toast";
 *   notify.success("Entry saved");
 *   notify.error("Failed to save");
 *   notify.warning("Draft not saved");
 *   notify.info("Auto-save in 5 s");
 */

import { toast } from "sonner";
import { uiText } from "@/lib/ui-copy";

const DEFAULT_DURATION = 4000;

export const notify = {
  /** Green success toast */
  success: (message: string, description?: string) =>
    toast.success(uiText(message), {
      description: description ? uiText(description) : undefined,
      duration: DEFAULT_DURATION,
    }),

  /** Red error toast */
  error: (message: string, description?: string) =>
    toast.error(uiText(message), {
      description: description ? uiText(description) : undefined,
      duration: DEFAULT_DURATION + 2000, // errors stay longer
    }),

  /** Amber warning toast */
  warning: (message: string, description?: string) =>
    toast.warning(uiText(message), {
      description: description ? uiText(description) : undefined,
      duration: DEFAULT_DURATION,
    }),

  /** Blue info toast */
  info: (message: string, description?: string) =>
    toast.info(uiText(message), {
      description: description ? uiText(description) : undefined,
      duration: DEFAULT_DURATION,
    }),

  /** Promise-based toast that shows loading -> success/error */
  promise: <T>(
    promise: Promise<T>,
    opts: { loading: string; success: string; error: string },
  ) =>
    toast.promise(promise, {
      loading: uiText(opts.loading),
      success: uiText(opts.success),
      error: uiText(opts.error),
    }),

  /** Dismiss a specific or all toasts */
  dismiss: (id?: string | number) => toast.dismiss(id),
};

export { toast };
