import { AwsStub } from 'aws-sdk-client-mock';
import type { AsymmetricMatchers } from 'expect';
import assert from 'node:assert';
import type {
    AnyCommand,
    AnySpyCall,
    AwsSdkMockAliasMatchers,
    AwsSdkMockBaseMatchers,
    CommonMatcherContext,
    CommonMatcherUtils,
    ExpectationResult,
    MatcherFunction,
} from './types';

interface MessageFunctionParams<T extends CommonMatcherUtils, CheckData = undefined> {
    cmd: string;
    client: string;
    commandCalls: AnySpyCall[];
    calls: AnySpyCall[];
    data: CheckData;
    notPrefix: string;
    ctxUtils: T;
}

interface ProcessMatchArgs<T extends CommonMatcherUtils, CheckData = undefined> {
    ctx: CommonMatcherContext<T>;
    mockClient: unknown;
    command?: new () => AnyCommand;
    check: (params: { calls: AnySpyCall[]; commandCalls: AnySpyCall[] }) => {
        pass: boolean;
        data: CheckData;
    };
    message: (params: MessageFunctionParams<T, CheckData>) => string;
}

function processMatch<T extends CommonMatcherUtils, CheckData = undefined>(
    args: ProcessMatchArgs<T, CheckData>,
): ExpectationResult {
    const { ctx, mockClient, command, check, message } = args;

    assert(
        mockClient instanceof AwsStub,
        'The actual must be a client mock instance'
    );

    if (command) {
        assert(
            typeof command === 'function' &&
        typeof command.name === 'string' &&
        command.name.length > 0,
            'Command must be valid AWS SDK Command'
        );
    }

    const calls = mockClient.calls();
    const commandCalls = command ? mockClient.commandCalls(command) : [];
    
    const { pass, data } = check({ calls, commandCalls });

    const msg = (): string => {
        const cmd = command?.name ?? 'Any Command';
        const client = mockClient.clientName();

        return message({
            client,
            cmd,
            data,
            calls,
            commandCalls,
            notPrefix: ctx.isNot ? 'not ' : '',
            ctxUtils: ctx.utils,
        });
    };

    return { pass, message: msg };
}

const ensureNoOtherArgs = (args: unknown[]): void => {
    assert(args.length === 0, 'Too many matcher arguments');
};

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
export interface AwsSdkMockMatchers<R>
  extends AwsSdkMockBaseMatchers<R>,
    AwsSdkMockAliasMatchers<R>,
    Record<string, Function> {}

interface MessageImpl<T extends CommonMatcherUtils> {
    toHaveReceivedCommandTimes: (expectedCalls: number) => (args:MessageFunctionParams<T>) => string;
    toHaveReceivedCommand: (args:MessageFunctionParams<T>) => string;
    toHaveReceivedCommandWith:(input: Record<string, unknown>,)=> (args:MessageFunctionParams<T, { matchCount: number }>) => string;
    toHaveReceivedNthCommandWith: (call: number, input: Record<string, unknown>) => (args:MessageFunctionParams<T, { received?: AnyCommand }>) => string;
    toHaveReceivedNthSpecificCommandWith: (call: number, input: Record<string, unknown>) => (args:MessageFunctionParams<T, { received?: AnyCommand }>) => string;
    toHaveReceivedAnyCommand: (args:MessageFunctionParams<T>) => string;
}

