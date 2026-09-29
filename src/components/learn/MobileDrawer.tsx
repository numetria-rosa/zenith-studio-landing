"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { Icon } from "@/components/obsidian/Icon";
import { SidebarContent, type SidebarUser } from "./SidebarContent";

/** Below 1024px the sidebar lives in a drawer behind a menu button. */
export function MobileDrawer(props: { currentModule: number; percent: number; user: SidebarUser }) {
  return (
    <Dialog.Root>
      <Dialog.Trigger
        aria-label="Open course menu"
        className="glass flex h-11 w-11 items-center justify-center rounded-full text-frost focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan"
      >
        <Icon name="menu" size={20} />
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/60" />
        <Dialog.Content className="fixed inset-y-0 left-0 z-50 flex w-[280px] max-w-[85vw] flex-col gap-[26px] overflow-y-auto border-r border-white/[0.08] bg-[#0A0B10] px-[18px] py-[26px] font-sans text-frost [line-height:normal]">
          <Dialog.Title className="sr-only">Course menu</Dialog.Title>
          <Dialog.Description className="sr-only">Navigate the AI Engineering course</Dialog.Description>
          <Dialog.Close
            aria-label="Close course menu"
            className="absolute right-3 top-3 flex h-11 w-11 items-center justify-center rounded-full text-mist focus-visible:outline-2 focus-visible:outline-cyan"
          >
            <Icon name="close" size={18} />
          </Dialog.Close>
          <SidebarContent {...props} />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
