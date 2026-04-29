import { ReactNode } from "react";
import TCell from "./subcomponents/TCell";
import THeadCell from "./subcomponents/THeadCell";


const TTable = ({ children }: { children: ReactNode; }) => {
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

TTable.Cell = TCell;
TTable.Header = THeader;
TTable.Header.Cell = THeadCell;

export default TTable;