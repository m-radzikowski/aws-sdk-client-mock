import {SinonSpy} from 'sinon';

export interface MaybeSinonProxy {
    isSinonProxy?: boolean;
}

export const isSinonProxy = (obj: unknown): obj is SinonSpy =>
    ((obj as MaybeSinonProxy).isSinonProxy || false)
    && (obj as SinonSpy).restore !== undefined;
