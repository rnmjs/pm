// TODO: Remove this file once https://github.com/zkochan/packages/pull/227 is merged.
module "which-pm-runs" {
  export function whichPMRuns(): undefined | { name: string; version: string };
}
