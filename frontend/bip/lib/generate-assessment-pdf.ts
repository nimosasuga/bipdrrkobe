'use client';

import { downloadAssessmentPdf as downloadAssessmentPdfCore } from './generate-assessment-pdf-core';
import type {
  AssessmentCause,
  AssessmentReportData as CoreAssessmentReportData,
} from './generate-assessment-pdf-core';

export type { AssessmentCause };

/**
 * Public report input for the BIP frontend.
 *
 * Charging duration remains an operational input, but charging/electricity is
 * intentionally excluded from the Rupiah cost model because it is not a stable,
 * directly comparable internal cost across customer sites.
 *
 * `chargingCostPerUnitMonth` is kept only as a deprecated compatibility field so
 * older callers still compile; any value is ignored before the PDF is generated.
 */
export type AssessmentReportData = Omit<CoreAssessmentReportData, 'chargingCostPerUnitMonth'> & {
  /** @deprecated Charging is operational context, not a Rupiah cost component. */
  chargingCostPerUnitMonth?: number;
};

export function downloadAssessmentPdf(data: AssessmentReportData) {
  const safeData: CoreAssessmentReportData = {
    ...data,
    chargingCostPerUnitMonth: 0,
  };

  return downloadAssessmentPdfCore(safeData);
}
