import {Client, Command, MetadataBearer} from '@aws-sdk/types';
import {match, SinonSpyCall, SinonStub} from 'sinon';
import {mockClient} from './mockClient';

export type AwsClientBehavior<TClient extends Client<any, any, any>> =
    TClient extends Client<infer TInput, infer TOutput, any> ? Behavior<TInput, TOutput, TOutput> : never;

export interface Behavior<TInput extends object, TOutput extends MetadataBearer, TCommandOutput extends TOutput> {

    /**
     * Allows specifying the behavior for any Command with given input (parameters).
     *
     * If the input is not specified, the given behavior will be used for any Command with any input.
     *
     * Calling `onAnyCommand()` without parameters is not required to specify the default behavior for any Command,
     * but can be used for readability.
     *
     * @example
     * ```ts
     * clientMock.onAnyCommand().resolves(123)
     * ```
     *
     * is same as:
     *
     * ```ts
     * clientMock.resolves(123)
     * ```
     *
     * @param input Command payload to match
     * @param strict Should the payload match strictly (default false, will match if all defined payload properties match)
     */
    onAnyCommand<TCmdInput extends TInput>(input?: Partial<TCmdInput>, strict?: boolean): Behavior<TInput, TOutput, TOutput>;

    /**
     * Allows specifying the behavior for a given Command type and its input (parameters).
     *
     * If the input is not specified, it will match any Command of that type.
     *
     * @param command Command type to match
     * @param input Command payload to match
     * @param strict Should the payload match strictly (default false, will match if all defined payload properties match)
     */
    on<TCmdInput extends TInput, TCmdOutput extends TOutput>(
        command: new (input: TCmdInput) => AwsCommand<TCmdInput, TCmdOutput>, input?: Partial<TCmdInput>, strict?: boolean,
    ): Behavior<TInput, TOutput, TCmdOutput>;

    /**
     * Sets a successful response that will be returned from any `Client#send()` invocation.
     *
     * @param response Content to be returned
     */
    resolves(response: CommandResponse<TCommandOutput>): AwsStub<TInput, TOutput>;

    /**
     * Sets a successful response that will be returned from one `Client#send()` invocation.
     *
     * Can be chained so that successive invocations return different responses. When there are no more
     * `resolvesOnce()` responses to use, invocations will return a response specified by `resolves()`.
     *
     * @example
     * ```js
     * clientMock
     *   .resolvesOnce('first call')
     *   .resolvesOnce('second call')
     *   .resolves('default');
     * ```
     *
     * @param response Content to be returned
     */
    resolvesOnce(response: CommandResponse<TCommandOutput>): Behavior<TInput, TOutput, TCommandOutput>;

    /**
     * Sets a failure response that will be returned from any `Client#send()` invocation.
     * The response will always be an `Error` instance.
     *
     * @param error Error text, Error instance or Error parameters to be returned
     */
    rejects(error?: string | Error | AwsError): AwsStub<TInput, TOutput>;

    /**
     * Sets a failure response that will be returned from one `Client#send()` invocation.
     * The response will always be an `Error` instance.
     *
     * Can be chained so that successive invocations return different responses. When there are no more
     * `rejectsOnce()` responses to use, invocations will return a response specified by `rejects()`.
     *
     * @example
     * ```js
     * clientMock
     *   .rejectsOnce('first call')
     *   .rejectsOnce('second call')
     *   .rejects('default');
     * ```
     *
     * @param error Error text, Error instance or Error parameters to be returned
     */
    rejectsOnce(error?: string | Error | AwsError): Behavior<TInput, TOutput, TCommandOutput>;

    /**
     * Sets a function that will be called on any `Client#send()` invocation.
     *
     * @param fn Function taking Command input and returning result
     */
    callsFake(fn: (input: any) => any): AwsStub<TInput, TOutput>; // TODO Types

    /**
     * Sets a function that will be called on any `Client#send()` invocation.
     *
     * Can be chained so that successive invocations call different functions. When there are no more
     * `callsFakeOnce()` functions to use, invocations will call a function specified by `callsFake()`.
     *
     * @example
     * ```js
     * clientMock
     *   .callsFakeOnce(cmd => 'first call')
     *   .callsFakeOnce(cmd => 'second call')
     *   .callsFake(cmd => 'default');
     * ```
     *
     * @param fn Function taking Command input and returning result
     */
    callsFakeOnce(fn: (input: any) => any): Behavior<TInput, TOutput, TCommandOutput>; // TODO Types

}

