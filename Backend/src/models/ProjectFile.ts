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
import Project from "./project";
import User from "./user";

@Table({
  tableName: "project_files",
  timestamps: true,
})
export default class ProjectFile extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id!: string;

  @ForeignKey(() => Project)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  project_id!: string;

  @Column({
    type: DataType.STRING(255),
    allowNull: false,
  })
  filename!: string;

  @Column({
    type: DataType.STRING(255),
    allowNull: false,
  })
  original_name!: string;

  @Column({
    type: DataType.TEXT,
    allowNull: false,
  })
  file_url!: string;

  @Column({
    type: DataType.BIGINT,
    allowNull: false,
  })
  file_size!: number;

  @Column({
    type: DataType.STRING(100),
    allowNull: false,
  })
  mime_type!: string;

  @ForeignKey(() => User)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  uploaded_by!: string;

  @CreatedAt
  created_at!: Date;

  @UpdatedAt
  updated_at!: Date;

  @BelongsTo(() => Project, "project_id")
  project!: Project;

  @BelongsTo(() => User, "uploaded_by")
  uploader!: User;
}