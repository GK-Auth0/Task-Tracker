import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  Default,
  ForeignKey,
  BelongsTo,
} from "sequelize-typescript";
import { Task } from "./index";

@Table({
  tableName: "subtasks",
  timestamps: false,
})
export default class Subtask extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id!: string;

  @ForeignKey(() => Task)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  task_id!: string;

  @Column({
    type: DataType.STRING(255),
    allowNull: false,
  })
  title!: string;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  })
  is_completed!: boolean;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 0,
  })
  position!: number;

  @BelongsTo(() => Task, "task_id")
  task!: Task;
}
