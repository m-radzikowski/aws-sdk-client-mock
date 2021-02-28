import {Client, Command, MetadataBearer} from '@aws-sdk/types';
import {SinonStub, stub} from 'sinon';
import {isSinonStub} from './sinon';
import {AwsClientStub} from './awsClientStub';

/**
 * Creates and attaches a stub of the `Client#send()` method. Only this single method is mocked.
 * If method is already a stub, it's replaced.
 * @param client `Client` type or instance to replace the method
 * @return Stub allowing to configure Client's behavior
 */
export const mockClient = <TInput extends object, TOutput extends MetadataBearer>(
    client: InstanceOrClassType<Client<TInput, TOutput, any>>,
): AwsClientStub<TInput, TOutput> => {
    const instance = isClientInstance(client) ? client : client.prototype;

    const send = instance.send;
    if (isSinonStub(send)) {
        send.restore();
    }

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore // TODO Resolve
    const sendStub: SinonStub<[Command<any, TInput, any, TOutput, any>], unknown> = stub(instance, 'send');

    return new AwsClientStub<TInput, TOutput>(sendStub);
};

type ClassType<T> = {
    new(...args: never[]): T;
    prototype: T;
};

type InstanceOrClassType<T> = T | ClassType<T>;

/**
 * Type guard to differentiate `Client` instance from a type.
 */
const isClientInstance = <TClient extends Client<any, any, any>>(obj: InstanceOrClassType<TClient>): obj is TClient =>
    (obj as TClient).send !== undefined;
