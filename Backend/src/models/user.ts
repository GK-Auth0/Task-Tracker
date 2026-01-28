import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  Default,
  Unique,
  CreatedAt,
  UpdatedAt,
  HasMany,
} from "sequelize-typescript";
import { Project } from "./index";
import { Task } from "./index";
import { Comment } from "./index";

@Table({
  tableName: "users",
  timestamps: true,
})
export default class User extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id!: string;

  @Column({
    type: DataType.STRING(255),
    allowNull: false,
  })
  full_name!: string;

  @Unique
  @Column({
    type: DataType.STRING(255),
    allowNull: false,
  })
  email!: string;

  @Column({
    type: DataType.STRING(255),
    allowNull: false,
  })
  password_hash!: string;

  @Column({
    type: DataType.STRING(500),
    allowNull: true,
  })
  avatar_url?: string;

  @Column({
    type: DataType.ENUM("Admin", "Member", "Viewer"),
    allowNull: false,
  })
  role!: "Admin" | "Member" | "Viewer";

  @CreatedAt
  created_at!: Date;

  @UpdatedAt
  updated_at!: Date;

  @HasMany(() => Project, "owner_id")
  owned_projects!: Project[];

  @HasMany(() => Task, "creator_id")
  created_tasks!: Task[];

  @HasMany(() => Task, "assignee_id")
  assigned_tasks!: Task[];

  @HasMany(() => Comment, "user_id")
  comments!: Comment[];
}
