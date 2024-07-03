/* eslint-disable @typescript-eslint/no-empty-interface */
import type { MatcherContext } from 'expect';
import { expect } from 'expect';
import type { AwsSdkMockMatchers } from './jestMatchers';
import { createBaseMatchers } from './jestMatchers';
import type {
    AnySpyCall,
    AwsSdkMockAliasMatchers,
    CommonMatcherUtils,
    MatcherFunction,
} from './types';

/**
 * Prettyprints command calls for message
 */
function addCalls(
    ctxUtils: CommonMatcherUtils,
    calls: AnySpyCall[],
    ...msgs: string[]
) {
    if (calls.length === 0) return msgs.join('\n');

    return [
        ...msgs,
        '',
        'Calls:',
        ...calls.map(
            (c, i) =>
                `  ${i + 1}. ${c.args[0].constructor.name}: ${ctxUtils.printReceived(
                    c.args[0].input
                )}`
        ),
    ].join('\n');
}

const baseMatchers = createBaseMatchers<MatcherContext['utils']>({
    toHaveReceivedCommand: ({
        client,
        cmd,
        notPrefix,
        calls,
        commandCalls,
        ctxUtils,
    }) =>
        addCalls(
            ctxUtils,
            calls,
            `Expected ${client} to ${notPrefix}receive ${ctxUtils.printExpected(cmd)}`,
            `${client} received ${ctxUtils.printExpected(cmd)} ${ctxUtils.printReceived(commandCalls.length)} times`
        ),
    toHaveReceivedCommandTimes:
    (expectedCalls) =>
        ({ calls, client, cmd, commandCalls, notPrefix, ctxUtils }) =>
            addCalls(
                ctxUtils,
                calls,
                `Expected ${client} to ${notPrefix}receive ${ctxUtils.printExpected(cmd)} ${ctxUtils.printExpected(expectedCalls)} times`,
                `${client} received ${ctxUtils.printExpected(cmd)} ${ctxUtils.printReceived(commandCalls.length)} times`
            ),

    toHaveReceivedCommandWith:
    (input) =>
        ({ client, cmd, notPrefix, data, calls, ctxUtils }) =>
            addCalls(
                ctxUtils,
                calls,
                `Expected ${client} to ${notPrefix}receive ${ctxUtils.printExpected(cmd)} with ${ctxUtils.printExpected(input)}`,
                `${client} received matching ${ctxUtils.printExpected(cmd)} ${ctxUtils.printReceived(data.matchCount)} times`
            ),

    toHaveReceivedNthCommandWith:
    (call, input) =>
        ({ cmd, client, data, notPrefix, ctxUtils, calls }) =>
            addCalls(
                ctxUtils,
                calls,
                `Expected ${client} to ${notPrefix}receive ${call}. ${ctxUtils.printExpected(cmd)} with ${ctxUtils.printExpected(input)}`,
                ...(data.received
                    ? [
                        `${client} received ${ctxUtils.printReceived(data.received.constructor.name)} with input:`,
                        ctxUtils.printDiffOrStringify(input, data.received.input, 'Expected', 'Received', false),
                    ]
                    : [])
            ),
    toHaveReceivedNthSpecificCommandWith:
    (call, input) =>
        ({ cmd, client, data, notPrefix, ctxUtils, calls }) =>
            addCalls(
                ctxUtils,
                calls,
                `Expected ${client} to ${notPrefix}receive ${call}. ${ctxUtils.printExpected(cmd)} with ${ctxUtils.printExpected(input)}`,
                ...(data.received
                    ? [
                        `${client} received ${ctxUtils.printReceived(data.received.constructor.name)} with input:`,
                        ctxUtils.printDiffOrStringify(input, data.received.input, 'Expected', 'Received', false),
                    ]
                    : [])
            ),
    toHaveReceivedAnyCommand: ({ client, notPrefix, calls, ctxUtils }) =>
        addCalls(
            ctxUtils,
            calls,
            `Expected ${client} to ${notPrefix}receive any command`,
            `${client} received any command ${ctxUtils.printReceived(calls.length)} times`
        ),
},
(sample: Record<string, unknown>) => expect.objectContaining(sample) 
);

/* typing ensures keys matching */
const aliasMatchers: {
    [P in keyof AwsSdkMockAliasMatchers<unknown>]: MatcherFunction<MatcherContext['utils']>;
} = {
    toReceiveCommandTimes: baseMatchers.toHaveReceivedCommandTimes,
    toReceiveCommand: baseMatchers.toHaveReceivedCommand,
    toReceiveCommandWith: baseMatchers.toHaveReceivedCommandWith,
    toReceiveNthCommandWith: baseMatchers.toHaveReceivedNthCommandWith,
    toReceiveNthSpecificCommandWith:baseMatchers.toHaveReceivedNthSpecificCommandWith,
    toReceiveAnyCommand: baseMatchers.toHaveReceivedAnyCommand,
};

// Skip registration if jest expect does not exist
if (typeof expect !== 'undefined' && typeof expect.extend === 'function') {
    expect.extend({ ...baseMatchers, ...aliasMatchers });
}

/**
 * Types for @types/jest
 */
declare global {
    namespace jest {
        interface Matchers<R = void> extends AwsSdkMockMatchers<R> {}
    }
}
