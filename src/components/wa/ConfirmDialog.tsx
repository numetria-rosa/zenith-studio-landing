"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { useState, useTransition, type ReactNode } from "react";
import { GlassButton, PrimaryButton } from "./ui";

/** Modal shell used for "Manage WhatsApp" and for destructive confirmations (Radix Dialog: focus trap, Esc to close). */
export function Modal({ trigger, title, description, children, open, onOpenChange, width = 560 }: { trigger?: ReactNode; title: string; description?: string; children: ReactNode; open?: boolean; onOpenChange?: (o: boolean) => void; width?: number }) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      {trigger && <Dialog.Trigger asChild>{trigger}</Dialog.Trigger>}
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-[rgba(5,6,10,.7)] backdrop-blur-[2px]" />
        <Dialog.Content
          style={{ width }}
          className="fixed left-1/2 top-1/2 z-50 max-h-[85vh] max-w-[calc(100vw-32px)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-[22px] border border-[rgba(255,255,255,.14)] bg-popover p-6 text-frost shadow-[0_24px_60px_rgba(0,0,0,.65)] outline-none"
        >
          <Dialog.Title className="m-0 text-[18px] font-semibold">{title}</Dialog.Title>
          {description && <Dialog.Description className="mb-0 mt-2 text-[14px] leading-[1.5] text-mist">{description}</Dialog.Description>}
          <div className="mt-5">{children}</div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

/** "Are you sure?" dialog. The confirm button runs `onConfirm` (typically a form submit or server action). */
export function ConfirmDialog({ trigger, title, description, confirmLabel, onConfirm, open, onOpenChange, pending }: { trigger?: ReactNode; title: string; description: string; confirmLabel: string; onConfirm: () => void; open?: boolean; onOpenChange?: (o: boolean) => void; pending?: boolean }) {
  return (
    <Modal trigger={trigger} title={title} description={description} open={open} onOpenChange={onOpenChange} width={440}>
      <div className="flex justify-end gap-[10px]">
        <Dialog.Close asChild>
          <GlassButton>Cancel</GlassButton>
        </Dialog.Close>
        <PrimaryButton onClick={onConfirm} disabled={pending} className="!bg-[#FF5C7A] !text-white !shadow-[0_0_24px_rgba(255,92,122,.25)]">
          {confirmLabel}
        </PrimaryButton>
      </div>
    </Modal>
  );
}

/** Confirm dialog wired to a server action: runs it on confirm and closes when it finishes. */
export function ConfirmAction({ action, trigger, title, description, confirmLabel }: { action: () => Promise<void>; trigger: ReactNode; title: string; description: string; confirmLabel: string }) {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  return (
    <ConfirmDialog
      open={open}
      onOpenChange={setOpen}
      trigger={trigger}
      title={title}
      description={description}
      confirmLabel={pending ? "Working..." : confirmLabel}
      pending={pending}
      onConfirm={() =>
        start(async () => {
          await action();
          setOpen(false);
        })
      }
    />
  );
}
