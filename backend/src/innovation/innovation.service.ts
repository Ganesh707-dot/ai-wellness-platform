import { Injectable } from '@nestjs/common';

const CT_BASE = 'https://clinicaltrials.gov/api/v2/studies';
const PUBMED_SEARCH = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi';

export type LiveTrial = {
  nctId: string;
  title: string;
  status: string;
  organization: string;
  url: string;
};

export type BioprintLiveData = {
  fetchedAt: string;
  sources: { clinicalTrialsGov: string; pubMed: string };
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

@Injectable()
export class InnovationService {
  async getLiveBioprintData(): Promise<BioprintLiveData> {
    const fetchedAt = new Date().toISOString();
    const sources = {
      clinicalTrialsGov: CT_BASE,
      pubMed: PUBMED_SEARCH,
    };

    try {
      const [bioprint, recruiting, tissue, pubMedCount] = await Promise.all([
        this.fetchClinicalTrials('bioprint OR bioprinting', 8),
        this.fetchClinicalTrials('bioprint recruiting', 4),
        this.fetchClinicalTrials('tissue engineering 3D printing', 4),
        this.fetchPubMedCount('bioprinting tissue engineering'),
      ]);

      const recentTrials = this.mapTrials(bioprint.studies ?? []);

      return {
        fetchedAt,
        sources,
        stats: {
          bioprintTrials: bioprint.totalCount ?? recentTrials.length,
          recruitingTrials: recruiting.totalCount ?? 0,
          pubMedArticles: pubMedCount,
          tissueEngineeringTrials: tissue.totalCount ?? 0,
        },
        recentTrials,
        live: true,
      };
    } catch (error) {
      return {
        fetchedAt,
        sources,
        stats: {
          bioprintTrials: 0,
          recruitingTrials: 0,
          pubMedArticles: 0,
          tissueEngineeringTrials: 0,
        },
        recentTrials: [],
        live: false,
        error: error instanceof Error ? error.message : 'Failed to fetch live research data',
      };
    }
  }

  private mapTrials(studies: Array<Record<string, unknown>>): LiveTrial[] {
    return studies
      .map((study) => {
        const protocol = study.protocolSection as Record<string, unknown> | undefined;
        const id = protocol?.identificationModule as Record<string, unknown> | undefined;
        const status = protocol?.statusModule as Record<string, unknown> | undefined;
        const org = id?.organization as Record<string, unknown> | undefined;
        const nctId = String(id?.nctId ?? '');
        if (!nctId) return null;
        return {
          nctId,
          title: String(id?.briefTitle ?? 'Untitled trial'),
          status: String(status?.overallStatus ?? status?.lastKnownStatus ?? 'Unknown'),
          organization: String(org?.fullName ?? 'Unknown'),
          url: `https://clinicaltrials.gov/study/${nctId}`,
        };
      })
      .filter((t): t is LiveTrial => t !== null);
  }

  private async fetchClinicalTrials(query: string, pageSize = 8) {
    const url = new URL(CT_BASE);
    url.searchParams.set('query.term', query);
    url.searchParams.set('pageSize', String(pageSize));
    url.searchParams.set('countTotal', 'true');
    url.searchParams.set('format', 'json');

    const res = await fetch(url.toString(), {
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) throw new Error(`ClinicalTrials.gov ${res.status}`);
    return res.json() as Promise<{ totalCount?: number; studies?: Array<Record<string, unknown>> }>;
  }

  private async fetchPubMedCount(term: string): Promise<number> {
    const url = new URL(PUBMED_SEARCH);
    url.searchParams.set('db', 'pubmed');
    url.searchParams.set('term', term);
    url.searchParams.set('retmode', 'json');
    url.searchParams.set('retmax', '0');

    const res = await fetch(url.toString());
    if (!res.ok) throw new Error(`PubMed ${res.status}`);
    const data = (await res.json()) as { esearchresult?: { count?: string } };
    return Number(data.esearchresult?.count ?? 0);
  }
}
