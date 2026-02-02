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
import User from "./user";

@Table({
  tableName: "audit_logs",
  timestamps: false,
})
export default class AuditLog extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id!: string;

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
    type: DataType.ENUM("created", "updated", "deleted", "status_changed", "assigned", "unassigned"),
    allowNull: false,
  })
  action!: "created" | "updated" | "deleted" | "status_changed" | "assigned" | "unassigned";

  @ForeignKey(() => User)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  user_id!: string;

  @Column({
    type: DataType.JSONB,
    allowNull: true,
  })
  old_values?: object;

  @Column({
    type: DataType.JSONB,
    allowNull: true,
  })
  new_values?: object;

  @Column({
    type: DataType.JSONB,
    allowNull: true,
  })
  changes?: object;

  @CreatedAt
  created_at!: Date;

  @BelongsTo(() => User)
  user!: User;
}