import { useOnboarding } from "@/store/onboarding";
import { Step1Account } from "@/screens/onboarding/Step1Account";
import { Step2Tables } from "@/screens/onboarding/Step2Tables";
import { Step3Kitchen } from "@/screens/onboarding/Step3Kitchen";
import { Step4Menu } from "@/screens/onboarding/Step4Menu";
import { Step5Platforms } from "@/screens/onboarding/Step5Platforms";
import { Step6Staff } from "@/screens/onboarding/Step6Staff";

export default function OnboardingRouter() {
  const step = useOnboarding((s) => s.step);
  switch (step) {
    case 0:
      return <Step1Account />;
    case 1:
      return <Step2Tables />;
    case 2:
      return <Step3Kitchen />;
    case 3:
      return <Step4Menu />;
    case 4:
      return <Step5Platforms />;
    default:
      return <Step6Staff />;
  }
}
