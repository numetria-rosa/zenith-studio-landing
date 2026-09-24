import os from "node:os";
import path from "node:path";
import { mkdirSync } from "node:fs";
import { generateVoiceoverLines } from "./_reel-voiceover.mjs";

export const VOICE = "en-US-AriaNeural";

export const LINES = [
  "This is Zenith AI. One team that never stops working for your business.",
  "Meet your AI employees. Built to answer, follow up, and book, so nothing falls through the cracks.",
  "Here's how it works. A message comes in, your AI agent reads it, decides what to do, and takes action automatically.",
  "The Inbox Manager sorts your email and drafts the replies, so your inbox is empty before you open it.",
  "The Lead Capture Agent follows up by text and email until they book, because the fastest reply wins the job.",
  "The Receptionist answers every call, books straight into your calendar, and never puts anyone on hold.",
  "For law firms and real estate brokerages, we bundle all three into one dedicated AI team.",
  "It all connects to what you already use. Gmail, Yahoo, Zoho, your calendar, your phone number. No new software to learn.",
  "Your AI team is ready when you are.",
];

export const VO_DIR = path.join(os.tmpdir(), "zenith-reel-vo-brand");

export function ensureVoiceoverLines() {
  mkdirSync(VO_DIR, { recursive: true });
  return generateVoiceoverLines(LINES, VOICE, VO_DIR);
}

if (process.argv[1]?.endsWith("_reel-brand-vo-lines.mjs")) {
  const clips = ensureVoiceoverLines();
  clips.forEach((c, i) => console.log(i, c.duration.toFixed(2) + "s", "-", c.text));
  console.log("Total:", clips.reduce((s, c) => s + c.duration, 0).toFixed(2) + "s");
}
