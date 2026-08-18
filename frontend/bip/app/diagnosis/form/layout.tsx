import type { ReactNode } from 'react';
import StepValidationGuard from '../../../components/step-validation-guard';

export default function DiagnosisFormLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <StepValidationGuard />
      {children}
    </>
  );
}
