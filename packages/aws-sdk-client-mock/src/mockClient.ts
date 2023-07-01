import {Client, Command, MetadataBearer} from '@smithy/types';
import {SinonStub, stub} from 'sinon';
import {isSinonStub} from './sinon';
import {AwsStub} from './awsClientStub';

/**
 * Creates and attaches a stub of the `Client#send()` method. Only this single method is mocked.
 * If method is already a stub, it's replaced.
 * @param client `Client` type or instance to replace the method
 * @return Stub allowing to configure Client's behavior
 */
export function mockClient<
    TClient extends Client<TInput, TOutput, TConfiguration>,
    TInput extends object = TClient extends Client<infer TIn, any, any> ? TIn : never,
    TOutput extends MetadataBearer = TClient extends Client<any, infer TOut, any> ? TOut : never,
    TConfiguration = TClient extends Client<any, any, infer TConf> ? TConf : never,
>(
    client: InstanceOrClassType<Client<TInput, TOutput, TConfiguration>>,
): AwsStub<TClient, TInput, TOutput, TConfiguration> {
    const instance = isClientInstance(client) ? client : client.prototype;

    const send = instance.send;
    if (isSinonStub(send)) {
        send.restore();
    }

    const sendStub = stub(instance, 'send') as SinonStub<[Command<TInput, TInput, TOutput, TOutput, TConfiguration>], Promise<TOutput>>;

    return new AwsStub<TClient, TInput, TOutput, TConfiguration>(instance, sendStub);
}

type ClassType<T> = {
    prototype: T;
};

type InstanceOrClassType<T> = T | ClassType<T>;

/**
 * Type guard to differentiate `Client` instance from a type.
 */
const isClientInstance = <TClient extends Client<any, any, any>>(obj: InstanceOrClassType<TClient>): obj is TClient =>
    (obj as TClient).send !== undefined;
