# Changelog
All notable changes to this project will be documented in this file.

## [Unreleased]

## [1.4.1]
 - npm audit fix

## [1.4.0]
 - fix tests and `output.options` handling, so the plugin is compatible with both rollup v1 and v2

## [1.3.1]
 - add `repository.url` to `package.json`

## [1.3.0]
 - fix npm audit volnurabilities, npm packages upgrade

## [1.2.0]
 - fix relative path calculation in shared chunks

## [1.1.0]
 - use new rollup api: `emitFile` instead of `emitAsset`
 - remove empty imports of assets, e.g. `import './file.css';`.
    The feature is there by design in rollup. But it could cause troubles for non-js files
 - script to automaticaly update changelog for `npm verion [type]`

## [1.0.0]
 - Initial Realease