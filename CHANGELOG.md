# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

## [1.0.0](https://github.com/m-radzikowski/aws-sdk-client-mock/compare/v0.6.2...v1.0.0) (2022-06-14)


### ⚠ BREAKING CHANGES

* remove @aws-sdk types and client-s3 from peer dependencies (#57)

### Features

* introduce jest matchers ([#97](https://github.com/m-radzikowski/aws-sdk-client-mock/issues/97)) ([b5f2c10](https://github.com/m-radzikowski/aws-sdk-client-mock/commit/b5f2c100075ad0d30856ec611bed739812b4a872))


### Bug Fixes

* remove [@aws-sdk](https://github.com/aws-sdk) types and client-s3 from peer dependencies ([#57](https://github.com/m-radzikowski/aws-sdk-client-mock/issues/57)) ([c66e050](https://github.com/m-radzikowski/aws-sdk-client-mock/commit/c66e050ba87895120277af3b4739f761c1ed231a))

### [0.6.2](https://github.com/m-radzikowski/aws-sdk-client-mock/compare/v0.6.1...v0.6.2) (2022-03-06)


### Features

* chained behaviors for consecutive command calls ([#80](https://github.com/m-radzikowski/aws-sdk-client-mock/issues/80)) ([fe131a9](https://github.com/m-radzikowski/aws-sdk-client-mock/commit/fe131a92afedd653ad576d7ac415d24a1984d6c1))

### [0.6.1](https://github.com/m-radzikowski/aws-sdk-client-mock/compare/v0.6.0...v0.6.1) (2022-03-05)


### Bug Fixes

* bump typescript to 4.6.2 ([5c29961](https://github.com/m-radzikowski/aws-sdk-client-mock/commit/5c29961e2c0e93e23d0cac705aad8cbcb8ec406d)), closes [#79](https://github.com/m-radzikowski/aws-sdk-client-mock/issues/79)

## [0.6.0](https://github.com/m-radzikowski/aws-sdk-client-mock/compare/v0.5.6...v0.6.0) (2022-02-12)


### ⚠ BREAKING CHANGES

* recreate mock on reset() (#76)

### Bug Fixes

* recreate mock on reset() ([#76](https://github.com/m-radzikowski/aws-sdk-client-mock/issues/76)) ([9e1a873](https://github.com/m-radzikowski/aws-sdk-client-mock/commit/9e1a873e0dbd2c969a7f164d9dca4ebf50a5db51)), closes [#1572](https://github.com/m-radzikowski/aws-sdk-client-mock/issues/1572) [#1572](https://github.com/m-radzikowski/aws-sdk-client-mock/issues/1572)

### [0.5.6](https://github.com/m-radzikowski/aws-sdk-client-mock/compare/v0.5.5...v0.5.6) (2021-11-06)


### Features

* getting mock calls with command type and payload filter ([#61](https://github.com/m-radzikowski/aws-sdk-client-mock/issues/61)) ([b3f3250](https://github.com/m-radzikowski/aws-sdk-client-mock/commit/b3f32507162e7e0054e40807c9119faf5266f969))

### [0.5.5](https://github.com/m-radzikowski/aws-sdk-client-mock/compare/v0.5.4...v0.5.5) (2021-09-19)


### Bug Fixes

* not requiring @aws-sdk/client-s3 installed if not using lib-storage mock ([#51](https://github.com/m-radzikowski/aws-sdk-client-mock/issues/51)) ([67d55d2](https://github.com/m-radzikowski/aws-sdk-client-mock/commit/67d55d2bd83c89d61d609a2eb30978a028b89b50))

### [0.5.4](https://github.com/m-radzikowski/aws-sdk-client-mock/compare/v0.5.3...v0.5.4) (2021-09-16)


### Features

* helper to mock @aws-sdk/lib-storage Upload ([#47](https://github.com/m-radzikowski/aws-sdk-client-mock/issues/47)) ([10780e8](https://github.com/m-radzikowski/aws-sdk-client-mock/commit/10780e821be9d6ef497579beb02f96ba222f6e62))

### [0.5.3](https://github.com/m-radzikowski/aws-sdk-client-mock/compare/v0.5.2...v0.5.3) (2021-06-24)


### Features

* **src:** enable types as peer dependencies to get around bumping wi… ([#35](https://github.com/m-radzikowski/aws-sdk-client-mock/issues/35)) ([2150567](https://github.com/m-radzikowski/aws-sdk-client-mock/commit/215056733f44cfca19242a4456fcaa6d188abf6d))

### [0.5.2](https://github.com/m-radzikowski/aws-sdk-client-mock/compare/v0.5.1...v0.5.2) (2021-06-14)

### [0.5.1](https://github.com/m-radzikowski/aws-sdk-client-mock/compare/v0.5.0...v0.5.1) (2021-06-13)


### Bug Fixes

* move tslib to dependencies ([#31](https://github.com/m-radzikowski/aws-sdk-client-mock/issues/31)) ([df8bd27](https://github.com/m-radzikowski/aws-sdk-client-mock/commit/df8bd2743e4da1ad97935fede5c930d0db59bcc9))

## [0.5.0](https://github.com/m-radzikowski/aws-sdk-client-mock/compare/v0.4.0...v0.5.0) (2021-05-31)


### ⚠ BREAKING CHANGES

* bump Sinon to v11 (#27)

### Bug Fixes

* make compatibility test project dir ([2aef307](https://github.com/m-radzikowski/aws-sdk-client-mock/commit/2aef3077089ab39d6185cfdec6a13ecf139bdd11))


* bump Sinon to v11 ([#27](https://github.com/m-radzikowski/aws-sdk-client-mock/issues/27)) ([2edad51](https://github.com/m-radzikowski/aws-sdk-client-mock/commit/2edad513c4788ab137e1348c13e53ae0b891a68f)), closes [#24](https://github.com/m-radzikowski/aws-sdk-client-mock/issues/24) [#22](https://github.com/m-radzikowski/aws-sdk-client-mock/issues/22)

## [0.4.0](https://github.com/m-radzikowski/aws-sdk-client-mock/compare/v0.3.0...v0.4.0) (2021-05-06)


### ⚠ BREAKING CHANGES

* partial payload matching by default (#16)

### Features

* partial payload matching by default ([#16](https://github.com/m-radzikowski/aws-sdk-client-mock/issues/16)) ([3bdc6bb](https://github.com/m-radzikowski/aws-sdk-client-mock/commit/3bdc6bb3be4a3b2e95be7c7093c8cd5a5625d656))

### [0.3.1](https://github.com/m-radzikowski/aws-sdk-client-mock/compare/v0.3.0...v0.3.1) (2021-05-01)

### [0.3.0](https://github.com/m-radzikowski/aws-sdk-client-mock/compare/v0.2.0...v0.3.0) (2021-04-11)


### Features

* DynamoDB DocumentClient mocking ([#11](https://github.com/m-radzikowski/aws-sdk-client-mock/issues/11)) ([a1de5fe](https://github.com/m-radzikowski/aws-sdk-client-mock/commit/a1de5fefaae2d5bfe0a8dadb5a7468f0c4d56790))

## 0.2.0 (2021-03-06)


### ⚠ BREAKING CHANGES

* type-checking of resolved responses (#2)

### Features

* type-checking of resolved responses ([#2](https://github.com/m-radzikowski/aws-sdk-client-mock/issues/2)) ([da31c40](https://github.com/m-radzikowski/aws-sdk-client-mock/commit/da31c40329fd53c4b5d9debd34413662ddbdc26e))

## 0.1.1 (2021-02-18)

Initial release
