import {AwsClientStub, mockClient} from '../src';
import {ListTopicsCommand, PublishCommand, SNSClient} from '@aws-sdk/client-sns';
import {MaybeSinonProxy} from '../src/sinon';
import {publishCmd1, publishCmd2, topicArn, uuid1, uuid2} from './fixtures';

let snsMock: AwsClientStub<SNSClient>;

beforeEach(() => {
    snsMock = mockClient(SNSClient);
});

afterEach(() => {
    snsMock.restore();
});

describe('setting up the mock', () => {
    it('returns undefined by default', async () => {
        const sns = new SNSClient({});
        const publish = await sns.send(publishCmd1);

        expect(publish).toBeUndefined();
    });

    it('resets mock behavior', async () => {
        snsMock.resolves({
            MessageId: uuid1,
        });

        const sns = new SNSClient({});
        const publish1 = await sns.send(publishCmd1);

        snsMock.resetBehavior();

        const publish2 = await sns.send(publishCmd2);

        expect(publish1.MessageId).toBe(uuid1);
        expect(publish2).toBeUndefined();
    });

    it('resets mock behavior on mock reset', async () => {
        snsMock.resolves({
            MessageId: uuid1,
        });

        const sns = new SNSClient({});
        const publish1 = await sns.send(publishCmd1);

        snsMock.reset();

        const publish2 = await sns.send(publishCmd2);

        expect(publish1.MessageId).toBe(uuid1);
        expect(publish2).toBeUndefined();
    });

    it('restores real client', () => {
        const sns = new SNSClient({});

        expect((sns.send as MaybeSinonProxy).isSinonProxy).toBe(true);

        snsMock.restore();

        expect((sns.send as MaybeSinonProxy).isSinonProxy).toBeUndefined();
    });

    it('replaces existing mock', async () => {
        snsMock.resolves({
            MessageId: uuid1,
        });

        const sns1 = new SNSClient({});
        const publish1 = await sns1.send(publishCmd1);

        const newSnsMock = mockClient(SNSClient);
        newSnsMock.resolves({
            MessageId: uuid2,
        });

        const sns2 = new SNSClient({});

        const publish2 = await sns2.send(publishCmd1);

        expect(publish1.MessageId).toBe(uuid1);
        expect(publish2.MessageId).toBe(uuid2);
    });
});

describe('spying on the mock', () => {
    it('allows to access underlying Sinon stub', async () => {
        const sns = new SNSClient({});
        await sns.send(publishCmd1);

        expect(snsMock.send.callCount).toBe(1);
        expect(snsMock.send.getCall(0).args[0].input).toStrictEqual(publishCmd1.input);
    });

    it('allows to spy on the send calls', async () => {
        const sns = new SNSClient({});
        await sns.send(publishCmd1);
        await sns.send(publishCmd2);

        expect(snsMock.calls()).toHaveLength(2);
        expect(snsMock.call(0).args[0].input).toStrictEqual(publishCmd1.input);
        expect(snsMock.call(1).args[0].input).toStrictEqual(publishCmd2.input);
    });

    it('resets calls history', async () => {
        const sns = new SNSClient({});
        await sns.send(publishCmd1);

        snsMock.resetHistory();

        expect(snsMock.calls()).toHaveLength(0);
    });

    it('resets calls history on mock reset', async () => {
        const sns = new SNSClient({});
        await sns.send(publishCmd1);

        snsMock.reset();

        expect(snsMock.calls()).toHaveLength(0);
    });
});

