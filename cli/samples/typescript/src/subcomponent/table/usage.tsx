import TTable from "./default";

const TableUser = () => {
    return (
        <TTable>
            <TTable.Header>
                <TTable.Header.Cell className="asd">
                    Header Cell
                </TTable.Header.Cell>
            </TTable.Header>
            <TTable.Cell>
                Cell
            </TTable.Cell>
        </TTable>
    );
};

export default TableUser;