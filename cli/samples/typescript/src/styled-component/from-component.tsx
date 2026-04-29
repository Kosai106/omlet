import styled from "styled-components";

export function Sample() {
    return <div>Sample</div>;
}

export const StyledSample = styled(Sample)`
    background-color: red;
`;

export function Unknown() {
    return;
}

export const StyledUnknownComponent = styled(Unknown)`
    background-color: red;
`;

export default StyledSample;
