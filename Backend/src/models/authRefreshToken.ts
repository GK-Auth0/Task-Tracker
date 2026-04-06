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
  UpdatedAt,
} from "sequelize-typescript";
import User from "./user";

@Table({
  tableName: "auth_refresh_tokens",
  timestamps: true,
  createdAt: "created_at",
  updatedAt: "updated_at",
})
export default class AuthRefreshToken extends Model {
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

  @BelongsTo(() => User, "user_id")
  user!: User;

  @Column({
    type: DataType.STRING(255),
    allowNull: false,
  })
  token_hash!: string;

  @Column({
    type: DataType.DATE,
    allowNull: false,
  })
  expires_at!: Date;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  revoked_at?: Date | null;

  @Column({
    type: DataType.UUID,
    allowNull: true,
  })
  replaced_by_token_id?: string | null;

  @Column({
    type: DataType.STRING(64),
    allowNull: true,
  })
  created_by_ip?: string | null;

  @Column({
    type: DataType.STRING(64),
    allowNull: true,
  })
  last_used_ip?: string | null;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  last_used_at?: Date | null;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  user_agent?: string | null;

  @CreatedAt
  created_at!: Date;

  @UpdatedAt
  updated_at!: Date;
}
