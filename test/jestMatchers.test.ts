import { AwsClientStub, mockClient } from '../src';
import { PublishCommand, SNSClient } from '@aws-sdk/client-sns';
import { publishCmd1, publishCmd2, uuid1 } from './fixtures';
import { matchers } from '../src/jestMatchers';
import { inspect } from 'util';

let snsMock: AwsClientStub<SNSClient>;


const contextMock = {
    isNot: false,
    equals: jest.fn(),
    utils: {
        printExpected: jest.fn(),
        printReceived: jest.fn(),
        printDiffOrStringify: jest.fn(),
    },
};

beforeEach(() => {
    snsMock = mockClient(SNSClient);

    contextMock.isNot = false,
    contextMock.equals.mockReturnValue(true),
    contextMock.utils.printExpected.mockImplementation((v) => inspect(v, { compact: true }));
    contextMock.utils.printReceived.mockImplementation((v) => inspect(v, { compact: true }));
    contextMock.utils.printDiffOrStringify.mockImplementation((a, b) => [
        inspect(a, { compact: true }),
        inspect(b, { compact: true }),
    ].join('\n')
    );
});

afterEach(() => {
    snsMock.restore();
});

describe('toHaveReceivedCommandTimes', () => {
    it('matches calls count', async () => {
        snsMock.resolves({
            MessageId: uuid1,
        });

        const sns = new SNSClient({});
        await sns.send(publishCmd1);


        const match = matchers.toHaveReceivedCommandTimes.call(contextMock as any, snsMock, PublishCommand, 2) as jest.CustomMatcherResult;
        expect(match.pass).toBeFalsy();

        expect(match.message()).toEqual(`Expected SNSClient have received 'PublishCommand' 2 times
Received SNSClient have received 'PublishCommand' 1 times
Calls:

  1, PublishCommand, { TopicArn: 'arn:aws:sns:us-east-1:111111111111:MyTopic', Message: 'mock message' }`);

    });

    it('matches not calls count', async () => {
        contextMock.isNot = true;

        snsMock.resolves({
            MessageId: uuid1,
        });

        const sns = new SNSClient({});
        await sns.send(publishCmd1);
        await sns.send(publishCmd1);


        const match = matchers.toHaveReceivedCommandTimes.call(contextMock as any, snsMock, PublishCommand, 2) as jest.CustomMatcherResult;
        expect(match.pass).toBeTruthy();

        expect(match.message()).toEqual(`Expected SNSClient have not received 'PublishCommand' 2 times
Received SNSClient have received 'PublishCommand' exactly 2 times
Calls:

  1, PublishCommand, { TopicArn: 'arn:aws:sns:us-east-1:111111111111:MyTopic', Message: 'mock message' }
  2, PublishCommand, { TopicArn: 'arn:aws:sns:us-east-1:111111111111:MyTopic', Message: 'mock message' }`);
    });
});


describe('toHaveReceivedCommand', () => {
    it('matches received', () => {
        snsMock.resolves({
            MessageId: uuid1,
        });

        const match = matchers.toHaveReceivedCommand.call(contextMock as any, snsMock, PublishCommand, 2) as jest.CustomMatcherResult;
        expect(match.pass).toBeFalsy();

        expect(match.message()).toEqual(`Expected SNSClient have received 'PublishCommand'
Received SNSClient have not received 'PublishCommand'`);
    });

    it('matches not received', async () => {
        contextMock.isNot = true;

        snsMock.resolves({
            MessageId: uuid1,
        });

        const sns = new SNSClient({});
        await sns.send(publishCmd1);

        const match = matchers.toHaveReceivedCommand.call(contextMock as any, snsMock, PublishCommand, 2) as jest.CustomMatcherResult;
        expect(match.pass).toBeTruthy();

        expect(match.message()).toEqual(`Expected SNSClient have not received 'PublishCommand'
Received SNSClient have received 'PublishCommand' 1 times
Calls:

  1, PublishCommand, { TopicArn: 'arn:aws:sns:us-east-1:111111111111:MyTopic', Message: 'mock message' }`);
    });
});

describe('toHaveReceivedCommandWith', () => {
    it('matches received', async () => {
        snsMock.resolves({
            MessageId: uuid1,
        });

        const sns = new SNSClient({});
        await sns.send(publishCmd1);

        const match = matchers.toHaveReceivedCommandWith.call(contextMock as any,
            snsMock, PublishCommand,
            publishCmd2.input
        ) as jest.CustomMatcherResult;

        expect(match.pass).toBeFalsy();

        expect(match.message()).toEqual(`Expected SNSClient have received 'PublishCommand' with { TopicArn: 'arn:aws:sns:us-east-1:111111111111:MyTopic',
  Message: 'second mock message' }
But 0 have been received
Calls:

  1, PublishCommand, { TopicArn: 'arn:aws:sns:us-east-1:111111111111:MyTopic', Message: 'mock message' }`);
    });

    it('matches not received', async () => {
        contextMock.isNot = true;

        snsMock.resolves({
            MessageId: uuid1,
        });

        const sns = new SNSClient({});
        await sns.send(publishCmd1);

        const match = matchers.toHaveReceivedCommandWith.call(contextMock as any, snsMock, PublishCommand, publishCmd1.input) as jest.CustomMatcherResult;
        expect(match.pass).toBeTruthy();

        expect(match.message()).toEqual(`Expected SNSClient Not have received 'PublishCommand' with { TopicArn: 'arn:aws:sns:us-east-1:111111111111:MyTopic', Message: 'mock message' }
But 1 have been received
Calls:

  1, PublishCommand, { TopicArn: 'arn:aws:sns:us-east-1:111111111111:MyTopic', Message: 'mock message' }`);
    });
});

describe('toHaveNthReceivedCommandWith', () => {
    it('matches received', async () => {
        contextMock.equals.mockReturnValue(false);

        snsMock.resolves({
            MessageId: uuid1,
        });

        const sns = new SNSClient({});
        await sns.send(publishCmd1);
        await sns.send(publishCmd2);

        const match = matchers.toHaveNthReceivedCommandWith.call(contextMock as any,
            snsMock, 1, PublishCommand,
            publishCmd2.input
        ) as jest.CustomMatcherResult;

        expect(match.pass).toBeFalsy();

        expect(match.message()).toEqual(`Expected SNSClient have 1 received 'PublishCommand'
Received 'PublishCommand' with input
{ TopicArn: 'arn:aws:sns:us-east-1:111111111111:MyTopic',
  Message: 'second mock message' }
{ TopicArn: 'arn:aws:sns:us-east-1:111111111111:MyTopic', Message: 'mock message' }
Command Calls:

  1, PublishCommand, { TopicArn: 'arn:aws:sns:us-east-1:111111111111:MyTopic', Message: 'mock message' }
  2, PublishCommand, { TopicArn: 'arn:aws:sns:us-east-1:111111111111:MyTopic',
  Message: 'second mock message' }`);
    });

    it('matches not received', async () => {
        contextMock.isNot = true;

        snsMock.resolves({
            MessageId: uuid1,
        });

        const sns = new SNSClient({});
        await sns.send(publishCmd1);

        const match = matchers.toHaveNthReceivedCommandWith.call(contextMock as any, snsMock, 1, PublishCommand, publishCmd1.input) as jest.CustomMatcherResult;
        expect(match.pass).toBeTruthy();

        expect(match.message()).toEqual(`Expected SNSClient Not have 1 received 'PublishCommand' with matching input
But 'PublishCommand' have been received matching given input`);
    });
});
