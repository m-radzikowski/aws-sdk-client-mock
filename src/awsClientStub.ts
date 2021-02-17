import {Client, MetadataBearer} from '@aws-sdk/types';
import {match, SinonMatcher, SinonSpyCall, SinonStub} from 'sinon';

/**
 * Wrapper on the mocked `Client#send()` method,
 * allowing to configure it's behavior.
 *
 * Without any configuration, `Client#send()` invocation returns `undefined`.
 */
export class AwsClientStub<TClient extends Client<any, any, any>> {

    /**
     * Underlying `Client#send()` method Sinon stub.
     *
     * Install `@types/sinon` for TypeScript typings.
     */
    public send: SinonStub<[AwsCommand<TClient>], unknown>;

    private commandMatcher: SinonMatcher = match.any;
    private inputMatcher: SinonMatcher = match.any;

    constructor(send: SinonStub<[AwsCommand<TClient>], unknown>) {
        this.send = send;
    }

    /**
     * Resets stub's history and behavior.
     */
    reset(): AwsClientStub<TClient> {
        this.send.reset();
        return this;
    }

    /**
     * Resets stub's behavior.
     */
    resetBehavior(): AwsClientStub<TClient> {
        this.send.resetBehavior();
        return this;
    }

    /**
     * Resets stub's calls history.
     */
    resetHistory(): AwsClientStub<TClient> {
        this.send.resetHistory();
        return this;
    }

    /**
     * Replaces stub with original `Client#send()` method.
     */
    restore(): void {
        this.send.restore();
    }

    /**
     * Returns recorded calls to the stub.
     * Clear history with {@link resetHistory} or {@link reset}.
     * @return Array of calls
     */
    calls(): SinonSpyCall<[AwsCommand<TClient>], unknown>[] {
        return this.send.getCalls();
    }

    /**
     * Returns n-th recorded call to the stub.
     * @return Call
     */
    call(n: number): SinonSpyCall<[AwsCommand<TClient>], unknown> {
        return this.send.getCall(n);
    }

    /**
     * Specifies a Command type and its input (parameters) for which the next defined `Client#send()` response
     * (with {@link resolves} or {@link rejects}) will act.
     *
     * If payload is not specified, it will match any Command of this type.
     * @param command Command type to match
     * @param input Command payload to (strictly) match
     */
    on<TInput>(command: AwsCommandType<TClient, TInput>, input?: TInput): AwsClientStub<TClient> {
        this.resetMatchers();

        this.commandMatcher = match.instanceOf(command);
        if (input !== undefined) {
            this.inputMatcher = match.has('input', input);
        }

        return this;
    }

    /**
     * Specifies a Command input (parameters) for which the next defined `Client#send()` response
     * (with {@link resolves} or {@link rejects}) will act.
     *
     * If input is not specified, the next defined `Client#send()` response will act for any Command and any input.
     * This is only for readability, as the result is the same as with not calling it at all.
     * @param input Command payload to (strictly) match
     */
    onAnyCommand(input?: unknown): AwsClientStub<TClient> {
        this.resetMatchers();
        this.inputMatcher = input !== undefined ? match.has('input', input) : match.any;
        return this;
    }

    /**
     * Sets a successful response that will be returned from the `Client#send()` invocation.
     *
     * If a Command and/or its input were specified (with {@link on} or {@link onAnyCommand}),
     * the response will be returned only on receiving them as `Client#send()` argument.
     * @param obj Content to be returned from `Client#send()` method
     */
    resolves(obj: unknown): AwsClientStub<TClient> {
        this.prepareStub().resolves(obj);

        this.resetMatchers();

        return this;
    }

    /**
     * Sets a failure response that will be returned from the `Client#send()` invocation.
     * The response will always be an `Error` instance.
     *
     * The same Command and its input rules apply as in the {@link resolves}.
     * @param error Error text, Error instance or Error parameters to be returned from `Client#send()` method
     */
    rejects(error?: string | Error | AwsError): AwsClientStub<TClient> {
        if (typeof error === 'string') {
            error = new Error(error);
        }
        if (!(error instanceof Error)) {
            error = Object.assign(new Error(), error);
        }

        this.prepareStub().rejects(error);

        this.resetMatchers();

        return this;
    }

    /**
     * Sets a function that will be called on `Client#send()` invocation.
     *
     * The same Command and its input rules apply as in the {@link resolves}.
     * @param fn Function taking Command input and returning result
     */
    callsFake(fn: (input: any) => any): AwsClientStub<TClient> {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        this.prepareStub().callsFake(cmd => fn(cmd.input));

        this.resetMatchers();

        return this;
    }

    private prepareStub(): SinonStub {
        return this.send.withArgs(this.getMatcher());
    }

    private getMatcher(): SinonMatcher {
        return match.any
            .and(this.commandMatcher)
            .and(this.inputMatcher);
    }

    private resetMatchers() {
        this.commandMatcher = match.any;
        this.inputMatcher = match.any;
    }

}

/**
 * Type matching the Command instances accepted by the Client.
 */
export type AwsCommand<TClient extends Client<any, any, any>> = Parameters<TClient['send']>[0];

/**
 * Type matching the Command type (class) accepted by the Client.
 */
export type AwsCommandType<TClient extends Client<any, any, any>, TInput> = new (input: TInput) => MatchArguments<AwsCommand<TClient>>;

/**
 * Based on solution from Sinon sources.
 */
type MatchArguments<T> = {
    // eslint-disable-next-line @typescript-eslint/ban-types
    [K in keyof T]: (T[K] extends object ? MatchArguments<T[K]> : never) | T[K];
};

export interface AwsError extends Partial<Error>, Partial<MetadataBearer> {
    Type?: string;
    Code?: string;
    $fault?: 'client' | 'server';
    $service?: string;
}
