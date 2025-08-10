import { AwsClientSpy, spyClient} from '../src';
import {ListQueuesCommand, SendMessageCommand, SQSClient, SQSClientConfig} from '@aws-sdk/client-sqs';
import {MaybeSinonProxy} from '../src/sinon';
import { HttpHandlerOptions, RequestHandler } from '@smithy/types';
import {fakeCredentials, sendMessageCmd1, sendMessageCmd2} from './fixtures';

let sqsMock: AwsClientSpy<SQSClient>;

beforeEach(() => {
    sqsMock = spyClient(SQSClient);
});

afterEach(() => {
    sqsMock.restore();
});

const requestHandlerMock: RequestHandler<any, any, HttpHandlerOptions> = {
    handle() {
        return Promise.resolve({
            response: {
                statusCode: 200,
                headers: new Headers({ 'content-type': 'application/json'}),
                body: (Buffer.from(JSON.stringify({
                    MessageId: 'hello',
                    MessageBody: 'hello',
                }))),
            }, 
        });
    },
};

const clientOptions: SQSClientConfig = {
    requestHandler: requestHandlerMock as unknown as Record<string, unknown>, 
    credentials: fakeCredentials, 
    useQueueUrlAsEndpoint: false, 
    md5: false,
};

describe('setting up the mock', () => {
    it('returns original result by default', async () => {
        const sqs = new SQSClient(clientOptions);
        const publish = await sqs.send(sendMessageCmd1);

        expect(publish).toBeDefined();
    });

    it('restores real client', () => {
        const sqs = new SQSClient(clientOptions);

        expect((sqs.send as MaybeSinonProxy).isSinonProxy).toBe(true);

        sqsMock.restore();

        expect((sqs.send as MaybeSinonProxy).isSinonProxy).toBeUndefined();
    });

    it('returns a client name', () => {
        expect(sqsMock.clientName()).toBe('SQSClient');
    });
});

describe('spying on the mock', () => {
    it('allows to access underlying Sinon spy', async () => {
        const sqs = new SQSClient(clientOptions);
        await sqs.send(sendMessageCmd1);

        expect(sqsMock.send.callCount).toBe(1);
        expect(sqsMock.send.getCall(0).args[0].input).toStrictEqual(sendMessageCmd1.input);
    });

    it('allows to spy on the send calls', async () => {
        const sqs = new SQSClient(clientOptions);
        await sqs.send(sendMessageCmd1);
        await sqs.send(sendMessageCmd2);

        expect(sqsMock.calls()).toHaveLength(2);
        expect(sqsMock.call(0).args[0].input).toStrictEqual(sendMessageCmd1.input);
        expect(sqsMock.call(1).args[0].input).toStrictEqual(sendMessageCmd2.input);
    });

    it('finds calls of given command type', async () => {
        const sqs = new SQSClient(clientOptions);
        await sqs.send(sendMessageCmd1);
        await sqs.send(new ListQueuesCommand({}));

        expect(sqsMock.calls()).toHaveLength(2);
        expect(sqsMock.commandCalls(SendMessageCommand)).toHaveLength(1);

        expect(sqsMock.commandCalls(SendMessageCommand)[0].args[0].input).toStrictEqual(sendMessageCmd1.input);
    });

    it('finds calls of given command type and input parameters', async () => {
        const sqs = new SQSClient(clientOptions);
        await sqs.send(sendMessageCmd1);
        await sqs.send(sendMessageCmd2);

        expect(sqsMock.commandCalls(SendMessageCommand)).toHaveLength(2);
        expect(sqsMock.commandCalls(SendMessageCommand, {MessageBody: sendMessageCmd1.input.MessageBody})).toHaveLength(1);
    });

    it('finds calls of given command type and exact input', async () => {
        const sqs = new SQSClient(clientOptions);
        await sqs.send(sendMessageCmd1);
        await sqs.send(sendMessageCmd2);

        expect(sqsMock.commandCalls(SendMessageCommand)).toHaveLength(2);
        expect(sqsMock.commandCalls(SendMessageCommand, {MessageBody: sendMessageCmd1.input.MessageBody}, true)).toHaveLength(0);
        expect(sqsMock.commandCalls(SendMessageCommand, {...sendMessageCmd1.input}, true)).toHaveLength(1);
    });

    it('finds nth call of given command type', async () => {
        const sqs = new SQSClient(clientOptions);
        await sqs.send(sendMessageCmd1);
        await sqs.send(sendMessageCmd2);

        expect(sqsMock.commandCall(0, SendMessageCommand).args[0].input).toStrictEqual(sendMessageCmd1.input);
        expect(sqsMock.commandCall(1, SendMessageCommand).args[0].input).toStrictEqual(sendMessageCmd2.input);
        expect(sqsMock.commandCall(-1, SendMessageCommand).args[0].input).toStrictEqual(sendMessageCmd2.input);
        expect(sqsMock.commandCall(2, SendMessageCommand)).toBeNull();
    });

    it('resets calls history', async () => {
        const sqs = new SQSClient(clientOptions);
        await sqs.send(sendMessageCmd1);

        sqsMock.resetHistory();

        expect(sqsMock.calls()).toHaveLength(0);
    });

    it('resets calls history on mock reset', async () => {
        const sqs = new SQSClient(clientOptions);
        await sqs.send(sendMessageCmd1);

        sqsMock.reset();

        expect(sqsMock.calls()).toHaveLength(0);
    });
});

