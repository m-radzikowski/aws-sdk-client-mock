import { PublishCommand, SNSClient } from '@aws-sdk/client-sns';
import { AwsCommand, mockClient } from 'aws-sdk-client-mock';
import {
    publishCmd1,
    publishCmd2,
    subscribeCmd1,
} from 'aws-sdk-client-mock/test/fixtures';
import { beforeEach, describe, expect, it } from 'vitest';
import '../src/vitest';
import { ordinalOf } from '../src/vitest';

const snsMock = mockClient(SNSClient);

beforeEach(() => {
    snsMock.reset();
});

describe('toHaveReceivedCommand', () => {
    it('passes on receiving Command', async () => {
        expect.assertions(2);

        const sns = new SNSClient({});
        await sns.send(publishCmd1);

        expect(() => expect(snsMock).toHaveReceivedCommand(PublishCommand)).not.toThrow();
    });

    it('fails on not receiving Command', () => {
        expect(() => expect(snsMock).toHaveReceivedCommand(PublishCommand))
            .toThrowErrorMatchingInlineSnapshot('[Error: expected SNSClient to receive PublishCommand at least once]');
    });

    it('fails on receiving Command with not', async () => {
        expect.assertions(2);

        const sns = new SNSClient({});
        await sns.send(publishCmd1);

        expect(() => expect(snsMock).not.toHaveReceivedCommand(PublishCommand))
            .toThrowErrorMatchingInlineSnapshot('[Error: expected SNSClient to not receive PublishCommand at least once]');
    });

    it('fails on more arguments', async () => {
        expect.assertions(2);

        const sns = new SNSClient({});
        await sns.send(publishCmd1);

        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        expect(() => expect(snsMock).not.toHaveReceivedCommand(PublishCommand, {}))
            .toThrowErrorMatchingInlineSnapshot('[AssertionError: Too many matcher arguments]');
    });
});

describe('toHaveReceivedCommandTimes', () => {
    it('passes on receiving Command twice', async () => {
        expect.assertions(2);

        const sns = new SNSClient({});
        await sns.send(publishCmd1);
        await sns.send(publishCmd2);

        expect(() => expect(snsMock).toHaveReceivedCommandTimes(PublishCommand, 2)).not.toThrow();
    });

    it('fails on not receiving Command twice', async () => {
        const sns = new SNSClient({});
        await sns.send(publishCmd1);

        expect(() => expect(snsMock).toHaveReceivedCommandTimes(PublishCommand, 2))
            .toThrowErrorMatchingInlineSnapshot('[Error: expected SNSClient to receive PublishCommand 2 times, but got 1 times]');
    });

    it('fails on receiving Command twice with not', async () => {
        expect.assertions(2);

        const sns = new SNSClient({});
        await sns.send(publishCmd1);
        await sns.send(publishCmd1);

        expect(() => expect(snsMock).not.toHaveReceivedCommandTimes(PublishCommand, 2))
            .toThrowErrorMatchingInlineSnapshot('[Error: expected SNSClient to not receive PublishCommand 2 times, but got 2 times]');
    });
});