export function createBaseMatchers<T extends CommonMatcherUtils = CommonMatcherUtils>(
    errorMsg: MessageImpl<T>,
    objectContaining: AsymmetricMatchers['objectContaining']
): { [P in keyof AwsSdkMockBaseMatchers<unknown>]: MatcherFunction<T> } {
    errorMsg.toHaveReceivedCommand;
    return {
        /**
         * implementation of {@link AwsSdkJestMockMatchers.toHaveReceivedCommand} matcher
         */
        toHaveReceivedCommand(
            this: CommonMatcherContext<T>,
            mockClient: unknown,
            command: new () => AnyCommand,
            ...other: unknown[]
        ) {
            ensureNoOtherArgs(other);
            return processMatch(
                {
                    ctx: this,
                    mockClient,
                    command,
                    check: ({ commandCalls }) => ({
                        pass: commandCalls.length > 0,
                        data: undefined,
                    }),
                    message: errorMsg.toHaveReceivedCommand,
                },
                
            );
        },
        /**
         * implementation of {@link AwsSdkJestMockMatchers.toHaveReceivedCommandTimes} matcher
         */
        toHaveReceivedCommandTimes(
            this: CommonMatcherContext<T>,
            mockClient: unknown,
            command: new () => AnyCommand,
            expectedCalls: number,
            ...other: unknown[]
        ) {
            ensureNoOtherArgs(other);
            return processMatch(
                {
                    ctx: this,
                    mockClient,
                    command,
                    check: ({ commandCalls }) => ({
                        pass: commandCalls.length === expectedCalls,
                        data: undefined,
                    }),
                    message: errorMsg.toHaveReceivedCommandTimes(expectedCalls),
                },
            );
        },
        /**
         * implementation of {@link AwsSdkJestMockMatchers.toHaveReceivedCommandWith} matcher
         */
        toHaveReceivedCommandWith(
            this: CommonMatcherContext<T>,
            mockClient: unknown,
            command: new () => AnyCommand,
            input: Record<string, unknown>,
            ...other: unknown[]
        ) {
            ensureNoOtherArgs(other);
            return processMatch<T, { matchCount: number }>(
                {
                    ctx: this,
                    mockClient,
                    command,
                    check: ({ commandCalls }) => {
                        const matchCount = commandCalls
                            .map((call) => call.args[0].input) // eslint-disable-line @typescript-eslint/no-unsafe-return
                            .map((received) => objectContaining(input).asymmetricMatch(received))
                            .reduce((acc, val) => acc + Number(val), 0);

                        return { pass: matchCount > 0, data: { matchCount } };
                    },
                    message: errorMsg.toHaveReceivedCommandWith(input),
                },
                
            );
        },
        /**
         * implementation of {@link AwsSdkJestMockMatchers.toHaveReceivedNthCommandWith} matcher
         */
        toHaveReceivedNthCommandWith(
            this: CommonMatcherContext<T>,
            mockClient: unknown,
            call: number,
            command: new () => AnyCommand,
            input: Record<string, unknown>,
            ...other: unknown[]
        ) {
            ensureNoOtherArgs(other);
            assert(
                call && typeof call === 'number' && call > 0,
                'Call number must be a number greater than 0'
            );

            return processMatch<T, { received: AnyCommand | undefined }>(
                {
                    ctx: this,
                    mockClient,
                    command,
                    check: ({ calls }) => {
                        if (calls.length < call) {
                            return { pass: false, data: { received: undefined } };
                        }

                        const received = calls[call - 1].args[0];

                        let pass = false;
                        if (received instanceof command) {
                            pass = objectContaining(input).asymmetricMatch(received.input);
                        }

                        return {
                            pass,
                            data: { received },
                        };
                    },
                    message: errorMsg.toHaveReceivedNthCommandWith(call, input),    
                },
            );
        },

        /**
         * implementation of {@link AwsSdkJestMockMatchers.toHaveReceivedNthSpecificCommandWith} matcher
         */
        toHaveReceivedNthSpecificCommandWith(
            this: CommonMatcherContext<T>,
            mockClient: unknown,
            call: number,
            command: new () => AnyCommand,
            input: Record<string, unknown>,
            ...other: unknown[]
        ) {
            ensureNoOtherArgs(other);
            assert(
                call && typeof call === 'number' && call > 0,
                'Call number must be a number greater than 0'
            );

            return processMatch<T, { received: AnyCommand | undefined }>(
                {
                    ctx: this,
                    mockClient,
                    command,
                    check: ({ commandCalls }) => {
                        if (commandCalls.length < call) {
                            return { pass: false, data: { received: undefined } };
                        }

                        const received = commandCalls[call - 1].args[0];

                        let pass = false;
                        if (received instanceof command) {
                            pass = objectContaining(input).asymmetricMatch(received.input);
                        }

                        return {
                            pass,
                            data: { received },
                        };
                    },
                    message: errorMsg.toHaveReceivedNthSpecificCommandWith(call, input),
                }
            );
        },
        /**
         * implementation of {@link AwsSdkJestMockMatchers.toHaveReceivedAnyCommand} matcher
         */
        toHaveReceivedAnyCommand(
            this: CommonMatcherContext<T>,
            mockClient: unknown,
            ...other: unknown[]
        ) {
            ensureNoOtherArgs(other);
            return processMatch(
                {
                    ctx: this,
                    mockClient,
                    check: ({ calls }) => ({ pass: calls.length > 0, data: undefined }),
                    message: errorMsg.toHaveReceivedAnyCommand,
                }
            );
        },
    };
}
