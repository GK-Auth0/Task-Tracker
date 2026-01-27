import { Table, Column, Model, DataType, PrimaryKey, Default, BelongsToMany, Unique } from "sequelize-typescript";
import { Task, TaskLabel } from "./index";

@Table({
  tableName: "labels",
  timestamps: false,
})
export default class Label extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id!: string;

  @Unique
  @Column({
    type: DataType.STRING(100),
    allowNull: false,
  })
  name!: string;

  @Column({
    type: DataType.STRING(7),
    allowNull: false,
    defaultValue: "#6B7280",
  })
  color_hex!: string;

  @BelongsToMany(() => Task, () => TaskLabel)
  tasks!: Task[];
}