describe('toHaveReceivedCommandWith', () => {
    it('passes on receiving Command with partial match', async () => {
        expect.assertions(2);

        const sns = new SNSClient({});
        await sns.send(publishCmd1);
        await sns.send(publishCmd2);

        expect(() =>
            expect(snsMock).toHaveReceivedCommandWith(PublishCommand, {
                Message: publishCmd2.input.Message,
            })
        ).not.toThrow();
    });

    it('fails on not receiving Command', async () => {
        expect.assertions(2);

        const sns = new SNSClient({});
        await sns.send(publishCmd1);

        expect(() =>
            expect(snsMock).toHaveReceivedCommandWith(PublishCommand, {
                Message: publishCmd2.input.Message,
            })
        ).toThrowErrorMatchingInlineSnapshot(`
"expected SNSClient to receive PublishCommand with arguments [{
  "Message": "second mock message",
}]

<gray>Received:</color>

<gray>  1st call:</color>

<gray>  Object {</color>
<green>-   "Message": "second mock message",</color>
<red>+   "Message": "mock message",</color>
<red>+   "TopicArn": "arn:aws:sns:us-east-1:111111111111:MyTopic",</color>
<gray>  }</color>

<gray>Number of calls: 1</color>"
`);
    });

    it('fails on receiving Command with partial match with not', async () => {
        expect.assertions(2);

        const sns = new SNSClient({});
        await sns.send(publishCmd1);

        expect(() =>
            expect(snsMock).not.toHaveReceivedCommandWith(PublishCommand, {
                Message: publishCmd1.input.Message,
            })
        ).toThrowErrorMatchingInlineSnapshot(`
"expected SNSClient to not receive PublishCommand with arguments [{
  "Message": "mock message",
}]

<gray>Received:</color>

<gray>  1st call:</color>

<gray>  Object {</color>
<gray>    "Message": "mock message",</color>
<red>+   "TopicArn": "arn:aws:sns:us-east-1:111111111111:MyTopic",</color>
<gray>  }</color>

<gray>Number of calls: 1</color>"
`);
    });

    it('passes on match with asymmetric matcher', async () => {
        expect.assertions(2);

        const sns = new SNSClient({});
        await sns.send(publishCmd1);

        expect(() =>
            expect(snsMock).toHaveReceivedCommandWith(PublishCommand, {
                Message: expect.stringMatching(/message/), // eslint-disable-line @typescript-eslint/no-unsafe-assignment
            })
        ).not.toThrow();
    });
});

describe('toHaveReceivedNthCommandWith', () => {
    it('passes on receiving second Command with partial match', async () => {
        expect.assertions(2);

        const sns = new SNSClient({});
        await sns.send(publishCmd1);
        await sns.send(publishCmd2);

        expect(() =>
            expect(snsMock).toHaveReceivedNthCommandWith(2, PublishCommand, {
                Message: publishCmd2.input.Message,
            })
        ).not.toThrow();
    });

    it('displays diff when client received nth command with different arguments', async () => {
        expect.assertions(2);

        const sns = new SNSClient({});
        await sns.send(publishCmd1);
        await sns.send(publishCmd1);

        expect(() =>
            expect(snsMock).toHaveReceivedNthCommandWith(2, PublishCommand, {
                Message: publishCmd2.input.Message,
            })
        ).toThrowErrorMatchingInlineSnapshot(`
"expected SNSClient to receive 2nd PublishCommand with arguments [{
  "Message": "second mock message",
}]

<green>- Expected</color>
<red>+ Received</color>

<gray>  Object {</color>
<green>-   "Message": "second mock message",</color>
<red>+   "Message": "mock message",</color>
<red>+   "TopicArn": "arn:aws:sns:us-east-1:111111111111:MyTopic",</color>
<gray>  }</color>"
`);
    });

    it('fails on receiving less Commands than the nth requested', async () => {
        expect.assertions(2);

        const sns = new SNSClient({});
        await sns.send(publishCmd1);
        await sns.send(publishCmd1);
        
        expect(() =>
            expect(snsMock).toHaveReceivedNthCommandWith(5, PublishCommand, {
                Message: publishCmd2.input.Message,
            })
        ).toThrowErrorMatchingInlineSnapshot(`
[Error: expected SNSClient to receive 5th PublishCommand with arguments [{
  "Message": "second mock message",
}], but SNSClient has only received PublishCommand 2 times

]
`);
    });

    it('fails on receiving second Command with not', async () => {
        expect.assertions(2);

        const sns = new SNSClient({});
        await sns.send(publishCmd1);
        await sns.send(publishCmd2);

        expect(() =>
            expect(snsMock).not.toHaveReceivedNthCommandWith(2, PublishCommand, {
                Message: publishCmd2.input.Message,
            })
        ).toThrowErrorMatchingInlineSnapshot(`
"expected SNSClient to not receive 2nd PublishCommand with arguments [{
  "Message": "second mock message",
}]

<green>- Expected</color>
<red>+ Received</color>

<gray>  Object {</color>
<gray>    "Message": "second mock message",</color>
<red>+   "TopicArn": "arn:aws:sns:us-east-1:111111111111:MyTopic",</color>
<gray>  }</color>"
`);
    });

    it('passes on match with asymmetric matcher', async () => {
        expect.assertions(2);

        const sns = new SNSClient({});
        await sns.send(publishCmd1);
        await sns.send(publishCmd2);

        expect(() =>
            expect(snsMock).toHaveReceivedNthCommandWith(2, PublishCommand, {
                Message: expect.stringMatching(/second/), // eslint-disable-line @typescript-eslint/no-unsafe-assignment
            })
        ).not.toThrow();
    });

    it('fails on unmatch with asymmetric matcher', async () => {
        expect.assertions(2);

        const sns = new SNSClient({});
        await sns.send(publishCmd1);
        await sns.send(publishCmd2);
        
        expect(() =>
            expect(snsMock).toHaveReceivedNthCommandWith(2, PublishCommand, {
                Message: expect.stringMatching(/qq/), // eslint-disable-line @typescript-eslint/no-unsafe-assignment
            })
        ).toThrowErrorMatchingInlineSnapshot(`
"expected SNSClient to receive 2nd PublishCommand with arguments [{
  "Message": StringMatching /qq/,
}]

<green>- Expected</color>
<red>+ Received</color>

<gray>  Object {</color>
<green>-   "Message": StringMatching /qq/,</color>
<red>+   "Message": "second mock message",</color>
<red>+   "TopicArn": "arn:aws:sns:us-east-1:111111111111:MyTopic",</color>
<gray>  }</color>"
`);
    });
});

