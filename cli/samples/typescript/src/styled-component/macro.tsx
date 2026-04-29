import styled from "styled-components/macro";

export function SampleMacro() {
    return <div>Sample</div>;
}

export const StyledSampleMacro = styled(SampleMacro)`
  background-color: red;
`;
