import {Client, Command, MetadataBearer} from '@smithy/types';
import {match, SinonSpyCall, SinonStub} from 'sinon';
import {mockClient} from './mockClient';

export type AwsClientBehavior<TClient> =
    TClient extends Client<infer TInput, infer TOutput, infer TConfiguration> ? Behavior<TInput, TOutput, TOutput, TConfiguration> : never;

export interface Behavior<TInput extends object, TOutput extends MetadataBearer, TCommandOutput extends TOutput, TConfiguration> {

    onAnyCommand<TCmdInput extends TInput>(input?: Partial<TCmdInput>, strict?: boolean): Behavior<TInput, TOutput, TOutput, TConfiguration>;

    on<TCmdInput extends TInput, TCmdOutput extends TOutput>(
        command: new (input: TCmdInput) => AwsCommand<TCmdInput, TCmdOutput>, input?: Partial<TCmdInput>, strict?: boolean,
    ): Behavior<TInput, TOutput, TCmdOutput, TConfiguration>;

    resolves(response: CommandResponse<TCommandOutput>): AwsStub<TInput, TOutput, TConfiguration>;

    resolvesOnce(response: CommandResponse<TCommandOutput>): Behavior<TInput, TOutput, TCommandOutput, TConfiguration>;

    rejects(error?: string | Error | AwsError): AwsStub<TInput, TOutput, TConfiguration>;

    rejectsOnce(error?: string | Error | AwsError): Behavior<TInput, TOutput, TCommandOutput, TConfiguration>;

    callsFake(fn: (input: any, getClient: () => Client<TInput, TOutput, TConfiguration>) => any): AwsStub<TInput, TOutput, TConfiguration>; // TODO Types

    callsFakeOnce(fn: (input: any, getClient: () => Client<TInput, TOutput, TConfiguration>) => any): Behavior<TInput, TOutput, TCommandOutput, TConfiguration>; // TODO Types

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
export type AwsClientStub<TClient> =
    TClient extends Client<infer TInput, infer TOutput, infer TConfiguration> ? AwsStub<TInput, TOutput, TConfiguration> : never;

/**
 * Wrapper on the mocked `Client#send()` method,
 * allowing to configure its behavior.
 *
 * Without any configuration, `Client#send()` invocation returns `undefined`.
 *
 * To define resulting variable type easily, use {@link AwsClientStub}.
 */
export class AwsStub<TInput extends object, TOutput extends MetadataBearer, TConfiguration> implements Behavior<TInput, TOutput, TOutput, TConfiguration> {

    /**
     * Underlying `Client#send()` method Sinon stub.
     *
     * Install `@types/sinon` for TypeScript typings.
     */
    public send: SinonStub<[AwsCommand<TInput, TOutput>], Promise<TOutput>>;

