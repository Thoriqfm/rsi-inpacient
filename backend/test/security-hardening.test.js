import "dotenv/config";
import { after, before, describe, test } from "node:test";
import assert from "node:assert/strict";
import { once } from "node:events";
import app from "../src/app.js";
import { errorHandler } from "../src/middlewares/error.middleware.js";

let server;
let baseUrl;

describe("Security & Production Hardening", () => {
    before(async () => {
        server = app.listen(0, "127.0.0.1");
        await once(server, "listening");
        const { port } = server.address();
        baseUrl = `http://127.0.0.1:${port}`;
    });

    after(async () => {
        await new Promise((resolve) => server.close(resolve));
    });

    test("health endpoint returns 200 ok", async () => {
        const res = await fetch(`${baseUrl}/api/health`);
        assert.equal(res.status, 200);
        const body = await res.json();
        assert.equal(body.data.status, "ok");
    });

    test("malformed JSON returns 400 INVALID_JSON instead of 500", async () => {
        const res = await fetch(`${baseUrl}/api/auth/login`, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: "{invalid-json",
        });
        assert.equal(res.status, 400);
        const body = await res.json();
        assert.equal(body.error.code, "INVALID_JSON");
    });

    test("CORS rejects untrusted browser Origin with 403", async () => {
        const res = await fetch(`${baseUrl}/api/health`, {
            headers: { Origin: "https://evil.example.com" },
        });
        assert.equal(res.status, 403);
        const body = await res.json();
        assert.equal(body.error.code, "CORS_FORBIDDEN");
    });

    test("CORS allows configured FRONTEND_ORIGIN", async () => {
        const allowed = (process.env.FRONTEND_ORIGIN || "http://localhost:3000").split(",")[0].trim();
        const res = await fetch(`${baseUrl}/api/health`, {
            headers: { Origin: allowed },
        });
        assert.equal(res.status, 200);
        assert.equal(res.headers.get("access-control-allow-origin"), allowed);
    });

    test("login rate limiter returns 429 after exceeding max attempts", async () => {
        let lastStatus = 0;
        for (let i = 0; i < 16; i += 1) {
            const res = await fetch(`${baseUrl}/api/auth/login`, {
                method: "POST",
                headers: {
                    "content-type": "application/json",
                    "x-test-rate-limit": "1",
                    "x-forwarded-for": "203.0.113.99",
                },
                body: JSON.stringify({ username: "", password: "" }),
            });
            lastStatus = res.status;
        }
        assert.equal(lastStatus, 429);
    });

    test("errorHandler maps unhandled Prisma P2002/P2025/P2003 codes without returning 500", () => {
        const makeRes = () => {
            const out = { statusCode: 0, body: null };
            return {
                out,
                status(code) {
                    out.statusCode = code;
                    return this;
                },
                json(payload) {
                    out.body = payload;
                    return this;
                },
            };
        };

        for (const [code, expectedStatus, expectedErrCode] of [
            ["P2002", 409, "CONFLICT"],
            ["P2025", 404, "NOT_FOUND"],
            ["P2003", 422, "INVALID_REFERENCE"],
        ]) {
            const res = makeRes();
            errorHandler(Object.assign(new Error("prisma err"), { code }), { method: "POST", originalUrl: "/api/test" }, res);
            assert.equal(res.out.statusCode, expectedStatus);
            assert.equal(res.out.body.error.code, expectedErrCode);
        }
    });
});
