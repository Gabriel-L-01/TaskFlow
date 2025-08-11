"use client"

import { useState } from "react"
import { useToast } from "@/hooks/use-toast"
import {
  Toast,
  ToastClose,
  ToastCopy,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"


export function Toaster() {
  const { toasts } = useToast()
  const [copiedToastId, setCopiedToastId] = useState<string | null>(null);

  const handleCopy = (id: string, title?: React.ReactNode, description?: React.ReactNode) => {
    let textToCopy = '';
    if (title && typeof title === 'string') {
        textToCopy += title;
    }
    if (description && typeof description === 'string') {
        if (textToCopy) textToCopy += '\n';
        textToCopy += description;
    }
    if(navigator.clipboard) {
        navigator.clipboard.writeText(textToCopy).then(() => {
          setCopiedToastId(id);
          setTimeout(() => setCopiedToastId(null), 2000);
        });
    }
  }

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, ...props }) {
        return (
          <Toast key={id} {...props}>
            <div className="grid gap-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && (
                <ToastDescription>{description}</ToastDescription>
              )}
            </div>
            {action}
            <ToastCopy 
              isCopied={copiedToastId === id} 
              onClick={() => handleCopy(id, title, description)} 
            />
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
