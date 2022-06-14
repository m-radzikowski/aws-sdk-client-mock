/* eslint-disable @typescript-eslint/no-explicit-any */
import assert from 'assert';
import type {MetadataBearer} from '@aws-sdk/types';
import type {AwsCommand, AwsStub} from './awsClientStub';
import type {SinonSpyCall} from 'sinon';

export interface AwsSdkJestMockBaseMatchers<R> extends Record<string, any> {
    /**
     * Asserts {@link AwsStub Aws Client Mock} received a {@link command} exact number of {@link times}
     *
     * @param command aws-sdk command constructor
     * @param times
     */
    toHaveReceivedCommandTimes<TCmdInput extends object,
        TCmdOutput extends MetadataBearer>(
        command: new (input: TCmdInput) => AwsCommand<TCmdInput, TCmdOutput>,
        times: number,
    ): R;

    /**
     * Asserts {@link AwsStub Aws Client Mock} received a {@link command} at least one time
     *
     * @param command aws-sdk command constructor
     */
    toHaveReceivedCommand<TCmdInput extends object,
        TCmdOutput extends MetadataBearer>(
        command: new (input: TCmdInput) => AwsCommand<TCmdInput, TCmdOutput>,
    ): R;

    /**
     * Asserts {@link AwsStub Aws Client Mock} received a {@link command} at leas one time with input
     * matching {@link input}
     *
     * @param command aws-sdk command constructor
     * @param input
     */
    toHaveReceivedCommandWith<TCmdInput extends object,
        TCmdOutput extends MetadataBearer>(
        command: new (input: TCmdInput) => AwsCommand<TCmdInput, TCmdOutput>,
        input: Partial<TCmdInput>,
    ): R;

    /**
     * Asserts {@link AwsStub Aws Client Mock} received a {@link command} as defined {@link call} number
     * with matching {@link input}
     *
     * @param call call number to assert
     * @param command aws-sdk command constructor
     * @param input
     */
    toHaveReceivedNthCommandWith<TCmdInput extends object,
        TCmdOutput extends MetadataBearer>(
        call: number,
        command: new (input: TCmdInput) => AwsCommand<TCmdInput, TCmdOutput>,
        input: Partial<TCmdInput>,
    ): R;
}

export interface AwsSdkJestMockAliasMatchers<R> {
    /**
     * Asserts {@link AwsStub Aws Client Mock} received a {@link command} exact number of {@link times}
     *
     * @alias {@link AwsSdkJestMockBaseMatchers.toHaveReceivedCommandTimes}
     * @param command aws-sdk command constructor
     * @param times
     */
    toReceiveCommandTimes<TCmdInput extends object,
        TCmdOutput extends MetadataBearer>(
        command: new (input: TCmdInput) => AwsCommand<TCmdInput, TCmdOutput>,
        times: number,
    ): R;

    /**
     * Asserts {@link AwsStub Aws Client Mock} received a {@link command} at least one time
     *
     * @alias {@link AwsSdkJestMockBaseMatchers.toHaveReceivedCommand}
     * @param command aws-sdk command constructor
     */
    toReceiveCommand<TCmdInput extends object,
        TCmdOutput extends MetadataBearer>(
        command: new (input: TCmdInput) => AwsCommand<TCmdInput, TCmdOutput>,
    ): R;

    /**
     * Asserts {@link AwsStub Aws Client Mock} received a {@link command} at leas one time with input
     * matching {@link input}
     *
     * @alias {@link AwsSdkJestMockBaseMatchers.toHaveReceivedCommandWith}
     * @param command aws-sdk command constructor
     * @param input
     */
    toReceiveCommandWith<TCmdInput extends object,
        TCmdOutput extends MetadataBearer>(
        command: new (input: TCmdInput) => AwsCommand<TCmdInput, TCmdOutput>,
        input: Partial<TCmdInput>,
    ): R;

