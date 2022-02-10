import {PublishCommand} from '@aws-sdk/client-sns';

export const topicArn = 'arn:aws:sns:us-east-1:111111111111:MyTopic';
export const topicArn2 = 'arn:aws:sns:us-east-1:111111111111:MyOtherTopic';

export const publishCmd1 = new PublishCommand({
    TopicArn: topicArn,
    Message: 'mock message',
});
export const publishCmd2 = new PublishCommand({
    TopicArn: topicArn,
    Message: 'second mock message',
});
export const publishCmd3 = new PublishCommand({
    TopicArn: topicArn2,
    Message: 'third mock message',
});

export const uuid1 = '12345678-1111-2222-3333-111122223333';
export const uuid2 = '12345678-4444-5555-6666-111122223333';
