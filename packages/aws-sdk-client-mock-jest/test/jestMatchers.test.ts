import {AwsClientStub, mockClient} from 'aws-sdk-client-mock';
import {PublishCommand, SNSClient} from '@aws-sdk/client-sns';
import {publishCmd1, publishCmd2, subscribeCmd1} from 'aws-sdk-client-mock/test/fixtures';
import '../src';

let snsMock: AwsClientStub<SNSClient>;

beforeEach(() => {
    snsMock = mockClient(SNSClient);
});

afterEach(() => {
    snsMock.restore();
});

describe('toHaveReceivedCommand', () => {
    it('passes on receiving Command', async () => {
        const sns = new SNSClient({});
        await sns.send(publishCmd1);

        expect(() => expect(snsMock).toHaveReceivedCommand(PublishCommand)).not.toThrow();
    });

    it('fails on not receiving Command', () => {
        expect(() => expect(snsMock).toHaveReceivedCommand(PublishCommand)).toThrowErrorMatchingInlineSnapshot(`
"Expected SNSClient to receive <green>"PublishCommand"</color>
SNSClient received <green>"PublishCommand"</color> <red>0</color> times"
`);
    });

    it('fails on receiving Command with not', async () => {
        const sns = new SNSClient({});
        await sns.send(publishCmd1);

        expect(() => expect(snsMock).not.toHaveReceivedCommand(PublishCommand)).toThrowErrorMatchingInlineSnapshot(`
"Expected SNSClient to not receive <green>"PublishCommand"</color>
SNSClient received <green>"PublishCommand"</color> <red>1</color> times

Calls:
  1. PublishCommand: <red>{"Message": "mock message", "TopicArn": "arn:aws:sns:us-east-1:111111111111:MyTopic"}</color>"
`);
    });
});

describe('toHaveReceivedCommandTimes', () => {
    it('passes on receiving Command twice', async () => {
        const sns = new SNSClient({});
        await sns.send(publishCmd1);
        await sns.send(publishCmd2);

        expect(() => expect(snsMock).toHaveReceivedCommandTimes(PublishCommand, 2)).not.toThrow();
    });

    it('fails on not receiving Command twice', async () => {
        const sns = new SNSClient({});
        await sns.send(publishCmd1);

        expect(() => expect(snsMock).toHaveReceivedCommandTimes(PublishCommand, 2)).toThrowErrorMatchingInlineSnapshot(`
"Expected SNSClient to receive <green>"PublishCommand"</color> <green>2</color> times
SNSClient received <green>"PublishCommand"</color> <red>1</color> times

Calls:
  1. PublishCommand: <red>{"Message": "mock message", "TopicArn": "arn:aws:sns:us-east-1:111111111111:MyTopic"}</color>"
`);
    });

    it('fails on receiving Command twice with not', async () => {
        const sns = new SNSClient({});
        await sns.send(publishCmd1);
        await sns.send(publishCmd1);

        expect(() => expect(snsMock).not.toHaveReceivedCommandTimes(PublishCommand, 2)).toThrowErrorMatchingInlineSnapshot(`
"Expected SNSClient to not receive <green>"PublishCommand"</color> <green>2</color> times
SNSClient received <green>"PublishCommand"</color> <red>2</color> times

Calls:
  1. PublishCommand: <red>{"Message": "mock message", "TopicArn": "arn:aws:sns:us-east-1:111111111111:MyTopic"}</color>
  2. PublishCommand: <red>{"Message": "mock message", "TopicArn": "arn:aws:sns:us-east-1:111111111111:MyTopic"}</color>"
`);
    });
});

