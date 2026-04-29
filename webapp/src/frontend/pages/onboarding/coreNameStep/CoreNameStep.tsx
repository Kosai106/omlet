import { TruncateFromMiddle } from "../../../common/truncate/TruncateFromMiddle";
import { Button } from "../../../library/Button/Button";
import { TextInput } from "../../../library/TextInput/TextInput";
import { DEFAULT_CORE_TAG_NAME, DEFAULT_DESIGN_SYSTEM_NAME } from "../constants";
import { DesignSystemUsageExample } from "../designSystemUsageExample/DesignSystemUsageExample";
import { OnboardingStep } from "../onboardingStep/OnboardingStep";
import { OnboardingStepCard } from "../onboardingStepCard/OnboardingStepCard";

import onboardingStepClasses from "../onboardingStep/OnboardingStep.module.css";

interface Props {
    coreTagName: string | null;
    onChange(value: string): void;
    onContinueClick(): void;
}

export function CoreNameStep({
    coreTagName,
    onChange,
    onContinueClick,
}: Props) {
    const designSystemName = coreTagName?.trim() || DEFAULT_DESIGN_SYSTEM_NAME;

    return (
        <OnboardingStep
            stepCards={
                <>
                    <OnboardingStepCard
                        title="What should we call your design system?"
                        active={true}>
                        <p>
                            Omlet uses this name to reference your design system in the charts
                            <br/>
                            — try to keep it short.
                        </p>
                        <TextInput value={coreTagName ?? DEFAULT_CORE_TAG_NAME} placeholder={DEFAULT_CORE_TAG_NAME} maxLength={20} onChange={onChange} autoSelect/>
                        <p className={onboardingStepClasses.caption}>
                            Don’t have a name yet? Teams usually go with “Core”, “Library” or “UI Kit”.
                        </p>
                        <Button onClick={onContinueClick} disabled={coreTagName?.trim() === ""}>Continue</Button>
                    </OnboardingStepCard>
                    <OnboardingStepCard title={<>Where are your <TruncateFromMiddle text={designSystemName} width={150}/> components located?</>}/>
                    <OnboardingStepCard title={<>Need to tag more components? <span className={onboardingStepClasses.headerSubText}>(Optional)</span></>}/>
                </>
            }
            stepContent={
                <DesignSystemUsageExample designSystemName={designSystemName}/>
            }/>
    );
}
