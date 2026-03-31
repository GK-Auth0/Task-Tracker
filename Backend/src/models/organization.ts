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
  tableName: "organization",
  timestamps: true,
})
export default class Organization extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id!: string;

  @Column({
    type: DataType.STRING(255),
    allowNull: false,
  })
  name!: string;

  @Column({
    type: DataType.CHAR(6),
    allowNull: false,
  })
  org_code!: string;

  @Column({
    type: DataType.STRING(255),
    allowNull: false,
  })
  slug!: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  description?: string;

  @Column({
    type: DataType.STRING(500),
    allowNull: true,
  })
  logo_url?: string;

  @ForeignKey(() => User)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  admin!: string;

  @Default(1)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  capacity!: number;

  @Default("active")
  @Column({
    type: DataType.ENUM("active", "inactive"),
    allowNull: false,
  })
  status!: "active" | "inactive";

  @Column({
    type: DataType.STRING(100),
    allowNull: true,
  })
  industry?: string;

  @Column({
    type: DataType.STRING(500),
    allowNull: true,
  })
  website_url?: string;

  @Column({
    type: DataType.STRING(255),
    allowNull: true,
  })
  contact_email?: string;

  @Column({
    type: DataType.STRING(30),
    allowNull: true,
  })
  phone_number?: string;

  @Column({
    type: DataType.STRING(255),
    allowNull: true,
  })
  address_line_1?: string;

  @Column({
    type: DataType.STRING(255),
    allowNull: true,
  })
  address_line_2?: string;

  @Column({
    type: DataType.STRING(100),
    allowNull: true,
  })
  city?: string;

  @Column({
    type: DataType.STRING(100),
    allowNull: true,
  })
  state?: string;

  @Column({
    type: DataType.STRING(100),
    allowNull: true,
  })
  country?: string;

  @Column({
    type: DataType.STRING(20),
    allowNull: true,
  })
  postal_code?: string;

  @ForeignKey(() => User)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  created_by!: string;

  @CreatedAt
  created_at!: Date;

  @UpdatedAt
  updated_at!: Date;

  @BelongsTo(() => User, "created_by")
  creator!: User;

  @BelongsTo(() => User, "admin")
  admin_user!: User;
}