describe('toHaveReceivedCommandWith', () => {
    it('passes on receiving Command with partial match', async () => {
        const sns = new SNSClient({});
        await sns.send(publishCmd1);
        await sns.send(publishCmd2);

        expect(() => expect(snsMock).toHaveReceivedCommandWith(PublishCommand, {Message: publishCmd2.input.Message})).not.toThrow();
    });

    it('fails on not receiving Command', async () => {
        const sns = new SNSClient({});
        await sns.send(publishCmd1);

        expect(() => expect(snsMock).toHaveReceivedCommandWith(PublishCommand, {Message: publishCmd2.input.Message})).toThrowErrorMatchingInlineSnapshot(`
"Expected SNSClient to receive <green>"PublishCommand"</color> with <green>{"Message": "second mock message"}</color>
SNSClient received matching <green>"PublishCommand"</color> <red>0</color> times

Calls:
  1. PublishCommand: <red>{"Message": "mock message", "TopicArn": "arn:aws:sns:us-east-1:111111111111:MyTopic"}</color>"
`);
    });

    it('fails on receiving Command with partial match with not', async () => {
        const sns = new SNSClient({});
        await sns.send(publishCmd1);

        expect(() => expect(snsMock).not.toHaveReceivedCommandWith(PublishCommand, {Message: publishCmd1.input.Message})).toThrowErrorMatchingInlineSnapshot(`
"Expected SNSClient to not receive <green>"PublishCommand"</color> with <green>{"Message": "mock message"}</color>
SNSClient received matching <green>"PublishCommand"</color> <red>1</color> times

Calls:
  1. PublishCommand: <red>{"Message": "mock message", "TopicArn": "arn:aws:sns:us-east-1:111111111111:MyTopic"}</color>"
`);
    });

    it('passes on match with asymmetric matcher', async () => {
        const sns = new SNSClient({});
        await sns.send(publishCmd1);

        expect(() => expect(snsMock).toHaveReceivedCommandWith(PublishCommand, {
            Message: expect.stringMatching(/message/), // eslint-disable-line @typescript-eslint/no-unsafe-assignment
        })).not.toThrow();
    });

    it('fails on unmatch with asymmetric matcher', async () => {
        const sns = new SNSClient({});
        await sns.send(publishCmd1);

        expect(() => expect(snsMock).toHaveReceivedCommandWith(PublishCommand, {
            Message: expect.stringMatching(/qq/), // eslint-disable-line @typescript-eslint/no-unsafe-assignment
        })).toThrowErrorMatchingInlineSnapshot(`
"Expected SNSClient to receive <green>"PublishCommand"</color> with <green>{"Message": StringMatching /qq/}</color>
SNSClient received matching <green>"PublishCommand"</color> <red>0</color> times

Calls:
  1. PublishCommand: <red>{"Message": "mock message", "TopicArn": "arn:aws:sns:us-east-1:111111111111:MyTopic"}</color>"
`);
    });
});

