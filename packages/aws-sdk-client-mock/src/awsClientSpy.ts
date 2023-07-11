import {Client, MetadataBearer} from '@smithy/types';
import {match, SinonSpyCall, SinonSpy} from 'sinon';
import {AwsCommand} from './commonTypes';
import {spyClient} from './spyClient';

/**
 * Type for {@link AwsSpy} class,
 * but with the AWS Client class type as an only generic parameter.
 *
 * @example
 * ```ts
 * let snsMock: AwsClientSpy<SNSClient>;
 * snsMock = mockClient(SNSClient);
 * ```
 */
export type AwsClientSpy<TClient> =
    TClient extends Client<infer TInput, infer TOutput, infer TConfiguration> ? AwsSpy<TInput, TOutput, TConfiguration> : never;

/**
 * Wrapper on the mocked `Client#send()` method, allowing you to inspect
 * calls to it.
 *
 * Without any configuration, `Client#send()` invocation returns `undefined`.
 *
 * To define resulting variable type easily, use {@link AwsClientSpy}.
 */
export class AwsSpy<TInput extends object, TOutput extends MetadataBearer, TConfiguration> {

    /**
     * Underlying `Client#send()` method Sinon spy.
     *
     * Install `@types/sinon` for TypeScript typings.
     */
    public send: SinonSpy<[AwsCommand<TInput, TOutput>], Promise<TOutput>>;

    constructor(
        private client: Client<TInput, TOutput, TConfiguration>,
        send: SinonSpy<[AwsCommand<TInput, TOutput>], Promise<TOutput>>,
    ) {
        this.send = send;
    }

    /** Returns the class name of the underlying mocked client class */
    clientName(): string {
        return this.client.constructor.name;
    }

    /**
     * Resets spy. It will replace the spy with a new one, with clean history and behavior.
     */
    reset(): AwsSpy<TInput, TOutput, TConfiguration> {
        /* sinon.spy.reset() does not remove the fakes which in some conditions can break subsequent spies,
         * so instead of calling send.reset(), we recreate the spy.
         * See: https://github.com/sinonjs/sinon/issues/1572
         * We are only affected by the broken reset() behavior of this bug, since we always use matchers.
         */
        const newSpy = spyClient(this.client);
        this.send = newSpy.send;
        return this;
    }

    /** Resets spy's calls history. */
    resetHistory(): AwsSpy<TInput, TOutput, TConfiguration> {
        this.send.resetHistory();
        return this;
    }

    /** Replaces spy with original `Client#send()` method. */
    restore(): void {
        this.send.restore();
    }

    /**
     * Returns recorded calls to the spy.
     * Clear history with {@link resetHistory} or {@link reset}.
     */
    calls(): SinonSpyCall<[AwsCommand<TInput, TOutput>], Promise<TOutput>>[] {
        return this.send.getCalls();
    }

    /**
     * Returns n-th recorded call to the spy.
     */
    call(n: number): SinonSpyCall<[AwsCommand<TInput, TOutput>], Promise<TOutput>> {
        return this.send.getCall(n);
    }

    /**
     * Returns recorded calls of given Command only.
     * @param commandType Command type to match
     * @param input Command payload to match
     * @param strict Should the payload match strictly (default false, will match if all defined payload properties match)
     */
    commandCalls<TCmd extends AwsCommand<any, any>,
        TCmdInput extends TCmd extends AwsCommand<infer TIn, any> ? TIn : never,
        TCmdOutput extends TCmd extends AwsCommand<any, infer TOut> ? TOut : never,
    >(
        commandType: new (input: TCmdInput) => TCmd,
        input?: Partial<TCmdInput>,
        strict?: boolean,
    ): SinonSpyCall<[TCmd], Promise<TCmdOutput>>[] {
        return this.send.getCalls()
            .filter((call): call is SinonSpyCall<[TCmd], Promise<TCmdOutput>> => {
                const isProperType = call.args[0] instanceof commandType;
                const inputMatches = this.createInputMatcher(input, strict).test(call.args[0]);
                return isProperType && inputMatches;
            });
    }

    private createInputMatcher<TCmdInput extends TInput>(input?: Partial<TCmdInput>, strict = false) {
        return input !== undefined ?
            match.has('input', strict ? input : match(input))
            : match.any;
    }
}


