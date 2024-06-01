/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-empty-interface */
import assert from 'assert';
import type {MetadataBearer} from '@smithy/types';
import {AwsCommand, AwsStub} from 'aws-sdk-client-mock';
import type {SinonSpyCall} from 'sinon';
import type {ExpectationResult, MatcherContext, MatcherFunction} from 'expect';
import {expect} from 'expect';

interface AwsSdkJestMockBaseMatchers<R> extends Record<string, Function> {
    /**
     * Asserts the {@link AwsStub Client Mock} received given `Command` exact number of times.
     *
     * @example
     * ```js
     * expect(snsMock).toHaveReceivedCommandTimes(PublishCommand, 2);
     * ```
     *
     * @param command AWS SDK Command type
     * @param times Number of expected calls
     */
    toHaveReceivedCommandTimes<TCmdInput extends object,
        TCmdOutput extends MetadataBearer>(
        command: new (input: TCmdInput) => AwsCommand<TCmdInput, TCmdOutput>,
        times: number,
    ): R;

    /**
     * Asserts the {@link AwsStub Client Mock} received given `Command` at least one time.
     *
     * @example
     * ```js
     * expect(snsMock).toHaveReceivedCommandTimes(PublishCommand);
     * ```
     *
     * @param command AWS SDK Command type
     */
    toHaveReceivedCommand<TCmdInput extends object,
        TCmdOutput extends MetadataBearer>(
        command: new (input: TCmdInput) => AwsCommand<TCmdInput, TCmdOutput>,
    ): R;

    /**
     * Asserts the {@link AwsStub Client Mock} received given `Command` at least one time with matching input.
     *
     * @example
     * ```js
     * expect(snsMock).toHaveReceivedCommandWith(
     *   PublishCommand,
     *   {
     *     Message: 'hello world',
     *   },
     * );
     * ```
     *
     * @example
     * With asymmetric matcher:
     * ```js
     * expect(snsMock).toHaveReceivedCommandWith(
     *   PublishCommand,
     *   {
     *     Message: expect.stringContaining('hello'),
     *   },
     * );
     * ```
     *
     * @param command AWS SDK Command type
     * @param input Partial input to match
     */
    toHaveReceivedCommandWith<TCmdInput extends object,
        TCmdOutput extends MetadataBearer>(
        command: new (input: TCmdInput) => AwsCommand<TCmdInput, TCmdOutput>,
        input: Partial<TCmdInput>,
    ): R;

    /**
     * Asserts the nth call to the {@link AwsStub Client Mock} was a given `Command` with matching input.
     *
     * @example
     * The second call to `SNSClient` was a `PublishCommand` with Message 'hello world':
     * ```js
     * expect(snsMock).toHaveReceivedNthCommandWith(
     *   2,
     *   PublishCommand,
     *   {
     *     Message: 'hello world',
     *   },
     * );
     * ```
     *
     * @param call Call number
     * @param command AWS SDK Command type
     * @param input Partial input to match
     */
    toHaveReceivedNthCommandWith<TCmdInput extends object,
        TCmdOutput extends MetadataBearer>(
        call: number,
        command: new (input: TCmdInput) => AwsCommand<TCmdInput, TCmdOutput>,
        input: Partial<TCmdInput>,
    ): R;

    /**
     * Asserts the nth `Command` of given type sent to the {@link AwsStub Client Mock} had matching input.
     *
     * @example
     * The second `PublishCommand` sent to `SNSClient` had Message 'hello world':
     * ```js
     * expect(snsMock).toHaveReceivedNthSpecificCommandWith(
     *   2,
     *   PublishCommand,
     *   {
     *     Message: 'hello world',
     *   },
     * );
     * ```
     *
     * @param call Call number
     * @param command AWS SDK Command type
     * @param input Partial input to match
     */
    toHaveReceivedNthSpecificCommandWith<TCmdInput extends object, TCmdOutput extends MetadataBearer>(
        call: number,
        command: new (input: TCmdInput) => AwsCommand<TCmdInput, TCmdOutput>,
        input: Partial<TCmdInput>,
    ): R;

