import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import ChargerDiagnosisScopeGuard from '../../../components/charger-diagnosis-scope-guard';
import FinancialContextSync from '../../../components/financial-context-sync';
import FinancialUiCopyGuard from '../../../components/financial-ui-copy-guard';
import LithiumScenarioGuard from '../../../components/lithium-scenario-guard';
import PdfConsultantPositioning from '../../../components/pdf-consultant-positioning';
import PdfStabilityLock from '../../../components/pdf-stability-lock';
import PdfV3Branding from '../../../components/pdf-v3-branding';
import SevenStepExperienceGuard from '../../../components/seven-step-experience-guard';
import StableStep8Guard from '../../../components/stable-step8-guard';
import StepValidationGuard from '../../../components/step-validation-guard';

export const metadata: Metadata = {
  title: 'Assessment Battery Forklift',
  description: 'Cek kondisi battery forklift atau baterai forklift Lead Acid berdasarkan umur battery, pola shift, charging, maintenance, downtime, dan gejala yang dilaporkan. Hasil membantu menentukan area pemeriksaan berikutnya.',
  alternates: {
    canonical: 'https://bip.drrkobe.com/diagnosis/form',
  },
  openGraph: {
    title: 'Assessment Battery Forklift | DRRKOBE BIP',
    description: 'Masukkan kondisi battery forklift Anda dan baca skor kondisi, indikasi penyebab, serta langkah pemeriksaan yang perlu diverifikasi.',
    url: 'https://bip.drrkobe.com/diagnosis/form',
    type: 'website',
    locale: 'id_ID',
  },
};

export default function DiagnosisFormLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <StepValidationGuard />
      <ChargerDiagnosisScopeGuard />
      <StableStep8Guard />
      <FinancialContextSync />
      <FinancialUiCopyGuard />
      <LithiumScenarioGuard />
      <SevenStepExperienceGuard />
      <PdfV3Branding />
      <PdfConsultantPositioning />
      <PdfStabilityLock />
      {children}
    </>
  );
}
