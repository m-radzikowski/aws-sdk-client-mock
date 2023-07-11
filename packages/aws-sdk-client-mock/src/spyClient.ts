import {Client, Command, MetadataBearer} from '@smithy/types';
import {SinonSpy, spy} from 'sinon';
import {isSinonSpy, isSinonStub} from './sinon';
import {AwsClientSpy, AwsSpy} from './awsClientSpy';

/**
 * Creates and attaches a spy of the `Client#send()` method. Only this single method is replaced.
 * If method is already a spy, it's replaced.
 * @param client `Client` type or instance to replace the method
 * @return Stub allowing to configure Client's behavior
 */
export const spyClient = <TInput extends object, TOutput extends MetadataBearer, TConfiguration>(
    client: InstanceOrClassType<Client<TInput, TOutput, TConfiguration>>,
): AwsClientSpy<Client<TInput, TOutput, TConfiguration>> => {
    const instance = isClientInstance(client) ? client : client.prototype;

    const send = instance.send;
    if (isSinonSpy(send) || isSinonStub(send)) {
        send.restore();
    }

    const sendStub = spy(instance, 'send') as SinonSpy<[Command<TInput, any, TOutput, any, any>], Promise<TOutput>>;

    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    return new AwsSpy<TInput, TOutput, TConfiguration>(instance, sendStub);
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
