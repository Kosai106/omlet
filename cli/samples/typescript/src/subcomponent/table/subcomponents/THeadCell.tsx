import { ReactNode } from "react";


const THeadCell = ({ children, className }: { children: ReactNode[]; className?: string; }) => {
    return (
        <th className={className}>
            {children}
        </th>
    );
};

export default THeadCell;