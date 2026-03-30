import {
    Table,
    Column,
    Model,
    DataType,
    PrimaryKey,
    Default,
    ForeignKey,
    BelongsTo,
    CreatedAt,
    UpdatedAt,
} from "sequelize-typescript";
import Cron_type from "./cron_types";
import { UUID } from "node:crypto";

@Table({
    tableName: "crons",
    timestamps: true,
})

export default class Cron extends Model {
    @PrimaryKey
    @Default(DataType.UUIDV4)
    @Column(DataType.UUIDV4)
    cron_id!: string;

    @Column({
        type: DataType.STRING, allowNull: false
    })
    cron_name!: string

    @ForeignKey(() => Cron_type)
    @Column({
        type: DataType.UUIDV4, allowNull: false
    })
    type_id!: UUID

    @Column({
        type: DataType.BOOLEAN, allowNull: false
    })
    is_active!: boolean

    @Column({
        type: DataType.STRING, allowNull: false
    })
    schedule_expression!: string

    @Column({
        type: DataType.DATE, allowNull: false
    })
    next_run_at!: Date

    @Column({
        type: DataType.DATE, allowNull: false
    })
    last_run_at!: Date

    @CreatedAt
    createdAt!: Date

    @UpdatedAt
    updatedAt?: Date;

    @BelongsTo(() => Cron_type, "type_id")
    cron_type!: Cron_type;

}