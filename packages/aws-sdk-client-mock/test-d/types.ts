import {AwsStub, mockClient} from '../src';
import {ListTopicsCommand, PublishCommand, PublishCommandOutput, SNSClient} from '@aws-sdk/client-sns';
import {expectError, expectType} from 'tsd';

expectType<AwsStub<SNSClient>>(mockClient(SNSClient));

// proper Command, input and output types
mockClient(SNSClient).on(PublishCommand);
mockClient(SNSClient).on(PublishCommand, {TopicArn: '', Message: ''});
mockClient(SNSClient).on(PublishCommand, {Message: ''});
mockClient(SNSClient).on(PublishCommand).resolves({});
mockClient(SNSClient).on(PublishCommand).resolves({MessageId: ''});

// invalid Client instance/type
expectError(mockClient({}));
expectError(mockClient(PublishCommand));

// invalid Command types
expectError(mockClient(SNSClient).on({}));
// Clients in AWS SDK v3.18.0 accept any wrong types of commands
// expectError(mockClient(SNSClient).on(ListTablesCommand));

// invalid input types
expectError(mockClient(SNSClient).on(ListTopicsCommand, {TopicArn: '', Message: ''}));

// invalid output types
expectError(mockClient(SNSClient).on(PublishCommand).resolves({MessageId: '', Topics: []}));
expectError(mockClient(SNSClient).on(PublishCommand).resolves({Topics: []}));

// Sinon Spy
expectType<PublishCommand>(mockClient(SNSClient).commandCalls(PublishCommand)[0].args[0]);
expectType<Promise<PublishCommandOutput>>(mockClient(SNSClient).commandCalls(PublishCommand)[0].returnValue);
