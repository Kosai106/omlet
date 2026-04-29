import { createContext } from "react";

const defaultElement = "div";

export const Card = ({
    className,
    bordered = true,
    rounded = false,
    background = true,
    padded = true,
    as,
    elementType,
    ...rest
}) => {
    const Element: ElementType = as || defaultElement;
    const AnotherElement = elementType || "img";
    return (
        <>
            <AnotherElement />
            <Element
                className={clsx(
                    padded && "p-4",
                    className,
                    rounded && "rounded",
                    bordered && "border",
                    background && "bg-weak"
                )}
                {...rest}
            />
        </>
    );
};

const EmptyStringContext = createContext("");
const NonEmptyStringContext = createContext("context with string");

export const Button = () => {
    return (
        <EmptyStringContext.Provider>
            <NonEmptyStringContext.Provider>
                {value => <button>{value}</button>}
            </NonEmptyStringContext.Provider>
        </EmptyStringContext.Provider>
    );
};
