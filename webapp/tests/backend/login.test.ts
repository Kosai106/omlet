import { type Express } from "express";
import { StatusCodes as httpStatus } from "http-status-codes";
import request from "supertest";

import { createApp } from "../../src/backend/app";
import { LoginProviderType } from "../../src/backend/service/auth/models";
import { generateToken, getAuthCookieFrom } from "../helper/auth";

let app: Express;

describe.skip("Logging in a user", () => {
    beforeAll(async () => {
        app = await createApp({ addViteMw: false });
    });

    describe("with JWT", () => {
        it("should return 200 with auth cookie", async () => {
            const token = generateToken({
                userId: "xyz13",
                email: "test@test",
                loginProvider: LoginProviderType.Google,
            });
            const res = await request(app).get(`/login?token=${token}`);

            expect(res.status).toBe(httpStatus.OK);
            expect(getAuthCookieFrom(res)).toEqual(token);
        });
    });

    describe("with invalid token", () => {
        it("should return 400", async () => {
            const token = "hebele";
            const res = await request(app).get(`/login?token=${token}`);

            expect(res.status).toBe(httpStatus.BAD_REQUEST);
        });
    });
});
