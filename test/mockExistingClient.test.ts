import {mockClient} from '../src';
import {SNSClient} from '@aws-sdk/client-sns';
import {publishCmd1, uuid1, uuid2} from './fixtures';

it('mocks given client instance', async () => {
    const sns = new SNSClient({});
    mockClient(sns).resolves({MessageId: uuid1});

    const publish = await sns.send(publishCmd1);

    expect(publish.MessageId).toBe(uuid1);
});

it('mocks 2 client instances separately', async () => {
    const sns1 = new SNSClient({});
    mockClient(sns1).resolves({MessageId: uuid1});

    const sns2 = new SNSClient({});
    mockClient(sns2).resolves({MessageId: uuid2});

    const publish1 = await sns1.send(publishCmd1);
    const publish2 = await sns2.send(publishCmd1);

    expect(publish1.MessageId).toBe(uuid1);
    expect(publish2.MessageId).toBe(uuid2);
});
