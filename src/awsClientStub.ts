import {Client, Command, MetadataBearer} from '@aws-sdk/types';
import {match, SinonSpyCall, SinonStub} from 'sinon';
import {mockClient} from './mockClient';

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
    public send: SinonStub<[AwsCommand<TInput, TOutput>], Promise<TOutput>>;

    constructor(
        private client: Client<TInput, TOutput, any>,
        send: SinonStub<[AwsCommand<TInput, TOutput>], Promise<TOutput>>,
    ) {
        this.send = send;
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
     * Allows specifying the behavior for a given Command type and its input (parameters).
     *
     * If the input is not specified, it will match any Command of that type.
     * @param command Command type to match
     * @param input Command payload to match
     * @param strict Should the payload match strictly (default false, will match if all defined payload properties match)
     */
    on<TCmdInput extends TInput, TCmdOutput extends TOutput>(
        command: new (input: TCmdInput) => AwsCommand<TCmdInput, TCmdOutput>, input?: Partial<TCmdInput>, strict = false,
    ): CommandBehavior<TInput, TOutput, TCmdOutput> {
        const matcher = match.instanceOf(command).and(this.createInputMatcher(input, strict));
        const cmdStub = this.send.withArgs(matcher);
        return new CommandBehavior<TInput, TOutput, TCmdOutput>(this, cmdStub);
    }

    /**
     * Allows specifying the behavior for any Command with given input (parameters).
     *
     * If the input is not specified, the given behavior will be used for any Command with any input.
     * @param input Command payload to match
     * @param strict Should the payload match strictly (default false, will match if all defined payload properties match)
     */
    onAnyCommand<TCmdInput extends TInput>(input?: Partial<TCmdInput>, strict = false): CommandBehavior<TInput, TOutput, TOutput> {
        const cmdStub = this.send.withArgs(this.createInputMatcher(input, strict));
        return new CommandBehavior(this, cmdStub);
    }

    private createInputMatcher<TCmdInput extends TInput>(input?: Partial<TCmdInput>, strict = false) {
        return input !== undefined ?
            match.has('input', strict ? input : match(input))
            : match.any;
    }

    /**
     * Sets a successful response that will be returned from any `Client#send()` invocation.
     *
     * Same as `mock.onAnyCommand().resolves()`.
     * @param response Content to be returned
     */
    resolves(response: CommandResponse<TOutput>): AwsStub<TInput, TOutput> {
        return this.onAnyCommand().resolves(response);
    }

    /**
     * Sets a failure response that will be returned from any `Client#send()` invocation.
     * The response will always be an `Error` instance.
     *
     * Same as `mock.onAnyCommand().rejects()`.
     * @param error Error text, Error instance or Error parameters to be returned
     */
    rejects(error?: string | Error | AwsError): AwsStub<TInput, TOutput> {
        return this.onAnyCommand().rejects(error);
    }

    /**
     * Sets a function that will be called on any `Client#send()` invocation.
     *
     * Same as `mock.onAnyCommand().callsFake()`.
     * @param fn Function taking Command input and returning result
     */
    callsFake(fn: (input: any) => any): AwsStub<TInput, TOutput> {
        return this.onAnyCommand().callsFake(fn);
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