describe('toHaveReceivedNthCommandWith', () => {
    it('passes on receiving second Command with partial match', async () => {
        const sns = new SNSClient({});
        await sns.send(publishCmd1);
        await sns.send(publishCmd2);

        expect(() => expect(snsMock).toHaveReceivedNthCommandWith(2, PublishCommand, {Message: publishCmd2.input.Message})).not.toThrow();
    });

    it('fails on not receiving second Command', async () => {
        const sns = new SNSClient({});
        await sns.send(publishCmd1);
        await sns.send(publishCmd1);

        expect(() => expect(snsMock).toHaveReceivedNthCommandWith(2, PublishCommand, {Message: publishCmd2.input.Message})).toThrowErrorMatchingInlineSnapshot(`
"Expected SNSClient to receive 2. <green>"PublishCommand"</color> with <green>{"Message": "second mock message"}</color>
SNSClient received <red>"PublishCommand"</color> with input:
<green>- Expected  - 1</color>
<red>+ Received  + 2</color>

<dim>  Object {</intensity>
<green>-   "Message": "second mock message",</color>
<red>+   "Message": "mock message",</color>
<red>+   "TopicArn": "arn:aws:sns:us-east-1:111111111111:MyTopic",</color>
<dim>  }</intensity>

Calls:
  1. PublishCommand: <red>{"Message": "mock message", "TopicArn": "arn:aws:sns:us-east-1:111111111111:MyTopic"}</color>
  2. PublishCommand: <red>{"Message": "mock message", "TopicArn": "arn:aws:sns:us-east-1:111111111111:MyTopic"}</color>"
`);
    });

    it('fails on receiving second Command with not', async () => {
        const sns = new SNSClient({});
        await sns.send(publishCmd1);
        await sns.send(publishCmd2);

        expect(() => expect(snsMock).not.toHaveReceivedNthCommandWith(2, PublishCommand, {Message: publishCmd2.input.Message})).toThrowErrorMatchingInlineSnapshot(`
"Expected SNSClient to not receive 2. <green>"PublishCommand"</color> with <green>{"Message": "second mock message"}</color>
SNSClient received <red>"PublishCommand"</color> with input:
<green>- Expected  - 0</color>
<red>+ Received  + 1</color>

<dim>  Object {</intensity>
<dim>    "Message": "second mock message",</intensity>
<red>+   "TopicArn": "arn:aws:sns:us-east-1:111111111111:MyTopic",</color>
<dim>  }</intensity>

Calls:
  1. PublishCommand: <red>{"Message": "mock message", "TopicArn": "arn:aws:sns:us-east-1:111111111111:MyTopic"}</color>
  2. PublishCommand: <red>{"Message": "second mock message", "TopicArn": "arn:aws:sns:us-east-1:111111111111:MyTopic"}</color>"
`);
    });

    it('fails on receiving less Commands than the nth requested', async () => {
        const sns = new SNSClient({});
        await sns.send(publishCmd1);

        expect(() => expect(snsMock).toHaveReceivedNthCommandWith(2, PublishCommand, {Message: publishCmd2.input.Message})).toThrowErrorMatchingInlineSnapshot(`
"Expected SNSClient to receive 2. <green>"PublishCommand"</color> with <green>{"Message": "second mock message"}</color>

Calls:
  1. PublishCommand: <red>{"Message": "mock message", "TopicArn": "arn:aws:sns:us-east-1:111111111111:MyTopic"}</color>"
`);
    });

    it('passes on match with asymmetric matcher', async () => {
        const sns = new SNSClient({});
        await sns.send(publishCmd1);
        await sns.send(publishCmd2);

        expect(() => expect(snsMock).toHaveReceivedNthCommandWith(2, PublishCommand, {
            Message: expect.stringMatching(/second/), // eslint-disable-line @typescript-eslint/no-unsafe-assignment
        })).not.toThrow();
    });

    it('fails on unmatch with asymmetric matcher', async () => {
        const sns = new SNSClient({});
        await sns.send(publishCmd1);
        await sns.send(publishCmd2);

        expect(() => expect(snsMock).toHaveReceivedNthCommandWith(2, PublishCommand, {
            Message: expect.stringMatching(/qq/), // eslint-disable-line @typescript-eslint/no-unsafe-assignment
        })).toThrowErrorMatchingInlineSnapshot(`
"Expected SNSClient to receive 2. <green>"PublishCommand"</color> with <green>{"Message": StringMatching /qq/}</color>
SNSClient received <red>"PublishCommand"</color> with input:
<green>- Expected  - 1</color>
<red>+ Received  + 2</color>

<dim>  Object {</intensity>
<green>-   "Message": StringMatching /qq/,</color>
<red>+   "Message": "second mock message",</color>
<red>+   "TopicArn": "arn:aws:sns:us-east-1:111111111111:MyTopic",</color>
<dim>  }</intensity>

Calls:
  1. PublishCommand: <red>{"Message": "mock message", "TopicArn": "arn:aws:sns:us-east-1:111111111111:MyTopic"}</color>
  2. PublishCommand: <red>{"Message": "second mock message", "TopicArn": "arn:aws:sns:us-east-1:111111111111:MyTopic"}</color>"
`);
    });
});

describe('toHaveReceivedNthSpecificCommandWith', () => {
    it('passes on receiving second Command with partial match', async () => {
        const sns = new SNSClient({});
        await sns.send(publishCmd1);
        await sns.send(subscribeCmd1);
        await sns.send(publishCmd2);

        expect(() => expect(snsMock).toHaveReceivedNthSpecificCommandWith(2, PublishCommand, {Message: publishCmd2.input.Message})).not.toThrow();
    });

    it('fails on receiving less Commands than the nth expected', async () => {
        const sns = new SNSClient({});
        await sns.send(publishCmd1);

        expect(() => expect(snsMock).toHaveReceivedNthSpecificCommandWith(2, PublishCommand, {Message: publishCmd2.input.Message})).toThrowErrorMatchingInlineSnapshot(`
"Expected SNSClient to receive 2. <green>"PublishCommand"</color> with <green>{"Message": "second mock message"}</color>

Calls:
  1. PublishCommand: <red>{"Message": "mock message", "TopicArn": "arn:aws:sns:us-east-1:111111111111:MyTopic"}</color>"
`);
    });
});
