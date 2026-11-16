import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { assessAdviceReadiness, type ScientificEvidence, type PersonalObservation } from "./evidence";

const evidence: ScientificEvidence = {
  id: "reviewed-evidence-1", title: "Verified study metadata example",
  authorsOrOrganization: "Reviewer-verified source", publicationYear: 2020,
  studyType: "systematic review", sourceUrl: "https://example.org/study",
  population: "Adults", limitations: "Applicability varies",
  certainty: "moderate", reviewedAt: "2026-11-16", verified: true,
};
const observation: PersonalObservation = {
  metricName: "Logged activity", metricValue: 45, unit: "min",
  observedFrom: "2026-11-01", observedTo: "2026-11-07",
  coverageRatio: 0.8, calculationMethod: "Sum of primary session minutes",
};

describe("evidence eligibility gate (not actual research verification)", () => {
  it("rejects unverified citations", () => {
    const result = assessAdviceReadiness({ ...evidence, verified: false }, observation, true);
    assert.equal(result.eligible, false);
  });
  it("rejects unassessed certainty and applicability", () => {
    const result = assessAdviceReadiness({ ...evidence, certainty: "not_assessed" }, observation, false);
    assert.equal(result.eligible, false);
    if (!result.eligible) assert.equal(result.reasons.length, 2);
  });
  it("rejects invalid or missing observations", () => {
    assert.equal(assessAdviceReadiness(evidence, { ...observation, coverageRatio: 0 }, true).eligible, false);
    assert.equal(assessAdviceReadiness(evidence, { ...observation, observedFrom: "2026-12-01" }, true).eligible, false);
  });
  it("accepts structurally complete inputs without claiming scientific validity", () => {
    assert.equal(assessAdviceReadiness(evidence, observation, true).eligible, true);
  });
});
