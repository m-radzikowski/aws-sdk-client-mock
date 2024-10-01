/* eslint-disable @typescript-eslint/no-empty-interface */
import type { MatcherState } from '@vitest/expect';
import { ObjectContaining } from '@vitest/expect';
import { Chalk } from 'chalk';
import { expect } from 'vitest';
import { AwsSdkMockMatchers, createBaseMatchers } from './jestMatchers';
import { AwsSdkMockAliasMatchers, MatcherFunction } from './types';

export function ordinalOf(n: number) {
    const j = n % 10;
    const k = n % 100;
    if (j === 1 && k !== 11) return `${n}st`;
    if (j === 2 && k !== 12) return `${n}nd`;
    if (j === 3 && k !== 13) return `${n}rd`;
    return `${n}th`;
}

const chalk = new Chalk({ level: 3 });

const baseMatchers = createBaseMatchers<MatcherState['utils']>({
    toHaveReceivedCommand: ({ client, cmd, notPrefix }) =>
        `expected ${client} to ${notPrefix}receive ${cmd} at least once`,
    toHaveReceivedCommandTimes:
    (expectedCalls) =>
        ({ client, cmd, commandCalls, notPrefix }) =>
            [
                `expected ${client} to ${notPrefix}receive ${cmd} ${expectedCalls} times`,
                `but got ${commandCalls.length} times`,
            ].join(', '),
    toHaveReceivedCommandWith:
    (input) =>
        ({ client, cmd, notPrefix, ctxUtils, commandCalls }) => {
            return [
                `expected ${client} to ${notPrefix}receive ${cmd} with arguments [${ctxUtils.stringify(input, undefined, { printBasicPrototype: false })}]`,
                chalk.gray('Received:'),
                ...commandCalls.map((c, i) => {
                    const callAnnotation = chalk.gray(`  ${ordinalOf(i + 1)} call:`);
                    // type of input can not be string, so the return value of `diff` will always be defined
                    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                    const diff = ctxUtils.diff(input, c.args[0].input, { omitAnnotationLines: true, commonColor: chalk.gray })!;

                    return `${callAnnotation}\n\n${diff}`;
                }).filter((x) => x),
                chalk.gray(`Number of calls: ${commandCalls.length}`),
            ].join('\n\n');
        },
    toHaveReceivedNthCommandWith:
    (call, input) =>
        ({ cmd, client, data, notPrefix, ctxUtils, commandCalls }) => {
            const beNthCalled = commandCalls.length >= call;

            const summary = `expected ${client} to ${notPrefix}receive ${ordinalOf(call)} ${cmd} with arguments [${ctxUtils.stringify(input, undefined, { printBasicPrototype: false })}]`;
            const msgWhenNotBeCalled = beNthCalled ? '' : `, but ${client} has only received ${cmd} ${commandCalls.length} times`;
            const diff = beNthCalled ? ctxUtils.diff(input, data.received?.input, { commonColor: chalk.gray }) : '';

            return [summary + msgWhenNotBeCalled, diff].join('\n\n');
        },
    toHaveReceivedNthSpecificCommandWith:
        (call, input) =>
            ({ cmd, client, data, notPrefix, ctxUtils, commandCalls }) => {
                const beNthCalled = commandCalls.length >= call;
    
                const summary = `expected ${client} to ${notPrefix}receive ${ordinalOf(call)} ${cmd} with arguments [${ctxUtils.stringify(input, undefined, { printBasicPrototype: false })}]`;
                const msgWhenNotBeCalled = beNthCalled ? '' : `, but ${client} has only received ${cmd} ${commandCalls.length} times`;
                const diff = beNthCalled ? ctxUtils.diff(input, data.received?.input, { commonColor: chalk.gray }) : '';
    
                return [summary + msgWhenNotBeCalled, diff].join('\n\n');
            },
    toHaveReceivedAnyCommand: ({ client, notPrefix }) =>
        `expected ${client} to ${notPrefix}receive any command at least once`,
}, 
(sample) => new ObjectContaining(sample)
);

const aliasMatchers: {
    [P in keyof AwsSdkMockAliasMatchers<unknown>]: MatcherFunction<MatcherState['utils']>;
} = {
    toReceiveCommandTimes: baseMatchers.toHaveReceivedCommandTimes,
    toReceiveCommand: baseMatchers.toHaveReceivedCommand,
    toReceiveCommandWith: baseMatchers.toHaveReceivedCommandWith,
    toReceiveNthCommandWith: baseMatchers.toHaveReceivedNthCommandWith,
    toReceiveNthSpecificCommandWith:baseMatchers.toHaveReceivedNthSpecificCommandWith,
    toReceiveAnyCommand: baseMatchers.toHaveReceivedAnyCommand,
};

expect.extend({
    ...baseMatchers,
    ...aliasMatchers,
});

declare module 'vitest' {
    interface Assertion<T = any> extends AwsSdkMockMatchers<T> {}
    interface AsymmetricMatchersContaining extends AwsSdkMockMatchers<unknown> {}
}