    /**
     * Asserts {@link AwsStub Aws Client Mock} received a {@link command} as defined {@link call} number
     * with matching {@link input}
     *
     * @alias {@link AwsSdkJestMockBaseMatchers.toHaveReceivedNthCommandWith}
     * @param call call number to assert
     * @param command aws-sdk command constructor
     * @param input
     */
    toReceiveNthCommandWith<TCmdInput extends object,
        TCmdOutput extends MetadataBearer>(
        call: number,
        command: new (input: TCmdInput) => AwsCommand<TCmdInput, TCmdOutput>,
        input: Partial<TCmdInput>,
    ): R;
}

/**
 * Provides {@link jest} matcher for testing {@link AwsStub} command calls
 *
 * @example
 *
 * ```ts
 * import { mockClient } from "aws-sdk-client-mock";
 * import { ScanCommand } from "@aws-sdk/client-dynamodb";
 *
 * const awsMock = mockClient(DynamoDBClient);
 *
 * awsMock.on(ScanCommand).resolves({
 *   Items: [{ Info: { S: '{ "val": "info" }' }, LockID: { S: "fooId" } }],
 * });
 *
 * it("Should call scan command", async () => {
 *    // check result ... maybe :)
 *    await expect(sut()).resolves.toEqual({ ... });
 *
 *    // Assert awsMock to have recevied a Scan Command at least one time
 *    expect(awsMock).toHaveReceivedCommand(ScanCommand);
 * });
 * ```
 */
export interface AwsSdkJestMockMatchers<R> extends AwsSdkJestMockBaseMatchers<R>, AwsSdkJestMockAliasMatchers<R>, Record<string, any> {
}

declare global {
    namespace jest {
        // eslint-disable-next-line @typescript-eslint/no-empty-interface
        interface Matchers<R = void> extends AwsSdkJestMockMatchers<R> {
        }
    }
}

type ClientMock = AwsStub<any, any>;
type AnyCommand = AwsCommand<any, any>;
type AnySpyCall = SinonSpyCall<[AnyCommand]>;
type MessageFunctionParams<CheckData> = {
    cmd: string;
    client: string;
    calls: AnySpyCall[];
    commandCalls: AnySpyCall[];
    data: CheckData;
    notPrefix: string;
};

/**
 * Prettyprints command calls for message
 *
 * @param ctx
 * @param calls
 * @returns
 */
function printCalls(ctx: jest.MatcherContext, calls: AnySpyCall[]): string[] {
    return calls.length > 0 ? [
        'Calls:',
        '',
        ...calls.map(
            (c, i) =>
                `  ${i + 1}. ${c.args[0].constructor.name}: ${ctx.utils.printReceived(
                    c.args[0].input,
                )}`,
        )] : [];
}

export function processMatch<CheckData>({
    ctx,
    mockClient,
    command,
    check,
    input,
    message,
}: {
    ctx: jest.MatcherContext;
    mockClient: ClientMock;
    command: new () => AnyCommand;
    check: (params: { calls: AnySpyCall[]; commandCalls: AnySpyCall[] }) => {
        pass: boolean;
        data: CheckData;
    };
    input: Record<string, unknown> | undefined;
    message: (params: MessageFunctionParams<CheckData>) => string[];
}): jest.CustomMatcherResult {
    assert(
        command &&
        typeof command === 'function' &&
        typeof command.name === 'string' &&
        command.name.length > 0,
        'Command must be valid AWS Sdk Command',
    );

    const calls = mockClient.calls();
    const commandCalls = mockClient.commandCalls(command, input);
    const {pass, data} = check({calls, commandCalls});

    const msg = (): string => {
        const cmd = ctx.utils.printExpected(command.name);
        const client = mockClient.clientName();

        const msgParams: MessageFunctionParams<CheckData> = {
            calls,
            client,
            cmd,
            data,
            commandCalls,
            notPrefix: ctx.isNot ? 'not ' : '',
        };

        return message(msgParams).join('\n');
    };

    return {pass, message: msg};
}

