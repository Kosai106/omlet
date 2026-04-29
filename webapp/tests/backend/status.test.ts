import { type Express } from "express";
import { StatusCodes as httpStatus } from "http-status-codes";
import request from "supertest";

import { createApp } from "../../src/backend/app";
import { healthCheckService } from "../../src/backend/service/healthcheck";

let app: Express;

describe("GET \"/status\" request", () => {
    beforeAll(async () => {
        app = await createApp({ addViteMw: false });
        healthCheckService.markHealthy();
    });

    it("should return 200", async () => {
        const res = await request(app)
            .get("/status");

        expect(res.status).toBe(httpStatus.OK);
    });
});
