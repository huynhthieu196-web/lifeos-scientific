/**
 * Scientific Personal Advisor — conservative evidence eligibility checks.
 *
 * This library deliberately does NOT generate recommendations or infer causality.
 * It only checks that evidence has recorded provenance, verification and
 * an applicability assessment before any future UI may display an advice card.
 */
export type EvidenceCertainty = "high" | "moderate" | "low" | "very_low" | "not_assessed";

export interface ScientificEvidence {
  id: string;
  title: string;
  sourceUrl: string;
  publicationYear: number;
  authorsOrOrganization: string;
  studyType: string;
  population: string;
  limitations: string;
  certainty: EvidenceCertainty;
  reviewedAt: string; // ISO 8601
  verified: boolean;
  doi?: string | null;
}

export interface PersonalObservation {
  metricName: string;
  metricValue: number;
  unit: string;
  observedFrom: string; // ISO 8601
  observedTo: string;   // ISO 8601
  coverageRatio: number; // 0..1
  calculationMethod: string;
}

export type AdviceReadiness =
  | { eligible: true; evidence: ScientificEvidence; observation: PersonalObservation }
  | { eligible: false; reasons: string[] };

function isRealDate(value: string): boolean {
  return typeof value === "string" && value.trim().length > 0 &&
    Number.isFinite(Date.parse(value));
}

function isHttpsUrl(value: string): boolean {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

/** This is a minimum data-integrity check, not an external source verification. */
export function assessAdviceReadiness(
  evidence: ScientificEvidence,
  observation: PersonalObservation,
  applicabilityReviewed: boolean,
): AdviceReadiness {
  const reasons: string[] = [];
  if (!evidence.verified) reasons.push("Nguồn khoa học chưa được xác minh.");
  if (!evidence.id.trim() || !evidence.title.trim() ||
      !evidence.authorsOrOrganization.trim() || !evidence.studyType.trim() ||
      !evidence.population.trim() || !evidence.limitations.trim()) {
    reasons.push("Thiếu thông tin về công trình, đối tượng hoặc giới hạn nghiên cứu.");
  }
  if (!isHttpsUrl(evidence.sourceUrl)) reasons.push("Nguồn phải có liên kết HTTPS hợp lệ.");
  if (!Number.isInteger(evidence.publicationYear) ||
      evidence.publicationYear < 1800 ||
      evidence.publicationYear > new Date().getUTCFullYear()) {
    reasons.push("Năm công bố không hợp lệ.");
  }
  if (!isRealDate(evidence.reviewedAt)) reasons.push("Thiếu ngày thẩm định nguồn.");
  if (evidence.certainty === "not_assessed") reasons.push("Độ chắc chắn bằng chứng chưa được đánh giá.");
  if (!applicabilityReviewed) reasons.push("Chưa đánh giá khả năng áp dụng cho người dùng.");

  if (!observation.metricName.trim() || !observation.unit.trim() ||
      !observation.calculationMethod.trim() || !Number.isFinite(observation.metricValue)) {
    reasons.push("Dữ liệu đo lường hoặc công thức tính chưa đầy đủ.");
  }
  if (!Number.isFinite(observation.coverageRatio) ||
      observation.coverageRatio < 0 || observation.coverageRatio > 1) {
    reasons.push("Tỷ lệ bao phủ dữ liệu phải nằm trong khoảng 0–1.");
  }
  if (!isRealDate(observation.observedFrom) || !isRealDate(observation.observedTo) ||
      Date.parse(observation.observedFrom) > Date.parse(observation.observedTo)) {
    reasons.push("Khoảng thời gian quan sát không hợp lệ.");
  }
  if (observation.coverageRatio === 0) reasons.push("Không có dữ liệu quan sát.");

  return reasons.length ? { eligible: false, reasons } :
    { eligible: true, evidence, observation };
}

export const INSUFFICIENT_EVIDENCE_MESSAGE =
  "Chưa đủ bằng chứng khoa học hoặc dữ liệu cá nhân để đưa ra khuyến nghị đáng tin cậy.";
