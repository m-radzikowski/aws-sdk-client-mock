import { PublishCommand, SNSClient } from '@aws-sdk/client-sns';
import {ListQueuesCommand, SQSClient} from '@aws-sdk/client-sqs';
import { describe, expect, it } from '@jest/globals';
import { mockClient, spyClient } from 'aws-sdk-client-mock';
import { fakeCredentials, listQueuesCmd1, publishCmd1 } from 'aws-sdk-client-mock/test/fixtures';
import '../src/jest';
import { dummyRequestHandler } from './dummyRequestHandler';


describe('mockClient', () => {
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
})

describe('spyClient', () => {
    const sqsMock = spyClient(SQSClient);
    it('passes using @jest/globals', async () => {
        const sqs = new SQSClient({requestHandler:dummyRequestHandler, credentials: fakeCredentials});
        await sqs.send(listQueuesCmd1);

        expect(() => expect(sqsMock).toHaveReceivedCommand(ListQueuesCommand)).not.toThrow();
    });

    it('accepts asymmetric matchers with @jest/globals', async () => {
        const sqs = new SQSClient({requestHandler:dummyRequestHandler, credentials: fakeCredentials});
        await sqs.send(listQueuesCmd1);

        expect(() => expect(sqsMock).toHaveReceivedCommandWith(ListQueuesCommand, {
            QueueNamePrefix: expect.stringMatching(/a/),
        })).not.toThrow();
    });
})
