import {
  BelongsTo,
  BeforeValidate,
  Column,
  CreatedAt,
  DataType,
  Default,
  ForeignKey,
  Model,
  PrimaryKey,
  Table,
  UpdatedAt,
} from "sequelize-typescript";
import Project from "./project";
import User from "./user";
import Sprint from "./sprint";

export const generateTestPlanReferenceCode = () => {
  const timePart = Date.now().toString(36).toUpperCase();
  const randomPart = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `TP-${timePart}${randomPart}`;
};

@Table({
  tableName: "test_plans",
  timestamps: true,
})
export default class TestPlan extends Model {
  @BeforeValidate
  static ensureReferenceCode(instance: TestPlan) {
    if (!instance.reference_code) {
      instance.reference_code = generateTestPlanReferenceCode();
    }
  }

  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id!: string;

  @Column({
    type: DataType.STRING(20),
    allowNull: false,
  })
  reference_code!: string;

  @Column({
    type: DataType.STRING(255),
    allowNull: false,
  })
  name!: string;

  @ForeignKey(() => Project)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  project_id!: string;

  @ForeignKey(() => User)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  owner_id!: string;

  @Column({
    type: DataType.STRING(120),
    allowNull: true,
  })
  sprint_name?: string;

  @ForeignKey(() => Sprint)
  @Column({
    type: DataType.UUID,
    allowNull: true,
  })
  sprint_id?: string;

  @Column({
    type: DataType.STRING(120),
    allowNull: true,
  })
  release_name?: string;

  @Default("Draft")
  @Column({
    type: DataType.ENUM("Draft", "Active", "Completed"),
    allowNull: false,
  })
  status!: "Draft" | "Active" | "Completed";

  @Default([])
  @Column({
    type: DataType.JSONB,
    allowNull: false,
  })
  suite_names!: string[];

  @CreatedAt
  created_at!: Date;

  @UpdatedAt
  updated_at!: Date;

  @BelongsTo(() => Project, "project_id")
  project!: Project;

  @BelongsTo(() => User, "owner_id")
  owner!: User;

  @BelongsTo(() => Sprint, "sprint_id")
  sprint?: Sprint;
}
