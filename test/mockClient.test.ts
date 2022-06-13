import {AwsClientBehavior, AwsClientStub, mockClient} from '../src';
import {ListTopicsCommand, PublishCommand, SNS, SNSClient} from '@aws-sdk/client-sns';
import {MaybeSinonProxy} from '../src/sinon';
import {publishCmd1, publishCmd2, topicArn, uuid1, uuid2, uuid3} from './fixtures';

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

    it('finds calls of given command type', async () => {
        snsMock.resolves({
            MessageId: uuid1,
        });

        const sns = new SNSClient({});
        await sns.send(publishCmd1);
        await sns.send(new ListTopicsCommand({}));

        expect(snsMock.calls()).toHaveLength(2);
        expect(snsMock.commandCalls(PublishCommand)).toHaveLength(1);

        expect(snsMock.commandCalls(PublishCommand)[0].args[0].input).toStrictEqual(publishCmd1.input);
        expect(snsMock.commandCalls(PublishCommand)[0].returnValue).toStrictEqual(Promise.resolve({MessageId: uuid1}));
    });

    it('finds calls of given command type and input parameters', async () => {
        const sns = new SNSClient({});
        await sns.send(publishCmd1);
        await sns.send(publishCmd2);

        expect(snsMock.commandCalls(PublishCommand)).toHaveLength(2);
        expect(snsMock.commandCalls(PublishCommand, {Message: publishCmd1.input.Message})).toHaveLength(1);
    });

    it('finds calls of given command type and exact input', async () => {
        const sns = new SNSClient({});
        await sns.send(publishCmd1);
        await sns.send(publishCmd2);

        expect(snsMock.commandCalls(PublishCommand)).toHaveLength(2);
        expect(snsMock.commandCalls(PublishCommand, {Message: publishCmd1.input.Message}, true)).toHaveLength(0);
        expect(snsMock.commandCalls(PublishCommand, {...publishCmd1.input}, true)).toHaveLength(1);
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

describe('mocking behaviors in different ways', () => {
    // those tests make sure that behaviors declared on mock, any command and specific command behave in the same way

    const behaviors: [string, () => AwsClientBehavior<SNSClient>][] = [
        ['client', () => snsMock],
        ['any command', () => snsMock.onAnyCommand()],
        ['any command with input', () => snsMock.onAnyCommand({...publishCmd1.input})],
        ['command', () => snsMock.on(PublishCommand)],
        ['command with input', () => snsMock.on(PublishCommand, {...publishCmd1.input})],
    ];

    describe.each(behaviors)('for behavior specified for %s', (level, getBehavior) => {
        let behavior: AwsClientBehavior<SNSClient>;

        beforeEach(() => {
            behavior = getBehavior();
        });

        describe('returning response', () => {
            it('returns mocked response', async () => {
                behavior.resolves({MessageId: uuid1});

                const sns = new SNSClient({});
                const publish = await sns.send(publishCmd1);

                expect(publish.MessageId).toBe(uuid1);
            });

            it('returns mocked response once', async () => {
                behavior.resolvesOnce({MessageId: uuid1});

                const sns = new SNSClient({});
                const publish1 = await sns.send(publishCmd1);
                const publish2 = await sns.send(publishCmd1);

                expect(publish1.MessageId).toBe(uuid1);
                expect(publish2).toBeUndefined();
            });

            it('returns mocked response for multiple calls', async () => {
                behavior.resolves({
                    MessageId: uuid1,
                });

                const sns = new SNSClient({});
                const publish1 = await sns.send(publishCmd1);
                const publish2 = await sns.send(publishCmd1);

                expect(publish1.MessageId).toBe(uuid1);
                expect(publish2.MessageId).toBe(uuid1);
            });

            it('replaces mocked response', async () => {
                behavior.resolves({MessageId: uuid1});

                const sns = new SNSClient({});
                const publish1 = await sns.send(publishCmd1);

                behavior.resolves({MessageId: uuid2});

                const publish2 = await sns.send(publishCmd1);

                expect(publish1.MessageId).toBe(uuid1);
                expect(publish2.MessageId).toBe(uuid2);
            });

            it('returns resolved async response', async () => {
                behavior.resolves(resolveImmediately({MessageId: uuid1}));

                const sns = new SNSClient({});
                const publish = await sns.send(publishCmd1);

                expect(publish.MessageId).toBe(uuid1);
            });
        });

        describe('throwing error', () => {
            it('throws an error', async () => {
                behavior.rejects();

                const sns = new SNSClient({});

                await expect(sns.send(publishCmd1)).rejects.toThrow();
            });

            it('throws an error once', async () => {
                behavior.rejectsOnce();

                const sns = new SNSClient({});

                await expect(sns.send(publishCmd1)).rejects.toThrow();

                const publish2 = sns.send(publishCmd1);

                expect(publish2).toBeUndefined();
            });

            it('throws custom simple error', async () => {
                behavior.rejects(new Error('Invalid parameter: TopicArn'));

                const sns = new SNSClient({});

                await expect(sns.send(publishCmd1)).rejects.toThrow('Invalid parameter: TopicArn');
            });

            it('throws a passed string as a simple error', async () => {
                behavior.rejects('Invalid parameter: TopicArn');

                const sns = new SNSClient({});

                await expect(sns.send(publishCmd1)).rejects.toThrow('Invalid parameter: TopicArn');
            });

            it('throws a custom data as an error', async () => {
                behavior.rejects({
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

        describe('calling mock function', () => {
            it('returns function result', async () => {
                behavior.callsFake(() => {
                    return {MessageId: uuid1};
                });

                const sns = new SNSClient({});
                const publish = await sns.send(publishCmd1);

                expect(publish.MessageId).toBe(uuid1);
            });

            it('returns function result once', async () => {
                behavior.callsFakeOnce(() => ({MessageId: uuid1}));

                const sns = new SNSClient({});
                const publish1 = await sns.send(publishCmd1);
                const publish2 = await sns.send(publishCmd1);

                expect(publish1.MessageId).toBe(uuid1);
                expect(publish2).toBeUndefined();
            });

            it('returns async function result', async () => {
                behavior.callsFake(() => {
                    return resolveImmediately({MessageId: uuid1});
                });

                const sns = new SNSClient({});
                const publish1 = await sns.send(publishCmd1);

                expect(publish1.MessageId).toBe(uuid1);
            });
        });

        describe('supporting alternative send() calls', () => {
            it('mocks send with options parameter', async () => {
                behavior.resolves({MessageId: uuid1});

                const sns = new SNSClient({});
                const publish = await sns.send(publishCmd1, {});

                expect(publish.MessageId).toBe(uuid1);
            });

            it.skip('mocks send with callback', done => {
                behavior.resolves({MessageId: uuid1});

                const sns = new SNSClient({});
                sns.send(publishCmd1, (err, data) => {
                    expect(err).toBeUndefined();
                    expect(data).toBe(uuid1);
                    done();
                });
            });

            it.skip('mocks send with options and callback', done => {
                behavior.resolves({MessageId: uuid1});

                const sns = new SNSClient({});
                sns.send(publishCmd1, {}, (err, data) => {
                    expect(err).toBeUndefined();
                    expect(data).toBe(uuid1);
                    done();
                });
            });
        });

        it('supports SDK v2-style calls', async () => {
            behavior.resolves({MessageId: uuid1});

            const sns = new SNS({});
            const publish = await sns.publish({
                TopicArn: topicArn,
                Message: 'mock message',
            });

            expect(publish.MessageId).toBe(uuid1);
        });
    });
});

describe('calling mock function', () => {
    it('returns result based on the input', async () => {
        snsMock.callsFake(input => {
            if (input.Message === publishCmd1.input.Message) {
                return {MessageId: uuid1};
            } else if (input.Message === publishCmd2.input.Message) {
                return {MessageId: uuid2};
            }
            throw new Error('Unexpected message in mock');
        });

        const sns = new SNSClient({});
        const publish = await sns.send(publishCmd1);

        expect(publish.MessageId).toBe(uuid1);
    });

    it('returns async function result based on the input', async () => {
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

        expect(publish1.MessageId).toBe(uuid1);
    });
});

describe('behavior matching', () => {
    it('selects matching command', async () => {
        snsMock
            .on(PublishCommand).resolves({MessageId: uuid1})
            .on(ListTopicsCommand).resolves({Topics: [{TopicArn: topicArn}]});

        const sns = new SNSClient({});
        const publish = await sns.send(publishCmd1);
        const listTopics = await sns.send(new ListTopicsCommand({}));

        expect(publish.MessageId).toBe(uuid1);
        expect(listTopics.Topics).toHaveLength(1);
    });

    it('selects matching command with partial parameters', async () => {
        snsMock
            .on(PublishCommand, {Message: publishCmd1.input.Message}).resolves({MessageId: uuid1})
            .on(PublishCommand, {Message: publishCmd2.input.Message}).resolves({MessageId: uuid2});

        const sns = new SNSClient({});
        const publish1 = await sns.send(publishCmd1);
        const publish2 = await sns.send(publishCmd2);

        expect(publish1.MessageId).toBe(uuid1);
        expect(publish2.MessageId).toBe(uuid2);
    });

    it('selects matching command with exact parameters', async () => {
        snsMock
            .on(PublishCommand, {...publishCmd1.input}, true).resolves({MessageId: uuid1})
            .on(PublishCommand, {...publishCmd2.input}, true).resolves({MessageId: uuid2});

        const sns = new SNSClient({});
        const publish1 = await sns.send(publishCmd1);
        const publish2 = await sns.send(publishCmd2);

        expect(publish1.MessageId).toBe(uuid1);
        expect(publish2.MessageId).toBe(uuid2);
    });

    it('does not select command if it does not strictly match', async () => {
        snsMock
            .on(PublishCommand, {Message: publishCmd1.input.Message}, true).resolves({MessageId: uuid1});

        const sns = new SNSClient({});
        const publish = await sns.send(publishCmd1);

        expect(publish).toBe(undefined);
    });

    it('selects default command response if parameters do not match', async () => {
        snsMock
            .on(PublishCommand).resolves({MessageId: uuid1})
            .on(PublishCommand, {...publishCmd2.input}).resolves({MessageId: uuid2});

        const sns = new SNSClient({});
        const publish1 = await sns.send(publishCmd1);
        const publish2 = await sns.send(publishCmd2);

        expect(publish1.MessageId).toBe(uuid1);
        expect(publish2.MessageId).toBe(uuid2);
    });

    it('selects default client response if commands do not match', async () => {
        snsMock
            .resolves({MessageId: uuid2})
            .on(PublishCommand, {...publishCmd1.input}).resolves({MessageId: uuid1});

        const sns = new SNSClient({});
        const publish1 = await sns.send(publishCmd1);
        const publish2 = await sns.send(publishCmd2);

        expect(publish1.MessageId).toBe(uuid1);
        expect(publish2.MessageId).toBe(uuid2);
    });

    it('selects client responses for given partial parameters', async () => {
        snsMock
            .onAnyCommand({Message: publishCmd1.input.Message}).resolves({MessageId: uuid1})
            .onAnyCommand({Message: publishCmd2.input.Message}).resolves({MessageId: uuid2});

        const sns = new SNSClient({});
        const publish1 = await sns.send(publishCmd1);
        const publish2 = await sns.send(publishCmd2);

        expect(publish1.MessageId).toBe(uuid1);
        expect(publish2.MessageId).toBe(uuid2);
    });

    it('selects client responses with exact parameters', async () => {
        snsMock
            .onAnyCommand({...publishCmd1.input}, true).resolves({MessageId: uuid1})
            .onAnyCommand({...publishCmd2.input}, true).resolves({MessageId: uuid2});

        const sns = new SNSClient({});
        const publish1 = await sns.send(publishCmd1);
        const publish2 = await sns.send(publishCmd2);

        expect(publish1.MessageId).toBe(uuid1);
        expect(publish2.MessageId).toBe(uuid2);
    });

    it('does not select client response if it does not strictly match', async () => {
        snsMock
            .onAnyCommand({Message: publishCmd1.input.Message}, true).resolves({MessageId: uuid1});

        const sns = new SNSClient({});
        const publish = await sns.send(publishCmd1);

        expect(publish).toBe(undefined);
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
            .onAnyCommand({...publishCmd1.input}).resolves({MessageId: uuid1})
            .onAnyCommand().resolves({MessageId: uuid2});

        const sns = new SNSClient({});
        const publish1 = await sns.send(publishCmd1);
        const publish2 = await sns.send(publishCmd2);

        expect(publish1.MessageId).toBe(uuid2);
        expect(publish2.MessageId).toBe(uuid2);
    });
});

describe('chained behaviors', () => {
    it('chains results', async () => {
        snsMock
            .resolvesOnce({MessageId: uuid1})
            .resolvesOnce({MessageId: uuid2})
            .resolves({MessageId: uuid3});

        const sns = new SNSClient({});
        const publish1 = await sns.send(publishCmd1);
        const publish2 = await sns.send(publishCmd1);
        const publish3 = await sns.send(publishCmd1);

        expect(publish1.MessageId).toBe(uuid1);
        expect(publish2.MessageId).toBe(uuid2);
        expect(publish3.MessageId).toBe(uuid3);
    });

    it('chains results for different commands', async () => {
        snsMock
            .on(PublishCommand)
            .resolvesOnce({MessageId: uuid1})
            .resolvesOnce({MessageId: uuid2})
            .resolves({MessageId: uuid3})
            .on(ListTopicsCommand)
            .resolvesOnce({Topics: [{TopicArn: topicArn}]});

        const sns = new SNSClient({});
        const publish1 = await sns.send(publishCmd1);
        const publish2 = await sns.send(publishCmd1);
        const publish3 = await sns.send(publishCmd1);
        const listTopics1 = await sns.send(new ListTopicsCommand({}));
        const listTopics2 = await sns.send(new ListTopicsCommand({}));

        expect(publish1.MessageId).toBe(uuid1);
        expect(publish2.MessageId).toBe(uuid2);
        expect(publish3.MessageId).toBe(uuid3);
        expect(listTopics1.Topics).toHaveLength(1);
        expect(listTopics2).toBeUndefined();
    });

    it('chains results for different command after resolving once', async () => {
        snsMock
            .on(PublishCommand)
            .resolvesOnce({MessageId: uuid1})
            .on(ListTopicsCommand)
            .resolvesOnce({Topics: [{TopicArn: topicArn}]});

        const sns = new SNSClient({});
        const publish1 = await sns.send(publishCmd1);
        const publish2 = await sns.send(publishCmd1);
        const listTopics1 = await sns.send(new ListTopicsCommand({}));
        const listTopics2 = await sns.send(new ListTopicsCommand({}));

        expect(publish1.MessageId).toBe(uuid1);
        expect(publish2).toBeUndefined();
        expect(listTopics1.Topics).toHaveLength(1);
        expect(listTopics2).toBeUndefined();
    });

    it('chains results, rejects, and mock functions', async () => {
        snsMock
            .resolvesOnce({MessageId: uuid1})
            .rejectsOnce()
            .callsFakeOnce(() => ({MessageId: uuid2}));

        const sns = new SNSClient({});
        const publish1 = await sns.send(publishCmd1);
        await expect(sns.send(publishCmd1)).rejects.toThrow();
        const publish3 = await sns.send(publishCmd1);
        const publish4 = await sns.send(publishCmd1);

        expect(publish1.MessageId).toBe(uuid1);
        expect(publish3.MessageId).toBe(uuid2);
        expect(publish4).toBeUndefined();
    });

    it('overrides chain results for command', async () => {
        snsMock
            .on(PublishCommand).resolvesOnce({MessageId: uuid1})
            .on(PublishCommand).resolvesOnce({MessageId: uuid2});

        const sns = new SNSClient({});
        const publish1 = await sns.send(publishCmd1);
        const publish2 = await sns.send(publishCmd1);

        expect(publish1.MessageId).toBe(uuid2);
        expect(publish2).toBeUndefined();
    });

    it('overrides chain results for all commands', async () => {
        snsMock
            .on(PublishCommand).resolvesOnce({MessageId: uuid1})
            .onAnyCommand().resolvesOnce({MessageId: uuid2});

        const sns = new SNSClient({});
        const publish1 = await sns.send(publishCmd1);
        const publish2 = await sns.send(publishCmd2);

        expect(publish1.MessageId).toBe(uuid2);
        expect(publish2).toBeUndefined();
    });
});

const resolveImmediately = <T>(x: T): Promise<T> => new Promise(resolve => {
    setTimeout(() => {
        resolve(x);
    }, 0);
});
