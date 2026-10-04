const { realpathSync } = require('node:fs');
const { createRequire } = require('node:module');
const { dirname, join, sep } = require('node:path');
const { getDefaultConfig } = require('expo/metro-config');
const { withUniwindConfig } = require('uniwind/metro');

const config = getDefaultConfig(__dirname);
const { resolve: metroResolve } = createRequire(require.resolve('metro/package.json'))(
  'metro-resolver',
);

const baseResolveRequest = config.resolver.resolveRequest ?? metroResolve;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'react-native' && isUniwindInternalPath(context.originModulePath)) {
    return metroResolve({ ...context, resolveRequest: metroResolve }, moduleName, platform);
  }

  if (moduleName === 'uniwind' || moduleName.startsWith('uniwind/')) {
    const pinnedContext = { ...context, originModulePath: join(__dirname, 'package.json') };
    return metroResolve({ ...pinnedContext, resolveRequest: metroResolve }, moduleName, platform);
  }

  return baseResolveRequest(context, moduleName, platform);
};

const uniwindConfig = withUniwindConfig(config, {
  cssEntryFile: './src/global.css',
  dtsFile: './src/uniwind-types.d.ts',
});

const uniwindPackageRoot = dirname(realpathSync(require.resolve('uniwind/package.json')));
const uniwindResolveRequest = uniwindConfig.resolver.resolveRequest;

function isUniwindInternalPath(modulePath) {
  if (modulePath.includes(`${sep}node_modules${sep}uniwind${sep}`)) return true;

  try {
    return realpathSync(modulePath).startsWith(`${uniwindPackageRoot}${sep}`);
  } catch {
    return modulePath.startsWith(`${uniwindPackageRoot}${sep}`);
  }
}

uniwindConfig.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'react-native' && isUniwindInternalPath(context.originModulePath)) {
    return metroResolve({ ...context, resolveRequest: metroResolve }, moduleName, platform);
  }

  return uniwindResolveRequest(context, moduleName, platform);
};

module.exports = uniwindConfig;
