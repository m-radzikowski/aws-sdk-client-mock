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

export const uuid1 = '12345678-1111-1111-1111-111122223333';
export const uuid2 = '12345678-2222-2222-2222-111122223333';
export const uuid3 = '12345678-3333-3333-3333-111122223333';