/**
 * Type for {@link AwsStub} class,
 * but with the AWS Client class type as an only generic parameter.
 *
 * @example
 * ```ts
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
    public send: SinonStub<[AwsCommand<TInput, TOutput>], Promise<TOutput>>;

    constructor(
        private client: Client<TInput, TOutput, any>,
        send: SinonStub<[AwsCommand<TInput, TOutput>], Promise<TOutput>>,
    ) {
        this.send = send;
    }

    /** Returns the class name of the underlying mocked client class */
    clientName(): string {
        return this.client.constructor.name;
    }

    /**
     * Resets stub. It will replace the stub with a new one, with clean history and behavior.
     */
    reset(): AwsStub<TInput, TOutput> {
        /* sinon.stub.reset() does not remove the fakes which in some conditions can break subsequent stubs,
         * so instead of calling send.reset(), we recreate the stub.
         * See: https://github.com/sinonjs/sinon/issues/1572
         * We are only affected by the broken reset() behavior of this bug, since we always use matchers.
         */
        const newStub = mockClient(this.client);
        this.send = newStub.send;
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
    calls(): SinonSpyCall<[AwsCommand<TInput, TOutput>], Promise<TOutput>>[] {
        return this.send.getCalls();
    }

    /**
     * Returns n-th recorded call to the stub.
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

    onAnyCommand<TCmdInput extends TInput>(input?: Partial<TCmdInput>, strict = false): CommandBehavior<TInput, TOutput, TOutput> {
        const cmdStub = this.send.withArgs(this.createInputMatcher(input, strict));
        return new CommandBehavior(this, cmdStub);
    }

    on<TCmdInput extends TInput, TCmdOutput extends TOutput>(
        command: new (input: TCmdInput) => AwsCommand<TCmdInput, TCmdOutput>, input?: Partial<TCmdInput>, strict = false,
    ): CommandBehavior<TInput, TOutput, TCmdOutput> {
        const matcher = match.instanceOf(command).and(this.createInputMatcher(input, strict));
        const cmdStub = this.send.withArgs(matcher);
        return new CommandBehavior<TInput, TOutput, TCmdOutput>(this, cmdStub);
    }

    private createInputMatcher<TCmdInput extends TInput>(input?: Partial<TCmdInput>, strict = false) {
        return input !== undefined ?
            match.has('input', strict ? input : match(input))
            : match.any;
    }

    resolves(response: CommandResponse<TOutput>): AwsStub<TInput, TOutput> {
        return this.onAnyCommand().resolves(response);
    }

    resolvesOnce(response: CommandResponse<TOutput>): CommandBehavior<TInput, TOutput, TOutput> {
        return this.onAnyCommand().resolvesOnce(response);
    }

    rejects(error?: string | Error | AwsError): AwsStub<TInput, TOutput> {
        return this.onAnyCommand().rejects(error);
    }

    rejectsOnce(error?: string | Error | AwsError): CommandBehavior<TInput, TOutput, TOutput> {
        return this.onAnyCommand().rejectsOnce(error);
    }

    callsFake(fn: (input: any) => any): AwsStub<TInput, TOutput> {
        return this.onAnyCommand().callsFake(fn);
    }

    callsFakeOnce(fn: (input: any) => any): CommandBehavior<TInput, TOutput, TOutput> {
        return this.onAnyCommand().callsFakeOnce(fn);
    }
}

export class CommandBehavior<TInput extends object, TOutput extends MetadataBearer, TCommandOutput extends TOutput> implements Behavior<TInput, TOutput, TCommandOutput> {

    /**
     * Counter to simulate chainable `resolvesOnce()` and similar `*Once()` methods with Sinon `Stub#onCall()`.
     * The counter is increased with every `*Once()` method call.
     */
    private nextChainableCallNumber = 0;

    constructor(
        private clientStub: AwsStub<TInput, TOutput>,
        private send: SinonStub<[AwsCommand<TInput, TOutput>], unknown>,
    ) {
    }

    onAnyCommand<TCmdInput extends TInput>(input?: Partial<TCmdInput>, strict?: boolean): Behavior<TInput, TOutput, TOutput> {
        return this.clientStub.onAnyCommand(input, strict);
    }

    on<TCmdInput extends TInput, TCmdOutput extends TOutput>(
        command: new (input: TCmdInput) => AwsCommand<TCmdInput, TCmdOutput>, input?: Partial<TCmdInput>, strict = false,
    ): CommandBehavior<TInput, TOutput, TCmdOutput> {
        return this.clientStub.on(command, input, strict);
    }

    resolves(response: CommandResponse<TCommandOutput>): AwsStub<TInput, TOutput> {
        this.send.resolves(response);
        return this.clientStub;
    }

    resolvesOnce(response: CommandResponse<TCommandOutput>): CommandBehavior<TInput, TOutput, TCommandOutput> {
        this.send = this.send.onCall(this.nextChainableCallNumber++).resolves(response);
        return this;
    }

    rejects(error?: string | Error | AwsError): AwsStub<TInput, TOutput> {
        this.send.rejects(CommandBehavior.normalizeError(error));
        return this.clientStub;
    }

    rejectsOnce(error?: string | Error | AwsError): CommandBehavior<TInput, TOutput, TCommandOutput> {
        this.send.onCall(this.nextChainableCallNumber++).rejects(CommandBehavior.normalizeError(error));
        return this;
    }

    private static normalizeError(error?: string | Error | AwsError): Error {
        if (typeof error === 'string') {
            return new Error(error);
        }

        if (!(error instanceof Error)) {
            return Object.assign(new Error(), error);
        }

        return error;
    }

    callsFake(fn: (input: any) => any): AwsStub<TInput, TOutput> {
        this.send.callsFake(cmd => fn(cmd.input));
        return this.clientStub;
    }

    callsFakeOnce(fn: (input: any) => any): CommandBehavior<TInput, TOutput, TCommandOutput> {
        this.send.onCall(this.nextChainableCallNumber++).callsFake(cmd => fn(cmd.input));
        return this;
    }
}

export type AwsCommand<Input extends ClientInput, Output extends ClientOutput, ClientInput extends object = any, ClientOutput extends MetadataBearer = any> = Command<ClientInput, Input, ClientOutput, Output, any>;
type CommandResponse<TOutput> = Partial<TOutput> | PromiseLike<Partial<TOutput>>;

export interface AwsError extends Partial<Error>, Partial<MetadataBearer> {
    Type?: string;
    Code?: string;
    $fault?: 'client' | 'server';
    $service?: string;
}
