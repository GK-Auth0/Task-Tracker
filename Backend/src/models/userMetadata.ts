import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  ForeignKey,
  BelongsTo,
  CreatedAt,
} from "sequelize-typescript";
import User from "./user";

@Table({
  tableName: "user_metadata",
  timestamps: false,
})
export default class UserMetadata extends Model {
  @PrimaryKey
  @ForeignKey(() => User)
  @Column(DataType.UUID)
  user_id!: string;

  @Column({
    type: DataType.INET,
    allowNull: false,
  })
  ip_address!: string;

  @Column({
    type: DataType.STRING(100),
    allowNull: true,
  })
  country?: string;

  @Column({
    type: DataType.STRING(100),
    allowNull: true,
  })
  region?: string;

  @Column({
    type: DataType.STRING(100),
    allowNull: true,
  })
  city?: string;

  @Column({
    type: DataType.STRING(50),
    allowNull: true,
  })
  timezone?: string;

  @Column({
    type: DataType.DECIMAL(10, 8),
    allowNull: true,
  })
  lat?: number;

  @Column({
    type: DataType.DECIMAL(11, 8),
    allowNull: true,
  })
  lng?: number;

  @Column({
    type: DataType.STRING(255),
    allowNull: true,
  })
  browser?: string;

  @Column({
    type: DataType.STRING(255),
    allowNull: true,
  })
  os?: string;

  @Column({
    type: DataType.STRING(255),
    allowNull: true,
  })
  device?: string;

  @CreatedAt
  created_at!: Date;

  @BelongsTo(() => User)
  user!: User;
}