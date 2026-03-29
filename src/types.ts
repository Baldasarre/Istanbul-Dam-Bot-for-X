export interface ReservoirItem {
  name: string;
  occupancyPercent: number;
}

export interface IskiSnapshot {
  fetchedAtIso: string;
  sourceUrl: string;
  generalOccupancyPercent: number;
  lastYearSameDayPercent?: number;
  reservoirs: ReservoirItem[];
  rawTextSample?: string;
}

export interface StoredState {
  lastSuccessfulPost?: {
    textHash: string;
    snapshot: IskiSnapshot;
    postedAtIso: string;
  };
  latestFetchedSnapshot?: IskiSnapshot;
}
