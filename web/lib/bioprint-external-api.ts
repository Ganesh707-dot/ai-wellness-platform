/**
 * Free public APIs — no API key required.
 * - ClinicalTrials.gov v2: https://clinicaltrials.gov/data-api/about-api
 * - PubMed E-utilities: https://www.ncbi.nlm.nih.gov/home/develop/api/
 */

const CT_BASE = "https://clinicaltrials.gov/api/v2/studies";
const PUBMED_SEARCH = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi";

export type LiveTrial = {
  nctId: string;
  title: string;
  status: string;
  organization: string;
  url: string;
};

export type BioprintLiveData = {
  fetchedAt: string;
  sources: {
    clinicalTrialsGov: string;
    pubMed: string;
  };
  stats: {
    bioprintTrials: number;
    recruitingTrials: number;
    pubMedArticles: number;
    tissueEngineeringTrials: number;
  };
  recentTrials: LiveTrial[];
  live: boolean;
  error?: string;
};

type CtStudy = {
  protocolSection?: {
    identificationModule?: {
      nctId?: string;
      briefTitle?: string;
      organization?: { fullName?: string };
    };
    statusModule?: {
      overallStatus?: string;
      lastKnownStatus?: string;
    };
  };
};

type CtResponse = {
  totalCount?: number;
  studies?: CtStudy[];
};

type PubMedResponse = {
  esearchresult?: { count?: string };
};

async function fetchClinicalTrials(query: string, pageSize = 8): Promise<CtResponse> {
  const url = new URL(CT_BASE);
  url.searchParams.set("query.term", query);
  url.searchParams.set("pageSize", String(pageSize));
  url.searchParams.set("countTotal", "true");
  url.searchParams.set("format", "json");

  const res = await fetch(url.toString(), {
    next: { revalidate: 3600 },
    headers: { Accept: "application/json" },
  });
  if (!res.ok) throw new Error(`ClinicalTrials.gov ${res.status}`);
  return res.json() as Promise<CtResponse>;
}

async function fetchPubMedCount(term: string): Promise<number> {
  const url = new URL(PUBMED_SEARCH);
  url.searchParams.set("db", "pubmed");
  url.searchParams.set("term", term);
  url.searchParams.set("retmode", "json");
  url.searchParams.set("retmax", "0");

  const res = await fetch(url.toString(), {
    next: { revalidate: 3600 },
    headers: { Accept: "application/json" },
  });
  if (!res.ok) throw new Error(`PubMed ${res.status}`);
  const data = (await res.json()) as PubMedResponse;
  return parseInt(data.esearchresult?.count ?? "0", 10);
}

function mapTrial(study: CtStudy): LiveTrial | null {
  const id = study.protocolSection?.identificationModule;
  const status = study.protocolSection?.statusModule;
  const nctId = id?.nctId;
  if (!nctId) return null;
  return {
    nctId,
    title: id?.briefTitle ?? "Untitled trial",
    status: status?.overallStatus ?? status?.lastKnownStatus ?? "UNKNOWN",
    organization: id?.organization?.fullName ?? "Unknown org",
    url: `https://clinicaltrials.gov/study/${nctId}`,
  };
}

export async function fetchBioprintLiveData(): Promise<BioprintLiveData> {
  const fetchedAt = new Date().toISOString();

  try {
    const [bioprintCt, tissueCt, pubMedCount] = await Promise.all([
      fetchClinicalTrials("bioprinting OR 3D bioprinting OR bioink"),
      fetchClinicalTrials("regenerative medicine tissue engineering"),
      fetchPubMedCount("bioprinting AND regenerative medicine"),
    ]);

    const recentTrials = (bioprintCt.studies ?? [])
      .map(mapTrial)
      .filter((t): t is LiveTrial => t !== null);

    const recruitingTrials = recentTrials.filter(
      (t) =>
        t.status === "RECRUITING" ||
        t.status === "ACTIVE_NOT_RECRUITING" ||
        t.status === "ENROLLING_BY_INVITATION"
    ).length;

    return {
      fetchedAt,
      sources: {
        clinicalTrialsGov: "https://clinicaltrials.gov",
        pubMed: "https://pubmed.ncbi.nlm.nih.gov",
      },
      stats: {
        bioprintTrials: bioprintCt.totalCount ?? recentTrials.length,
        recruitingTrials,
        pubMedArticles: pubMedCount,
        tissueEngineeringTrials: tissueCt.totalCount ?? 0,
      },
      recentTrials,
      live: true,
    };
  } catch (e) {
    const message = e instanceof Error ? e.message : "External API unavailable";
    return {
      fetchedAt,
      sources: {
        clinicalTrialsGov: "https://clinicaltrials.gov",
        pubMed: "https://pubmed.ncbi.nlm.nih.gov",
      },
      stats: {
        bioprintTrials: 0,
        recruitingTrials: 0,
        pubMedArticles: 0,
        tissueEngineeringTrials: 0,
      },
      recentTrials: [],
      live: false,
      error: message,
    };
  }
}
