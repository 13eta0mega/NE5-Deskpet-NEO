import { cp, mkdir } from 'node:fs/promises'

await mkdir('dist/assets', { recursive: true })
await cp('assets/jirai', 'dist/assets/jirai', { recursive: true })
console.log('Copied assets/jirai -> dist/assets/jirai')