    /**
     * Asserts {@link AwsStub Client Mock} was called at least once with any `Command`.
     */
    toHaveReceivedAnyCommand(): R;
}

interface AwsSdkJestMockAliasMatchers<R> extends Record<string, Function> {
    /**
     * @see toHaveReceivedCommandTimes
     */
    toReceiveCommandTimes<TCmdInput extends object,
        TCmdOutput extends MetadataBearer>(
        command: new (input: TCmdInput) => AwsCommand<TCmdInput, TCmdOutput>,
        times: number,
    ): R;

    /**
     * @see toHaveReceivedCommand
     */
    toReceiveCommand<TCmdInput extends object,
        TCmdOutput extends MetadataBearer>(
        command: new (input: TCmdInput) => AwsCommand<TCmdInput, TCmdOutput>,
    ): R;

    /**
     * @see toHaveReceivedCommandWith
     */
    toReceiveCommandWith<TCmdInput extends object,
        TCmdOutput extends MetadataBearer>(
        command: new (input: TCmdInput) => AwsCommand<TCmdInput, TCmdOutput>,
        input: Partial<TCmdInput>,
    ): R;

    /**
     * @see toHaveReceivedNthCommandWith
     */
    toReceiveNthCommandWith<TCmdInput extends object,
        TCmdOutput extends MetadataBearer>(
        call: number,
        command: new (input: TCmdInput) => AwsCommand<TCmdInput, TCmdOutput>,
        input: Partial<TCmdInput>,
    ): R;

    /**
     * @see toHaveReceivedNthSpecificCommandWith
     */
    toReceiveNthSpecificCommandWith<TCmdInput extends object, TCmdOutput extends MetadataBearer>(
        call: number,
        command: new (input: TCmdInput) => AwsCommand<TCmdInput, TCmdOutput>,
        input: Partial<TCmdInput>,
    ): R;

