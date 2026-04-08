import database from "../config/database";

const tableColumnCache = new Map<string, Promise<Set<string>>>();

const loadTableColumns = async (tableName: string) => {
  const queryInterface = database.getQueryInterface();
  const definition = await queryInterface.describeTable(tableName);
  return new Set(Object.keys(definition));
};

export const getTableColumns = async (tableName: string) => {
  if (!tableColumnCache.has(tableName)) {
    tableColumnCache.set(tableName, loadTableColumns(tableName));
  }

  return tableColumnCache.get(tableName)!;
};

export const tableHasColumn = async (tableName: string, columnName: string) => {
  const columns = await getTableColumns(tableName);
  return columns.has(columnName);
};
