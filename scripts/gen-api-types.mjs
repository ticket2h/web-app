// Sinh kiểu TypeScript từ OpenAPI của các service (springdoc, /v3/api-docs). Cần service đang chạy.
//   npm run api:types                        đọc từ localhost:8082 (identity), localhost:8080 (core)
//   IDENTITY_URL=... CORE_URL=... npm run api:types
// Kết quả commit vào src/shared/api/generated/, để build và CI không cần BE.
import { writeFile } from 'node:fs/promises'
import openapiTS, { astToString } from 'openapi-typescript'

const services = {
  identity: process.env.IDENTITY_URL ?? 'http://localhost:8082',
  core: process.env.CORE_URL ?? 'http://localhost:8080',
}

for (const [name, baseUrl] of Object.entries(services)) {
  const url = new URL('/v3/api-docs', baseUrl)
  const ast = await openapiTS(url)
  const header = `// Sinh tự động từ ${name}-service (${url.pathname}) bằng scripts/gen-api-types.mjs. Không sửa tay.\n\n`
  await writeFile(`src/shared/api/generated/${name}.ts`, header + astToString(ast))
  console.log(`${name}: ${url}`)
}
