import { PublishCommand, SNSClient } from '@aws-sdk/client-sns';
import { expect, it } from '@jest/globals';
import { mockClient } from 'aws-sdk-client-mock';
import { publishCmd1 } from 'aws-sdk-client-mock/test/fixtures';
import '../src/jestGlobals';

const snsMock = mockClient(SNSClient);

it('passes using @jest/globals', async () => {
    const sns = new SNSClient({});
    await sns.send(publishCmd1);

    expect(() => expect(snsMock).toHaveReceivedCommand(PublishCommand)).not.toThrow();
});

it('accepts asymmetric matchers with @jest/globals', async () => {
    const sns = new SNSClient({});
    await sns.send(publishCmd1);

    expect(() => expect(snsMock).toHaveReceivedCommandWith(PublishCommand, {
        Message: expect.stringContaining('mock'),
    })).not.toThrow();
});
