#!/usr/bin/env node
const esbuild = require('esbuild');
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const server = require('browser-sync').create();
const styles = require('esbuild-sass-plugin').sassPlugin;
const silent = require('sass').Logger.silent;

const dir = process.cwd();
const src = path.resolve(dir, 'src');
const package = require(`${dir}/package.json`);
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
      if (result.warnings.length || result.errors.length) return console.log('\007');

      const css = `${path}/${slug}.css`;
      console.log(`${css} ${Math.round(fs.statSync(css).size / 1000)} KB`);

      const js = `${path}/${slug}.js`;
      console.log(`${js} ${Math.round(fs.statSync(js).size / 1000)} KB`);
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
    styles({sourceMap: false, logger: silent}),
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
  proxy: `${package.name}.test`,
  files: ['assets/**', 'build/*', '**/*.php'],
  host: 'localhost',
  open: false,
  notify: false,
  logLevel: 'silent',
  injectChanges: false,
  ui: false,
};

server.info = function() {
  const host = server.getOption('proxy').get('target');
  const port = server.getOption('port');
  const proxying = `${host}:${port}`;
  const external = server.getOption('urls').get('external');

  console.clear();
  console.log();
  console.log(`Proxying: ${chalk.green(proxying)}`);
  console.log(`External: ${chalk.cyan(external || 'offline')}\n`);
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
  });
}

main();
