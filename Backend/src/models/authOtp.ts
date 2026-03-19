import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  Default,
  CreatedAt,
  UpdatedAt,
  ForeignKey,
  BelongsTo,
} from "sequelize-typescript";
import User from "./user";

@Table({
  tableName: "auth_otps",
  timestamps: true,
  createdAt: "created_at",
  updatedAt: "updated_at",
})
export default class AuthOtp extends Model {
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
    type: DataType.ENUM("login", "register", "auth0", "passwordReset"),
    allowNull: false,
  })
  purpose!: "login" | "register" | "auth0" | "passwordReset";

  @Column({
    type: DataType.STRING(255),
    allowNull: false,
  })
  otp_hash!: string;

  @Column({
    type: DataType.DATE,
    allowNull: false,
  })
  expires_at!: Date;

  @Default(0)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  attempts!: number;

  @Default(false)
  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
  })
  is_verified!: boolean;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  verified_at?: Date;

  @BelongsTo(() => User, "user_id")
  user!: User;

  @CreatedAt
  created_at!: Date;

  @UpdatedAt
  updated_at!: Date;
}
