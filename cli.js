#!/usr/bin/env node
const esbuild = require('esbuild');
const path = require('path');
const exec = require('child_process').execSync;
const styles = require('esbuild-sass-plugin').sassPlugin;
const qrcode = require('qrcode-terminal');
const chalk = require('chalk');
const bs = require('browser-sync').create();

const cwd = process.cwd();
const package = require(`${cwd}/package.json`);
const command = process.argv[2];

if (!['build', 'watch'].includes(command)) {
  console.log(`Invalid command: ${chalk.red(command)}\n`);
  process.exit();
}

exec(`rm -rf ${cwd}/build/*`);

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
    build.onEnd(result => {
      if (result.errors.length) {
        console.log(result.errors)
      }
    });
  },
});

function entryPoints(suffix = '') {

  if (!suffix.startsWith('.')) {
    suffix = `.${suffix}`;
  }

  const entries = Object.entries({
    admin: path.resolve(cwd, './src/admin'),
    main: path.resolve(cwd, './src'),
  });

  return entries.reduce((result, [name, path]) => {
    result[`${name}${suffix}`] = path;
    return result;
  }, {});
}

const defaults = {
  watch: command === 'watch',
  outdir: path.resolve(cwd, 'build'),
  bundle: true,
  minify: true,
  sourcemap: false,
  logLevel: 'warning',
  legalComments: 'none',
  target: 'es2019',
  plugins: [
    styles({cache: true}),
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

esbuild.build(watchConfig);
esbuild.build(buildConfig);

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

  bs.init(options, () => {

    const host = bs.getOption('proxy').get('target');
    const port = bs.getOption('port');
    const proxying = `${host}:${port}`;
    const external = bs.getOption('urls').get('external');

    external && qrcode.generate(external, {small: true}, console.log);
    console.log(`Proxying: ${chalk.green(proxying)}`);
    console.log(`External: ${chalk.cyan(external || 'offline')}`);
  });
}
