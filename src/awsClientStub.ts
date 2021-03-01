/* eslint-disable @typescript-eslint/ban-types,@typescript-eslint/no-explicit-any */
import {Command, MetadataBearer} from '@aws-sdk/types';
import {match, SinonSpyCall, SinonStub} from 'sinon';

/**
 * Wrapper on the mocked `Client#send()` method,
 * allowing to configure it's behavior.
 *
 * Without any configuration, `Client#send()` invocation returns `undefined`.
 */
export class AwsClientStub<TInput extends object, TOutput extends MetadataBearer> {

    /**
     * Underlying `Client#send()` method Sinon stub.
     *
     * Install `@types/sinon` for TypeScript typings.
     */
    public send: SinonStub<[Command<any, TInput, any, TOutput, any>], unknown>;

    private readonly anyCommandBehavior: CommandBehavior<TInput, TOutput, TOutput>;

    constructor(send: SinonStub<[Command<any, TInput, any, TOutput, any>], unknown>) {
        this.send = send;
        this.anyCommandBehavior = new CommandBehavior(this, send);
    }

    /**
     * Resets stub's history and behavior.
     */
    reset(): AwsClientStub<TInput, TOutput> {
        this.send.reset();
        return this;
    }

    /**
     * Resets stub's behavior.
     */
    resetBehavior(): AwsClientStub<TInput, TOutput> {
        this.send.resetBehavior();
        return this;
    }

    /**
     * Resets stub's calls history.
     */
    resetHistory(): AwsClientStub<TInput, TOutput> {
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
    calls(): SinonSpyCall[] { // TODO Restore Sinon generics
        return this.send.getCalls();
    }

    /**
     * Returns n-th recorded call to the stub.
     * @return Call
     */
    call(n: number): SinonSpyCall { // TODO Restore Sinon generics
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
    on<TCmdInput extends TInput, TCmdOutput extends TOutput>(command: new (input: TCmdInput) => Command<any, TCmdInput, any, TCmdOutput, any>, input?: TCmdInput) {
        const matcher = match.instanceOf(command).and(this.createInputMatcher(input));

        const cmdStub = this.send.withArgs(matcher);

        return new CommandBehavior<TInput, TOutput, TCmdOutput>(this, cmdStub);
    }

    /**
     * Specifies a Command input (parameters) for which the next defined `Client#send()` response
     * (with {@link resolves} or {@link rejects}) will act.
     *
     * If input is not specified, the next defined `Client#send()` response will act for any Command and any input.
     * This is only for readability, as the result is the same as with not calling it at all.
     * @param input Command payload to (strictly) match
     */
    onAnyCommand<TCmdInput extends TInput>(input?: TCmdInput) {
        const cmdStub = this.send.withArgs(this.createInputMatcher(input));
        return new CommandBehavior<TInput, TOutput, TOutput>(this, cmdStub);
    }

    private createInputMatcher<TCmdInput extends TInput>(input?: TCmdInput) {
        return input !== undefined ? match.has('input', input) : match.any;
    }

    resolves(response: Partial<TOutput>): AwsClientStub<TInput, TOutput> {
        return this.anyCommandBehavior.resolves(response);
    }

    rejects(error?: string | Error | AwsError): AwsClientStub<TInput, TOutput> {
        return this.anyCommandBehavior.rejects(error);
    }

    callsFake(fn: (input: any) => any): AwsClientStub<TInput, TOutput> {
        return this.anyCommandBehavior.callsFake(fn);
    }

}

type CommandOutputType<TCommand> = TCommand extends new (input: any) => Command<any, any, any, infer OutputType, any> ? OutputType : never

abstract class Behavior<TInput extends object, TOutput extends MetadataBearer, TResponse extends TOutput> {

    protected constructor(
        private clientStub: AwsClientStub<TInput, TOutput>,
        private send: SinonStub, // TODO Add generic types?
    ) {
    }

    /**
     * Sets a successful response that will be returned from the `Client#send()` invocation.
     *
     * If a Command and/or its input were specified (with {@link on} or {@link onAnyCommand}),
     * the response will be returned only on receiving them as `Client#send()` argument.
     * @param response Content to be returned from `Client#send()` method
     */
    resolves(response: Partial<TResponse>): AwsClientStub<TInput, TOutput> {
        this.send.resolves(response);
        return this.clientStub;
    }

    /**
     * Sets a failure response that will be returned from the `Client#send()` invocation.
     * The response will always be an `Error` instance.
     *
     * The same Command and its input rules apply as in the {@link resolves}.
     * @param error Error text, Error instance or Error parameters to be returned from `Client#send()` method
     */
    rejects(error?: string | Error | AwsError): AwsClientStub<TInput, TOutput> {
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
     * Sets a function that will be called on `Client#send()` invocation.
     *
     * The same Command and its input rules apply as in the {@link resolves}.
     * @param fn Function taking Command input and returning result
     */
    callsFake(fn: (input: any) => any): AwsClientStub<TInput, TOutput> {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        this.send.callsFake(cmd => fn(cmd.input));

        return this.clientStub;
    }

}

export class CommandBehavior<TInput extends object, TOutput extends MetadataBearer, TCommandOutput extends TOutput>
    extends Behavior<TInput, TOutput, TCommandOutput> {

    constructor(
        clientStub: AwsClientStub<TInput, TOutput>,
        send: SinonStub, // TODO Add generic types?
    ) {
        super(clientStub, send);
    }
}

export interface AwsError extends Partial<Error>, Partial<MetadataBearer> {
    Type?: string;
    Code?: string;
    $fault?: 'client' | 'server';
    $service?: string;
}
