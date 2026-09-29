-- Tracks which path connected a WhatsApp number, so the Embedded Signup
-- weekly cap (10 new business customers per rolling 7 days, per Meta's
-- own limit) only counts agencies onboarded that way.
CREATE TYPE "WaConnectMethod" AS ENUM ('MANUAL', 'EMBEDDED_SIGNUP');
ALTER TABLE "WaWhatsAppAccount" ADD COLUMN "connectMethod" "WaConnectMethod" NOT NULL DEFAULT 'MANUAL';
