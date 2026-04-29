import { type Express } from "express";
import { StatusCodes as httpStatus } from "http-status-codes";
import request from "supertest";

import { createApp } from "../../src/backend/app";
import { LoginProviderType } from "../../src/backend/service/auth/models";
import { generateToken, getAuthCookieFrom } from "../helper/auth";

let app: Express;

describe.skip("Logging out a user", () => {
    beforeAll(async () => {
        app = await createApp({ addViteMw: false });
    });

    describe("who's logged in with JWT", () => {
        let requestor: request.SuperTest<request.Test>;

        beforeEach(async () => {
            requestor = request(app);

            await requestor
                .get(`/login?token=${generateToken({
                    userId: "xyz13",
                    email: "test@test",
                    loginProvider: LoginProviderType.Google,
                })}`);
        });

        it("should return 200 with no auth cookie", async () => {
            const res = await requestor.get("/logout");

            expect(res.status).toBe(httpStatus.OK);
            expect(getAuthCookieFrom(res)).toBeUndefined();
        });
    });
});