    constructor(
        private client: Client<TInput, TOutput, TConfiguration>,
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
    reset(): AwsStub<TInput, TOutput, TConfiguration> {
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
    resetHistory(): AwsStub<TInput, TOutput, TConfiguration> {
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

    /**
     * Allows specifying the behavior for any Command with given input (parameters).
     *
     * If the input is not specified, the given behavior will be used for any Command with any input.
     *
     * Calling `onAnyCommand()` without parameters is not required to specify the default behavior for any Command,
     * but can be used for readability.
     *
     * @example
     * ```js
     * clientMock.onAnyCommand().resolves({})
     * ```
     *
     * @param input Command payload to match
     * @param strict Should the payload match strictly (default false, will match if all defined payload properties match)
     */
    onAnyCommand<TCmdInput extends TInput>(input?: Partial<TCmdInput>, strict = false): CommandBehavior<TInput, TOutput, TOutput, TConfiguration> {
        const cmdStub = this.send.withArgs(this.createInputMatcher(input, strict));
        return new CommandBehavior(this, cmdStub);
    }

    /**
     * Allows specifying the behavior for a given Command type and its input (parameters).
     *
     * If the input is not specified, it will match any Command of that type.
     *
     * @example
     * ```js
     * snsMock
     *   .on(PublishCommand, {Message: 'My message'})
     *   .resolves({MessageId: '111'});
     * ```
     *
     * @param command Command type to match
     * @param input Command payload to match
     * @param strict Should the payload match strictly (default false, will match if all defined payload properties match)
     */
    on<TCmdInput extends TInput, TCmdOutput extends TOutput>(
        command: new (input: TCmdInput) => AwsCommand<TCmdInput, TCmdOutput>, input?: Partial<TCmdInput>, strict = false,
    ): CommandBehavior<TInput, TOutput, TCmdOutput, TConfiguration> {
        const matcher = match.instanceOf(command).and(this.createInputMatcher(input, strict));
        const cmdStub = this.send.withArgs(matcher);
        return new CommandBehavior<TInput, TOutput, TCmdOutput, TConfiguration>(this, cmdStub);
    }

    private createInputMatcher<TCmdInput extends TInput>(input?: Partial<TCmdInput>, strict = false) {
        return input !== undefined ?
            match.has('input', strict ? input : match(input))
            : match.any;
    }

    /**
     * Sets a successful response that will be returned from any `Client#send()` invocation.
     *
     * @example
     * ```js
     * snsMock
     *   .resolves({MessageId: '111'});
     * ```
     *
     * @param response Content to be returned
     */
    resolves(response: CommandResponse<TOutput>): AwsStub<TInput, TOutput, TConfiguration> {
        return this.onAnyCommand().resolves(response);
    }

    /**
     * Sets a successful response that will be returned from one `Client#send()` invocation.
     *
     * Can be chained so that successive invocations return different responses. When there are no more
     * `resolvesOnce()` responses to use, invocations will return a response specified by `resolves()`.
     *
     * @example
     * ```js
     * snsMock
     *   .resolvesOnce({MessageId: '111'}) // first call
     *   .resolvesOnce({MessageId: '222'}) // second call
     *   .resolves({MessageId: '333'}); // default
     * ```
     *
     * @param response Content to be returned
     */
    resolvesOnce(response: CommandResponse<TOutput>): CommandBehavior<TInput, TOutput, TOutput, TConfiguration> {
        return this.onAnyCommand().resolvesOnce(response);
    }

    /**
     * Sets a failure response that will be returned from any `Client#send()` invocation.
     * The response will always be an `Error` instance.
     *
     * @example
     * ```js
     * snsMock
     *   .rejects('mocked rejection');
     *```
     *
     * @example
     * ```js
     * const throttlingError = new Error('mocked rejection');
     * throttlingError.name = 'ThrottlingException';
     * snsMock
     *   .rejects(throttlingError);
     * ```
     *
     * @param error Error text, Error instance or Error parameters to be returned
     */
    rejects(error?: string | Error | AwsError): AwsStub<TInput, TOutput, TConfiguration> {
        return this.onAnyCommand().rejects(error);
    }

    /**
     * Sets a failure response that will be returned from one `Client#send()` invocation.
     * The response will always be an `Error` instance.
     *
     * Can be chained so that successive invocations return different responses. When there are no more
     * `rejectsOnce()` responses to use, invocations will return a response specified by `rejects()`.
     *
     * @example
     * ```js
     * snsMock
     *   .rejectsOnce('first mocked rejection')
     *   .rejectsOnce('second mocked rejection')
     *   .rejects('default mocked rejection');
     * ```
     *
     * @param error Error text, Error instance or Error parameters to be returned
     */
    rejectsOnce(error?: string | Error | AwsError): CommandBehavior<TInput, TOutput, TOutput, TConfiguration> {
        return this.onAnyCommand().rejectsOnce(error);
    }

    /**
     * Sets a function that will be called on any `Client#send()` invocation.
     *
     * @example
     * ```js
     * snsMock
     *   .callsFake(input => {
     *     if (input.Message === 'My message') {
     *       return {MessageId: '111'};
     *     } else {
     *       throw new Error('mocked rejection');
     *     }
     *   });
     * ```
     *
     * @example
     * Result based on the `Client` configuration:
     * ```js
     * snsMock
     *   .callsFake(async (input, getClient) => {
     *     const client = getClient();
     *     const region = await client.config.region();
     *     return {MessageId: region.substring(0, 2)};
     *   });
     * ```
     *
     * @param fn Function taking Command input and returning result
     */
    callsFake(fn: (input: any, getClient: () => Client<TInput, TOutput, TConfiguration>) => any): AwsStub<TInput, TOutput, TConfiguration> {
        return this.onAnyCommand().callsFake(fn);
    }

    /**
     * Sets a function that will be called once, on any `Client#send()` invocation.
     *
     * Can be chained so that successive invocations call different functions. When there are no more
     * `callsFakeOnce()` functions to use, invocations will call a function specified by `callsFake()`.
     *
     * @example
     * ```js
     * snsMock
     *   .callsFakeOnce(cmd => {MessageId: '111'}) // first call
     *   .callsFakeOnce(cmd => {MessageId: '222'}) // second call
     *   .callsFake(cmd => {MessageId: '000'}); // default
     * ```
     *
     * @param fn Function taking Command input and returning result
     */
    callsFakeOnce(fn: (input: any, getClient: () => Client<TInput, TOutput, TConfiguration>) => any): CommandBehavior<TInput, TOutput, TOutput, TConfiguration> {
        return this.onAnyCommand().callsFakeOnce(fn);
    }
}

export class CommandBehavior<TInput extends object, TOutput extends MetadataBearer, TCommandOutput extends TOutput, TConfiguration> implements Behavior<TInput, TOutput, TCommandOutput, TConfiguration> {

    /**
     * Counter to simulate chainable `resolvesOnce()` and similar `*Once()` methods with Sinon `Stub#onCall()`.
     * The counter is increased with every `*Once()` method call.
     */
    private nextChainableCallNumber = 0;

    /**
     * Function to get the current Client object from inside the `callsFake()` callback.
     * Since this is called from the callback when the mock function is executed,
     * the current Client is the last on the Sinon `Stub#thisValues` list.
     */
    private getClient = () => this.send.thisValues[this.send.thisValues.length - 1] as Client<TInput, TOutput, TConfiguration>;

    constructor(
        private clientStub: AwsStub<TInput, TOutput, TConfiguration>,
        private send: SinonStub<[AwsCommand<TInput, TOutput>], unknown>,
    ) {
    }

    /**
     * @deprecated Using this method means that the previously set `.on(Command)` was not followed by  resolves/rejects/callsFake call.
     * If this is legitimate behavior, please open an issue with your use case.
     */
    onAnyCommand<TCmdInput extends TInput>(input?: Partial<TCmdInput>, strict?: boolean): Behavior<TInput, TOutput, TOutput, TConfiguration> {
        return this.clientStub.onAnyCommand(input, strict);
    }

    /**
     * @deprecated Using this method means that the previously set `.on(Command)` was not followed by  resolves/rejects/callsFake call.
     * If this is legitimate behavior, please open an issue with your use case.
     */
    on<TCmdInput extends TInput, TCmdOutput extends TOutput>(
        command: new (input: TCmdInput) => AwsCommand<TCmdInput, TCmdOutput>, input?: Partial<TCmdInput>, strict = false,
    ): CommandBehavior<TInput, TOutput, TCmdOutput, TConfiguration> {
        return this.clientStub.on(command, input, strict);
    }

    /**
     * Sets a successful response that will be returned from `Client#send()` invocation for the current `Command`.
     *
     * @example
     * ```js
     * snsMock
     *   .on(PublishCommand)
     *   .resolves({MessageId: '111'});
     * ```
     *
     * @param response Content to be returned
     */
    resolves(response: CommandResponse<TCommandOutput>): AwsStub<TInput, TOutput, TConfiguration> {
        this.send.resolves(response);
        return this.clientStub;
    }

    /**
     * Sets a successful response that will be returned from one `Client#send()` invocation for the current `Command`.
     *
     * Can be chained so that successive invocations return different responses. When there are no more
     * `resolvesOnce()` responses to use, invocations will return a response specified by `resolves()`.
     *
     * @example
     * ```js
     * snsMock
     *   .on(PublishCommand)
     *   .resolvesOnce({MessageId: '111'}) // first call
     *   .resolvesOnce({MessageId: '222'}) // second call
     *   .resolves({MessageId: '333'}); // default
     * ```
     *
     * @param response Content to be returned
     */
    resolvesOnce(response: CommandResponse<TCommandOutput>): CommandBehavior<TInput, TOutput, TCommandOutput, TConfiguration> {
        this.send = this.send.onCall(this.nextChainableCallNumber++).resolves(response);
        return this;
    }

    /**
     * Sets a failure response that will be returned from `Client#send()` invocation for the current `Command`.
     * The response will always be an `Error` instance.
     *
     * @example
     * ```js
     * snsMock
     *   .on(PublishCommand)
     *   .rejects('mocked rejection');
     *```
     *
     * @example
     * ```js
     * const throttlingError = new Error('mocked rejection');
     * throttlingError.name = 'ThrottlingException';
     * snsMock
     *   .on(PublishCommand)
     *   .rejects(throttlingError);
     * ```
     *
     * @param error Error text, Error instance or Error parameters to be returned
     */
    rejects(error?: string | Error | AwsError): AwsStub<TInput, TOutput, TConfiguration> {
        this.send.rejects(CommandBehavior.normalizeError(error));
        return this.clientStub;
    }

    /**
     * Sets a failure response that will be returned from one `Client#send()` invocation for the current `Command`.
     * The response will always be an `Error` instance.
     *
     * Can be chained so that successive invocations return different responses. When there are no more
     * `rejectsOnce()` responses to use, invocations will return a response specified by `rejects()`.
     *
     * @example
     * ```js
     * snsMock
     *   .on(PublishCommand)
     *   .rejectsOnce('first mocked rejection')
     *   .rejectsOnce('second mocked rejection')
     *   .rejects('default mocked rejection');
     * ```
     *
     * @param error Error text, Error instance or Error parameters to be returned
     */
    rejectsOnce(error?: string | Error | AwsError): CommandBehavior<TInput, TOutput, TCommandOutput, TConfiguration> {
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

    /**
     * Sets a function that will be called on `Client#send()` invocation for the current `Command`.
     *
     * @example
     * ```js
     * snsMock
     *   .on(PublishCommand)
     *   .callsFake(input => {
     *     if (input.Message === 'My message') {
     *       return {MessageId: '111'};
     *     } else {
     *       throw new Error('mocked rejection');
     *     }
     *   });
     * ```
     *
     * @example
     * Result based on the `Client` configuration:
     * ```js
     * snsMock
     *   .on(PublishCommand)
     *   .callsFake(async (input, getClient) => {
     *     const client = getClient();
     *     const region = await client.config.region();
     *     return {MessageId: region.substring(0, 2)};
     *   });
     * ```
     *
     * @param fn Function taking Command input and returning result
     */
    callsFake(fn: (input: any, getClient: () => Client<TInput, TOutput, TConfiguration>) => any): AwsStub<TInput, TOutput, TConfiguration> {
        this.send.callsFake(cmd => this.fakeFnWrapper(cmd, fn));
        return this.clientStub;
    }

    /**
     * Sets a function that will be called once on `Client#send()` invocation  for the current `Command`.
     *
     * Can be chained so that successive invocations call different functions. When there are no more
     * `callsFakeOnce()` functions to use, invocations will call a function specified by `callsFake()`.
     *
     * @example
     * ```js
     * snsMock
     *   .on(PublishCommand)
     *   .callsFakeOnce(cmd => {MessageId: '111'}) // first call
     *   .callsFakeOnce(cmd => {MessageId: '222'}) // second call
     *   .callsFake(cmd => {MessageId: '000'}); // default
     * ```
     *
     * @param fn Function taking Command input and returning result
     */
    callsFakeOnce(fn: (input: any, getClient: () => Client<TInput, TOutput, TConfiguration>) => any): CommandBehavior<TInput, TOutput, TCommandOutput, TConfiguration> {
        this.send.onCall(this.nextChainableCallNumber++).callsFake(cmd => this.fakeFnWrapper(cmd, fn));
        return this;
    }

    private fakeFnWrapper(cmd: AwsCommand<TInput, TOutput>, fn: (input: any, getClient: () => Client<TInput, TOutput, TConfiguration>) => any) {
        try {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-return
            return fn(cmd.input, this.getClient);
        } catch (err) {
            return Promise.reject(CommandBehavior.normalizeError(err as string | object));
        }
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