describe('toHaveReceivedNthSpecificCommandWith', () => {
    it('passes on receiving second Command with partial match', async () => {
        expect.assertions(2);

        const sns = new SNSClient({});
        await sns.send(publishCmd1);
        await sns.send(subscribeCmd1);
        await sns.send(publishCmd2);

        expect(() =>
            expect(snsMock).toHaveReceivedNthSpecificCommandWith(2, PublishCommand, {
                Message: publishCmd2.input.Message,
            })
        ).not.toThrow();
    });

    it('fails on receiving less Commands than the nth expected', async () => {
        expect.assertions(2);

        const sns = new SNSClient({});
        await sns.send(publishCmd1);

        expect(() =>
            expect(snsMock).toHaveReceivedNthSpecificCommandWith(2, PublishCommand, {
                Message: publishCmd2.input.Message,
            })
        ).toThrowErrorMatchingInlineSnapshot(`
[Error: expected SNSClient to receive 2nd PublishCommand with arguments [{
  "Message": "second mock message",
}], but SNSClient has only received PublishCommand 1 times

]
`);
    });

    it('displays diff when client received nth command with different arguments', async () => {
        expect.assertions(2);

        const sns = new SNSClient({});
        await sns.send(publishCmd1);
        await sns.send(publishCmd1);

        expect(() =>
            expect(snsMock).toHaveReceivedNthSpecificCommandWith(2, PublishCommand, {
                Message: publishCmd2.input.Message,
            })
        ).toThrowErrorMatchingInlineSnapshot(`
"expected SNSClient to receive 2nd PublishCommand with arguments [{
  "Message": "second mock message",
}]

<green>- Expected</color>
<red>+ Received</color>

<gray>  Object {</color>
<green>-   "Message": "second mock message",</color>
<red>+   "Message": "mock message",</color>
<red>+   "TopicArn": "arn:aws:sns:us-east-1:111111111111:MyTopic",</color>
<gray>  }</color>"
`);
    });
});

describe('toHaveReceivedAnyCommand', () => {
    it.each`
    command
    ${publishCmd1}
    ${subscribeCmd1}
  `(
        'passes on receiving any command',
        async ({ command }: { command: AwsCommand<any, any> }) => {
            expect.assertions(2);

            const sns = new SNSClient({});
            await sns.send(command); // eslint-disable-line @typescript-eslint/no-unsafe-argument

            expect(() => expect(snsMock).toHaveReceivedAnyCommand()).not.toThrow();
        }
    );

    it('fails on not receiving any command', () => {
        expect.assertions(2);
        expect(() => expect(snsMock).toHaveReceivedAnyCommand())
            .toThrowErrorMatchingInlineSnapshot('[Error: expected SNSClient to receive any command at least once]');
    });
});

