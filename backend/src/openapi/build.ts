import fs from 'fs';
import path from 'path';
import { generateOpenApiDocument } from './schema';

function main() {
	const doc = generateOpenApiDocument();
	const outPath = path.resolve(__dirname, '../../openapi.json');
	fs.writeFileSync(outPath, JSON.stringify(doc, null, 2), 'utf-8');
	// eslint-disable-next-line no-console
	console.log(`OpenAPI spec written to ${outPath}`);
}

main();


