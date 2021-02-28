import {mockClient} from '../src';
import {ListTopicsCommand, PublishCommand, SNSClient} from '@aws-sdk/client-sns';
import {expectError} from 'tsd';
import {ListTablesCommand} from '@aws-sdk/client-dynamodb';

expectError(mockClient({}));

// expectType<AwsClientStub<SNSClient>>(mockClient(SNSClient)); // TODO Fix

// proper Command, input and output types
mockClient(SNSClient).on(PublishCommand);
mockClient(SNSClient).on(PublishCommand, {TopicArn: '', Message: ''});
mockClient(SNSClient).on(PublishCommand).resolves({});
mockClient(SNSClient).on(PublishCommand).resolves({MessageId: ''});

// invalid Command types
expectError(mockClient(SNSClient).on({}));
expectError(mockClient(SNSClient).on(ListTablesCommand));

// invalid input types
expectError(mockClient(SNSClient).on(PublishCommand, {}));
expectError(mockClient(SNSClient).on(ListTopicsCommand, {TopicArn: '', Message: ''}));

// invalid output types
expectError(mockClient(SNSClient).on(PublishCommand).resolves({MessageId: '', Topics: []}));
expectError(mockClient(SNSClient).on(PublishCommand).resolves({Topics: []}));
