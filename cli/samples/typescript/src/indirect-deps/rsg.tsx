// Adapted from https://github.com/styleguidist/react-styleguidist/blob/4c55077d534fd62c3a5fe4ba7ca042c2157eb6c1/src/client/rsg-components/Methods/MethodsRenderer.tsx

import Markdown from "rsg-components/Markdown";
import Argument from "rsg-components/Argument";
import Arguments from "rsg-components/Arguments";
import Name from "rsg-components/Name";
import JsDoc from "rsg-components/JsDoc";
import Table from "rsg-components/Table";

export const columns = [
    {
        caption: "Method name",
        render: ({ name, tags = {} }) => (
            <Name deprecated={!!tags.deprecated}>{`${name}()`}</Name>
        ),
    },
    {
        caption: "Parameters",
        render: ({ params = [] }) => <Arguments args={params} />,
    },
    {
        caption: "Description",
        render: ({ description, returns, tags = {} }) => (
            <div>
                {description && <Markdown text={description} />}
                {returns && <Argument block returns {...returns} />}
                <JsDoc {...tags} />
            </div>
        ),
    },
];

export const MethodsRenderer = () => (
    <Table columns={columns} />
);
