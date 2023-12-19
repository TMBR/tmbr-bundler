#!/usr/bin/env node
import esbuild from 'esbuild';
import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import readline from 'readline';
import { create } from 'browser-sync';
import { execSync as exec } from 'child_process';
import { sassPlugin as styles } from 'esbuild-sass-plugin';
import * as sass from 'sass';

const server = create();

const cwd = process.cwd();
const src = path.resolve(cwd, 'src');
const command = process.argv[2];

if (!['build', 'watch'].includes(command)) {
  console.log(`Invalid command: ${chalk.red(command)}\n`);
  process.exit();
}

const logger = (options = {}) => ({
  name: 'logger',
  setup(context) {

    const path = context.initialOptions.outdir;
    const slug = Object.keys(context.initialOptions.entryPoints)[0];

    context.onStart(() => {
      server.instance.active && server.info();
    });

    context.onEnd(result => {
      if (result.warnings.length || result.errors.length) return console.log('\\007');

      const css = `${path}/${slug}.css`;
      const js = `${path}/${slug}.js`;

      console.log(`  ${chalk.green('✓')} ${css} ${Math.round(fs.statSync(css).size / 1000)} KB`);
      console.log(`  ${chalk.green('✓')} ${js} ${Math.round(fs.statSync(js).size / 1000)} KB`);
      console.log()
    });
  }
});

const buildOptions = {
  entryPoints: {'main.min': src},
  alias: {'~': src},
  outdir: 'build',
  bundle: true,
  minify: true,
  target: 'es2019',
  external: 'jpg,jpeg,webp,png,gif,svg,woff,woff2'.split(',').map(ext => `*.${ext}`),
  logLevel: 'warning',
  sourcemap: false,
  treeShaking: true,
  legalComments: 'none',
  plugins: [
    styles({sourceMap: false, logger: sass.Logger.silent}),
    logger()
  ]
};

const watchOptions = Object.assign({}, buildOptions, {
  entryPoints: {'main.dev': src},
  minify: false,
  logLevel: 'silent',
  sourcemap: 'inline',
  plugins: [
    styles({sourceMap: true})
  ]
});

const serveOptions = {
  proxy: `${process.env.npm_package_name}.test`,
  files: ['assets/**', 'build/*', '**/*.php'],
  host: 'localhost',
  open: false,
  notify: false,
  logLevel: 'silent',
  injectChanges: false,
  ui: false,
};

server.info = function() {
  const proxying = this.url();
  const external = this.getOption('urls').get('external');

  console.clear();
  console.log();
  console.log(`  ➜ ${chalk.bold('Proxying')}: ${chalk.green(proxying)}`);
  console.log(`  ➜ ${chalk.bold('External')}: ${chalk.cyan(external || 'offline')}\n`);
  console.log(`  ${chalk.bold('Shortcuts')}`);

  for (const [key, [_, tip]] of Object.entries(shortcuts)) {
    tip && console.log(chalk.grey(`  press ${chalk.white.bold(key)} to ${tip}`));
  }

  console.log();
};

server.url = function() {
  const host = this.getOption('proxy').get('target');
  const port = this.getOption('port');
  return `${host}:${port}`;
};

const shortcuts = {
  o: [() => exec(`open ${server.url()}`), 'open in browser'],
  r: [() => server.reload(), 'reload the page'],
  q: [() => process.exit(), 'quit'],
  '\x03': [() => process.exit()],
};

async function main() {

  const watcher = await esbuild.context(watchOptions);
  const builder = await esbuild.context(buildOptions);

  if (command === 'build') {
    await watcher.rebuild();
    await builder.rebuild();
    process.exit();
  }

  server.init(serveOptions, () => {
    builder.watch();
    watcher.watch();
    readline.emitKeypressEvents(process.stdin);

    process.stdin.setRawMode(true);
    process.stdin.on('keypress', (_, key) => {
      if (!key) return;
      shortcuts[key.sequence]?.[0]();
    });
  });
}

function extend(options, config) {
  if (!config) return options;
  return typeof config === 'function' ? config(options) : Object.assign(options, config);
}

if (fs.existsSync(process.argv[3])) {
  // const test = require(`${cwd}/${process.argv[3]}`);
  // console.log(extend(watchOptions, test.watch));
  // console.log(extend(buildOptions, test.build));
  // console.log(extend(serveOptions, test.serve));
  // process.exit();
}

main();
