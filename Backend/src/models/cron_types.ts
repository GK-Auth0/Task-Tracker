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
} from "sequelize-typescript";

@Table({
    tableName: "cron_types",
    timestamps: true
})

export default class Cron_type extends Model {
    @PrimaryKey
    @Default(DataType.UUIDV4)
    @Column(DataType.UUIDV4)
    type_id!: string;

    @Column({ type: DataType.STRING, allowNull: false })
    type_name!: string;

    @Column({ type: DataType.TEXT })
    description!: string;

    @CreatedAt
    createdAt?: Date

    @UpdatedAt
    updatedAt?: Date

}