// alias matchers

describe('toReceivedCommand', () => {
    it('passes on receiving Command', async () => {
        expect.assertions(2);

        const sns = new SNSClient({});
        await sns.send(publishCmd1);

        expect(() => expect(snsMock).toReceiveCommand(PublishCommand)).not.toThrow();
    });

    it('fails on not receiving Command', () => {
        expect(() => expect(snsMock).toReceiveCommand(PublishCommand))
            .toThrowErrorMatchingInlineSnapshot('[Error: expected SNSClient to receive PublishCommand at least once]');
    });

    it('fails on receiving Command with not', async () => {
        expect.assertions(2);

        const sns = new SNSClient({});
        await sns.send(publishCmd1);

        expect(() => expect(snsMock).not.toReceiveCommand(PublishCommand))
            .toThrowErrorMatchingInlineSnapshot('[Error: expected SNSClient to not receive PublishCommand at least once]');
    });

    it('fails on more arguments', async () => {
        expect.assertions(2);

        const sns = new SNSClient({});
        await sns.send(publishCmd1);

        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        expect(() => expect(snsMock).not.toReceiveCommand(PublishCommand, {}))
            .toThrowErrorMatchingInlineSnapshot('[AssertionError: Too many matcher arguments]');
    });
});

describe('toReceivedCommandTimes', () => {
    it('passes on receiving Command twice', async () => {
        expect.assertions(2);

        const sns = new SNSClient({});
        await sns.send(publishCmd1);
        await sns.send(publishCmd2);

        expect(() => expect(snsMock).toReceiveCommandTimes(PublishCommand, 2)).not.toThrow();
    });

    it('fails on not receiving Command twice', async () => {
        const sns = new SNSClient({});
        await sns.send(publishCmd1);

        expect(() => expect(snsMock).toReceiveCommandTimes(PublishCommand, 2))
            .toThrowErrorMatchingInlineSnapshot('[Error: expected SNSClient to receive PublishCommand 2 times, but got 1 times]');
    });

    it('fails on receiving Command twice with not', async () => {
        expect.assertions(2);

        const sns = new SNSClient({});
        await sns.send(publishCmd1);
        await sns.send(publishCmd1);

        expect(() => expect(snsMock).not.toReceiveCommandTimes(PublishCommand, 2))
            .toThrowErrorMatchingInlineSnapshot('[Error: expected SNSClient to not receive PublishCommand 2 times, but got 2 times]');
    });
});

describe('toReceivedCommandWith', () => {
    it('passes on receiving Command with partial match', async () => {
        expect.assertions(2);

        const sns = new SNSClient({});
        await sns.send(publishCmd1);
        await sns.send(publishCmd2);

        expect(() =>
            expect(snsMock).toReceiveCommandWith(PublishCommand, {
                Message: publishCmd2.input.Message,
            })
        ).not.toThrow();
    });

    it('fails on not receiving Command', async () => {
        expect.assertions(2);

        const sns = new SNSClient({});
        await sns.send(publishCmd1);

        expect(() =>
            expect(snsMock).toReceiveCommandWith(PublishCommand, {
                Message: publishCmd2.input.Message,
            })
        ).toThrowErrorMatchingInlineSnapshot(`
"expected SNSClient to receive PublishCommand with arguments [{
  "Message": "second mock message",
}]

<gray>Received:</color>

<gray>  1st call:</color>

<gray>  Object {</color>
<green>-   "Message": "second mock message",</color>
<red>+   "Message": "mock message",</color>
<red>+   "TopicArn": "arn:aws:sns:us-east-1:111111111111:MyTopic",</color>
<gray>  }</color>

<gray>Number of calls: 1</color>"
`);
    });

    it('fails on receiving Command with partial match with not', async () => {
        expect.assertions(2);

        const sns = new SNSClient({});
        await sns.send(publishCmd1);

        expect(() =>
            expect(snsMock).not.toReceiveCommandWith(PublishCommand, {
                Message: publishCmd1.input.Message,
            })
        ).toThrowErrorMatchingInlineSnapshot(`
"expected SNSClient to not receive PublishCommand with arguments [{
  "Message": "mock message",
}]

<gray>Received:</color>

<gray>  1st call:</color>

<gray>  Object {</color>
<gray>    "Message": "mock message",</color>
<red>+   "TopicArn": "arn:aws:sns:us-east-1:111111111111:MyTopic",</color>
<gray>  }</color>

<gray>Number of calls: 1</color>"
`);
    });

    it('passes on match with asymmetric matcher', async () => {
        expect.assertions(2);

        const sns = new SNSClient({});
        await sns.send(publishCmd1);

        expect(() =>
            expect(snsMock).toReceiveCommandWith(PublishCommand, {
                Message: expect.stringMatching(/message/), // eslint-disable-line @typescript-eslint/no-unsafe-assignment
            })
        ).not.toThrow();
    });
});

