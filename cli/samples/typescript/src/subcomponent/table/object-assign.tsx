import { ReactNode } from "react";
import TCell from "./subcomponents/TCell";
import THeadCell from "./subcomponents/THeadCell";


const TTableObject = ({ children }: { children: ReactNode; }) => {
    return (
        <table>
            {children}
        </table>
    );
};

const THeader = ({ children }: { children: ReactNode; }) => {
    return (
        <thead>
            {children}
        </thead>
    );
};


Object.assign(TTableObject, {
    THeader,
    Cell: TCell,
    Header: {
        Cell: THeadCell,
    }
});

export default TTableObject;