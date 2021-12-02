#!/usr/bin/env node

const { spawn } = require('child_process')
const path = require('path')
const fs = require('fs/promises')

const argv = require('minimist')(process.argv.slice(2), { string: ['_'] })
const prompts = require('prompts')
const { blue, red, green } = require('kolorist')

const cwd = process.cwd()

const eslintDependencies = [
  'eslint',
  'eslint-config-standard',
  'eslint-plugin-import',
  'eslint-plugin-node',
  'eslint-plugin-promise',
  'eslint-plugin-vue',
]

async function checkViteDir (dir) {
  const viteConfigPath = path.join(dir, 'vite.config.ts')

  try {
    await fs.access(viteConfigPath)
  } catch (e) {
    return false
  }

  return true
}

async function updateTsConfig (root) {
  const filePath = path.join(root, 'tsconfig.json')

  const content = await fs.readFile(filePath, 'utf-8')
  const json = JSON.parse(content)

  json.compilerOptions.paths = {
    ...json.compilerOptions.paths || {},
    '@/*': ['./src/*'],
  }

  await fs.writeFile(filePath, JSON.stringify(json, null, 2))
}

async function updateViteConfig (root) {
  const filePath = path.join(root, 'vite.config.ts')

  let content = await fs.readFile(filePath, 'utf-8')

  content = "import path from 'path'\n\n" + content

  content = content.replace('[vue()]', `[vue()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src')
    },
  },`)

  await fs.writeFile(filePath, content)
}

async function copyEslintConfig (root) {
  const srcPath = path.join(__dirname, 'eslintrc.template.js')
  const filePath = path.join(root, '.eslintrc.js')

  await fs.copyFile(srcPath, filePath)
}

function addEslintDependencies (root, verbose) {
  return new Promise((resolve, reject) => {
    const child = spawn('npm', ['install', '--save-dev', ...eslintDependencies], {
      cwd: root,
      stdio: verbose ? 'inherit' : undefined,
    })

    child.on('exit', () => resolve())
    child.on('error', (e) => reject(e))
  })
}

async function installTailwind (root, verbose) {
  return new Promise((resolve, reject) => {
    const child = spawn('npx', ['npx', 'tailwindcss', 'init', '-p'], {
      cwd: root,
      stdio: verbose ? 'inherit' : undefined,
    })

    child.on('exit', () => resolve())
    child.on('error', (e) => reject(e))
  })
}

async function updateTailwindConfig (root) {
  const filePath = path.join(root, 'tailwind.config.js')

  let content = await fs.readFile(filePath, 'utf-8')

  content = content.replace('purge: [],', `mode: 'jit',
  purge: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],`)

  await fs.writeFile(filePath, content)
}

async function installDependencies (root, verbose) {
  return new Promise((resolve, reject) => {
    const child = spawn('npm', ['install'], {
      cwd: root,
      stdio: verbose ? 'inherit' : undefined,
    })

    child.on('exit', () => resolve())
    child.on('error', (e) => reject(e))
  })
}

async function start () {
  const verbose = argv.verbose || argv.v || false

  let targetDir = null
  let root = null

  const setTargetDir = (target) => {
    targetDir = target
    root = path.join(cwd, target)
  }

  setTargetDir(argv._[0])

  let features = []

  try {
    await prompts([
      {
        type: targetDir ? null : 'text',
        name: 'targetDir',
        message: 'Target directory',
        onState: state => setTargetDir(state),
      },
      {
        type: async () => {
          const isViteDir = await checkViteDir(root)
          if (!isViteDir) {
            throw new Error(red('✖') + ' Target directory is not a Vite project')
          }
          return null
        },
        name: 'viteChecker',
      },
      {
        type: 'multiselect',
        name: 'features',
        message: 'Select features',
        instructions: '↑/↓ to move, space to toggle, a to toggle all',
        choices: [
          { title: 'ESLint', value: 'eslint' },
          { title: 'Tailwind CSS', value: 'tailwind' },
          { title: 'Alias @/ to src', value: 'alias' },
        ],
        onState: state => {
          features = state.value.map(feat => feat.value)
        },
      },
    ])
  } catch (cancelled) {
    console.error(cancelled.message)
    process.exit(1)
  }

  prompts({
    name: 'startTsConfig',
    type: '',
  })

  if (features.includes('alias')) {
    console.log(blue('➔') + ' Updating tsconfig.json')
    await updateTsConfig(root)

    console.log(blue('➔') + ' Updating vite.config.ts')
    await updateViteConfig(root)
  }

  if (features.includes('eslint')) {
    console.log(blue('➔') + ' Copying .eslintrc.js')
    await copyEslintConfig(root)

    console.log(blue('➔') + ' Adding ESLint dependencies')
    await addEslintDependencies(root, verbose)
  }

  if (features.includes('tailwind')) {
    console.log(blue('➔') + ' Installing Tailwind CSS')
    await installTailwind(root, verbose)

    console.log(blue('➔') + ' Updating Tailwind config')
    await updateTailwindConfig(root)
  }

  console.log(blue('➔') + ' Installing remaining dependencies')
  await installDependencies(root, verbose)

  console.log(green('✔') + ' Project upgraded')
}

start()
  .catch(err => console.error(err))
