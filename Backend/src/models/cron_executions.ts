import { UUID } from "crypto"
import {
    Column,
    DataType,
    Default,
    PrimaryKey,
    Table,
    Model,
    ForeignKey
} from "sequelize-typescript"
import Cron from "./crons"

export enum cron_executions {
    SUCCESS = "success",
    FAILED = "failed"
}

@Table({
    tableName: "cron_executions",
    timestamps: true,
})

export default class cron_execution extends Model {
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

    @Default(0)
    @Column({type:DataType.NUMBER,allowNull:false})
    retry_count!:Number



}

