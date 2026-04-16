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
  HasOne,
  ForeignKey,
  BelongsTo,
} from "sequelize-typescript";
import { Project } from "./index";
import { Task } from "./index";
import { Comment } from "./index";
import UserMetadata from "./userMetadata";
import Organization from "./organization";
import { buildFullName, splitFullName } from "../utils/userName";

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
  first_name!: string;

  @Column({
    type: DataType.STRING(255),
    allowNull: false,
    defaultValue: "",
  })
  last_name!: string;

  @Column(DataType.VIRTUAL)
  get full_name(): string {
    return buildFullName({
      first_name: this.getDataValue("first_name"),
      last_name: this.getDataValue("last_name"),
    });
  }

  set full_name(value: string) {
    const { first_name, last_name } = splitFullName(value);
    this.setDataValue("first_name", first_name);
    this.setDataValue("last_name", last_name);
  }

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
    defaultValue: "Member",
  })
  role!: "Admin" | "Member" | "Viewer";

  @Default(false)
  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
  })
  password_reset_required!: boolean;

  @Default(false)
  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
  })
  is_invited_user!: boolean;

  @ForeignKey(() => Organization)
  @Column({
    type: DataType.UUID,
    allowNull: true,
  })
  organization_id?: string;

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

  @HasOne(() => UserMetadata, "user_id")
  metadata!: UserMetadata;

  @BelongsTo(() => Organization, "organization_id")
  organization?: Organization;
}
