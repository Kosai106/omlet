
import joi from "joi";

import { type AnalysisResult } from "../../cliDataModels/AnalysisResult";
import { PropValueType } from "../../cliDataModels/PropValueType";
import { AnalysisSubject } from "../../common/models/AnalysisSubject";
import { AnalysisType } from "../../common/models/AnalysisType";
import { BreakdownType } from "../../common/models/BreakdownType";
import { DataFrequencyOption } from "../../common/models/DataFrequencyOption";
import { FilterDataType } from "../../common/models/FilterDataType";
import { FilterOperation, dateFilterOperations, equalityFilterOperations, numberFilterOperations, stringFilterOperations } from "../../common/models/FilterOperation";
import { FilterType } from "../../common/models/FilterType";
import { TimeWindowOption } from "../../common/models/TimeWindowOption";

const moduleIdSchema = joi.object({
    hash: joi.string(),
    path: joi.string().allow(""),
    mtype: joi.string().valid("local", "package"),
}).unknown(true);

const symbolWithSourceSchema = joi.object({
    source: moduleIdSchema,
    symbol: joi.string(),
});

const dependencyEdgeSchema = symbolWithSourceSchema.keys({
    id: joi.string(),
    name: joi.string(),
});

const characterPositionSchema = joi.object({
    line: joi.number(),
    column: joi.number(),
});

const propValueSchema = joi.alternatives().try(
    joi.object({
        type: joi.string().valid(PropValueType.String, PropValueType.Identifier),
        value: joi.string().allow(""),
    }),
    joi.object({
        type: joi.string().valid(PropValueType.Number),
        value: joi.number(),
    }),
    joi.object({
        type: joi.string().valid(PropValueType.Bool),
        value: joi.boolean(),
    }),
    joi.object({
        type: joi.string().valid(PropValueType.Regex),
        value: joi.string(),
        flags: joi.string().allow(""),
    }),
    joi.object({
        type: joi.string().valid(PropValueType.Array),
        values: joi.array().items(joi.link("#propValue")),
    }),
    joi.object({
        type: joi.string().valid(PropValueType.Spread),
        value: joi.link("#propValue"),
    }),
    joi.object({
        type: joi.string().valid(PropValueType.Member),
        value: joi.link("#propValue"),
        property: joi.link("#propValue"),
    }),
    joi.object({
        type: joi.string().valid(PropValueType.Object),
        props: joi.array().items(
            joi.alternatives().try(
                joi.object({
                    type: joi.string().valid(PropValueType.Spread),
                    value: joi.link("#propValue"),
                }),
                joi.object({
                    type: joi.string().valid(PropValueType.Shorthand),
                    key: joi.string(),
                }),
                joi.object({
                    type: joi.string().valid(PropValueType.KeyValue),
                    key: joi.string().allow(""),
                    value: joi.link("#propValue"),
                }),
            )
        ).optional(),
    }),
    joi.object({
        type: joi.string().valid(
            PropValueType.JSXElement,
            PropValueType.Function,
            PropValueType.Getter,
            PropValueType.Setter,
            PropValueType.Null,
            PropValueType.This,
            PropValueType.Super,
            PropValueType.TemplateLiteral,
            PropValueType.Expression,
        ),
    })
).id("propValue");

const componentPropUsageSchema = joi.object({
    name: joi.string().allow(""),
    value: propValueSchema,
});

const componentUsageSchema = joi.object({
    start: characterPositionSchema,
    end: characterPositionSchema,
    props: joi.array().items(componentPropUsageSchema),
});

const componentDependencyReferenceSchema = joi.object({
    trace: joi.array().items(symbolWithSourceSchema),
    usages: joi.array().items(componentUsageSchema),
});

const componentDependencySchema = joi.object({
    from: dependencyEdgeSchema,
    to: dependencyEdgeSchema,
    references: joi.array().items(componentDependencyReferenceSchema),
});

const componentPropSchema = joi.object({
    name: joi.string(),
    default_value: propValueSchema.optional(),
    span: joi.object({
        start: characterPositionSchema,
        end: characterPositionSchema,
    }).optional(),
});

