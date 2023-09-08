export interface CensureListFilters {
  instances: string[];
  includeEndorsed: boolean;
  includeGuaranteed: boolean;
  recursive: boolean;
  onlyMatching: boolean;
  matchingReasons: string[];
}