describe('mocking responses', () => {
    it('returns mocked response', async () => {
        snsMock.resolves({
            MessageId: uuid1,
        });

        const sns = new SNSClient({});
        const publish = await sns.send(publishCmd1);

        expect(publish.MessageId).toBe(uuid1);
    });

    it('returns mocked response for multiple calls', async () => {
        snsMock.resolves({
            MessageId: uuid1,
        });

        const sns = new SNSClient({});
        const publish1 = await sns.send(publishCmd1);
        const publish2 = await sns.send(publishCmd2);

        expect(publish1.MessageId).toBe(uuid1);
        expect(publish2.MessageId).toBe(uuid1);
    });

    it('returns resolved async response', async () => {
        snsMock.resolves(resolveImmediately({
            MessageId: uuid1,
        }));

        const sns = new SNSClient({});
        const publish = await sns.send(publishCmd1);

        expect(publish.MessageId).toBe(uuid1);
    });

    it('returns function result', async () => {
        snsMock.callsFake(input => {
            if (input.Message === publishCmd1.input.Message) {
                return {MessageId: uuid1};
            } else if (input.Message === publishCmd2.input.Message) {
                return {MessageId: uuid2};
            }
            throw new Error('Unexpected message in mock');
        });

        const sns = new SNSClient({});
        const publish1 = await sns.send(publishCmd1);
        const publish2 = await sns.send(publishCmd2);

        expect(publish1.MessageId).toBe(uuid1);
        expect(publish2.MessageId).toBe(uuid2);
    });

    it('returns async function result', async () => {
        snsMock.callsFake(input => {
            if (input.Message === publishCmd1.input.Message) {
                return resolveImmediately({MessageId: uuid1});
            } else if (input.Message === publishCmd2.input.Message) {
                return resolveImmediately({MessageId: uuid2});
            }
            throw new Error('Unexpected message in mock');
        });

        const sns = new SNSClient({});
        const publish1 = await sns.send(publishCmd1);
        const publish2 = await sns.send(publishCmd2);

        expect(publish1.MessageId).toBe(uuid1);
        expect(publish2.MessageId).toBe(uuid2);
    });
});

describe('mocking command reponses', () => {
    it('returns mocked responses for commands', async () => {
        snsMock
            .on(PublishCommand).resolves({MessageId: uuid1})
            .on(ListTopicsCommand).resolves({Topics: [{TopicArn: topicArn}]});

        const sns = new SNSClient({});
        const publish = await sns.send(publishCmd1);
        const listTopics = await sns.send(new ListTopicsCommand({}));

        expect(publish.MessageId).toBe(uuid1);
        expect(listTopics.Topics).toHaveLength(1);
    });

    it('replaces command mock', async () => {
        snsMock.on(PublishCommand).resolves({MessageId: uuid1});

        const sns = new SNSClient({});
        const publish1 = await sns.send(publishCmd1);

        snsMock.on(PublishCommand).resolves({MessageId: uuid2});

        const publish2 = await sns.send(publishCmd2);

        expect(publish1.MessageId).toBe(uuid1);
        expect(publish2.MessageId).toBe(uuid2);
    });

    it('returns mocked responses for commands with given parameters', async () => {
        snsMock
            .on(PublishCommand, {...publishCmd1.input}).resolves({MessageId: uuid1})
            .on(PublishCommand, {...publishCmd2.input}).resolves({MessageId: uuid2});

        const sns = new SNSClient({});
        const publish1 = await sns.send(publishCmd1);
        const publish2 = await sns.send(publishCmd2);

        expect(publish1.MessageId).toBe(uuid1);
        expect(publish2.MessageId).toBe(uuid2);
    });

    it('returns default response for command if parameters do not match', async () => {
        snsMock
            .on(PublishCommand).resolves({MessageId: uuid1})
            .on(PublishCommand, {...publishCmd2.input}).resolves({MessageId: uuid2});

        const sns = new SNSClient({});
        const publish1 = await sns.send(publishCmd1);
        const publish2 = await sns.send(publishCmd2);

        expect(publish1.MessageId).toBe(uuid1);
        expect(publish2.MessageId).toBe(uuid2);
    });

    it('returns default response for client if commands do not match', async () => {
        snsMock
            .resolves({MessageId: uuid2})
            .on(PublishCommand, {...publishCmd1.input}).resolves({MessageId: uuid1});

        const sns = new SNSClient({});
        const publish1 = await sns.send(publishCmd1);
        const publish2 = await sns.send(publishCmd2);

        expect(publish1.MessageId).toBe(uuid1);
        expect(publish2.MessageId).toBe(uuid2);
    });

    it('returns mocked responses for given parameters', async () => {
        snsMock
            .onAnyCommand({...publishCmd1.input}).resolves({MessageId: uuid1})
            .onAnyCommand({...publishCmd2.input}).resolves({MessageId: uuid2});

        const sns = new SNSClient({});
        const publish1 = await sns.send(publishCmd1);
        const publish2 = await sns.send(publishCmd2);

        expect(publish1.MessageId).toBe(uuid1);
        expect(publish2.MessageId).toBe(uuid2);
    });
});

