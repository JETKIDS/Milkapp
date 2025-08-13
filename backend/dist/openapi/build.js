"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const schema_1 = require("./schema");
function main() {
    const doc = (0, schema_1.generateOpenApiDocument)();
    const outPath = path_1.default.resolve(__dirname, '../../openapi.json');
    fs_1.default.writeFileSync(outPath, JSON.stringify(doc, null, 2), 'utf-8');
    // eslint-disable-next-line no-console
    console.log(`OpenAPI spec written to ${outPath}`);
}
main();
