import {Client, Command, MetadataBearer} from '@aws-sdk/types';
import {match, SinonSpyCall, SinonStub} from 'sinon';

export type AwsClientBehavior<TClient extends Client<any, any, any>> =
    TClient extends Client<infer TInput, infer TOutput, any> ? Behavior<TInput, TOutput, TOutput> : never;

interface Behavior<TInput extends object, TOutput extends MetadataBearer, TCommandOutput extends TOutput> {

    resolves(response: CommandResponse<TCommandOutput>): AwsStub<TInput, TOutput>;

    rejects(error?: string | Error | AwsError): AwsStub<TInput, TOutput>;

    callsFake(fn: (input: any) => any): AwsStub<TInput, TOutput>; // TODO Types

}

/**
 * Type for {@link AwsStub} class,
 * but with the AWS Client class type as an only generic parameter.
 *
 * Usage:
 * ```typescript
 * let snsMock: AwsClientStub<SNSClient>;
 * snsMock = mockClient(SNSClient);
 * ```
 */
export type AwsClientStub<TClient extends Client<any, any, any>> =
    TClient extends Client<infer TInput, infer TOutput, any> ? AwsStub<TInput, TOutput> : never;

/**
 * Wrapper on the mocked `Client#send()` method,
 * allowing to configure its behavior.
 *
 * Without any configuration, `Client#send()` invocation returns `undefined`.
 *
 * To define resulting variable type easily, use {@link AwsClientStub}.
 */
export class AwsStub<TInput extends object, TOutput extends MetadataBearer> implements Behavior<TInput, TOutput, TOutput> {

    /**
     * Underlying `Client#send()` method Sinon stub.
     *
     * Install `@types/sinon` for TypeScript typings.
     */
    public send: SinonStub<[AwsCommand<TInput, TOutput>], unknown>;

    private readonly anyCommandBehavior: CommandBehavior<TInput, TOutput, TOutput>;

    constructor(send: SinonStub<[AwsCommand<TInput, TOutput>], unknown>) {
        this.send = send;
        this.anyCommandBehavior = new CommandBehavior(this, send);
    }

    /** Resets stub's history and behavior. */
    reset(): AwsStub<TInput, TOutput> {
        this.send.reset();
        return this;
    }

    /** Resets stub's behavior. */
    resetBehavior(): AwsStub<TInput, TOutput> {
        this.send.resetBehavior();
        return this;
    }

    /** Resets stub's calls history. */
    resetHistory(): AwsStub<TInput, TOutput> {
        this.send.resetHistory();
        return this;
    }

    /** Replaces stub with original `Client#send()` method. */
    restore(): void {
        this.send.restore();
    }

    /**
     * Returns recorded calls to the stub.
     * Clear history with {@link resetHistory} or {@link reset}.
     */
    calls(): SinonSpyCall<[AwsCommand<TInput, TOutput>], unknown>[] {
        return this.send.getCalls();
    }

    /**
     * Returns n-th recorded call to the stub.
     */
    call(n: number): SinonSpyCall<[AwsCommand<TInput, TOutput>], unknown> {
        return this.send.getCall(n);
    }

    /**
     * Allows specifying the behavior for a given Command type and its input (parameters).
     *
     * If the input is not specified, it will match any Command of that type.
     * @param command Command type to match
     * @param input Command payload to (strictly) match
     */
    on<TCmdInput extends TInput, TCmdOutput extends TOutput>(
        command: new (input: TCmdInput) => AwsCommand<TCmdInput, TCmdOutput>, input?: TCmdInput,
    ): CommandBehavior<TInput, TOutput, TCmdOutput> {
        const matcher = match.instanceOf(command).and(this.createInputMatcher(input));
        const cmdStub = this.send.withArgs(matcher);
        return new CommandBehavior<TInput, TOutput, TCmdOutput>(this, cmdStub);
    }

    /**
     * Allows specifying the behavior for any Command with given input (parameters).
     *
     * If the input is not specified, the given behavior will be used for any Command with any input.
     * This is no different from using {@link resolves}, {@link rejects}, etc. directly,
     * but can be used for readability.
     * @param input Command payload to (strictly) match
     */
    onAnyCommand<TCmdInput extends TInput>(input?: TCmdInput): CommandBehavior<TInput, TOutput, TOutput> {
        const cmdStub = this.send.withArgs(this.createInputMatcher(input));
        return new CommandBehavior(this, cmdStub);
    }

    private createInputMatcher<TCmdInput extends TInput>(input?: TCmdInput) {
        return input !== undefined ? match.has('input', input) : match.any;
    }

    /**
     * Sets a successful response that will be returned from any `Client#send()` invocation.
     * @param response Content to be returned
     */
    resolves(response: CommandResponse<TOutput>): AwsStub<TInput, TOutput> {
        return this.anyCommandBehavior.resolves(response);
    }

    /**
     * Sets a failure response that will be returned from any `Client#send()` invocation.
     * The response will always be an `Error` instance.
     * @param error Error text, Error instance or Error parameters to be returned
     */
    rejects(error?: string | Error | AwsError): AwsStub<TInput, TOutput> {
        return this.anyCommandBehavior.rejects(error);
    }

    /**
     * Sets a function that will be called on any `Client#send()` invocation.
     * @param fn Function taking Command input and returning result
     */
    callsFake(fn: (input: any) => any): AwsStub<TInput, TOutput> {
        return this.anyCommandBehavior.callsFake(fn);
    }

}

export class CommandBehavior<TInput extends object, TOutput extends MetadataBearer, TCommandOutput extends TOutput> implements Behavior<TInput, TOutput, TCommandOutput> {

    constructor(
        private clientStub: AwsStub<TInput, TOutput>,
        private send: SinonStub<[AwsCommand<TInput, TOutput>], unknown>,
    ) {
    }

    /**
     * Sets a successful response that will be returned from the `Client#send()` invocation
     * for specified Command and/or its input.
     * @param response Content to be returned
     */
    resolves(response: CommandResponse<TCommandOutput>): AwsStub<TInput, TOutput> {
        this.send.resolves(response);
        return this.clientStub;
    }

    /**
     * Sets a failure response that will be returned from the `Client#send()` invocation
     * for specified Command and/or its input.
     * The response will always be an `Error` instance.
     * @param error Error text, Error instance or Error parameters to be returned
     */
    rejects(error?: string | Error | AwsError): AwsStub<TInput, TOutput> {
        if (typeof error === 'string') {
            error = new Error(error);
        }
        if (!(error instanceof Error)) {
            error = Object.assign(new Error(), error);
        }

        this.send.rejects(error);

        return this.clientStub;
    }

    /**
     * Sets a function that will be called on `Client#send()` invocation
     * for specified Command and/or its input.
     * @param fn Function taking Command input and returning result
     */
    callsFake(fn: (input: any) => any): AwsStub<TInput, TOutput> {
        this.send.callsFake(cmd => fn(cmd.input));
        return this.clientStub;
    }

}

type AwsCommand<Input extends ClientInput, Output extends ClientOutput, ClientInput extends object = any, ClientOutput extends MetadataBearer = any> = Command<ClientInput, Input, ClientOutput, Output, any>;
type CommandResponse<TOutput> = Partial<TOutput> | PromiseLike<Partial<TOutput>>;

export interface AwsError extends Partial<Error>, Partial<MetadataBearer> {
    Type?: string;
    Code?: string;
    $fault?: 'client' | 'server';
    $service?: string;
}