describe('toReceivedNthCommandWith', () => {
    it('passes on receiving second Command with partial match', async () => {
        expect.assertions(2);

        const sns = new SNSClient({});
        await sns.send(publishCmd1);
        await sns.send(publishCmd2);

        expect(() =>
            expect(snsMock).toReceiveNthCommandWith(2, PublishCommand, {
                Message: publishCmd2.input.Message,
            })
        ).not.toThrow();
    });

    it('displays diff when client received nth command with different arguments', async () => {
        expect.assertions(2);

        const sns = new SNSClient({});
        await sns.send(publishCmd1);
        await sns.send(publishCmd1);

        expect(() =>
            expect(snsMock).toReceiveNthCommandWith(2, PublishCommand, {
                Message: publishCmd2.input.Message,
            })
        ).toThrowErrorMatchingInlineSnapshot(`
"expected SNSClient to receive 2nd PublishCommand with arguments [{
  "Message": "second mock message",
}]

<green>- Expected</color>
<red>+ Received</color>

<gray>  Object {</color>
<green>-   "Message": "second mock message",</color>
<red>+   "Message": "mock message",</color>
<red>+   "TopicArn": "arn:aws:sns:us-east-1:111111111111:MyTopic",</color>
<gray>  }</color>"
`);
    });

    it('fails on receiving less Commands than the nth requested', async () => {
        expect.assertions(2);

        const sns = new SNSClient({});
        await sns.send(publishCmd1);
        await sns.send(publishCmd1);
        
        expect(() =>
            expect(snsMock).toReceiveNthCommandWith(5, PublishCommand, {
                Message: publishCmd2.input.Message,
            })
        ).toThrowErrorMatchingInlineSnapshot(`
[Error: expected SNSClient to receive 5th PublishCommand with arguments [{
  "Message": "second mock message",
}], but SNSClient has only received PublishCommand 2 times

]
`);
    });

    it('fails on receiving second Command with not', async () => {
        expect.assertions(2);

        const sns = new SNSClient({});
        await sns.send(publishCmd1);
        await sns.send(publishCmd2);

        expect(() =>
            expect(snsMock).not.toReceiveNthCommandWith(2, PublishCommand, {
                Message: publishCmd2.input.Message,
            })
        ).toThrowErrorMatchingInlineSnapshot(`
"expected SNSClient to not receive 2nd PublishCommand with arguments [{
  "Message": "second mock message",
}]

<green>- Expected</color>
<red>+ Received</color>

<gray>  Object {</color>
<gray>    "Message": "second mock message",</color>
<red>+   "TopicArn": "arn:aws:sns:us-east-1:111111111111:MyTopic",</color>
<gray>  }</color>"
`);
    });

    it('passes on match with asymmetric matcher', async () => {
        expect.assertions(2);

        const sns = new SNSClient({});
        await sns.send(publishCmd1);
        await sns.send(publishCmd2);

        expect(() =>
            expect(snsMock).toReceiveNthCommandWith(2, PublishCommand, {
                Message: expect.stringMatching(/second/), // eslint-disable-line @typescript-eslint/no-unsafe-assignment
            })
        ).not.toThrow();
    });

    it('fails on unmatch with asymmetric matcher', async () => {
        expect.assertions(2);

        const sns = new SNSClient({});
        await sns.send(publishCmd1);
        await sns.send(publishCmd2);
        
        expect(() =>
            expect(snsMock).toReceiveNthCommandWith(2, PublishCommand, {
                Message: expect.stringMatching(/qq/), // eslint-disable-line @typescript-eslint/no-unsafe-assignment
            })
        ).toThrowErrorMatchingInlineSnapshot(`
"expected SNSClient to receive 2nd PublishCommand with arguments [{
  "Message": StringMatching /qq/,
}]

<green>- Expected</color>
<red>+ Received</color>

<gray>  Object {</color>
<green>-   "Message": StringMatching /qq/,</color>
<red>+   "Message": "second mock message",</color>
<red>+   "TopicArn": "arn:aws:sns:us-east-1:111111111111:MyTopic",</color>
<gray>  }</color>"
`);
    });
});

