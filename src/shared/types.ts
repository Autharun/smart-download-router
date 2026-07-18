export type RuleMatchType = 'domain' | 'wildcard' | 'urlContains';

export type DownloadRule = {
  id: string;
  name: string;
  enabled: boolean;
  domainPattern: string;
  folderPath: string;
  matchType: RuleMatchType;
  createdAt: string;
  updatedAt: string;
};

export type RuleDraft = {
  name: string;
  enabled: boolean;
  domainPattern: string;
  folderPath: string;
  matchType: RuleMatchType;
};

export type UrlCandidate = {
  sourceUrl: string;
  hostname: string;
};

export type RouteMatch = {
  rule: DownloadRule;
  sourceUrl: string;
  hostname: string;
  score: number;
};

export type RecentRoute = {
  id: string;
  ruleId: string;
  ruleName: string;
  sourceUrl: string;
  originalFilename: string;
  routedFilename: string;
  routedAt: string;
};
