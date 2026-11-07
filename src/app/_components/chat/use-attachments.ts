"use client";

import { useCallback, useState } from "react";
import { announceStatus } from "@/components/status-store";
import { attachmentHelp, classifyAttachment } from "@/lib/attachments";

export interface PendingPdf {
  name: string;
  data: string;
}

export interface AttachmentsApi {
  image: string | null;
  pdf: PendingPdf | null;
  error: string | null;
  attach: (file: File | undefined) => void;
  removeImage: () => void;
  removePdf: () => void;
  clear: () => void;
}

export function useAttachments(): AttachmentsApi {
  const [image, setImage] = useState<string | null>(null);
  const [pdf, setPdf] = useState<PendingPdf | null>(null);
  const [error, setError] = useState<string | null>(null);

  const attach = useCallback((file: File | undefined) => {
    if (!file) {
      return;
    }
    const kind = classifyAttachment(file.type, file.size);
    if (!kind) {
      setError(attachmentHelp);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : null;
      setError(null);
      if (kind === "pdf") {
        setImage(null);
        setPdf(result ? { name: file.name, data: result } : null);
        announceStatus("PDF attached");
      } else {
        setPdf(null);
        setImage(result);
        announceStatus("Image attached");
      }
    };
    reader.readAsDataURL(file);
  }, []);

  const clear = useCallback(() => {
    setImage(null);
    setPdf(null);
  }, []);

  return { image, pdf, error, attach, removeImage: () => setImage(null), removePdf: () => setPdf(null), clear };
}
