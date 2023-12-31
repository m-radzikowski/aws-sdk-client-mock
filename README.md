<div align="center">

# AWS SDK v3 Client mock

Easy and powerful mocking of AWS SDK v3 Clients.

[![npm aws-sdk-client-mock](https://img.shields.io/npm/v/aws-sdk-client-mock?color=brightgreen&style=flat-square&label=npm+aws-sdk-client-mock)](https://www.npmjs.com/package/aws-sdk-client-mock)
[![npm aws-sdk-client-mock-jest](https://img.shields.io/npm/v/aws-sdk-client-mock-jest?color=brightgreen&style=flat-square&label=npm+aws-sdk-client-mock-jest)](https://www.npmjs.com/package/aws-sdk-client-mock-jest)

</div>

Library recommended by the AWS SDK for JavaScript team - see the [introductory post on the AWS blog](https://aws.amazon.com/blogs/developer/mocking-modular-aws-sdk-for-javascript-v3-in-unit-tests/).

Features:

- 🌊&nbsp; **fluent interface** - declaring behavior is short and readable
- 🔍&nbsp; **matching options** - defining mock behavior by Command type and/or its input payload
- 🕵️&nbsp; **spying** - checking if Commands were actually sent
- 🃏&nbsp; **Jest matchers** - easily verifying sent Commands
- 🖋️&nbsp; **fully typed** - same type control for declaring mock's behavior as when writing regular code
- ✅&nbsp; **fully tested** - reliable mocks help instead of impeding

In action:

![aws-client-mock-example](media/aws-client-mock-example.gif)

### Table of Contents

- [About AWS SDK v3](#about-aws-sdk-v3)
- [Usage](#usage)
  - [Install](#install)
  - [Import](#import)
  - [Mock](#mock)
    - [DynamoDB DocumentClient](#dynamodb-documentclient)
    - [Lib Storage Upload](#lib-storage-upload)
    - [S3 GetObjectCommand](#s3-getobjectcommand)
    - [Paginated operations](#paginated-operations)
    - [SDK v2-style mocks](#sdk-v2-style-mocks)
  - [Inspect](#inspect)
  - [Reset and restore](#reset-and-restore)
  - [Jest matchers](#jest-matchers)
- [API Reference](#api-reference)
- [AWS Lambda example](#aws-lambda-example)
- [Caveats](#caveats)
  - [Mixed @smithy/types versions](#mixed-smithytypes-versions)
  - [AwsClientStub and strictFunctionTypes](#awsclientstub-and-strictfunctiontypes)
  - [Order of mock behaviors](#order-of-mock-behaviors)
  - [Order of type and instance mocks](#order-of-type-and-instance-mocks)

## About AWS SDK v3

The [AWS SDK for JavaScript version 3](https://docs.aws.amazon.com/sdk-for-javascript/v3/developer-guide/welcome.html),
is the new version of SDK to use in Node.js and browser.
It comes with modular architecture and improved typing,
thanks to being written in TypeScript.

The recommended way of using it is to create a `Client`
and use it to send `Commands`.

For example, using SNS Client to publish a message to a topic looks like that:

```typescript
import {PublishCommand, SNSClient} from '@aws-sdk/client-sns';

const sns = new SNSClient({});
const result = await sns.send(new PublishCommand({
  TopicArn: 'arn:aws:sns:us-east-1:111111111111:MyTopic',
  Message: 'My message',
}));

console.log(`Message published, id: ${result.MessageId}`);
```

This library provides an easy way to mock sending `Commands`
and define returned results depending on the `Command` type and payload.

## Usage

### Install

```bash
npm install -D aws-sdk-client-mock
```

> **Warning**  
> If you are getting type errors `Argument of type 'typeof SomeClient' is not assignable to parameter of type...`
> see instructions [here](#mixed-smithytypes-versions).

#### Versions compatibility

| `@aws-sdk/*` | `aws-sdk-client-mock` |
|--------------|-----------------------|
| ≥ 3.363.0    | 3.x                   |
| < 3.363.0    | 2.x                   |

### Import

CommonJS:

```javascript
const {mockClient} = require('aws-sdk-client-mock');
```

TypeScript / ES6:

```typescript
import {mockClient} from 'aws-sdk-client-mock';
```

### Mock

Create mock for all instances or for given instance of the AWS SDK Client:

```typescript
const snsMock = mockClient(SNSClient);

const dynamoDB = new DynamoDBClient({});
const dynamoDBMock = mockClient(dynamoDB);
```

By default, mocked `Client#send()` method returns `undefined`.

Using the obtained mock instance, you can specify the mock behavior
on receiving various commands to send.

See the [AwsStub API Reference](https://m-radzikowski.github.io/aws-sdk-client-mock/classes/AwsStub.html)
for all available methods or check out the examples below.

Specify default mock behavior:

```typescript
snsMock.onAnyCommand().resolves({});

// same as:

snsMock.resolves({});
```

Specify mock behavior on receiving given command only:

```typescript
snsMock
    .on(PublishCommand)
    .resolves({
        MessageId: '12345678-1111-2222-3333-111122223333',
    });
```

Specify mock behavior on receiving given command with given payload only:

```typescript
snsMock
    .on(PublishCommand, {
        TopicArn: 'arn:aws:sns:us-east-1:111111111111:MyTopic',
        Message: 'My message',
    })
    .resolves({
        MessageId: '12345678-4444-5555-6666-111122223333',
    });
```

Not all payload parameters must be defined to match
(you can force strict matching by passing third param `strict: true`):

```typescript
snsMock
    .on(PublishCommand, {
        Message: 'My message',
    })
    .resolves({
        MessageId: '12345678-4444-5555-6666-111122223333',
    });
```

Specify mock behavior on receiving given payload only:

```typescript
snsMock
    .onAnyCommand({
        TopicArn: 'arn:aws:sns:us-east-1:111111111111:MyTopic',
        Message: 'My message',
    })
    .resolves({
        MessageId: '12345678-4444-5555-6666-111122223333',
    });
```

Multiple behaviors (for different commands and payloads) may be specified
for a single mock:

```typescript
snsMock
    .resolves({ // default for any command
        MessageId: '12345678-1111-2222-3333-111122223333'
    })
    .on(PublishCommand)
    .resolves({ // default for PublishCommand
        MessageId: '12345678-4444-5555-6666-111122223333'
    })
    .on(PublishCommand, {
        TopicArn: 'arn:aws:sns:us-east-1:111111111111:MyTopic',
        Message: 'My message',
    })
    .resolves({ // for PublishCommand with given input
        MessageId: '12345678-7777-8888-9999-111122223333',
    });
```

Specify chained behaviors - next behaviors for consecutive calls:

```typescript
snsMock
    .on(PublishCommand)
    .resolvesOnce({ // for the first command call
        MessageId: '12345678-1111-1111-1111-111122223333'
    })
    .resolvesOnce({ // for the second command call
        MessageId: '12345678-2222-2222-2222-111122223333'
    })
    .resolves({ // for further calls
        MessageId: '12345678-3333-3333-3333-111122223333'
    });
```

Specify mock throwing an error:

```typescript
snsMock
    .rejects('mocked rejection');
```

Specify custom mock function:

```typescript
snsMock
    .callsFake(input => {
        if (input.Message === 'My message') {
            return {MessageId: '12345678-1111-2222-3333-111122223333'};
        } else {
            throw new Error('mocked rejection');
        }
    });
```

Specify custom mock function for a specific command (chained behavior):

```typescript
snsMock
    .on(PublishCommand)
    .callsFake(input => {
        if (input.Message === 'My message') {
            return {MessageId: '12345678-1111-2222-3333-111122223333'};
        } else {
            throw new Error('mocked rejection');
        }
    });
```

Together with `resolvesOnce()`, you can also use `rejectsOnce()` and `callsFakeOnce()`
to specify consecutive behaviors.

#### DynamoDB DocumentClient

You can mock the `DynamoDBDocumentClient` just like any other Client:

```typescript
import {DynamoDBClient} from '@aws-sdk/client-dynamodb';
import {DynamoDBDocumentClient, QueryCommand} from '@aws-sdk/lib-dynamodb';

const ddbMock = mockClient(DynamoDBDocumentClient);
ddbMock.on(QueryCommand).resolves({
    Items: [{pk: 'a', sk: 'b'}],
});

const dynamodb = new DynamoDBClient({});
const ddb = DynamoDBDocumentClient.from(dynamodb);

const query = await ddb.send(new QueryCommand({
  TableName: 'mock',
}));
```

#### Lib Storage Upload

To mock `@aws-sdk/lib-storage` `Upload` you need to mock
at least two commands: `CreateMultipartUploadCommand` and `UploadPartCommand`
used [under the hood](https://github.com/aws/aws-sdk-js-v3/blob/main/lib/lib-storage/src/Upload.ts):

```typescript
import {S3Client, CreateMultipartUploadCommand, UploadPartCommand} from '@aws-sdk/client-s3';
import {Upload} from "@aws-sdk/lib-storage";

const s3Mock = mockClient(S3Client);
s3Mock.on(CreateMultipartUploadCommand).resolves({UploadId: '1'});
s3Mock.on(UploadPartCommand).resolves({ETag: '1'});

const s3Upload = new Upload({
    client: new S3Client({}),
    params: {
        Bucket: 'mock',
        Key: 'test',
        Body: 'x'.repeat(6 * 1024 * 1024), // 6 MB
    },
});

s3Upload.on('httpUploadProgress', (progress) => {
    console.log(progress);
});

await s3Upload.done();
```

This way, the  `Upload#done()` will complete successfuly.

To cause a failure, you need to specify the `rejects()` behavior
for one of the AWS SDK Commands used by the `@aws-sdk/lib-storage`.

For uploading a small file (under the defined multipart upload single part size),
`lib-storage` sends a `PutObjectCommand`. To make it fail:

```ts
s3Mock.on(PutObjectCommand).rejects();
```

For bigger files, it makes a series of calls including `CreateMultipartUploadCommand`,
`UploadPartCommand`, and `CompleteMultipartUploadCommand`. Making any of them fail will fail the upload:

```ts
s3Mock.on(UploadPartCommand).rejects();
```

#### S3 GetObjectCommand

AWS SDK wraps the stream in the S3 `GetObjectCommand` result to provide utility methods to parse it.
To mock it, you need to install the [`@smithy/util-stream`](https://www.npmjs.com/package/@smithy/util-stream) package 
and call the wrapping function `sdkStreamMixin()` on the stream you provide as the command output:

```ts
import {GetObjectCommand, S3Client} from '@aws-sdk/client-s3';
import {sdkStreamMixin} from '@smithy/util-stream';
import {mockClient} from 'aws-sdk-client-mock';
import {Readable} from 'stream';
import {createReadStream} from 'fs';

const s3Mock = mockClient(S3Client);

it('mocks get object', async () => {
    // create Stream from string
    const stream = new Readable();
    stream.push('hello world');
    stream.push(null); // end of stream

    // alternatively: create Stream from file
    // const stream = createReadStream('./test/data.txt');

    // wrap the Stream with SDK mixin
    const sdkStream = sdkStreamMixin(stream);

    s3Mock.on(GetObjectCommand).resolves({Body: sdkStream});

    const s3 = new S3Client({});

    const getObjectResult = await s3.send(new GetObjectCommand({Bucket: '', Key: ''}));

    const str = await getObjectResult.Body?.transformToString();

    expect(str).toBe('hello world');
});
```

#### Paginated operations

To mock a [paginated operation](https://aws.amazon.com/blogs/developer/pagination-using-async-iterators-in-modular-aws-sdk-for-javascript/)
results, simply mock the corresponding Command:

```typescript
import {DynamoDBClient, paginateQuery, QueryCommand} from '@aws-sdk/client-dynamodb';
import {marshall} from '@aws-sdk/util-dynamodb';

const dynamodbMock = mockClient(DynamoDBClient);
dynamodbMock.on(QueryCommand).resolves({
    Items: [
        marshall({pk: 'a', sk: 'b'}),
        marshall({pk: 'c', sk: 'd'}),
    ],
});

const dynamodb = new DynamoDBClient({});
const paginator = paginateQuery({client: dynamodb}, {TableName: 'mock'});

const items = [];
for await (const page of paginator) {
    items.push(...page.Items || []);
}
```

#### SDK v2-style mocks

The AWS SDK v3 gives an option to use it similarly to v2 SDK,
with command method call instead of `send()`:

```typescript
import {SNS} from '@aws-sdk/client-sns';

const sns = new SNS({});
const result = await sns.publish({
    TopicArn: 'arn:aws:sns:us-east-1:111111111111:MyTopic',
    Message: 'My message',
});
```

Although this approach is not recommended by AWS,
those calls can be mocked in the standard way:

```typescript
import {PublishCommand, SNSClient} from '@aws-sdk/client-sns';

const snsMock = mockClient(SNSClient);
snsMock
    .on(PublishCommand)
    .resolves({
        MessageId: '12345678-1111-2222-3333-111122223333',
    });
```

Notice that in mocks you still need to use `SNSClient`, not `SNS`,
as well as `Command` classes.

### Inspect

Inspect received calls:

```typescript
snsMock.calls(); // all received calls
snsMock.call(0); // first received call
```

Get calls of a specified command:

```typescript
snsMock.commandCalls(PublishCommand)
```

Get calls of a specified command with given payload
(you can force strict matching by passing third param `strict: true`):

```typescript
snsMock.commandCalls(PublishCommand, {Message: 'My message'})
```

Under the hood, the library uses [Sinon.js](https://sinonjs.org/) `stub`.
You can get the stub instance to configure and use it directly:

```typescript
const snsSendStub = snsMock.send;
```

### Reset and restore

The Client mock exposes three [Sinon.js](https://sinonjs.org/) `stub` methods:
`reset()`, `resetHistory()`, and `restore()`.

The `reset()` method resets the mock state and behavior.
The Client will continue to be mocked, only now with a clean mock instance,
without any behavior (set with methods like `on(...).resolves(...)`) and calls history.

**You should call `clientMock.reset()` before or after every test
(using `beforeEach()` / `beforeAll()` from your test framework)
to keep tests independent from each other.**

The `resetHistory()` only clear mocked client calls history
that you access with `mockedClient.call(...)` and `mockedClient.calls()`.
The behavior is preserved.

The `restore()` removes the mock altogether,
restoring the normal behavior of `client.send()`.

### Jest matchers

Custom [Jest](https://jestjs.io/) matchers simplify verification
that the mocked Client was called with given Commands.

Matchers are published as a separate package. Install it:

```bash
yarn add -D aws-sdk-client-mock-jest
# or:
npm install -D aws-sdk-client-mock-jest
```

Usage (notice the `import`):

```ts
import 'aws-sdk-client-mock-jest';

// a PublishCommand was sent to SNS
expect(snsMock).toHaveReceivedCommand(PublishCommand);

// two PublishCommands were sent to SNS
expect(snsMock).toHaveReceivedCommandTimes(PublishCommand, 2);

// a PublishCommand with Message "My message" was sent to SNS
expect(snsMock).toHaveReceivedCommandWith(PublishCommand, {Message: 'My message'});

// the second command sent to SNS is a PublishCommand with Message "My message"
expect(snsMock).toHaveReceivedNthCommandWith(2, PublishCommand, {Message: 'My message'});

// the second PublishCommand sent to SNS has Message "My message"
expect(snsMock).toHaveReceivedNthSpecificCommandWith(2, PublishCommand, {Message: 'My message'});
```

Shorter aliases exist, like `toReceiveCommandTimes()`. 

To use those matchers with [Vitest](https://vitest.dev/), set `test.globals` to `true` in `vite.config.js`
(see [#139](https://github.com/m-radzikowski/aws-sdk-client-mock/issues/139)).

To use the matchers outside of Jest, you can pull in the [expect](https://www.npmjs.com/package/expect) library separately
and add it to the global scope directly, e.g.:

```ts
const {expect} = require("expect");
(globalThis as any).expect = expect;
require("aws-sdk-client-mock-jest");
```

## API Reference

See the [full API Reference](https://m-radzikowski.github.io/aws-sdk-client-mock/).

## AWS Lambda example

Example below uses Jest as a test framework, but mocks will work with any testing library.

Let's take a simple Lambda function that takes a list of messages,
sends them to SNS topic and returns message IDs:

```typescript
import {PublishCommand, SNSClient} from '@aws-sdk/client-sns';

const snsTopicArn = process.env.SNS_TOPIC_ARN || '';

const sns = new SNSClient({});

export const handler = async (event: Event): Promise<string[]> => {
  const promises = event.messages.map(async (msg, idx) => {
    const publish = await sns.send(new PublishCommand({
      TopicArn: snsTopicArn,
      Message: msg,
    }));
    return publish.MessageId!;
  });

  return await Promise.all(promises);
};

interface Event {
  messages: string[];
}
```

Then the tests could look like this:

```typescript
import {mockClient} from 'aws-sdk-client-mock';
import {PublishCommand, SNSClient} from '@aws-sdk/client-sns';
import {handler} from '../src';

const snsMock = mockClient(SNSClient);

/**
 * To be sure that unit tests are independent from each other,
 * reset mock behavior between the tests.
 */
beforeEach(() => {
  snsMock.reset();
});

it('message IDs are returned', async () => {
  snsMock.on(PublishCommand).resolves({
    MessageId: '12345678-1111-2222-3333-111122223333',
  });

  const result = await handler({
    messages: ['one', 'two', 'three']
  });

  expect(result).toHaveLength(3);
  expect(result[0]).toBe('12345678-1111-2222-3333-111122223333');
});

it('SNS Client is called with PublishCommand', async () => {
  snsMock.on(PublishCommand).resolves({
    MessageId: '111-222-333',
  });

  await handler({
    messages: ['qq', 'xx']
  });

  expect(snsMock).toHaveReceivedCommandTimes(PublishCommand, 2);
});
```

For more examples, see the [unit tests](packages/aws-sdk-client-mock/test/mockClient.test.ts).

## Caveats

### Mixed @smithy/types versions

> **Note**  
> Those instructions refer to `@smithy/types` used by AWS SDK v3.363.0 and above.
> For version below 3.363.0, perform the same steps for the `@aws-sdk/types` package.

If you have multiple versions of `@smithy/types` installed in your project,
you can get type errors similar to this:

```
TS2345: Argument of type 'typeof DynamoDBDocumentClient' is not assignable to parameter of type 'InstanceOrClassType<Client<ServiceInputTypes, MetadataBearer, any>>'.
  Type 'typeof DynamoDBDocumentClient' is not assignable to type 'ClassType<Client<ServiceInputTypes, MetadataBearer, any>>'.
    The types of 'prototype.middlewareStack.concat' are incompatible between these types.
      Type '<InputType extends ServiceInputTypes, OutputType extends ServiceOutputTypes>(from: MiddlewareStack<InputType, OutputType>) => MiddlewareStack<...>' is not assignable to type '<InputType extends ServiceInputTypes, OutputType extends MetadataBearer>(from: MiddlewareStack<InputType, OutputType>) => MiddlewareStack<InputType, OutputType>'.
        Types of parameters 'from' and 'from' are incompatible.
          Property 'identify' is missing in type 'MiddlewareStack<InputType, OutputType>' but required in type 'MiddlewareStack<InputType, ServiceOutputTypes>'.
```

Run `npm ls @smithy/types` / `pnpm why @smithy/types` / `yarn why @smithy/types`
and check if you have more than one version of the package installed.

To solve this, go through the steps until one works:

- make sure all your `@aws-sdk/*` packages point to the same version,
- remove all `@aws-sdk/*` packages from `package.json`, run `npm install` / `pnpm install` / `yarn install`,
  restore `@aws-sdk/*` packages in `package.json`, and run install again,
- add `@smithy/types` to your dev dependencies in the latest version,
- force using single `@smithy/types` version with [npm overrides](https://docs.npmjs.com/cli/v9/configuring-npm/package-json#overrides),
  [pnpm overrides](https://pnpm.io/package_json#pnpmoverrides), or [yarn resolutions](https://yarnpkg.com/configuration/manifest#resolutions),
- if nothing else helped, open an issue including the output of `npm ls @smithy/types` / `pnpm why @smithy/types` / `yarn why @smithy/types`.

### AwsClientStub and strictFunctionTypes

If you need to explicitly type the mock variable,
you can use `AwsClientStub` type:

```ts
import {AwsClientStub, mockClient} from 'aws-sdk-client-mock'
import {S3Client} from "@aws-sdk/client-s3";

const mock: AwsClientStub<S3Client> = mockClient(S3Client);
```

The `AwsClientStub` type works only with `tsconfig` option
`strictFunctionTypes=true` or (`strict=true`) in `tsconfig.json` file.

See details in [#167](https://github.com/m-radzikowski/aws-sdk-client-mock/issues/167).

### Order of mock behaviors

Wider Command matchers must be declared first,
otherwise, they will take precedence over previous ones.

In this case, all `PublishCommand` sends will return message ID `222`:

```typescript
snsMock
  .on(PublishCommand, myInput).resolves({MessageId: '111'})
  .on(PublishCommand).resolves({MessageId: '222'});
```

If the order of the declarations is switched, sends with input matching `myInput`
will return ID `111` and all others `222`.

It works similarly with `onAnyCommand()`.

### Order of type and instance mocks

When you create both a Client type mock
and a specific Client instance mock(s),
you need to declare type mock last.
Otherwise, the other instances will not be mocked.

Right now if you create a mock for the Client type,
and then mock a specific instance of this Client,
with the order of mocking as here:

```typescript
const sns1 = new SNSClient({}); // not mocked

mockClient(SNSClient).resolves({MessageId: '123'});

const sns2 = new SNSClient({}); // mocked
mockClient(sns2).resolves({MessageId: '456'});

const sns3 = new SNSClient({}); // not mocked
```

Declaring mocks in this order will fix it:

```typescript
const sns1 = new SNSClient({}); // mocked - default

const sns2 = new SNSClient({}); // mocked
mockClient(sns2).resolves({MessageId: '456'});

mockClient(SNSClient).resolves({MessageId: '123'});

const sns3 = new SNSClient({}); // mocked - default
```

PRs to fix this are welcome.

### Using with Mocha

When testing with Mocha, call `mockClient()`
in the `beforeEach()` method, not in the global scope,
to prevent overriding the mock between test files.
See [this](https://github.com/m-radzikowski/aws-sdk-client-mock/issues/64)
for more details.