export const cliAnalysisDataSchema = joi.object<AnalysisResult>({
    components: joi.array().items(
        joi.object({
            id: joi.string(),
            name: joi.string(),
            export_ids: joi.array().items(joi.string()),
            created_at: joi.date().allow(null).optional(),
            updated_at: joi.date().allow(null).optional(),
            source: symbolWithSourceSchema,
            package_name: joi.string(),
            declaration: joi.any().allow(null).optional(),
            dependencies: joi.array().items(componentDependencySchema),
            reverse_dependencies: joi.any().optional(),
            props: joi.array().items(componentPropSchema).optional(),
            span: joi.object({
                start: characterPositionSchema,
                end: characterPositionSchema,
            }).optional(),
            html_elements: joi.array().items(joi.string()).optional(),
            html_element_usages: joi.array().items(joi.object({
                tag: joi.string(),
                count: joi.number(),
                spans: joi.array().items(joi.object({
                    start: characterPositionSchema,
                    end: characterPositionSchema,
                })),
            })).optional(),
            metadata: joi.object().pattern(
                joi.string(),
                joi.alternatives(joi.string().allow(""), joi.number(), joi.boolean())
            ).optional(),
        })
    ),
    exports: joi.array().items(joi.any()),
    meta: joi.object({
        num_of_components: joi.number(),
        num_of_modules: joi.number(),
        num_of_exports: joi.number(),
        num_of_dependencies: joi.number(),
        num_of_commits: joi.number().optional(),
        num_of_deltas: joi.number().optional(),
        analyze_duration_msec: joi.number().optional(),
        parse_duration_msec: joi.number().optional(),
        date_extraction_msec: joi.number().optional(),
        duration_msec: joi.number(),
        cli_version: joi.string(),
        cli_params: joi.object().unknown(true).optional(),
        cli_config: joi.object().unknown(true).optional(),
        argv: joi.string().optional(),
        node_version: joi.string().optional(),
        device_info: joi.object({
            os: joi.string(),
            arch: joi.string(),
            version: joi.string(),
        }).optional(),
        ci_vendor: joi.string().optional(),
        mem_usages: joi.object({
            before_scan_rss: joi.number().optional(),
            after_file_dates_rss: joi.number().optional(),
            after_project_setup_rss: joi.number().optional(),
            after_parse_rss: joi.number().optional(),
            after_analyze_rss: joi.number().optional(),
        }).optional(),
    }).unknown(true),
    repository: joi.object({
        scope: joi.string().allow("").optional(),
        name: joi.string().allow("").optional(),
        branch: joi.string().allow("").optional(),
        url: joi.string().allow("").optional(),
        initialCommitHash: joi.string().allow("").optional(),
    }).optional(),
    invalid_dependencies: joi.array().items(joi.object({
        package_name: joi.string(),
        path: joi.string().allow(""),
        source_package_name: joi.string(),
    })).optional(),
}).unknown(true);

const equalityFilterSchema = joi.object({
    operation: joi.string().valid(...equalityFilterOperations),
    values: joi.array().items(joi.string()),
});

const stringFilterSchema = joi.object({
    operation: joi.string().valid(...stringFilterOperations),
    value: joi.string(),
});

const numericValueFilterSchema = joi.object({
    operation: joi.string().valid(...numberFilterOperations),
    value: joi.number(),
});

const dateFilterSchema = joi.object({
    operation: joi.string().valid(...dateFilterOperations),
    value: joi.array().items(joi.string().isoDate().allow(null)).length(2),
});

export const tagFilterSchema = joi.object({
    field: joi.string(),
    dataType: joi.string().valid(...Object.values<string>(FilterDataType)),
    operation: joi.string().valid(...Object.values<string>(FilterOperation)),
    value: joi.array().items(joi.string().allow("")),
});

const baseDataAnalysisSchema = joi.object({
    analysisSubject: joi.string().valid(...Object.values<string>(AnalysisSubject)),
    filters: joi.string().optional(),
});

