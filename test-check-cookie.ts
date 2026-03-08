import { db } from './src/lib/db'

async function main() {
  const p = await db.getProduct('ai-rankrs-nyvuw')
  console.log('AI Rankrs cookie:')
  console.log(p?.linkedinCookie)
}

main().catch(console.error)
