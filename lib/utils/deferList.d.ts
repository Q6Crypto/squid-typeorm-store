import { EntityMetadata, FindOptionsRelations, ObjectLiteral } from 'typeorm';
import { Logger } from '@subsquid/logger';
export type DeferData = {
    ids: Set<string>;
    relations: FindOptionsRelations<any>;
};
export declare class DeferList {
    private opts;
    private map;
    private logger;
    constructor(opts: {
        logger: Logger;
    });
    add<E extends ObjectLiteral>(metadata: EntityMetadata, id: string, relations?: FindOptionsRelations<E>): void;
    values(): Map<EntityMetadata, DeferData>;
    clear(): void;
    private getData;
}
//# sourceMappingURL=deferList.d.ts.map