# Changelog
All notable changes to this project will be documented in this file.

## [Unreleased]
 - use new rollup api: `emitFile` instead of `emitAsset`
 - remove empty imports of assets, e.g. `import './file.css';`.
    The feature is there by design in rollup. But it could cause troubles for non-js files

[1.0.0]
 - Initial Realease