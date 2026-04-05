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
import Task from "./task";

export const generateTestCaseReferenceCode = () => {
  const timePart = Date.now().toString(36).toUpperCase();
  const randomPart = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `TC-${timePart}${randomPart}`;
};

@Table({
  tableName: "test_cases",
  timestamps: true,
})
export default class TestCase extends Model {
  @BeforeValidate
  static ensureReferenceCode(instance: TestCase) {
    if (!instance.reference_code) {
      instance.reference_code = generateTestCaseReferenceCode();
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
  title!: string;

  @ForeignKey(() => Project)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  project_id!: string;

  @ForeignKey(() => Task)
  @Column({
    type: DataType.UUID,
    allowNull: true,
  })
  linked_task_id?: string;

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
  suite!: string;

  @Column({
    type: DataType.STRING(120),
    allowNull: false,
  })
  module!: string;

  @Column({
    type: DataType.STRING(120),
    allowNull: true,
  })
  sprint_name?: string;

  @Column({
    type: DataType.ENUM("Critical", "High", "Medium", "Low"),
    allowNull: false,
  })
  priority!: "Critical" | "High" | "Medium" | "Low";

  @Default("Draft")
  @Column({
    type: DataType.ENUM("Draft", "Ready", "Blocked", "Passed", "Failed"),
    allowNull: false,
  })
  status!: "Draft" | "Ready" | "Blocked" | "Passed" | "Failed";

  @Default("Manual")
  @Column({
    type: DataType.ENUM("Manual", "Automated", "Candidate"),
    allowNull: false,
  })
  automation!: "Manual" | "Automated" | "Candidate";

  @Default([])
  @Column({
    type: DataType.JSONB,
    allowNull: false,
  })
  tags!: string[];

  @Default([])
  @Column({
    type: DataType.JSONB,
    allowNull: false,
  })
  preconditions!: string[];

  @Default([])
  @Column({
    type: DataType.JSONB,
    allowNull: false,
  })
  steps!: Array<{ id: number; action: string; expected: string }>;

  @Default([])
  @Column({
    type: DataType.JSONB,
    allowNull: false,
  })
  linked_items!: Array<{
    id: string;
    type: "Story" | "Bug" | "Requirement";
    title: string;
  }>;

  @Default([])
  @Column({
    type: DataType.JSONB,
    allowNull: false,
  })
  execution_history!: Array<{
    id: string;
    cycle: string;
    status: "Passed" | "Failed" | "Blocked";
    tester: string;
    executedAt: string;
    note: string;
  }>;

  @CreatedAt
  created_at!: Date;

  @UpdatedAt
  updated_at!: Date;

  @BelongsTo(() => Project, "project_id")
  project!: Project;

  @BelongsTo(() => User, "owner_id")
  owner!: User;

  @BelongsTo(() => Task, "linked_task_id")
  linked_task?: Task;
}