describe('toReceivedNthSpecificCommandWith', () => {
    it('passes on receiving second Command with partial match', async () => {
        expect.assertions(2);

        const sns = new SNSClient({});
        await sns.send(publishCmd1);
        await sns.send(subscribeCmd1);
        await sns.send(publishCmd2);

        expect(() =>
            expect(snsMock).toReceiveNthSpecificCommandWith(2, PublishCommand, {
                Message: publishCmd2.input.Message,
            })
        ).not.toThrow();
    });

    it('fails on receiving less Commands than the nth expected', async () => {
        expect.assertions(2);

        const sns = new SNSClient({});
        await sns.send(publishCmd1);

        expect(() =>
            expect(snsMock).toReceiveNthSpecificCommandWith(2, PublishCommand, {
                Message: publishCmd2.input.Message,
            })
        ).toThrowErrorMatchingInlineSnapshot(`
[Error: expected SNSClient to receive 2nd PublishCommand with arguments [{
  "Message": "second mock message",
}], but SNSClient has only received PublishCommand 1 times

]
`);
    });

    it('displays diff when client received nth command with different arguments', async () => {
        expect.assertions(2);

        const sns = new SNSClient({});
        await sns.send(publishCmd1);
        await sns.send(publishCmd1);

        expect(() =>
            expect(snsMock).toReceiveNthSpecificCommandWith(2, PublishCommand, {
                Message: publishCmd2.input.Message,
            })
        ).toThrowErrorMatchingInlineSnapshot(`
"expected SNSClient to receive 2nd PublishCommand with arguments [{
  "Message": "second mock message",
}]

<green>- Expected</color>
<red>+ Received</color>

<gray>  Object {</color>
<green>-   "Message": "second mock message",</color>
<red>+   "Message": "mock message",</color>
<red>+   "TopicArn": "arn:aws:sns:us-east-1:111111111111:MyTopic",</color>
<gray>  }</color>"
`);
    });
});

describe('toReceivedAnyCommand', () => {
    it.each`
    command
    ${publishCmd1}
    ${subscribeCmd1}
  `(
        'passes on receiving any command',
        async ({ command }: { command: AwsCommand<any, any> }) => {
            expect.assertions(2);

            const sns = new SNSClient({});
            await sns.send(command); // eslint-disable-line @typescript-eslint/no-unsafe-argument

            expect(() => expect(snsMock).toReceiveAnyCommand()).not.toThrow();
        }
    );

    it('fails on not receiving any command', () => {
        expect.assertions(2);
        expect(() => expect(snsMock).toReceiveAnyCommand())
            .toThrowErrorMatchingInlineSnapshot('[Error: expected SNSClient to receive any command at least once]');
    });
});

describe('ordinalOf', () => {
    const cases: Array<[number, string]> = [
        [1, '1st'],
        [2, '2nd'],
        [3, '3rd'],
        [4, '4th'],
        [9, '9th'],
        [10, '10th'],
        [11, '11th'],
        [12, '12th'],
        [13, '13th'],
        [21, '21st'],
        [32, '32nd'],
        [93, '93rd'],
        [94, '94th'],
        [1001, '1001st'],
        [1011, '1011th'],
        [1012, '1012th'],
        [1013, '1013th'],
        [1021, '1021st'],
        [1022, '1022nd'],
        [1023, '1023rd'],
    ];
    it.each(cases)('should translate %d to %s', (a, b) => {
        expect(ordinalOf(a)).toStrictEqual(b);
    });
});
