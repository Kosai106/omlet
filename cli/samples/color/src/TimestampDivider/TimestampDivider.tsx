import { Divider } from "Divider";
import { SubDivider } from "Divider/SubDivider";
export const SimpleDividerComponent = () => {
    return (
        <div>
            <h1>Title</h1>
        <Divider />
        <SubDivider/>
        <p>Some content below the divider.</p>
    </div>
);
};