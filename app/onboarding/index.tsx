import { useOnboarding } from "@/store/onboarding";
import { Step1Account } from "@/screens/onboarding/Step1Account";
import { Step2Space } from "@/screens/onboarding/Step2Space";
import { Step3Menu } from "@/screens/onboarding/Step3Menu";
import { Step4Platforms } from "@/screens/onboarding/Step4Platforms";
import { Step5Staff } from "@/screens/onboarding/Step5Staff";

export default function OnboardingRouter() {
  const step = useOnboarding((s) => s.step);
  switch (step) {
    case 0:
      return <Step1Account />;
    case 1:
      return <Step2Space />;
    case 2:
      return <Step3Menu />;
    case 3:
      return <Step4Platforms />;
    default:
      return <Step5Staff />;
  }
}
