import {mockClient} from 'aws-sdk-client-mock';
import {PublishCommand, SNSClient} from '@aws-sdk/client-sns';
import {expect as globalsExpect} from '@jest/globals';
import {expectError} from 'tsd';
import '../src';

expect(1).toHaveReceivedCommand(PublishCommand);

expect(mockClient(SNSClient)).toHaveReceivedCommand(PublishCommand);
expectError(expect(mockClient(SNSClient)).toHaveReceivedCommand(String));

expect(mockClient(SNSClient)).toHaveReceivedAnyCommand();

expect(mockClient(SNSClient)).toHaveReceivedCommandTimes(PublishCommand, 1);
expectError(expect(mockClient(SNSClient)).toHaveReceivedCommandTimes(PublishCommand));

expect(mockClient(SNSClient)).toHaveReceivedCommandWith(PublishCommand, {Message: ''});
expectError(expect(mockClient(SNSClient)).toHaveReceivedCommandWith(PublishCommand, {Foo: ''}));

expect(mockClient(SNSClient)).toHaveReceivedNthCommandWith(1, PublishCommand, {Message: ''});
expectError(expect(mockClient(SNSClient)).toHaveReceivedNthCommandWith(1, PublishCommand, {Foo: ''}));

globalsExpect(mockClient(SNSClient)).toHaveReceivedCommand(PublishCommand);
