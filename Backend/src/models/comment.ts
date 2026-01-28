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
} from "sequelize-typescript";
import { Task, User } from "./index";

@Table({
  tableName: "comments",
  timestamps: false,
})
export default class Comment extends Model {
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

  @ForeignKey(() => User)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  user_id!: string;

  @Column({
    type: DataType.TEXT,
    allowNull: false,
  })
  content!: string;

  @CreatedAt
  created_at!: Date;

  @BelongsTo(() => Task, "task_id")
  task!: Task;

  @BelongsTo(() => User, "user_id")
  user!: User;
}
