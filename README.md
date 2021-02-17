# AWS SDK v3 Client mock

Easy and powerful mocking of AWS SDK v3 Clients.

Features:

- 🌊&nbsp; **fluent interface** - declaring behavior is short and readable
- 🔍&nbsp; **matching options** - defining mock behavior by Command type and/or its input payload
- 🕵️&nbsp; **spying** - checking if Commands were actually send
- 🖋️&nbsp; **fully typed** - same type control for declaring mock's behavior as when writing regular code
- ✅&nbsp; **fully tested** - reliable mocks help instead of impeding

### Table of Contents

- [About AWS SDK v3](#about-aws-sdk-v3)
- [Usage](#usage)
  - [Install](#install)
  - [Import](#import)
  - [Mock](#mock)
- [API Reference](#api-reference)
- [AWS Lambda example](#aws-lambda-example)
- [Caveats](#caveats)
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

or

```bash
yarn add -D aws-sdk-client-mock
```

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

Multiple behaviors (for different commands and payloads) may be specified
for a single mock.

Inspect received calls:

```typescript
snsMock.calls(); // all received calls
snsMock.call(0); // first received call
```

Under the hood, the library uses [Sinon.js](https://sinonjs.org/) `stub`.
You can get the stub instance to configure and use it directly:

```typescript
const snsSendStub = snsMock.send;
```

## API Reference

See the [full API Reference](#). TODO

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
import {mockClient} from '@m-radzikowski/aws-sdk-client-mock';
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
  snsMock.on(PublishCommand, {
    MessageId: '12345678-1111-2222-3333-111122223333',
  });

  const result = await handler({
    messages: ['one', 'two', 'three']
  });

  expect(result).toHaveLength(3);
  expect(result[0]).toBe('12345678-1111-2222-3333-111122223333');
});

it('SNS Client is called', async () => {
  snsMock.on(PublishCommand, {
    MessageId: '111-222-333',
  });

  await handler({
    messages: ['qq', 'xx']
  });

  expect(snsMock.calls()).toHaveLength(2);
});
```

For more examples, see the [unit tests](./test/mockClient.test.ts).

## Caveats

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
