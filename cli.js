#!/usr/bin/env node
const esbuild = require('esbuild');
const path = require('path');
const exec = require('child_process').execSync;
const chalk = require('chalk');
const styles = require('esbuild-sass-plugin').sassPlugin;
const qrcode = require('qrcode-terminal');
const server = require('browser-sync').create();

const dir = process.cwd();
const package = require(`${dir}/package.json`);
const command = process.argv[2];

if (!['build', 'watch'].includes(command)) {
  console.log(`Invalid command: ${chalk.red(command)}\n`);
  process.exit();
}

function ok() {

  console.clear();
  const host = server.getOption('proxy').get('target');
  const port = server.getOption('port');
  const proxying = `${host}:${port}`;
  const external = server.getOption('urls').get('external');

  external && qrcode.generate(external, {small: true}, console.log);
  console.log(`Proxying: ${chalk.green(proxying)}`);
  console.log(`External: ${chalk.cyan(external || 'offline')}\n`);
}

const errors = (options = {}) => ({
  name: 'errors',
  setup(build) {
    // console.log(Object.keys(build));
    // console.log(build)
    // build.onEnd(({warnings, errors}) => (warnings.length || errors.length) ? console.log('\007') : ok());
  },
});

const buildConfig = {
  entryPoints: {'main.min': path.resolve(dir, './src')},
  alias: {'~': path.resolve(dir, 'src')},
  outdir: path.resolve(dir, 'build'),
  bundle: true,
  minify: true,
  target: 'es2019',
  external: 'jpg,jpeg,webp,png,gif,svg,woff,woff2'.split(',').map(ext => `*.${ext}`),
  logLevel: 'warning',
  sourcemap: false,
  treeShaking: true,
  legalComments: 'none',
  plugins: [styles({sourceMap: true})]
};

const watchConfig = Object.assign({}, buildConfig, {
  entryPoints: {'main.dev': path.resolve(dir, './src')},
  minify: false,
  logLevel: 'silent',
  sourcemap: 'inline',
  plugins: [...buildConfig.plugins, errors()]
});

async function main() {

  const builder = await esbuild.context(buildConfig);
  const watcher = await esbuild.context(watchConfig);

  try {

    await builder.rebuild();
    await watcher.rebuild();

    if (command === 'build') process.exit();

    await builder.watch();
    await watcher.watch();

  } catch(e) {
    console.log(e);
    process.exit();
  }

  const options = {
    proxy: `${package.name}.test`,
    files: ['assets/**', 'build/*', '**/*.php'],
    host: 'localhost',
    open: false,
    notify: false,
    logLevel: 'silent',
    injectChanges: false,
    ui: false,
  };

  server.init(options, ok);
}

main();
