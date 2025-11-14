import { Logger } from '@subsquid/logger';
import { EntityMetadata } from 'typeorm';
export declare enum ChangeType {
    Insert = "Insert",
    Upsert = "Upsert",
    Remove = "Remove"
}
export interface Change {
    id: string;
    type: ChangeType;
}
export declare class ChangeMap {
    private opts;
    private map;
    private logger;
    constructor(opts: {
        logger: Logger;
    });
    get(metadata: EntityMetadata, id: string): ChangeType | undefined;
    set(metadata: EntityMetadata, id: string, type: ChangeType): this;
    insert(metadata: EntityMetadata, id: string): void;
    upsert(metadata: EntityMetadata, id: string): void;
    remove(metadata: EntityMetadata, id: string): void;
    clear(): void;
    values(): Map<EntityMetadata, Map<string, ChangeType>>;
    private getChanges;
}
//# sourceMappingURL=changeMap.d.ts.map