import { createContext } from "react";

interface Context {
    totalNumberOfComponents: number;
    totalNumberOfUsages: number;
}

export const OnboardingContext = createContext<Context>({
    totalNumberOfComponents: 0,
    totalNumberOfUsages: 0,
});
