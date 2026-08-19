import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import LithiumScenarioGuard from '../../../components/lithium-scenario-guard';
import PdfV3Branding from '../../../components/pdf-v3-branding';
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
      <StableStep8Guard />
      <LithiumScenarioGuard />
      <PdfV3Branding />
      {children}
    </>
  );
}
