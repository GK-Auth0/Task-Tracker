import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  Default,
  ForeignKey,
  BelongsTo,
  HasMany,
  BelongsToMany,
  CreatedAt,
  UpdatedAt,
} from "sequelize-typescript";
import { User, Project, Subtask, Comment, Label, TaskLabel } from "./index";

@Table({
  tableName: "tasks",
  timestamps: true,
})
export default class Task extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id!: string;

  @ForeignKey(() => Project)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  project_id!: string;

  @Column({
    type: DataType.STRING(255),
    allowNull: false,
  })
  title!: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  description?: string;

  @Column({
    type: DataType.ENUM("To Do", "In Progress", "Done"),
    allowNull: false,
    defaultValue: "To Do",
  })
  status!: "To Do" | "In Progress" | "Done";

  @Column({
    type: DataType.ENUM("Low", "Medium", "High"),
    allowNull: false,
    defaultValue: "Medium",
  })
  priority!: "Low" | "Medium" | "High";

  @Column({
    type: DataType.DATEONLY,
    allowNull: true,
  })
  due_date?: Date;

  @ForeignKey(() => User)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  creator_id!: string;

  @ForeignKey(() => User)
  @Column({
    type: DataType.UUID,
    allowNull: true,
  })
  assignee_id?: string;

  @CreatedAt
  created_at!: Date;

  @UpdatedAt
  updated_at!: Date;

  @BelongsTo(() => Project, "project_id")
  project!: Project;

  @BelongsTo(() => User, "creator_id")
  creator!: User;

  @BelongsTo(() => User, "assignee_id")
  assignee?: User;

  @HasMany(() => Subtask, "task_id")
  subtasks!: Subtask[];

  @HasMany(() => Comment, "task_id")
  comments!: Comment[];

  @BelongsToMany(() => Label, () => TaskLabel)
  labels!: Label[];
}
