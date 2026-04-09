import {
  BelongsTo,
  Column,
  CreatedAt,
  DataType,
  Default,
  ForeignKey,
  HasMany,
  Model,
  PrimaryKey,
  Table,
  UpdatedAt,
} from "sequelize-typescript";
import Project from "./project";
import User from "./user";
import Task from "./task";

@Table({
  tableName: "sprints",
  timestamps: true,
})
export default class Sprint extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id!: string;

  @Column({
    type: DataType.STRING(120),
    allowNull: false,
  })
  name!: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  goal?: string;

  @Column({
    type: DataType.STRING(120),
    allowNull: true,
  })
  release?: string;

  @Column({
    type: DataType.STRING(120),
    allowNull: true,
  })
  squad?: string;

  @ForeignKey(() => Project)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  project_id!: string;

  @ForeignKey(() => User)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  owner_id!: string;

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  capacity?: number;

  @Column({
    type: DataType.DATEONLY,
    allowNull: true,
  })
  start_date?: Date;

  @Column({
    type: DataType.DATEONLY,
    allowNull: true,
  })
  end_date?: Date;

  @Default("Active")
  @Column({
    type: DataType.ENUM("Planning", "Active", "Completed"),
    allowNull: false,
  })
  status!: "Planning" | "Active" | "Completed";

  @CreatedAt
  created_at!: Date;

  @UpdatedAt
  updated_at!: Date;

  @BelongsTo(() => Project, "project_id")
  project!: Project;

  @BelongsTo(() => User, "owner_id")
  owner!: User;

  @HasMany(() => Task, "sprint_id")
  tasks!: Task[];
}