const conditionalCustomPropertySchema = joi.string().when("analysisSubject", {
    is: AnalysisSubject.CustomProperties,
    then: joi.required(),
    // When not analyzing a custom property, the field is only allowed if we're
    // breaking down by one (e.g. analyze Projects, break down by "DS Version").
    otherwise: joi.when("breakdownType", {
        is: BreakdownType.CustomProperty,
        then: joi.optional(),
        otherwise: joi.forbidden(),
    }),
});

export const latestDataAnalysisSchema = baseDataAnalysisSchema.keys({
    customProperty: conditionalCustomPropertySchema,
    breakdownType: joi.string().valid(...Object.values(BreakdownType)).optional(),
});

export const timeSeriesDataAnalysisSchema = baseDataAnalysisSchema.keys({
    customProperty: conditionalCustomPropertySchema,
    timeSeriesFilter: joi.string().optional(),
});

export const analysisFilterSchema = joi.object({
    name: joi.array().items(stringFilterSchema, equalityFilterSchema).optional(),
    path: joi.array().items(stringFilterSchema).optional(),
    tag: joi.array().items(equalityFilterSchema).optional(),
    sourceProject: joi.array().items(equalityFilterSchema).optional(),
    clientProject: joi.array().items(equalityFilterSchema).optional(),
    numOfUsages: joi.array().items(numericValueFilterSchema).optional(),
    numOfDependencies: joi.array().items(numericValueFilterSchema).optional(),
    createdAt: joi.array().items(dateFilterSchema).optional(),
    updatedAt: joi.array().items(dateFilterSchema).optional(),
    lastUsageChangedAt: joi.array().items(dateFilterSchema).optional(),
    metadata: joi.array().items(tagFilterSchema).optional(),
});

export const timeSeriesFilterSchema = joi.object({
    frequency: joi.string().valid(...Object.values<string>(DataFrequencyOption)),
    timeWindow: dateFilterSchema,
});

export const savedTimeSeriesFilterSchema = joi.object({
    frequency: joi.string().valid(...Object.values<string>(DataFrequencyOption)),
    timeWindow: joi.string().valid(...Object.values<string>(TimeWindowOption)),
});

export const treeNodeSchema = joi.object({
    packageName: joi.string(),
    path: joi.string().allow(""),
});

export const folderFilterSchema = joi.object({
    selectedTreeNodes: joi.array().items(treeNodeSchema).required(),
    deselectedTreeNodes: joi.array().items(treeNodeSchema).required(),
});

export const filterSchema = joi.object({
    type: joi.string().valid(...Object.values<string>(FilterType)),
    operation: joi.string().valid(...Object.values<string>(FilterOperation)),
    value: joi.array().items(joi.string().allow("")),
});

const baseCreateSavedChartSchema = joi.object({
    name: joi.string().max(72),
    description: joi.string().max(72).allow(""),
    analysisType: joi.string().valid(...Object.values<string>(AnalysisType)),
    analysisSubject: joi.string().valid(...Object.values<string>(AnalysisSubject)),
    filters: joi.array().items(filterSchema),
    breakdownType: joi.string().valid(...Object.values<string>(BreakdownType)).optional(),
    timeSeriesFilter: savedTimeSeriesFilterSchema.optional(),
});

export const createSavedChartSchema = baseCreateSavedChartSchema.keys({
    customProperty: conditionalCustomPropertySchema,
});

const baseUpdateSavedChartSchema = joi.object({
    name: joi.string().max(72).optional(),
    description: joi.string().max(72).allow("").optional(),
    analysisType: joi.string().valid(...Object.values<string>(AnalysisType)).optional(),
    analysisSubject: joi.string().valid(...Object.values<string>(AnalysisSubject)).optional(),
    filters: joi.array().items(filterSchema).optional(),
    breakdownType: joi.string().valid(...Object.values<string>(BreakdownType), null).optional(),
    timeSeriesFilter: savedTimeSeriesFilterSchema.optional(),
});

export const updateSavedChartSchema = baseUpdateSavedChartSchema.keys({
    customProperty: conditionalCustomPropertySchema,
});