/* Using them for testing */
export const baseMatchers: { [P in keyof AwsSdkJestMockBaseMatchers<unknown>]: jest.CustomMatcher } = {
    /**
     * implementation of {@link AwsSdkJestMockMatchers.toHaveReceivedCommandTimes} matcher
     */
    toHaveReceivedCommandTimes(
        this: jest.MatcherContext,
        mockClient: ClientMock,
        command: new () => AnyCommand,
        expectedCalls: number,
    ) {
        return processMatch({
            ctx: this,
            mockClient,
            command,
            input: undefined,
            check: ({commandCalls}) => ({pass: commandCalls.length === expectedCalls, data: {}}),
            message: ({client, cmd, commandCalls, notPrefix}) => [
                `Expected ${client} to ${notPrefix}receive ${cmd} ${this.utils.printExpected(
                    expectedCalls,
                )} times`,
                `${client} received ${cmd} ${this.utils.printReceived(commandCalls.length)} times`,
                ...printCalls(this, commandCalls),
            ],
        });
    },
    /**
     * implementation of {@link AwsSdkJestMockMatchers.toHaveReceivedCommand} matcher
     */
    toHaveReceivedCommand(
        this: jest.MatcherContext,
        mockClient: ClientMock,
        command: new () => AnyCommand,
    ) {
        return processMatch({
            ctx: this,
            mockClient,
            command,
            input: undefined,
            check: ({commandCalls}) => ({pass: commandCalls.length > 0, data: {}}),
            message: ({client, cmd, notPrefix, commandCalls}) => [
                `Expected ${client} to ${notPrefix}receive ${cmd}`,
                `${client} received ${cmd} ${this.utils.printReceived(commandCalls.length)} times`,
                ...printCalls(this, commandCalls),
            ],
        });
    },
    /**
     * implementation of {@link AwsSdkJestMockMatchers.toHaveReceivedCommandWith} matcher
     */
    toHaveReceivedCommandWith(
        this: jest.MatcherContext,
        mockClient: ClientMock,
        command: new () => AnyCommand,
        input: Record<string, unknown>,
    ) {
        return processMatch({
            ctx: this,
            mockClient,
            command,
            input,
            check: ({commandCalls}) => ({pass: commandCalls.length > 0, data: {}}),
            message: ({client, cmd, calls, notPrefix, commandCalls}) => [
                `Expected ${client} to ${notPrefix}receive ${cmd} with ${this.utils.printExpected(
                    input,
                )}`,
                `${client} received ${cmd} ${this.utils.printReceived(commandCalls.length)} times`,
                ...printCalls(this, calls),
            ],
        });
    },
    /**
     * implementation of {@link AwsSdkJestMockMatchers.toHaveReceivedNthCommandWith} matcher
     */
    toHaveReceivedNthCommandWith(
        this: jest.MatcherContext,
        mockClient: ClientMock,
        call: number,
        command: new () => AnyCommand,
        input?: Record<string, unknown>,
    ) {
        assert(
            call && typeof call === 'number' && call > 0,
            'Call number must be a number and greater as 0',
        );

        return processMatch<{ received: AnyCommand; cmd: string }>({
            ctx: this,
            mockClient,
            command,
            check: ({calls}) => {
                const received = calls[call - 1].args[0];
                return {
                    pass:
                        received instanceof command && this.equals(received.input, input),
                    data: {
                        received,
                        cmd: this.utils.printReceived(received.constructor.name),
                    },
                };
            },
            input,
            message: ({cmd, client, calls, data, notPrefix}) => [
                `Expected ${client} to ${notPrefix}receive ${call}. ${cmd}`,
                `${client} received ${call}. ${data.cmd} with input`,
                this.utils.printDiffOrStringify(
                    input,
                    data.received.input,
                    'Expected',
                    'Received',
                    false,
                ),
                ...printCalls(this, calls),
            ],
        });
    },
};

/* typing ensures keys matching */
export const aliasMatchers: { [P in keyof AwsSdkJestMockAliasMatchers<unknown>]: jest.CustomMatcher } = {
    toReceiveCommandTimes: baseMatchers.toHaveReceivedCommandTimes,
    toReceiveCommand: baseMatchers.toHaveReceivedCommand,
    toReceiveCommandWith: baseMatchers.toHaveReceivedCommandWith,
    toReceiveNthCommandWith: baseMatchers.toHaveReceivedNthCommandWith,
};

// Skip registration if jest expect does not exist
if (typeof expect !== 'undefined' && typeof expect.extend === 'function') {
    expect.extend({...baseMatchers, ...aliasMatchers});
}
