import { ComponentWithDefaultProps } from "./defaultProp";
import { ReExportedComponent } from "./reExport";
import DefaultExportComponent from "./defaultExport";
import DefaultExportArrowComponent from "./defaultExportArrow";

const DEFAULT_VARIABLE = 1;
const MY_DEFAULT_ARRAY = [];
const shorthand = 321;
const MY_DEFAULT_OBJECT = { foo: "bar" };
const MY_DEFAULT_KEY = "dasa";
enum MyEnum {
    Value1,
    Value2
}

export function ParentComponent() {
    const bar = 1;
    const props = {};
    return (
        <>
            <ComponentWithDefaultProps
                variable={bar}
                number={1}
                string={"foo"}
                reactNode={<span>foo</span>}
                jsxFragment={<>foo</>}
                nullable={null}
                undefinedValue={undefined}
                boolean={false}
                regex={/foo/i}
                myObject={{
                    key: "key",
                    1: "1",
                    "string": "string",
                    ["index"]: "index",
                    [MY_DEFAULT_KEY]: "MY_DEFAULT_KEY",
                    shorthand,
                    get getter() {
                        return ""
                    },
                    set setter(value) {},
                    myFunction() {},
                    ...MY_DEFAULT_OBJECT,
                }}
                myField={MY_DEFAULT_OBJECT.foo}
                myComputedField={MY_DEFAULT_OBJECT["foo"]}
                myArrayField={MY_DEFAULT_ARRAY[1]}
                myEnum={MyEnum.Value2}
                myArray={[]}
                arrowProp={() => {}}
                myOptionalChain={MY_DEFAULT_OBJECT?.foo}
                myThisValue={this.foo}
                mySuperValue={super.foo}
                myTemplateLiteral={`hello world`}
                myExpression={MY_DEFAULT_ARRAY ? 1 : 0}>
                children
            </ComponentWithDefaultProps>
            <ComponentWithDefaultProps string="bar" boolean />
            <ComponentWithDefaultProps {...{ string: "hello" }} />
            <ComponentWithDefaultProps {...props} />
            <ReExportedComponent string="re-export" />
            <DefaultExportComponent prop="foo" />
            <DefaultExportArrowComponent prop="arrow" />
        </>
    );
}

function LocalComponent() {
    return <DefaultExportComponent prop="indirect-usage" />;
}

export function IndirectParent() {
    return (
        <>
            <DefaultExportComponent prop="direct-usage" />
            <LocalComponent />
        </>
    )
}
