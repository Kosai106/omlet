import { styled } from "styled-components";

export function NamedImportSample() {
    return <div>Sample</div>;
}

const StyledNamedImportSample = styled(NamedImportSample)`
  background-color: red;
`;

export function NamedImportUnknown() {
    return;
}

export const StyledNamedImportUnknownComponent = styled(NamedImportUnknown)`
    background-color: red;
`;

export default StyledNamedImportSample;


