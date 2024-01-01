import {mockClient} from 'aws-sdk-client-mock';
import {PublishCommand, SNSClient} from '@aws-sdk/client-sns';
import {publishCmd1} from 'aws-sdk-client-mock/test/fixtures';
import {expect, it} from '@jest/globals';
import '../src';

const snsMock = mockClient(SNSClient);

it('passes using @jest/globals', async () => {
    const sns = new SNSClient({});
    await sns.send(publishCmd1);

    expect(() => expect(snsMock).toHaveReceivedCommand(PublishCommand)).not.toThrow();
});
