/* eslint-disable @typescript-eslint/no-unsafe-argument */
import {AwsClientStub, mockClient} from '../src';
import {PublishCommand, SNSClient} from '@aws-sdk/client-sns';
import {publishCmd1, publishCmd2, uuid1} from './fixtures';
import {aliasMatchers, baseMatchers} from '../src/jestMatchers';
import {inspect} from 'util';

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

    contextMock.isNot = false;
    contextMock.equals.mockReturnValue(true);
    contextMock.utils.printExpected.mockImplementation((v) => inspect(v, {compact: true}));
    contextMock.utils.printReceived.mockImplementation((v) => inspect(v, {compact: true}));
    contextMock.utils.printDiffOrStringify.mockImplementation((a, b) => [
        inspect(a, {compact: true}),
        inspect(b, {compact: true}),
    ].join('\n'));
});

afterEach(() => {
    snsMock.restore();
});

describe('matcher aliases', () => {
    it('adds matcher aliases', () => {
        expect(aliasMatchers.toReceiveCommand).toBe(baseMatchers.toHaveReceivedCommand);
        expect(aliasMatchers.toReceiveCommandTimes).toBe(baseMatchers.toHaveReceivedCommandTimes);
        expect(aliasMatchers.toReceiveCommandWith).toBe(baseMatchers.toHaveReceivedCommandWith);
        expect(aliasMatchers.toReceiveNthCommandWith).toBe(baseMatchers.toHaveReceivedNthCommandWith);
    });
});

describe('toHaveReceivedCommandTimes', () => {
    it('matches calls count', async () => {
        snsMock.resolves({
            MessageId: uuid1,
        });

        const sns = new SNSClient({});
        await sns.send(publishCmd1);

        const match = baseMatchers.toHaveReceivedCommandTimes.call(contextMock as any, snsMock, PublishCommand, 2) as jest.CustomMatcherResult;
        expect(match.pass).toBeFalsy();

        expect(match.message()).toEqual(`Expected SNSClient to receive 'PublishCommand' 2 times
SNSClient received 'PublishCommand' 1 times
Calls:

  1. PublishCommand: { TopicArn: 'arn:aws:sns:us-east-1:111111111111:MyTopic', Message: 'mock message' }`);

    });

    it('matches not calls count', async () => {
        contextMock.isNot = true;

        snsMock.resolves({
            MessageId: uuid1,
        });

        const sns = new SNSClient({});
        await sns.send(publishCmd1);
        await sns.send(publishCmd1);

        const match = baseMatchers.toHaveReceivedCommandTimes.call(contextMock as any, snsMock, PublishCommand, 2) as jest.CustomMatcherResult;
        expect(match.pass).toBeTruthy();

        expect(match.message()).toEqual(`Expected SNSClient to not receive 'PublishCommand' 2 times
SNSClient received 'PublishCommand' 2 times
Calls:

  1. PublishCommand: { TopicArn: 'arn:aws:sns:us-east-1:111111111111:MyTopic', Message: 'mock message' }
  2. PublishCommand: { TopicArn: 'arn:aws:sns:us-east-1:111111111111:MyTopic', Message: 'mock message' }`);
    });
});

describe('toHaveReceivedCommand', () => {
    it('matches received', () => {
        snsMock.resolves({
            MessageId: uuid1,
        });

        const match = baseMatchers.toHaveReceivedCommand.call(contextMock as any, snsMock, PublishCommand, 2) as jest.CustomMatcherResult;
        expect(match.pass).toBeFalsy();

        expect(match.message()).toEqual(`Expected SNSClient to receive 'PublishCommand'
SNSClient received 'PublishCommand' 0 times`);
    });

    it('matches not received', async () => {
        contextMock.isNot = true;

        snsMock.resolves({
            MessageId: uuid1,
        });

        const sns = new SNSClient({});
        await sns.send(publishCmd1);

        const match = baseMatchers.toHaveReceivedCommand.call(contextMock as any, snsMock, PublishCommand, 2) as jest.CustomMatcherResult;
        expect(match.pass).toBeTruthy();

        expect(match.message()).toEqual(`Expected SNSClient to not receive 'PublishCommand'
SNSClient received 'PublishCommand' 1 times
Calls:

  1. PublishCommand: { TopicArn: 'arn:aws:sns:us-east-1:111111111111:MyTopic', Message: 'mock message' }`);
    });
});

