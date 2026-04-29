import { fs, vol } from "memfs";

import { type AnalyzeResult } from "../analyzer";

import analysisJson from "./__fixtures__/analyzeResult.json";
import { CliHookError, HookComponent, HookContext, init } from "./hook";

jest.mock("fs/promises", () => {
    return fs.promises;
});

jest.mock("fs", () => {
    return fs;
});

const DUMMY_HOOK_SCRIPT = {
    afterScan() {
        // nop
    },
};

const mockHookModule = (hookPath: string, content: unknown) => {
    vol.writeFileSync(hookPath, "");

    jest.mock(hookPath, () => {
        return content;
    }, { virtual: true });
};

const analysisData = analysisJson as AnalyzeResult;

describe("hook", () => {
    describe("init", () => {
        beforeEach(() => {
            vol.reset();
            jest.resetAllMocks();
        });

        it("should load hook script on a given path", async () => {
            const hookPath = "/path-to-hook.js";
            mockHookModule(hookPath, DUMMY_HOOK_SCRIPT);

            const context = await init(hookPath, analysisData);

            expect(context).toBeInstanceOf(HookContext);
        });

        it("should throw error when hook script does not exist", async () => {
            const hookPath = "/path-to-hook.js";
            mockHookModule(hookPath, DUMMY_HOOK_SCRIPT);

            await expect(init("/non-existing-hook.js", analysisData)).rejects.toThrow(
                CliHookError
            );
        });
    });

    describe("HookComponent", () => {
        it("should create read-only component from analysis data", () => {
            const context = new HookContext(analysisData, DUMMY_HOOK_SCRIPT);
            const sourceComponent = analysisData.components.find(c => c.dependencies.length > 0)!;
            const component = new HookComponent(context, sourceComponent);

            expect(component.id).toEqual(sourceComponent.id);
            expect(component.name).toEqual(sourceComponent.name);
            expect(component.packageName).toEqual(sourceComponent.source.source.package_name);
            expect(component.filePath).toEqual(sourceComponent.source.source.path);
            expect(component.createdAt).toEqual(sourceComponent.created_at);
            expect(component.updatedAt).toEqual(sourceComponent.updated_at);
        });

        it("should have same html_elements as the source component", () => {
            const context = new HookContext(analysisData, DUMMY_HOOK_SCRIPT);
            const sourceComponent = analysisData.components.find(c => c.html_elements.length > 0)!;
            const component = new HookComponent(context, sourceComponent);

            expect(component.id).toEqual(sourceComponent.id);
            expect(new Set(component.htmlElementsUsed)).toEqual(new Set(sourceComponent.html_elements));
        });

        it("should have same props as the source component", () => {
            const context = new HookContext(analysisData, DUMMY_HOOK_SCRIPT);
            const sourceComponent = analysisData.components.find(c => c.props.length > 0)!;
            const component = new HookComponent(context, sourceComponent);

            expect(component.id).toEqual(sourceComponent.id);
            expect(component.props).toEqual(expect.arrayContaining(sourceComponent.props));
        });

        it("should have same dependencies as the source component", () => {
            const context = new HookContext(analysisData, DUMMY_HOOK_SCRIPT);
            const sourceComponent = analysisData.components.find(c => c.dependencies.length > 0)!;
            const component = new HookComponent(context, sourceComponent);

            expect(component.id).toEqual(sourceComponent.id);
            expect(new Set(component.children.map(d => d.id))).toEqual(new Set(sourceComponent.dependencies.map(d => d.to.id)));
        });
    });

    describe("HookContext", () => {
        it("should create hook components from analysis data", () => {
            const context = new HookContext(analysisData, DUMMY_HOOK_SCRIPT);

            expect(new Set(context.components.map(c => c.id))).toEqual(new Set(analysisData.components.map(c => c.id)));
        });

        describe("getComponent", () => {
            it("should return component by id", () => {
                const context = new HookContext(analysisData, DUMMY_HOOK_SCRIPT);

                for (const component of context.components) {
                    expect(context.getComponent(component.id)).toEqual(component);
                }
            });

            it("should return null if component does not exist", () => {
                const context = new HookContext(analysisData, DUMMY_HOOK_SCRIPT);

                expect(context.getComponent("non-existing-id")).toBeNull();
            });
        });

        describe("findParentComponents", () => {
            it("should find reverse dependencies", () => {
                const context = new HookContext(analysisData, DUMMY_HOOK_SCRIPT);

                const expectedReverseDeps: Record<string, string[]> = {};
                for (const component of analysisData.components) {
                    for (const dep of component.dependencies) {
                        if (!expectedReverseDeps[dep.to.id]) {
                            expectedReverseDeps[dep.to.id] = [];
                        }

                        expectedReverseDeps[dep.to.id].push(component.id);
                    }
                }

                for (const component of context.components) {
                    expect(new Set(context.findParentComponents(component.id).map(c => c.id))).toEqual(new Set(expectedReverseDeps[component.id]));
                }
            });

        });

        describe("setComponentMetadata", () => {
            it("should set metadata for a component", () => {
                const context = new HookContext(analysisData, DUMMY_HOOK_SCRIPT);

                const component = context.components[0];
                context.setComponentMetadata(component.id, "test", "value");

                expect(context.getComponentMetadata(component.id)).toEqual({ test: "value" });
            });

            it("should throw error for invalid metadata value type", () => {
                const context = new HookContext(analysisData, DUMMY_HOOK_SCRIPT);

                const component = context.components[0];
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore
                expect(() => context.setComponentMetadata(component.id, "test", { invalid: "value" })).toThrow(CliHookError);
            });
        });

        describe("afterScan", () => {
            it("should call afterScan function from hook script", async () => {
                const hookPath = "/path-to-hook.js";
                mockHookModule(hookPath, DUMMY_HOOK_SCRIPT);

                const afterScanMock = jest.fn();
                const context = new HookContext(analysisData, {
                    afterScan: afterScanMock,
                });

                await context.afterScan();

                expect(afterScanMock).toBeCalledWith(context.components);
            });

            it("should handle and rethrow errors from afterScan hook function", async () => {
                const hookPath = "/path-to-hook.js";
                mockHookModule(hookPath, DUMMY_HOOK_SCRIPT);

                const context = new HookContext(analysisData, {
                    afterScan: () => {
                        throw new Error("test error");
                    },
                });

                await expect(context.afterScan()).rejects.toThrow(CliHookError);
            });

            it("should throw error when components array is tried to be modified", async () => {
                const context = new HookContext(analysisData, {
                    afterScan: (components) => {
                        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                        // @ts-ignore
                        // eslint-disable-next-line @typescript-eslint/no-unsafe-call
                        components.push({
                            id: "component-id",
                        });
                    },
                });

                await expect(context.afterScan()).rejects.toThrow(CliHookError);
            });

            it("should throw error when a component from components array is tried to be modified", async () => {
                const context = new HookContext(analysisData, {
                    afterScan: (components) => {
                        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                        // @ts-ignore
                        // eslint-disable-next-line @typescript-eslint/no-unsafe-call
                        components[0].customProperty = "value";
                    },
                });

                await expect(context.afterScan()).rejects.toThrow(CliHookError);
            });
        });
    });
});
