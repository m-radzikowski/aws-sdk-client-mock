import {Client, Command, MetadataBearer} from '@aws-sdk/types';
import {SinonStub, stub} from 'sinon';
import {isSinonStub} from './sinon';
import {AwsClientStub, AwsStub} from './awsClientStub';

/**
 * Creates and attaches a stub of the `Client#send()` method. Only this single method is mocked.
 * If method is already a stub, it's replaced.
 * @param client `Client` type or instance to replace the method
 * @return Stub allowing to configure Client's behavior
 */
export const mockClient = <TInput extends object, TOutput extends MetadataBearer>(
    client: InstanceOrClassType<Client<TInput, TOutput, any>>,
): AwsClientStub<Client<TInput, TOutput, any>> => {
    const instance = isClientInstance(client) ? client : client.prototype;

    const send = instance.send;
    if (isSinonStub(send)) {
        send.restore();
    }

    const sendStub = stub(instance, 'send') as SinonStub<[Command<TInput, any, TOutput, any, any>], Promise<TOutput>>;

    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    return new AwsStub<TInput, TOutput>(instance, sendStub);
};

type ClassType<T> = {
    prototype: T;
};

type InstanceOrClassType<T> = T | ClassType<T>;

/**
 * Type guard to differentiate `Client` instance from a type.
 */
const isClientInstance = <TClient extends Client<any, any, any>>(obj: InstanceOrClassType<TClient>): obj is TClient =>
    (obj as TClient).send !== undefined;
