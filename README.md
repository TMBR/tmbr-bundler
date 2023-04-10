# tmbr-bundler

A configurable JavaScript and CSS bundler built on [esbuild](https://esbuild.github.io) and [browser-sync](https://browsersync.io). Specifically developed for WordPress development where CI/CD is not available, allowing for concurrent development and production bundles.

**Why [esbuild](https://esbuild.github.io)?**

Compared to the mess of webpack loaders and dependencies, esbuild is faster, has better documentation and zero dependencies by default. It was created by Evan Wallace, who built this amazing [WebGL demo](https://madebyevan.com/webgl-water) ... oh yeah, and also co-founded [Figma](https://www.figma.com/).

## Installation 

```bash
npm install @tmbr/bundler --save-dev
```

## Usage
