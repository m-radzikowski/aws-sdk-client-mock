import {AwsClientStub, mockClient} from '../src';
import {PublishCommand, SNSClient} from '@aws-sdk/client-sns';
import {publishCmd1, publishCmd2} from './fixtures';

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
"Expected SNSClient to receive <green>\\"PublishCommand\\"</>
SNSClient received <green>\\"PublishCommand\\"</> <red>0</> times"
`);
    });

    it('fails on receiving Command with not', async () => {
        const sns = new SNSClient({});
        await sns.send(publishCmd1);

        expect(() => expect(snsMock).not.toHaveReceivedCommand(PublishCommand)).toThrowErrorMatchingInlineSnapshot(`
"Expected SNSClient to not receive <green>\\"PublishCommand\\"</>
SNSClient received <green>\\"PublishCommand\\"</> <red>1</> times

Calls:
  1. PublishCommand: <red>{\\"Message\\": \\"mock message\\", \\"TopicArn\\": \\"arn:aws:sns:us-east-1:111111111111:MyTopic\\"}</>"
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
"Expected SNSClient to receive <green>\\"PublishCommand\\"</> <green>2</> times
SNSClient received <green>\\"PublishCommand\\"</> <red>1</> times

Calls:
  1. PublishCommand: <red>{\\"Message\\": \\"mock message\\", \\"TopicArn\\": \\"arn:aws:sns:us-east-1:111111111111:MyTopic\\"}</>"
`);
    });

    it('fails on receiving Command twice with not', async () => {
        const sns = new SNSClient({});
        await sns.send(publishCmd1);
        await sns.send(publishCmd1);

        expect(() => expect(snsMock).not.toHaveReceivedCommandTimes(PublishCommand, 2)).toThrowErrorMatchingInlineSnapshot(`
"Expected SNSClient to not receive <green>\\"PublishCommand\\"</> <green>2</> times
SNSClient received <green>\\"PublishCommand\\"</> <red>2</> times

Calls:
  1. PublishCommand: <red>{\\"Message\\": \\"mock message\\", \\"TopicArn\\": \\"arn:aws:sns:us-east-1:111111111111:MyTopic\\"}</>
  2. PublishCommand: <red>{\\"Message\\": \\"mock message\\", \\"TopicArn\\": \\"arn:aws:sns:us-east-1:111111111111:MyTopic\\"}</>"
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
"Expected SNSClient to receive <green>\\"PublishCommand\\"</> with <green>{\\"Message\\": \\"second mock message\\"}</>
SNSClient received matching <green>\\"PublishCommand\\"</> <red>0</> times

Calls:
  1. PublishCommand: <red>{\\"Message\\": \\"mock message\\", \\"TopicArn\\": \\"arn:aws:sns:us-east-1:111111111111:MyTopic\\"}</>"
`);
    });

    it('fails on receiving Command with partial match with not', async () => {
        const sns = new SNSClient({});
        await sns.send(publishCmd1);

        expect(() => expect(snsMock).not.toHaveReceivedCommandWith(PublishCommand, {Message: publishCmd1.input.Message})).toThrowErrorMatchingInlineSnapshot(`
"Expected SNSClient to not receive <green>\\"PublishCommand\\"</> with <green>{\\"Message\\": \\"mock message\\"}</>
SNSClient received matching <green>\\"PublishCommand\\"</> <red>1</> times

Calls:
  1. PublishCommand: <red>{\\"Message\\": \\"mock message\\", \\"TopicArn\\": \\"arn:aws:sns:us-east-1:111111111111:MyTopic\\"}</>"
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
"Expected SNSClient to receive <green>\\"PublishCommand\\"</> with <green>{\\"Message\\": StringMatching /qq/}</>
SNSClient received matching <green>\\"PublishCommand\\"</> <red>0</> times

Calls:
  1. PublishCommand: <red>{\\"Message\\": \\"mock message\\", \\"TopicArn\\": \\"arn:aws:sns:us-east-1:111111111111:MyTopic\\"}</>"
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
"Expected SNSClient to receive 2. <green>\\"PublishCommand\\"</> with <green>{\\"Message\\": \\"second mock message\\"}</>
SNSClient received <red>\\"PublishCommand\\"</> with input:
<green>- Expected  - 1</>
<red>+ Received  + 2</>

<dim>  Object {</>
<green>-   \\"Message\\": \\"second mock message\\",</>
<red>+   \\"Message\\": \\"mock message\\",</>
<red>+   \\"TopicArn\\": \\"arn:aws:sns:us-east-1:111111111111:MyTopic\\",</>
<dim>  }</>

Calls:
  1. PublishCommand: <red>{\\"Message\\": \\"mock message\\", \\"TopicArn\\": \\"arn:aws:sns:us-east-1:111111111111:MyTopic\\"}</>
  2. PublishCommand: <red>{\\"Message\\": \\"mock message\\", \\"TopicArn\\": \\"arn:aws:sns:us-east-1:111111111111:MyTopic\\"}</>"
`);
    });

    it('fails on receiving second Command with not', async () => {
        const sns = new SNSClient({});
        await sns.send(publishCmd1);
        await sns.send(publishCmd2);

        expect(() => expect(snsMock).not.toHaveReceivedNthCommandWith(2, PublishCommand, {Message: publishCmd2.input.Message})).toThrowErrorMatchingInlineSnapshot(`
"Expected SNSClient to not receive 2. <green>\\"PublishCommand\\"</> with <green>{\\"Message\\": \\"second mock message\\"}</>
SNSClient received <red>\\"PublishCommand\\"</> with input:
<green>- Expected  - 0</>
<red>+ Received  + 1</>

<dim>  Object {</>
<dim>    \\"Message\\": \\"second mock message\\",</>
<red>+   \\"TopicArn\\": \\"arn:aws:sns:us-east-1:111111111111:MyTopic\\",</>
<dim>  }</>

Calls:
  1. PublishCommand: <red>{\\"Message\\": \\"mock message\\", \\"TopicArn\\": \\"arn:aws:sns:us-east-1:111111111111:MyTopic\\"}</>
  2. PublishCommand: <red>{\\"Message\\": \\"second mock message\\", \\"TopicArn\\": \\"arn:aws:sns:us-east-1:111111111111:MyTopic\\"}</>"
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
"Expected SNSClient to receive 2. <green>\\"PublishCommand\\"</> with <green>{\\"Message\\": StringMatching /qq/}</>
SNSClient received <red>\\"PublishCommand\\"</> with input:
<green>- Expected  - 1</>
<red>+ Received  + 2</>

<dim>  Object {</>
<green>-   \\"Message\\": StringMatching /qq/,</>
<red>+   \\"Message\\": \\"second mock message\\",</>
<red>+   \\"TopicArn\\": \\"arn:aws:sns:us-east-1:111111111111:MyTopic\\",</>
<dim>  }</>

Calls:
  1. PublishCommand: <red>{\\"Message\\": \\"mock message\\", \\"TopicArn\\": \\"arn:aws:sns:us-east-1:111111111111:MyTopic\\"}</>
  2. PublishCommand: <red>{\\"Message\\": \\"second mock message\\", \\"TopicArn\\": \\"arn:aws:sns:us-east-1:111111111111:MyTopic\\"}</>"
`);
    });
});
