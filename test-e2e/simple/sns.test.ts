import {PublishCommand, SNSClient} from '@aws-sdk/client-sns';
import {mockClient} from 'aws-sdk-client-mock';

it('mocks SNS client', async () => {
    const snsMock = mockClient(SNSClient);
    snsMock.on(PublishCommand).resolves({
        MessageId: '12345678-1111-2222-3333-111122223333',
    });

    const sns = new SNSClient({});
    const result = await sns.send(new PublishCommand({
        TopicArn: 'arn:aws:sns:us-east-1:111111111111:MyTopic',
        Message: 'My message',
    }));

    expect(snsMock).toHaveReceivedCommandTimes(PublishCommand, 1);
    expect(result.MessageId).toBe('12345678-1111-2222-3333-111122223333');
});
