import Table from "cli-table3";

export function printVersion(version: string): void {
  const table = new Table({
    head: ["현재버전"],
    style: { head: [] },
  });
  table.push([version]);
  console.log(table.toString());
}
