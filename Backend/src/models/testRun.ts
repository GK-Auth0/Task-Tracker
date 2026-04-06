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
import TestPlan from "./testPlan";

export const generateTestRunReferenceCode = () => {
  const timePart = Date.now().toString(36).toUpperCase();
  const randomPart = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `TR-${timePart}${randomPart}`;
};

@Table({
  tableName: "test_runs",
  timestamps: true,
})
export default class TestRun extends Model {
  @BeforeValidate
  static ensureReferenceCode(instance: TestRun) {
    if (!instance.reference_code) {
      instance.reference_code = generateTestRunReferenceCode();
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

  @ForeignKey(() => TestPlan)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  plan_id!: string;

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
    allowNull: false,
  })
  environment!: string;

  @Default("Planned")
  @Column({
    type: DataType.ENUM("Planned", "In Progress", "Completed", "Blocked"),
    allowNull: false,
  })
  status!: "Planned" | "In Progress" | "Completed" | "Blocked";

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  notes?: string;

  @CreatedAt
  created_at!: Date;

  @UpdatedAt
  updated_at!: Date;

  @BelongsTo(() => TestPlan, "plan_id")
  plan!: TestPlan;

  @BelongsTo(() => Project, "project_id")
  project!: Project;

  @BelongsTo(() => User, "owner_id")
  owner!: User;
}
