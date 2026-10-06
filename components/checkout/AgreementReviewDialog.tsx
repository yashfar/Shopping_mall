"use client";

import { useEffect, useRef } from "react";
import { Check, X } from "lucide-react";
import styles from "./AgreementReviewDialog.module.css";

interface AgreementReviewDialogProps {
  open: boolean;
  title: string;
  description: string;
  documentHtml: string;
  cancelLabel: string;
  acceptLabel: string;
  onOpenChange: (open: boolean) => void;
  onAccept: () => void;
}

export default function AgreementReviewDialog({
  open,
  title,
  description,
  documentHtml,
  cancelLabel,
  acceptLabel,
  onOpenChange,
  onAccept,
}: AgreementReviewDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      returnFocusRef.current =
        document.activeElement instanceof HTMLElement
          ? document.activeElement
          : null;
      dialog.showModal();
    }
    if (!open && dialog.open) dialog.close();
  }, [open]);

  useEffect(
    () => () => {
      returnFocusRef.current?.focus();
    },
    [],
  );

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="checkout-agreement-title"
      aria-describedby="checkout-agreement-description"
      data-checkout-agreement-dialog
      onClose={() => onOpenChange(false)}
      onCancel={(event) => {
        event.preventDefault();
        onOpenChange(false);
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onOpenChange(false);
      }}
      className={styles.dialog}
    >
      <div className={styles.shell}>
        <header className={styles.header}>
          <div className="min-w-0 flex-1">
            <h2 id="checkout-agreement-title" className={styles.title}>
              {title}
            </h2>
            <p
              id="checkout-agreement-description"
              className={styles.description}
            >
              {description}
            </p>
          </div>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            aria-label={cancelLabel}
            className={styles.closeButton}
          >
            <X aria-hidden="true" className="size-5" />
          </button>
        </header>

        <div className={styles.body}>
          <iframe
            title={title}
            srcDoc={documentHtml}
            sandbox=""
            className={styles.documentFrame}
          />
        </div>

        <footer className={styles.footer}>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className={styles.cancelButton}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onAccept}
            className={styles.acceptButton}
          >
            <Check aria-hidden="true" className="size-4" strokeWidth={2.4} />
            {acceptLabel}
          </button>
        </footer>
      </div>
    </dialog>
  );
}
