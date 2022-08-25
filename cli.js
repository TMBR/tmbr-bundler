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

exec(`rm -rf ${dir}/build/*`);

function ok() {
  const host = server.getOption('proxy').get('target');
  const port = server.getOption('port');
  const proxying = `${host}:${port}`;
  const external = server.getOption('urls').get('external');

  console.clear();
  external && qrcode.generate(external, {small: true}, console.log);
  console.log(`Proxying: ${chalk.green(proxying)}`);
  console.log(`External: ${chalk.cyan(external || 'offline')}\n`);
}

function entryPoints(suffix = '') {

  if (!suffix.startsWith('.')) {
    suffix = `.${suffix}`;
  }

  const entries = Object.entries({
    admin: path.resolve(dir, './src/admin'),
    main: path.resolve(dir, './src'),
  });

  return entries.reduce((result, [name, path]) => {
    result[`${name}${suffix}`] = path;
    return result;
  }, {});
}

const assets = (options = {}) => ({
  name: 'assets',
  setup(build) {
    build.onResolve({filter: /..\/(fonts|images)\//}, args => ({
      path: args.path,
      external: true
    }))
  },
});

const errors = (options = {}) => ({
  name: 'errors',
  setup(build) {
    build.onEnd(({warnings, errors}) => {
      (warnings.length || errors.length) ? console.log('\007') : ok();
    });
  },
});

const defaults = {
  watch: command === 'watch',
  outdir: path.resolve(dir, 'build'),
  bundle: true,
  minify: true,
  sourcemap: false,
  logLevel: 'warning',
  legalComments: 'none',
  treeShaking: true,
  target: 'es2019',
  plugins: [
    styles({sourceMap: true}),
    assets(),
  ],
};

const watchConfig = Object.assign({}, defaults, {
  entryPoints: entryPoints('dev'),
  minify: false,
  sourcemap: 'inline',
  logLevel: 'silent',
  plugins: [
    ...defaults.plugins,
    errors()
  ],
});

const buildConfig = Object.assign({}, defaults, {
  entryPoints: entryPoints('min'),
});

const noop = fn => fn;
esbuild.build(watchConfig).catch(noop);
esbuild.build(buildConfig).catch(noop);

if (command === 'watch') {

  const watchedBuilds = Object.keys(watchConfig.entryPoints).map(name => (
    `${watchConfig.outdir}/${name}.*`
  ));

  const files = [
    ...watchedBuilds,
    'images/*',
    '**/*.php'
  ];

  const options = {
    proxy: `${package.name}.test`,
    host: 'localhost',
    open: false,
    notify: false,
    logLevel: 'silent',
    ui: false,
    files
  };

  server.init(options, ok);
}
