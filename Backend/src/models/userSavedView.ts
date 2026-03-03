import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  Default,
  ForeignKey,
  CreatedAt,
  UpdatedAt,
  BelongsTo,
} from "sequelize-typescript";
import User from "./user";

@Table({
  tableName: "user_saved_views",
  timestamps: true,
})
export default class UserSavedView extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id!: string;

  @ForeignKey(() => User)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  user_id!: string;

  @Column({
    type: DataType.ENUM("tasks", "projects"),
    allowNull: false,
  })
  page!: "tasks" | "projects";

  @Column({
    type: DataType.STRING(100),
    allowNull: false,
  })
  name!: string;

  @Column({
    type: DataType.JSONB,
    allowNull: false,
    defaultValue: {},
  })
  filters!: Record<string, unknown>;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  })
  is_default!: boolean;

  @CreatedAt
  created_at!: Date;

  @UpdatedAt
  updated_at!: Date;

  @BelongsTo(() => User, "user_id")
  user!: User;
}
