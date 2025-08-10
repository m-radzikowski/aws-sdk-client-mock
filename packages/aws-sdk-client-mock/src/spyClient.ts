import {Client, Command, MetadataBearer} from '@smithy/types';
import sinon, {SinonSandbox, SinonSpy} from 'sinon';
import {isSinonProxy} from './sinon';
import {AwsClientSpy, AwsSpy} from './awsClientSpy';

/**
 * Creates and attaches a stub of the `Client#send()` method. Only this single method is spied.
 * If method is already a spy, it's replaced.
 * @param client `Client` type or instance to replace the method
 * @param sandbox Optional sinon sandbox to use
 * @return Spy allowing to configure Client's behavior
 */
export const spyClient = <TInput extends object, TOutput extends MetadataBearer, TConfiguration>(
    client: InstanceOrClassType<Client<TInput, TOutput, TConfiguration>>,
    {sandbox}: { sandbox?: SinonSandbox } = {},
): AwsClientSpy<Client<TInput, TOutput, TConfiguration>> => {
    const instance = isClientInstance(client) ? client : client.prototype;

    const send = instance.send;
    if (isSinonProxy(send)) {
        send.restore();
    }

    const sinonSandbox = sandbox || sinon;
    const sendStub = sinonSandbox.spy(instance, 'send') as SinonSpy<[Command<TInput, any, TOutput, any, any>], Promise<TOutput>>;

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
