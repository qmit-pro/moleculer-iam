"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const moleculer_1 = require("moleculer");
const iam_identity_service_1 = require("./iam.identity.service");
describe("Test OIDCService", () => {
    const broker = new moleculer_1.ServiceBroker();
    const service = broker.createService(iam_identity_service_1.IdentityProviderService);
    beforeAll(() => broker.start());
    afterAll(() => broker.stop());
    it("should be created", () => {
        expect(service).toBeDefined();
    });
    it("should return with 'Hello Anonymous'", () => {
        return broker.call("iam.identity.test")
            .then((res) => {
            expect(res).toBe("Hello Anonymous");
        });
    });
    it("should return with 'Hello John'", () => {
        return broker.call("iam.identity.test", { name: "John" })
            .then((res) => {
            expect(res).toBe("Hello John");
        });
    });
});
//# sourceMappingURL=iam.identity.service.spec.js.map