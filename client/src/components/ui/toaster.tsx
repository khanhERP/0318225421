import { useToast } from "@/hooks/use-toast"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"
import { useTranslation } from "@/lib/i18n"

export function Toaster() {
  const { toasts } = useToast()
  const { t } = useTranslation()

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, ...props }) {
        // Handle translation for title
        const translatedTitle = title 
          ? (typeof title === 'string' && title.includes('.') ? t(title as any) : title)
          : null;

        // Handle translation for description with better error formatting
        let translatedDescription = description;
        if (description) {
          if (typeof description === 'string') {
            if (description.includes('.')) {
              translatedDescription = t(description as any);
            }
            // Handle "Failed to create product" errors with more context
            if (description.includes('Failed to create product')) {
              translatedDescription = 'Không thể tạo sản phẩm. Vui lòng kiểm tra lại thông tin và thử lại.';
            }
          }
        }

        return (
          <Toast key={id} {...props}>
            <div className="grid gap-2">
              {translatedTitle && (
                <ToastTitle className="text-sm font-semibold">
                  {translatedTitle}
                </ToastTitle>
              )}
              {translatedDescription && (
                <ToastDescription className="text-sm opacity-90 mt-1">
                  {translatedDescription}
                </ToastDescription>
              )}
            </div>
            {action}
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
