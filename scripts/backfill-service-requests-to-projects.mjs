// Slice 8 of the service-platform build (2026-08-28): backfills the 3
// generic AI Systems services' historical ServiceRequest rows into
// ServiceProject rows, so old customers eventually get the same delivery
// workspace (milestones, requirements, portal) that new purchases and
// proposal-driven projects already get via Slice 6/7.
//
// Deliberately last per SERVICE_PLATFORM_ARCHITECTURE.md §9: only run once
// Slices 6-7 are proven live. This is its own isolated, reviewed migration,
// not bundled with any feature slice.
//
// What it does NOT do:
//   - Does not touch, modify, or delete ServiceRequest rows in any way.
//     ServiceRequest stays exactly as-is, forever, per the architecture
//     doc's explicit instruction not to retire/alter it in this build.
//   - Does not migrate "law-firms"/"brokerages" ServiceRequest rows — those
//     two vertical offers already get a live ServiceProject via the
//     webhook's own Slice 6 branch (src/app/api/webhooks/whop/route.ts).
//     Any ServiceRequest row with serviceId "law-firms" or "brokerages"
//     (e.g. stale/historical data from before Slice 0 fixed fulfillment) is
//     skipped here to avoid creating a duplicate ServiceProject.
//
// Idempotent / safe to re-run: for each remaining ServiceRequest, checks
// for an existing ServiceProject on (userId, sourceServiceId) — mirroring
// the findFirst-then-create pattern the webhook's Slice 6 branch uses,
// since ServiceProject has no @@unique constraint to upsert against — and
// skips creation if one already exists. Running this script twice on the
// same data creates zero new rows the second time.
//
// Imports getService/createServiceProjectWithDefaults directly from the
// TypeScript source (rather than duplicating the milestone/requirement
// content the way scripts/seed-service-catalog.mjs duplicates SERVICES) so
// there is exactly one canonical copy of that content, per the slice brief.
// Requires --experimental-strip-types (Node 22.6+) to import .ts files
// directly from a plain .mjs script.
//
// Usage:
//   node --experimental-strip-types --env-file=.env scripts/backfill-service-requests-to-projects.mjs

import { PrismaClient } from "@prisma/client";
import { getService } from "../src/lib/services.ts";
import { createServiceProjectWithDefaults } from "../src/lib/service-projects.ts";

const db = new PrismaClient();

const VERTICAL_OFFER_IDS = new Set(["law-firms", "brokerages"]);

// ServiceRequest.status is a free string (new | scoping | building | live |
// maintenance). Five of those map directly onto ProjectStage. Anything that
// doesn't match one of these five is logged and defaulted to NEW rather
// than guessed at.
const STATUS_TO_STAGE = {
  new: "NEW",
  scoping: "SCOPING",
  building: "BUILDING",
  live: "LIVE",
  maintenance: "MAINTENANCE",
};

function mapStatusToStage(status, requestId) {
  const stage = STATUS_TO_STAGE[status];
  if (stage) return stage;
  console.log(
    `  [WARN] ServiceRequest ${requestId} has unrecognized status "${status}" — defaulting stage to NEW.`
  );
  return "NEW";
}

async function main() {
  const requests = await db.serviceRequest.findMany({
    orderBy: { createdAt: "asc" },
  });

  let processed = 0;
  let skippedVertical = 0;
  let skippedExisting = 0;
  let created = 0;

  for (const req of requests) {
    processed++;

    if (VERTICAL_OFFER_IDS.has(req.serviceId)) {
      skippedVertical++;
      console.log(
        `SKIP (vertical offer): ServiceRequest ${req.id} — serviceId "${req.serviceId}" is fulfilled via the webhook's own ServiceProject path, not this backfill.`
      );
      continue;
    }

    const existingProject = await db.serviceProject.findFirst({
      where: { userId: req.userId, sourceServiceId: req.serviceId },
    });

    if (existingProject) {
      skippedExisting++;
      console.log(
        `SKIP (already migrated): ServiceRequest ${req.id} (user ${req.userId}, service "${req.serviceId}") already has ServiceProject ${existingProject.id}.`
      );
      continue;
    }

    const catalogEntry = getService(req.serviceId);
    const stage = mapStatusToStage(req.status, req.id);

    await db.$transaction(async (tx) => {
      const project = await createServiceProjectWithDefaults(tx, {
        userId: req.userId,
        title: catalogEntry?.title ?? req.serviceId,
        sourceServiceId: req.serviceId,
        whopMonthlyMembershipId: req.whopMonthlyMembershipId ?? null,
      });

      // createServiceProjectWithDefaults always creates at stage NEW with no
      // adminNote (that's correct for its two live triggers, which are
      // always fresh purchases). This backfill needs both set from the
      // source ServiceRequest, so patch them in the same transaction.
      await tx.serviceProject.update({
        where: { id: project.id },
        data: {
          stage,
          adminNote: req.adminNote ?? null,
        },
      });
    });

    created++;
    console.log(
      `CREATED: ServiceProject for ServiceRequest ${req.id} (user ${req.userId}, service "${req.serviceId}", status "${req.status}" -> stage ${stage}).`
    );
  }

  console.log("\n--- Backfill summary ---");
  console.log(`ServiceRequest rows processed: ${processed}`);
  console.log(`Skipped (vertical offer, handled by webhook): ${skippedVertical}`);
  console.log(`Skipped (ServiceProject already exists): ${skippedExisting}`);
  console.log(`ServiceProject rows created: ${created}`);
}

main().finally(() => db.$disconnect());
