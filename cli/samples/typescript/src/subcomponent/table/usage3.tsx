import { TTable } from "./named";

const TableUser3 = () => {
    return (
        <TTable>
            <TTable.Header>
                <TTable.Header.Cell>
                    Header Cell
                </TTable.Header.Cell>
            </TTable.Header>
            <TTable.Cell>
                Cell
            </TTable.Cell>
        </TTable>
    );
};

export default TableUser3;