export type BioprintApplication = {
  id: string;
  name: string;
  tissue: string;
  bioink: string;
  layers: number;
  viabilityTarget: number;
  useCase: string;
  clinicalPath: string;
};

export type PipelineStage = {
  id: string;
  label: string;
  short: string;
  detail: string;
  duration: string;
};

export const BIOPRINT_APPLICATIONS: BioprintApplication[] = [
  {
    id: "skin",
    name: "Dermal scaffold",
    tissue: "Epidermal + dermal matrix",
    bioink: "Collagen I · Keratinocytes · Fibroblasts",
    layers: 24,
    viabilityTarget: 96,
    useCase: "Regenerative medicine",
    clinicalPath: "Burn recovery · chronic wound closure",
  },
  {
    id: "cartilage",
    name: "Cartilage construct",
    tissue: "Hyaline cartilage patch",
    bioink: "Gelatin methacryloyl · Chondrocytes",
    layers: 32,
    viabilityTarget: 94,
    useCase: "Joint restoration",
    clinicalPath: "Osteoarthritis · sports injury repair",
  },
  {
    id: "organ-chip",
    name: "Organ-on-a-chip",
    tissue: "Microfluidic liver model",
    bioink: "Alginate · Hepatocyte spheroids",
    layers: 18,
    viabilityTarget: 92,
    useCase: "Drug testing",
    clinicalPath: "Pharma screening · toxicity profiling",
  },
  {
    id: "cardiac",
    name: "Cardiac patch",
    tissue: "Patient-derived cardiomyocytes",
    bioink: "Decellularized ECM · iPSC-cardiomyocytes",
    layers: 28,
    viabilityTarget: 95,
    useCase: "Personalized care",
    clinicalPath: "Post-MI recovery · precision graft planning",
  },
  {
    id: "brain",
    name: "Neural construct",
    tissue: "Cortical organoid · neural tissue",
    bioink: "Matrigel · iPSC-neural progenitors",
    layers: 22,
    viabilityTarget: 93,
    useCase: "Neuro research",
    clinicalPath: "Stroke recovery · neurodegeneration models",
  },
  {
    id: "kidney",
    name: "Renal scaffold",
    tissue: "Nephron tubule · kidney organoid",
    bioink: "GelMA · Kidney organoids",
    layers: 26,
    viabilityTarget: 91,
    useCase: "Organ replacement research",
    clinicalPath: "CKD modeling · transplant scaffold prep",
  },
];

export const BIOPRINT_PIPELINE: PipelineStage[] = [
  {
    id: "harvest",
    label: "Cell harvest & QC",
    short: "Harvest",
    detail:
      "Autologous or iPSC-derived cells expanded under GMP-like conditions. Viability, sterility, and karyotype checks before formulation.",
    duration: "Day 0–7",
  },
  {
    id: "formulation",
    label: "Bioink formulation",
    short: "Formulate",
    detail:
      "Cell-rich hydrogels tuned for rheology, crosslinking, and print resolution. Temperature and shear stress kept within viability bands.",
    duration: "Day 7–8",
  },
  {
    id: "deposition",
    label: "Layer deposition",
    short: "Print",
    detail:
      "Extrusion or inkjet deposition builds 3D scaffolds layer by layer. Real-time nozzle tracking, flow rate, and layer height telemetry.",
    duration: "Day 8–9",
  },
  {
    id: "maturation",
    label: "Bioreactor maturation",
    short: "Mature",
    detail:
      "Constructs perfused in bioreactors until mechanical strength and marker expression meet release criteria for study or graft.",
    duration: "Day 9–21",
  },
  {
    id: "clinical",
    label: "Clinical pathway",
    short: "Care",
    detail:
      "Eligibility screening, regenerative-care referral, and longitudinal recovery coaching — routed through AI intake and clinician encounter.",
    duration: "Day 21+",
  },
];

export const BIOPRINT_ENTERPRISE_STATS = {
  activeTrials: 47,
  constructsPrinted: 10_284,
  clinicalRecords: 10_000,
  avgViability: 94.6,
  partnerLabs: 12,
  regulatoryPathways: ["FDA RMAT", "EMA ATMP", "CDSCO cell therapy"],
};
