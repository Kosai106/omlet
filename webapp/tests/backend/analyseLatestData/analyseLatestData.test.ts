import { type Express } from "express";
import { StatusCodes as httpStatus } from "http-status-codes";
import request from "supertest";

import { createApp } from "../../../src/backend/app";
import { LoginProviderType } from "../../../src/backend/service/auth/models";
import { generateToken } from "../../helper/auth";
import { createUser } from "../../helper/user";
import { createWorkspace } from "../../helper/workspace";
import { analysisDate } from "../analyseTimeSeriesData/fixtures";
import omletWebapp from "../files/omlet-webapp.json";
import openCollectiveFrontend from "../files/opencollective-frontend.json";

import { workspaceId, workspaceSlug } from "./fixtures";

let app: Express;

describe("Analyse latest data", () => {
    const email = "test@email";
    let token: string;

    beforeAll(async () => {
        const user = await createUser({
            _id: "67a1ba2c091e46dc32382826",
            email,
        });

        await createWorkspace({
            _id: workspaceId,
            name: `test-${workspaceSlug}`,
            slug: workspaceSlug,
            userId: user.id,
        });

        token = generateToken({ userId: user.id, email, loginProvider: LoginProviderType.Google });

        app = await createApp({ addViteMw: false });

        await request(app)
            .post(`/api/workspaces/${workspaceSlug}/analyses`)
            .set("Cookie", `omlet-auth-token=${token}`)
            .send(omletWebapp);

        await new Promise(resolve => setTimeout(resolve, 10000));

        await request(app)
            .post(`/api/workspaces/${workspaceSlug}/tags`)
            .set("Cookie", `omlet-auth-token=${token}`)
            .send({
                "name": "Path",
                "searchTerm": "",
                "selectedTreeNodes": [
                    {
                        "packageName": "@omlet/webapp",
                        "path": "src/frontend/",
                    },
                    {
                        "packageName": "@omlet/webapp",
                        "path": "src/frontend/containers/analytics/",
                    },
                    {
                        "packageName": "@omlet/webapp",
                        "path": "src/frontend/containers/header/",
                    },
                    {
                        "packageName": "@omlet/webapp",
                        "path": "src/frontend/containers/header/inviteDialog/memberRow/",
                    },
                ],
                "deselectedTreeNodes": [
                    {
                        "packageName": "@omlet/webapp",
                        "path": "src/frontend/containers/",
                    },
                    {
                        "packageName": "@omlet/webapp",
                        "path": "src/frontend/containers/header/inviteDialog/",
                    },
                ],
                "filters": [],
            });

        await request(app)
            .post(`/api/workspaces/${workspaceSlug}/tags`)
            .set("Cookie", `omlet-auth-token=${token}`)
            .send({
                "name": "Most Used",
                "searchTerm": "",
                "selectedTreeNodes": [],
                "deselectedTreeNodes": [],
                "filters": [
                    {
                        "field": "usingComponents.length",
                        "dataType": "number",
                        "operation": "greaterThan",
                        "value": [
                            "20",
                        ],
                    },
                ],
            });

        await request(app)
            .post(`/api/workspaces/${workspaceSlug}/analyses`)
            .set("Cookie", `omlet-auth-token=${token}`)
            .send(openCollectiveFrontend);

        await new Promise(resolve => setTimeout(resolve, 10000));
    });

    it("should return unauthorized status when the token is not provided", async () => {
        const res = await request(app)
            .get(`/api/workspaces/${workspaceSlug}/latest-data-analyses?analysisSubject=projects`);

        expect(res.status).toBe(httpStatus.UNAUTHORIZED);
    });

    it("should return not found status when the workspace is not found", async () => {
        const res = await request(app)
            .get("/api/workspaces/DUMMY_SLUG/latest-data-analyses?analysisSubject=projects")
            .set("Cookie", `omlet-auth-token=${token}`);

        expect(res.status).toBe(httpStatus.NOT_FOUND);
    });

    it("should return ok status as CSV (subject = projects)", async () => {
        const res = await request(app)
            .get(`/api/workspaces/${workspaceSlug}/latest-data-analyses?analysisSubject=projects`)
            .set("Cookie", `omlet-auth-token=${token}`)
            .set("Accept", "text/csv");

        const [header, ...rows] = res.text.split("\n");
        const responseText = [header, ...rows.map(row => row.replace(/^".+?",/, `"${analysisDate}",`))].join("\n");

        expect(res.status).toBe(httpStatus.OK);
        expect(responseText).toMatchSnapshot();
    });

    it("should return ok status (subject = components & filters = sourceProject and numOfUsages)", async () => {
        const filters = {
            "sourceProject": [
                {
                    "operation": "equals",
                    "values": [
                        "@omlet/webapp",
                        "opencollective-frontend",
                    ],
                },
            ],
            "numOfUsages": [
                {
                    "operation": "greaterThan",
                    "value": 20,
                },
            ],
        };
        const encodedFilters = encodeURIComponent(JSON.stringify(filters));
        const res = await request(app)
            .get(`/api/workspaces/${workspaceSlug}/latest-data-analyses?analysisSubject=components&filters=${encodedFilters}`)
            .set("Cookie", `omlet-auth-token=${token}`)
            .set("Accept", "application/json");

        expect(res.status).toBe(httpStatus.OK);
        expect(res.body).toMatchSnapshot();
    });

    it("should return ok status (subject = component & filters = sourceProject, tag, path)", async () => {
        const filters = {
            "sourceProject": [
                {
                    "operation": "equals",
                    "values": [
                        "@omlet/webapp",
                        "opencollective-frontend",
                    ],
                },
            ],
            "tag": [
                {
                    "operation": "equals",
                    "values": [
                        "most-used-core",
                        "open-collective-V2",
                    ],
                },
            ],
            "path": [
                {
                    "operation": "contains",
                    "value": "Button",
                },
            ],
        };
        const encodedFilters = encodeURIComponent(JSON.stringify(filters));
        const res = await request(app)
            .get(`/api/workspaces/${workspaceSlug}/latest-data-analyses?analysisSubject=components&filters=${encodedFilters}`)
            .set("Cookie", `omlet-auth-token=${token}`)
            .set("Accept", "application/json");

        expect(res.status).toBe(httpStatus.OK);
        expect(res.body).toMatchSnapshot();
    });

    it("should return ok status (subject = component & filters = clientProject, updatedAt, numOfDependencies)", async () => {
        const filters = {
            "clientProject": [
                {
                    "operation": "equals",
                    "values": [
                        "@omlet/webapp",
                        "opencollective-frontend",
                    ],
                },
            ],
            "updatedAt": [
                {
                    "operation": "between",
                    "value": [
                        "2024-07-23T21:00:00.000Z",
                        "2024-07-31T20:59:59.999Z",
                    ],
                },
            ],
            "numOfDependencies": [
                {
                    "operation": "greaterThan",
                    "value": 6,
                },
            ],
        };
        const encodedFilters = encodeURIComponent(JSON.stringify(filters));
        const res = await request(app)
            .get(`/api/workspaces/${workspaceSlug}/latest-data-analyses?analysisSubject=components&filters=${encodedFilters}`)
            .set("Cookie", `omlet-auth-token=${token}`)
            .set("Accept", "application/json");

        expect(res.status).toBe(httpStatus.OK);
        expect(res.body).toMatchSnapshot();
    });

    it("should return ok status (subject = projects & breakdownType = tag)", async () => {
        const res = await request(app)
            .get(`/api/workspaces/${workspaceSlug}/latest-data-analyses?analysisSubject=projects&breakdownType=tag`)
            .set("Cookie", `omlet-auth-token=${token}`)
            .set("Accept", "application/json");

        expect(res.status).toBe(httpStatus.OK);
        expect(res.body).toMatchSnapshot();
    });

    it("should return ok status (subject = projects & filters = numOfDependencies)", async () => {
        const filters = {
            "numOfDependencies": [
                {
                    "operation": "greaterThan",
                    "value": 15,
                },
            ],
        };
        const encodedFilters = encodeURIComponent(JSON.stringify(filters));
        const res = await request(app)
            .get(`/api/workspaces/${workspaceSlug}/latest-data-analyses?analysisSubject=projects&filters=${encodedFilters}`)
            .set("Cookie", `omlet-auth-token=${token}`)
            .set("Accept", "application/json");

        expect(res.status).toBe(httpStatus.OK);
        expect(res.body).toMatchSnapshot();
    });

    it("should return ok status (subject = tags & filters = sourceProject and numOfUsages)", async () => {
        const filters = {
            "sourceProject": [
                {
                    "operation": "equals",
                    "values": [
                        "@omlet/webapp",
                        "opencollective-frontend",
                    ],
                },
            ],
            "numOfUsages": [
                {
                    "operation": "greaterThan",
                    "value": 30,
                },
                {
                    "operation": "lessThan",
                    "value": 40,
                },
            ],
        };
        const encodedFilters = encodeURIComponent(JSON.stringify(filters));
        const res = await request(app)
            .get(`/api/workspaces/${workspaceSlug}/latest-data-analyses?analysisSubject=tags&filters=${encodedFilters}`)
            .set("Cookie", `omlet-auth-token=${token}`)
            .set("Accept", "application/json");

        expect(res.status).toBe(httpStatus.OK);
        expect(res.body).toMatchSnapshot();
    });

    it("should return ok status (subject = tags & filters = createdAt and path)", async () => {
        const filters = {
            "createdAt": [
                {
                    "operation": "between",
                    "value": [
                        "2024-04-30T21:00:00.000Z",
                        "2024-07-31T20:59:59.999Z",
                    ],
                },
            ],
            "path": [
                {
                    "operation": "contains",
                    "value": "payment",
                },
            ],
        };
        const encodedFilters = encodeURIComponent(JSON.stringify(filters));
        const res = await request(app)
            .get(`/api/workspaces/${workspaceSlug}/latest-data-analyses?analysisSubject=tags&filters=${encodedFilters}`)
            .set("Cookie", `omlet-auth-token=${token}`)
            .set("Accept", "application/json");

        expect(res.status).toBe(httpStatus.OK);
        expect(res.body).toMatchSnapshot();
    });
});