describe('toHaveReceivedCommandWith', () => {
    it('matches received', async () => {
        snsMock.resolves({
            MessageId: uuid1,
        });

        const sns = new SNSClient({});
        await sns.send(publishCmd1);

        const match = baseMatchers.toHaveReceivedCommandWith.call(contextMock as any,
            snsMock, PublishCommand,
            publishCmd2.input,
        ) as jest.CustomMatcherResult;

        expect(match.pass).toBeFalsy();

        expect(match.message()).toEqual(`Expected SNSClient to receive 'PublishCommand' with { TopicArn: 'arn:aws:sns:us-east-1:111111111111:MyTopic',
  Message: 'second mock message' }
SNSClient received 'PublishCommand' 0 times
Calls:

  1. PublishCommand: { TopicArn: 'arn:aws:sns:us-east-1:111111111111:MyTopic', Message: 'mock message' }`);
    });

    it('matches not received', async () => {
        contextMock.isNot = true;

        snsMock.resolves({
            MessageId: uuid1,
        });

        const sns = new SNSClient({});
        await sns.send(publishCmd1);

        const match = baseMatchers.toHaveReceivedCommandWith.call(contextMock as any, snsMock, PublishCommand, publishCmd1.input) as jest.CustomMatcherResult;
        expect(match.pass).toBeTruthy();

        expect(match.message()).toEqual(`Expected SNSClient to not receive 'PublishCommand' with { TopicArn: 'arn:aws:sns:us-east-1:111111111111:MyTopic', Message: 'mock message' }
SNSClient received 'PublishCommand' 1 times
Calls:

  1. PublishCommand: { TopicArn: 'arn:aws:sns:us-east-1:111111111111:MyTopic', Message: 'mock message' }`);
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

        const match = baseMatchers.toHaveReceivedNthCommandWith.call(contextMock as any,
            snsMock, 1, PublishCommand,
            publishCmd2.input,
        ) as jest.CustomMatcherResult;

        expect(match.pass).toBeFalsy();

        expect(match.message()).toEqual(`Expected SNSClient to receive 1. 'PublishCommand'
SNSClient received 1. 'PublishCommand' with input
{ TopicArn: 'arn:aws:sns:us-east-1:111111111111:MyTopic',
  Message: 'second mock message' }
{ TopicArn: 'arn:aws:sns:us-east-1:111111111111:MyTopic', Message: 'mock message' }
Calls:

  1. PublishCommand: { TopicArn: 'arn:aws:sns:us-east-1:111111111111:MyTopic', Message: 'mock message' }
  2. PublishCommand: { TopicArn: 'arn:aws:sns:us-east-1:111111111111:MyTopic',
  Message: 'second mock message' }`);
    });

    it('matches not received', async () => {
        contextMock.isNot = true;

        snsMock.resolves({MessageId: uuid1});

        const sns = new SNSClient({});
        await sns.send(publishCmd1);

        const match = baseMatchers.toHaveReceivedNthCommandWith.call(contextMock as any, snsMock, 1, PublishCommand, publishCmd1.input) as jest.CustomMatcherResult;
        expect(match.pass).toBeTruthy();

        expect(match.message()).toEqual(`Expected SNSClient to not receive 1. 'PublishCommand'
SNSClient received 1. 'PublishCommand' with input
{ TopicArn: 'arn:aws:sns:us-east-1:111111111111:MyTopic', Message: 'mock message' }
{ TopicArn: 'arn:aws:sns:us-east-1:111111111111:MyTopic', Message: 'mock message' }
Calls:

  1. PublishCommand: { TopicArn: 'arn:aws:sns:us-east-1:111111111111:MyTopic', Message: 'mock message' }`);
    });
});
