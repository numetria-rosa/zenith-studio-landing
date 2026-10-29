"use client";

import { useRef } from "react";
import { ChecklistPicker, type PickerOption } from "./ChecklistPicker";
import c from "./chaser.module.css";

/* "Change checklist" on a client's card: the same picker as step 1, applied as soon as a list is chosen. */
export function ChangeChecklist({ clientId, clientName, current, options, act }: { clientId: string; clientName: string; current: string; options: PickerOption[]; act: (op: string, fd: FormData) => Promise<void> }) {
  const form = useRef<HTMLFormElement>(null);
  const chosen = useRef<HTMLInputElement>(null);
  const match = options.find((o) => o.name === current);

  return (
    <form ref={form} action={act.bind(null, "change-checklist")} className={c.toolForm}>
      <input type="hidden" name="id" value={clientId} />
      <input ref={chosen} type="hidden" name="checklist" />
      <ChecklistPicker
        compact
        label={`${clientName}'s checklist`}
        options={options}
        value={match?.key ?? ""}
        onChange={(key) => {
          if (key === match?.key) return;
          chosen.current!.value = key;
          form.current!.requestSubmit();
        }}
        current={{ title: match ? (match.title ?? match.name) : current, sub: match?.sub, group: match?.group, badge: "Change" }}
      />
    </form>
  );
}
