import { ReactNode } from "react";


const TCell = ({ children }: { children: ReactNode; }) => {
    return (
        <td>
            {children}
        </td>
    );
};

export default TCell;