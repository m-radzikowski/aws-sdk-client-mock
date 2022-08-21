import {AwsClientStub, mockClient} from '../src';
import {PublishCommand, SNSClient} from '@aws-sdk/client-sns';
import {publishCmd1, publishCmd3, topicArn} from './fixtures';

let snsMock: AwsClientStub<SNSClient>;

beforeEach(() => {
    snsMock = mockClient(SNSClient);
});

afterEach(() => {
    snsMock.restore();
});

/**
 * Sinon.JS has a bug with a sinon.match breaking subsequent mocks in some scenarios,
 * including leaking the mock behaviors between the stub.reset() calls.
 * See: https://github.com/m-radzikowski/aws-sdk-client-mock/issues/67 and https://github.com/sinonjs/sinon/issues/1572
 */
describe('issue 67 - breaking subsequent mocks', () => {
    const sns = new SNSClient({});

    /**
     * This corresponds to the pattern with mock.reset() and mock.onAnyCommand().rejects()
     * being called in the beforeEach() block and then individual mock behaviors being set in test functions.
     */
    test('resetting mock does not break subsequent mocks', async () => {
        snsMock.onAnyCommand().rejects('any command error');
        snsMock.on(PublishCommand).rejects('publish error');

        snsMock.reset();
        snsMock.onAnyCommand().rejects('any command error');

        const publish = sns.send(publishCmd1);

        await expect(publish).rejects.toThrow('any command error');
    });

    /**
     * Make sure the main behavior described in the Sinon.JS bug, with match.any breaking subsequent stubs,
     * does not happen.
     */
    test('onAnyCommand does not brake other mocks', async () => {
        snsMock.onAnyCommand().rejects('any command error');
        snsMock.onAnyCommand({TopicArn: topicArn}).rejects('any command first topic error');

        const publish1 = sns.send(publishCmd1);
        const publish2 = sns.send(publishCmd3);

        await expect(publish1).rejects.toThrow('any command first topic error');
        await expect(publish2).rejects.toThrow('any command error');
    });
});
