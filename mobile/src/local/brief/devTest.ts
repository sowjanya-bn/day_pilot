import { getDailyBriefLocal } from "./getDailyBriefLocal.ts";
import { mockRepository } from "../storage/mockRepository.ts";

async function run() {
  const brief = await getDailyBriefLocal("2026-04-03", mockRepository);
  console.log("=== DAILY BRIEF ===");
  console.log(JSON.stringify(brief, null, 2));
}

run();