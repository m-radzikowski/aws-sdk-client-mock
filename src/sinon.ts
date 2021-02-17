import {SinonStub} from 'sinon';

export interface MaybeSinonProxy {
    isSinonProxy?: boolean;
}

export const isSinonStub = (obj: unknown): obj is SinonStub =>
    ((obj as MaybeSinonProxy).isSinonProxy || false)
    && (obj as SinonStub).restore !== undefined;
