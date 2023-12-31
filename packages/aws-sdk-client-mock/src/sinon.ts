import {SinonStub, SinonSpy} from 'sinon';

export interface MaybeSinonProxy {
    isSinonProxy?: boolean;
}

export const isSinonStub = (obj: unknown): obj is SinonStub =>
    ((obj as MaybeSinonProxy).isSinonProxy || false)
    && (obj as SinonStub).restore !== undefined;

export const isSinonSpy = (obj: unknown): obj is SinonSpy =>
    ((obj as MaybeSinonProxy).isSinonProxy || false)
    && (obj as SinonSpy).restore !== undefined;
