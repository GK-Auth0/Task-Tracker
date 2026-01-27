import { Table, Column, Model, DataType, ForeignKey } from "sequelize-typescript";
import { Task, Label } from "./index";

@Table({
  tableName: "task_labels",
  timestamps: false,
})
export default class TaskLabel extends Model {
  @ForeignKey(() => Task)
  @Column({
    type: DataType.UUID,
    allowNull: false,
    primaryKey: true,
  })
  task_id!: string;

  @ForeignKey(() => Label)
  @Column({
    type: DataType.UUID,
    allowNull: false,
    primaryKey: true,
  })
  label_id!: string;
}