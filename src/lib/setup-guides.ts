/* Step-by-step guides for anything in the dashboard that's confusing or
   too technical for a client to figure out alone - a generic, reusable
   pattern (not a one-off for CRM setup) so future self-serve steps can
   plug in the same way instead of each inventing its own help text.
   Content sourced from real research on how these platforms actually
   work (EZLynx's own Zapier docs, HawkSoft's Partner API program) -
   never guessed, since a wrong step here wastes a client's time more
   than no guide at all. */

export type SetupGuide = {
  id: string;
  label: string; // shown in the picker
  intro: string;
  steps: string[];
  linkLabel?: string;
  linkUrl?: string;
};

export const CRM_SETUP_GUIDES: SetupGuide[] = [
  {
    id: "ezlynx",
    label: "EZLynx",
    intro: "EZLynx has a built-in Zapier connection - this is the fastest option if you use EZLynx.",
    steps: [
      "You'll need an EZLynx Sales Center license (most agencies already have this).",
      "In Zapier, create a new Zap and search for the \"EZLynx\" app as the action.",
      "Choose the trigger \"Webhooks by Zapier\" → \"Catch Hook\" as the first step - Zapier will give you a webhook URL.",
      "Copy that URL and paste it into the Webhook URL field on this page.",
      "In the Zap's second step, map the incoming fields to EZLynx's prospect/lead fields, then publish the Zap.",
    ],
    linkLabel: "EZLynx Zapier integration guide",
    linkUrl: "https://ezlynxsupport.freshdesk.com/support/solutions/articles/8000085587-zapier-integration",
  },
  {
    id: "hawksoft",
    label: "HawkSoft",
    intro: "HawkSoft doesn't have a self-serve Zapier connection - it goes through their Partner API program instead, which takes a bit more setup than the others.",
    steps: [
      "Contact HawkSoft's partner program (via hawksoft.com) and request Partner API access for lead intake.",
      "HawkSoft will issue your agency an Agency Account ID once approved.",
      "Ask HawkSoft's partner team for the lead-intake endpoint and required field format for your account.",
      "Once you have that, come back here and paste your endpoint URL in the Webhook URL field. If HawkSoft requires specific field names, add those in the optional field-format box below.",
    ],
    linkLabel: "HawkSoft partner integrations",
    linkUrl: "https://www.hawksoft.com/about/partners/",
  },
  {
    id: "zapier-generic",
    label: "Something else (AgencyZoom, Zoho, HubSpot, monday.com, etc.)",
    intro: "Most other CRMs connect through Zapier's own \"Webhooks by Zapier\" trigger - the same pattern, just pointed at your CRM's Zapier app instead of EZLynx's.",
    steps: [
      "Log in to Zapier (or create a free account at zapier.com).",
      "Create a new Zap. For the trigger, search for and choose \"Webhooks by Zapier\" → \"Catch Hook\".",
      "Zapier generates a unique webhook URL for you - copy it.",
      "Paste that URL into the Webhook URL field on this page.",
      "For the Zap's action step, search for your CRM by name (most are listed) and map the incoming fields to your CRM's lead/contact fields.",
      "Publish the Zap. From then on, every lead we send gets routed straight into your CRM.",
    ],
    linkLabel: "Zapier's Webhooks trigger",
    linkUrl: "https://zapier.com/apps/webhook/integrations",
  },
];

export const GOOGLE_SHEETS_SHARE_GUIDE: SetupGuide = {
  id: "google-sheets-share",
  label: "How do I share my Google Sheet?",
  intro: "We read your sheet directly from its link, so it needs to be shared for viewing (not editing) by anyone with the link - no Google login required on our end.",
  steps: [
    'Open your Google Sheet, click the "Share" button in the top right.',
    'Under "General access", change it from "Restricted" to "Anyone with the link".',
    'Make sure the permission next to it is set to "Viewer" (not Editor).',
    "Click \"Copy link\", then paste that link into the Google Sheets field on this page.",
  ],
};
