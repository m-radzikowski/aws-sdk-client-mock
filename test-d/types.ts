import {AwsClientStub, mockClient} from '../src';
import {ListTopicsCommand, PublishCommand, SNSClient} from '@aws-sdk/client-sns';
import {expectError, expectType} from 'tsd';
import {ListTablesCommand} from '@aws-sdk/client-dynamodb';

expectType<AwsClientStub<SNSClient>>(mockClient(SNSClient));

// proper Command, input and output types
mockClient(SNSClient).on(PublishCommand);
mockClient(SNSClient).on(PublishCommand, {TopicArn: '', Message: ''});
mockClient(SNSClient).on(PublishCommand).resolves({});
mockClient(SNSClient).on(PublishCommand).resolves({MessageId: ''});

// invalid Client instance/type
expectError(mockClient({}));
expectError(mockClient(PublishCommand));

// invalid Command types
expectError(mockClient(SNSClient).on({}));
expectError(mockClient(SNSClient).on(ListTablesCommand));

// invalid input types
expectError(mockClient(SNSClient).on(PublishCommand, {}));
expectError(mockClient(SNSClient).on(ListTopicsCommand, {TopicArn: '', Message: ''}));

// invalid output types
expectError(mockClient(SNSClient).on(PublishCommand).resolves({MessageId: '', Topics: []}));
expectError(mockClient(SNSClient).on(PublishCommand).resolves({Topics: []}));
