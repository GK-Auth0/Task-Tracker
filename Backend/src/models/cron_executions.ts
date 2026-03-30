import { UUID } from "crypto"
import {
    Column,
    DataType,
    Default,
    PrimaryKey,
    Table,
    Model,
    ForeignKey,
    CreatedAt,
    UpdatedAt,
    BelongsTo
} from "sequelize-typescript"
import Cron from "./crons"

export enum cron_executions_status {
    PENDING = "pending",
    RUNNING = "running",
    SUCCESS = "success",
    FAILED = "failed",
    RETRYING = "retrying"
}

@Table({
    tableName: "cron_executions",
    timestamps: true,
})

export default class Cron_execution extends Model {
    @PrimaryKey
    @Default(DataType.UUIDV4)
    @Column({ type: DataType.UUIDV4, allowNull: false })
    execution_id!: string

    @ForeignKey(() => Cron)
    @Column({
        type: DataType.UUIDV4,
        allowNull: false
    })
    cron_id!: string

    @Default(cron_executions_status.PENDING)
    @Column({
        type: DataType.ENUM(...Object.values(cron_executions_status)),
        allowNull: false,
    })
    status!: cron_executions_status

    @Default(0)
    @Column({ type: DataType.NUMBER, allowNull: false })
    retry_count!: Number

    @Column({ type: DataType.DATE, allowNull: false })
    started_at!: Date

    @Column({ type: DataType.DATE, allowNull: false })
    ended_at!: Date

    @Column({ type: DataType.TEXT })
    error_message!: string

    @CreatedAt
    created_at!: Date

    @UpdatedAt
    updatedAt!: Date

    @BelongsTo(() => Cron, "cron_id")
    cron!: Cron

}

