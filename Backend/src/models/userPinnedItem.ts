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
  tableName: "user_pinned_items",
  timestamps: true,
})
export default class UserPinnedItem extends Model {
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
    type: DataType.ENUM("task", "project"),
    allowNull: false,
  })
  entity_type!: "task" | "project";

  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  entity_id!: string;

  @Column({
    type: DataType.STRING(255),
    allowNull: true,
  })
  note?: string;

  @CreatedAt
  created_at!: Date;

  @UpdatedAt
  updated_at!: Date;

  @BelongsTo(() => User, "user_id")
  user!: User;
}
