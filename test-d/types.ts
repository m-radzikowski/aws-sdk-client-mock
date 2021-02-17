import {AwsClientStub, mockClient} from '../src';
import {ListTopicsCommand, PublishCommand, SNSClient} from '@aws-sdk/client-sns';
import {expectError, expectType} from 'tsd';
import {ListTablesCommand} from '@aws-sdk/client-dynamodb';

expectError(mockClient({}));

expectType<AwsClientStub<SNSClient>>(mockClient(SNSClient));

// proper Command and input types
mockClient(SNSClient).on(PublishCommand);
mockClient(SNSClient).on(PublishCommand, {TopicArn: '', Message: ''});

// invalid Command types
expectError(mockClient(SNSClient).on({}));
expectError(mockClient(SNSClient).on(ListTablesCommand));

// invalid input types
expectError(mockClient(SNSClient).on(PublishCommand, {}));
expectError(mockClient(SNSClient).on(ListTopicsCommand, {TopicArn: '', Message: ''}));
