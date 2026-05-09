import fs from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { spawn } from 'node:child_process'

const rootDir = process.cwd()
const tempOutput = path.join(
  rootDir,
  'scripts',
  'interview-bank',
  '.tmp-generated-question-bank.ts'
)

const run = (command, args) =>
  new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: rootDir,
      stdio: 'inherit',
      shell: process.platform === 'win32'
    })

    child.on('exit', (code) => {
      if (code === 0) {
        resolve()
        return
      }

      reject(new Error(`command failed: ${command} ${args.join(' ')}`))
    })
  })

const main = async () => {
  await run('node', [
    'scripts/interview-bank/sync.mjs',
    '--config',
    'scripts/interview-bank/sources.test.json',
    '--output',
    tempOutput
  ])

  const content = await fs.readFile(tempOutput, 'utf8')

  if (!content.includes('generatedVueSections')) {
    throw new Error('missing generatedVueSections export')
  }

  if (!content.includes('自动采集 / JSON 示例')) {
    throw new Error('json source section was not generated')
  }

  if (!content.includes('自动采集 / HTML 示例')) {
    throw new Error('html source section was not generated')
  }

  await fs.rm(tempOutput, { force: true })
  console.log('[interview-bank] test passed')
}

main().catch(async (error) => {
  await fs.rm(tempOutput, { force: true }).catch(() => {})
  console.error(error)
  process.exitCode = 1
})