describe('behavior declaration order', () => {
    it('uses more generic declaration for the Command if declared later', async () => {
        snsMock
            .on(PublishCommand, {...publishCmd1.input}).resolves({MessageId: uuid1})
            .on(PublishCommand).resolves({MessageId: uuid2});

        const sns = new SNSClient({});
        const publish1 = await sns.send(publishCmd1);
        const publish2 = await sns.send(publishCmd2);

        expect(publish1.MessageId).toBe(uuid2);
        expect(publish2.MessageId).toBe(uuid2);
    });

    it('uses more generic declaration for all Commands if declared later', async () => {
        snsMock
            .on(PublishCommand).resolves({MessageId: uuid1})
            .onAnyCommand().resolves({MessageId: uuid2});

        const sns = new SNSClient({});
        const publish1 = await sns.send(publishCmd1);
        const publish2 = await sns.send(publishCmd2);

        expect(publish1.MessageId).toBe(uuid2);
        expect(publish2.MessageId).toBe(uuid2);
    });
});

describe('throwing error', () => {
    it('throws an error', async () => {
        snsMock.on(PublishCommand).rejects();

        const sns = new SNSClient({});

        await expect(sns.send(publishCmd1)).rejects.toThrow();
    });

    it('throws a custom simple error', async () => {
        snsMock.on(PublishCommand).rejects(new Error('Invalid parameter: TopicArn'));

        const sns = new SNSClient({});

        await expect(sns.send(publishCmd1)).rejects.toThrow('Invalid parameter: TopicArn');
    });

    it('throws a passed string as a simple error', async () => {
        snsMock.on(PublishCommand).rejects('Invalid parameter: TopicArn');

        const sns = new SNSClient({});

        await expect(sns.send(publishCmd1)).rejects.toThrow('Invalid parameter: TopicArn');
    });

    it('throws a custom data as an error', async () => {
        snsMock.on(PublishCommand).rejects({
            message: 'Invalid parameter: TopicArn',
            Type: 'Sender',
            Code: 'InvalidParameter',
        });

        const sns = new SNSClient({});

        try {
            await sns.send(publishCmd1);
        } catch (e) {
            expect(e).toMatchObject({
                message: 'Invalid parameter: TopicArn',
                Type: 'Sender',
                Code: 'InvalidParameter',
            });
        }

        expect.hasAssertions();
    });
});

describe('supporting alternative send() calls', () => {
    it('mocks send with options parameter', async () => {
        snsMock.resolves({
            MessageId: uuid1,
        });

        const sns = new SNSClient({});
        const publish = await sns.send(publishCmd1, {});

        expect(publish.MessageId).toBe(uuid1);
    });

    it.skip('mocks send with callback', done => {
        snsMock.resolves({
            MessageId: uuid1,
        });

        const sns = new SNSClient({});
        sns.send(publishCmd1, (err, data) => {
            expect(err).toBeUndefined();
            expect(data).toBe(uuid1);
            done();
        });
    });

    it.skip('mocks send with options and callback', done => {
        snsMock.resolves({
            MessageId: uuid1,
        });

        const sns = new SNSClient({});
        sns.send(publishCmd1, {}, (err, data) => {
            expect(err).toBeUndefined();
            expect(data).toBe(uuid1);
            done();
        });
    });
});

const resolveImmediately = (x: unknown) => new Promise(resolve => {
    setTimeout(() => {
        resolve(x);
    }, 0);
});
