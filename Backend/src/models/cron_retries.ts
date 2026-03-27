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
    AllowNull,
    UpdatedAt,
} from "sequelize-typescript"
import Cron_execution from "./cron_executions"


@Table({
    tableName: "cron_retries",
    timestamps: true
})

export default class Cron_retrie extends Model {
    @PrimaryKey
    @Default(DataType.UUIDV4)
    @Column(DataType.UUIDV4)
    retry_id!: string

    @ForeignKey(() => Cron_execution)
    @Column({ type: DataType.UUIDV4, allowNull: false })
    execution_id!: string

    @Column({ type: DataType.NUMBER, allowNull: false })
    retry_count!: Number

    @Column({ type: DataType.BOOLEAN, allowNull: false })
    status!: Boolean

    @Column({ type: DataType.DATE })
    retry_time!: Date

    @CreatedAt
    createdAt!: Date

    @UpdatedAt
    updatedAt!: Date

    @BelongsTo(() => Cron_execution, "execution_id")
    cron_execution!: Cron_execution
}