    /**
     * @see toHaveReceivedAnyCommand
     */
    toReceiveAnyCommand(): R;
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
export interface AwsSdkJestMockMatchers<R> extends AwsSdkJestMockBaseMatchers<R>, AwsSdkJestMockAliasMatchers<R>, Record<string, Function> {
}

/**
 * Types for @types/jest
 */
declare global {
    namespace jest {
        interface Matchers<R = void> extends AwsSdkJestMockMatchers<R> {
        }
    }
}

/**
 * Types for @jest/globals
 */
declare module 'expect' {
    interface Matchers<R = void> extends AwsSdkJestMockMatchers<R> {
    }
}

type AnyCommand = AwsCommand<any, any>;
type AnySpyCall = SinonSpyCall<[AnyCommand]>;
type MessageFunctionParams<CheckData> = {
    cmd: string;
    client: string;
    commandCalls: AnySpyCall[];
    calls: AnySpyCall[];
    data: CheckData;
    notPrefix: string;
};

/**
 * Prettyprints command calls for message
 */
const printCalls = (ctx: MatcherContext, calls: AnySpyCall[]): string[] =>
    calls.length > 0
        ? [
            '',
            'Calls:',
            ...calls.map(
                (c, i) =>
                    `  ${i + 1}. ${c.args[0].constructor.name}: ${ctx.utils.printReceived(
                        c.args[0].input,
                    )}`,
            )]
        : [];

const processMatch = <CheckData = undefined>({ctx, mockClient, command, check, message}: {
    ctx: MatcherContext;
    mockClient: unknown;
    command?: new () => AnyCommand;
    check: (params: { calls: AnySpyCall[]; commandCalls: AnySpyCall[] }) => {
        pass: boolean;
        data: CheckData;
    };
    message: (params: MessageFunctionParams<CheckData>) => string[];
}): ExpectationResult => {
    assert(mockClient instanceof AwsStub, 'The actual must be a client mock instance');
    command && assert(
        command &&
        typeof command === 'function' &&
        typeof command.name === 'string' &&
        command.name.length > 0,
        'Command must be valid AWS SDK Command',
    );

    const calls = mockClient.calls();
    const commandCalls = command ? mockClient.commandCalls(command) : [];

    const {pass, data} = check({calls, commandCalls});

    const msg = (): string => {
        const cmd = ctx.utils.printExpected(command?.name || 'Any Command');
        const client = mockClient.clientName();

        return [
            ...message({
                client,
                cmd,
                data,
                calls,
                commandCalls,
                notPrefix: ctx.isNot ? 'not ' : '',
            }),
            ...printCalls(ctx, calls),
        ].join('\n');
    };

    return {pass, message: msg};
};

const ensureNoOtherArgs = (args: unknown[]): void => {
    assert(args.length === 0, 'Too many matcher arguments');
};

const baseMatchers: { [P in keyof AwsSdkJestMockBaseMatchers<unknown>]: MatcherFunction<any[]> } = {
    /**
     * implementation of {@link AwsSdkJestMockMatchers.toHaveReceivedCommand} matcher
     */
    toHaveReceivedCommand(
        this: MatcherContext,
        mockClient: unknown,
        command: new () => AnyCommand,
        ...other: unknown[]
    ) {
        ensureNoOtherArgs(other);
        return processMatch({
            ctx: this,
            mockClient,
            command,
            check: ({commandCalls}) => ({pass: commandCalls.length > 0, data: undefined}),
            message: ({client, cmd, notPrefix, commandCalls}) => [
                `Expected ${client} to ${notPrefix}receive ${cmd}`,
                `${client} received ${cmd} ${this.utils.printReceived(commandCalls.length)} times`,
            ],
        });
    },
    /**
     * implementation of {@link AwsSdkJestMockMatchers.toHaveReceivedCommandTimes} matcher
     */
    toHaveReceivedCommandTimes(
        this: MatcherContext,
        mockClient: unknown,
        command: new () => AnyCommand,
        expectedCalls: number,
        ...other: unknown[]
    ) {
        ensureNoOtherArgs(other);
        return processMatch({
            ctx: this,
            mockClient,
            command,
            check: ({commandCalls}) => ({pass: commandCalls.length === expectedCalls, data: undefined}),
            message: ({client, cmd, commandCalls, notPrefix}) => [
                `Expected ${client} to ${notPrefix}receive ${cmd} ${this.utils.printExpected(expectedCalls)} times`,
                `${client} received ${cmd} ${this.utils.printReceived(commandCalls.length)} times`,
            ],
        });
    },
    /**
     * implementation of {@link AwsSdkJestMockMatchers.toHaveReceivedCommandWith} matcher
     */
    toHaveReceivedCommandWith(
        this: MatcherContext,
        mockClient: unknown,
        command: new () => AnyCommand,
        input: Record<string, unknown>,
        ...other: unknown[]
    ) {
        ensureNoOtherArgs(other);
        return processMatch<{ matchCount: number }>({
            ctx: this,
            mockClient,
            command,
            check: ({commandCalls}) => {
                const matchCount = commandCalls
                    .map(call => call.args[0].input) // eslint-disable-line @typescript-eslint/no-unsafe-return
                    .map(received => this.equals(received, expect.objectContaining(input)))
                    .reduce((acc, val) => acc + Number(val), 0);

                return {pass: matchCount > 0, data: {matchCount}};
            },
            message: ({client, cmd, notPrefix, data}) => [
                `Expected ${client} to ${notPrefix}receive ${cmd} with ${this.utils.printExpected(input)}`,
                `${client} received matching ${cmd} ${this.utils.printReceived(data.matchCount)} times`,
            ],
        });
    },
    /**
     * implementation of {@link AwsSdkJestMockMatchers.toHaveReceivedNthCommandWith} matcher
     */
    toHaveReceivedNthCommandWith(
        this: MatcherContext,
        mockClient: unknown,
        call: number,
        command: new () => AnyCommand,
        input: Record<string, unknown>,
        ...other: unknown[]
    ) {
        ensureNoOtherArgs(other);
        assert(
            call && typeof call === 'number' && call > 0,
            'Call number must be a number greater than 0',
        );

        return processMatch<{ received: AnyCommand | undefined }>({
            ctx: this,
            mockClient,
            command,
            check: ({calls}) => {
                if (calls.length < call) {
                    return {pass: false, data: {received: undefined}};
                }

                const received = calls[call - 1].args[0];

                let pass = false;
                if (received instanceof command) {
                    pass = this.equals(received.input, expect.objectContaining(input));
                }

                return {
                    pass,
                    data: {received},
                };
            },
            message: ({cmd, client, data, notPrefix}) => [
                `Expected ${client} to ${notPrefix}receive ${call}. ${cmd} with ${this.utils.printExpected(input)}`,
                ...(data.received
                    ? [
                        `${client} received ${this.utils.printReceived(data.received.constructor.name)} with input:`,
                        this.utils.printDiffOrStringify(
                            input,
                            data.received.input,
                            'Expected',
                            'Received',
                            false,
                        ),
                    ]
                    : []),
            ],
        });
    },
    /**
     * implementation of {@link AwsSdkJestMockMatchers.toHaveReceivedNthSpecificCommandWith} matcher
     */
    toHaveReceivedNthSpecificCommandWith(
        this: MatcherContext,
        mockClient: unknown,
        call: number,
        command: new () => AnyCommand,
        input: Record<string, unknown>,
        ...other: unknown[]
    ) {
        ensureNoOtherArgs(other);
        assert(
            call && typeof call === 'number' && call > 0,
            'Call number must be a number greater than 0',
        );

        return processMatch<{ received: AnyCommand | undefined }>({
            ctx: this,
            mockClient,
            command,
            check: ({commandCalls}) => {
                if (commandCalls.length < call) {
                    return {pass: false, data: {received: undefined}};
                }

                const received = commandCalls[call - 1].args[0];

                let pass = false;
                if (received instanceof command) {
                    pass = this.equals(received.input, expect.objectContaining(input));
                }

                return {
                    pass,
                    data: {received},
                };
            },
            message: ({cmd, client, data, notPrefix}) => [
                `Expected ${client} to ${notPrefix}receive ${call}. ${cmd} with ${this.utils.printExpected(input)}`,
                ...(data.received
                    ? [
                        `${client} received ${this.utils.printReceived(data.received.constructor.name)} with input:`,
                        this.utils.printDiffOrStringify(
                            input,
                            data.received.input,
                            'Expected',
                            'Received',
                            false,
                        ),
                    ]
                    : []),
            ],
        });
    },
    /**
     * implementation of {@link AwsSdkJestMockMatchers.toHaveReceivedAnyCommand} matcher
     */
    toHaveReceivedAnyCommand(
        this: MatcherContext,
        mockClient: unknown,
        ...other: unknown[]
    ) {
        ensureNoOtherArgs(other);
        return processMatch({
            ctx: this,
            mockClient,
            check: ({calls}) => ({pass: calls.length > 0, data: undefined}),
            message: ({client, notPrefix, calls}) => [
                `Expected ${client} to ${notPrefix}receive any command`,
                `${client} received any command ${this.utils.printReceived(calls.length)} times`,
            ],
        });
    },
};

/* typing ensures keys matching */
const aliasMatchers: { [P in keyof AwsSdkJestMockAliasMatchers<unknown>]: MatcherFunction<any[]> } = {
    toReceiveCommandTimes: baseMatchers.toHaveReceivedCommandTimes,
    toReceiveCommand: baseMatchers.toHaveReceivedCommand,
    toReceiveCommandWith: baseMatchers.toHaveReceivedCommandWith,
    toReceiveNthCommandWith: baseMatchers.toHaveReceivedNthCommandWith,
    toReceiveNthSpecificCommandWith: baseMatchers.toHaveReceivedNthSpecificCommandWith,
    toReceiveAnyCommand: baseMatchers.toHaveReceivedAnyCommand,
};

// Skip registration if jest expect does not exist
if (typeof expect !== 'undefined' && typeof expect.extend === 'function') {
    expect.extend({...baseMatchers, ...aliasMatchers});
}
