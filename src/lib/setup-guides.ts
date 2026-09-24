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
    id: "make-generic",
    label: "Most CRMs (HubSpot, Zoho, AgencyZoom, monday.com, etc.) — free option",
    intro:
      "Make.com's Custom Webhook works on their free plan (1,000 operations/month, no card needed) - use this unless you already pay for Zapier, since Zapier's webhook trigger needs their $49/mo Professional plan.",
    steps: [
      "Create a free account at make.com.",
      'Click "Create a new scenario", then click the big "+" and search for "Webhooks".',
      'Choose "Custom webhook" as the trigger, then click "Add" and give it any name.',
      'Make shows you a webhook URL - click "Copy address to clipboard".',
      "Paste that URL into the Webhook URL field on this page.",
      'Add a second module: search for your CRM by name (HubSpot, Zoho, AgencyZoom, monday.com, and most others are listed) and choose "Create Lead" or "Create Contact" as the action.',
      "Map the incoming fields (name, phone, email, notes) to your CRM's fields, then turn the scenario on (the toggle in the top left).",
    ],
    linkLabel: "Make's Custom Webhook documentation",
    linkUrl: "https://www.make.com/en/help/tools/webhooks",
  },
  {
    id: "ezlynx",
    label: "EZLynx",
    intro:
      'EZLynx has a native Zapier app for this. One real cost to know upfront: receiving a webhook in Zapier needs their $49/mo Professional plan (their free/Starter plans don\'t include the "Webhooks by Zapier" trigger) - there\'s no free workaround for EZLynx specifically.',
    steps: [
      "You'll need an EZLynx Sales Center license (most agencies already have this) and a Zapier account on at least their Professional plan.",
      'In Zapier, click "+ Create Zap" in the top left.',
      'For the trigger, search for and choose "Webhooks by Zapier", then choose "Catch Hook" as the event and click Continue.',
      "Zapier shows you a webhook URL - copy it.",
      "Paste that URL into the Webhook URL field on this page, then come back to Zapier and click \"Test trigger\" to confirm it received something.",
      'For the action step, search for and choose "EZLynx", then map the incoming fields to EZLynx\'s prospect/lead fields.',
      "Publish the Zap.",
    ],
    linkLabel: "EZLynx Zapier integration guide",
    linkUrl: "https://ezlynxsupport.freshdesk.com/support/solutions/articles/8000085587-zapier-integration",
  },
  {
    id: "hawksoft",
    label: "HawkSoft",
    intro: "HawkSoft doesn't have a self-serve Zapier or Make connection - it goes through their Partner API program instead, which takes a bit more setup than the others.",
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
    id: "zapier-alt",
    label: "I already use Zapier for other things",
    intro: 'If you\'re already on a paid Zapier plan, you can use "Webhooks by Zapier" the same way as the free Make.com option above - just in Zapier instead.',
    steps: [
      'In Zapier, click "+ Create Zap" in the top left.',
      'For the trigger, search for and choose "Webhooks by Zapier", then choose "Catch Hook" as the event and click Continue.',
      "Zapier shows you a webhook URL - copy it.",
      "Paste that URL into the Webhook URL field on this page, then click \"Test trigger\" in Zapier to confirm it received something.",
      "For the action step, search for your CRM by name and map the incoming fields to your CRM's lead/contact fields, then publish the Zap.",
    ],
    linkLabel: "Zapier's Webhooks trigger",
    linkUrl: "https://help.zapier.com/hc/en-us/articles/8496083355661-How-to-get-started-with-Webhooks-by-Zapier",
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
