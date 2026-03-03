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
  tableName: "auth_password_resets",
  timestamps: true,
})
export default class AuthPasswordReset extends Model {
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

  @BelongsTo(() => User)
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
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  })
  is_used!: boolean;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  used_at?: Date;

  @CreatedAt
  created_at!: Date;

  @UpdatedAt
  updated_at!: Date;
}
