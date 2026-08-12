import { NextResponse } from "next/server";
import { fetchBioprintLiveData } from "@/lib/bioprint-external-api";
import { BIOPRINT_APPLICATIONS, BIOPRINT_PIPELINE } from "@/lib/bioprint-data";

/**
 * GET /api/innovation/live-data
 * Aggregates FREE public APIs:
 * - ClinicalTrials.gov (bioprinting trials)
 * - PubMed (research article count)
 * Plus local application profiles and pipeline config.
 */
export async function GET() {
  const live = await fetchBioprintLiveData();

  return NextResponse.json({
    ...live,
    applications: BIOPRINT_APPLICATIONS,
    pipeline: BIOPRINT_PIPELINE,
    apiVersion: "aw-innovation-v1",
  });
}
