import { WTable }  from "./wildcard";

const TableUser2 = () => {
    return (
        <WTable.TTable>
            <WTable.TTable.Header>
                <WTable.TTable.Header.Cell>
                    Header Cell
                </WTable.TTable.Header.Cell>
            </WTable.TTable.Header>
            <WTable.TTable.Cell>
                Cell
            </WTable.TTable.Cell>
        </WTable.TTable>
    );
};

export default TableUser2;