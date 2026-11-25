<script setup lang="ts" generic="T extends Record<string, any>">
// A plain table with sortable columns, an empty state and CSV / Excel export.
import { ArrowDown, ArrowUp, ArrowUpDown, Download } from "@lucide/vue";
import type { Column } from "~/utils/types";


const props = withDefaults(defineProps<{
  rows: T[];
  columns: Column<T>[];
  exportName?: string;
  empty?: string;
  rowKey?: (row: T) => string | number;
  defaultSort?: { key: string; desc?: boolean };
  loading?: boolean;
  maxRows?: number;
}>(), { empty: "Нет данных за выбранный период", exportName: "", maxRows: 500 });

const emit = defineEmits<{ rowClick: [row: T] }>();
const slots = defineSlots<Record<string, (props: { row: T }) => unknown>>();

const sort = ref<{ key: string; desc: boolean } | null>(props.defaultSort ? { key: props.defaultSort.key, desc: !!props.defaultSort.desc } : null);
const valueOf = (column: Column<T>, row: T) => (column.value ? column.value(row) : (row[column.key] as string | number | null));
const sorted = computed(() => {
  if (!sort.value) return props.rows;
  const column = props.columns.find((c) => c.key === sort.value!.key);
  if (!column) return props.rows;
  const dir = sort.value.desc ? -1 : 1;
  return [...props.rows].sort((a, b) => {
    const x = valueOf(column, a);
    const y = valueOf(column, b);
    if (x === y) return 0;
    if (x === null || x === undefined) return 1;
    if (y === null || y === undefined) return -1;
    return (typeof x === "number" && typeof y === "number" ? x - y : String(x).localeCompare(String(y), "ru")) * dir;
  });
});
const visible = computed(() => sorted.value.slice(0, props.maxRows));
const toggleSort = (key: string) => {
  sort.value = sort.value?.key === key ? (sort.value.desc ? { key, desc: false } : null) : { key, desc: true };
};
const exportColumns = computed(() => props.columns.map((c) => ({ label: c.label, value: (row: T) => valueOf(c, row) })));
const listeners = getCurrentInstance()?.vnode.props;
const clickable = computed(() => !!listeners?.onRowClick);
</script>

<template>
  <div class="grid gap-2">
    <div v-if="exportName" class="flex justify-end">
      <DropdownMenu>
        <DropdownMenuTrigger as-child>
          <Button variant="outline" size="sm" :disabled="!rows.length">
            <Download />
            Экспорт
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem @click="exportXlsx(sorted, exportColumns, exportName)">Excel (.xlsx)</DropdownMenuItem>
          <DropdownMenuItem @click="exportCsv(sorted, exportColumns, exportName)">CSV</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
    <div class="overflow-hidden rounded-lg border">
      <Table>
        <TableHeader class="bg-muted/50">
          <TableRow>
            <TableHead v-for="column in columns" :key="column.key" :class="[column.align === 'right' && 'text-right', column.class]">
              <button
                v-if="column.sortable !== false"
                type="button"
                class="hover:text-foreground inline-flex items-center gap-1"
                :class="column.align === 'right' && 'flex-row-reverse'"
                @click="toggleSort(column.key)"
              >
                {{ column.label }}
                <ArrowDown v-if="sort?.key === column.key && sort.desc" class="size-3.5" />
                <ArrowUp v-else-if="sort?.key === column.key" class="size-3.5" />
                <ArrowUpDown v-else class="size-3.5 opacity-30" />
              </button>
              <template v-else>{{ column.label }}</template>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <template v-if="loading">
            <TableRow v-for="i in 4" :key="i">
              <TableCell v-for="column in columns" :key="column.key"><Skeleton class="h-4 w-full max-w-24" /></TableCell>
            </TableRow>
          </template>
          <TableRow v-else-if="!rows.length">
            <TableCell :colspan="columns.length" class="text-muted-foreground h-24 text-center">{{ empty }}</TableCell>
          </TableRow>
          <TableRow
            v-for="(row, index) in visible"
            v-else
            :key="rowKey ? rowKey(row) : index"
            :class="clickable && 'cursor-pointer'"
            @click="emit('rowClick', row)"
          >
            <TableCell v-for="column in columns" :key="column.key" :class="[column.align === 'right' && 'text-right tabular-nums', column.class]">
              <component :is="() => slots[column.key]!({ row })" v-if="slots[column.key]" />
              <template v-else>{{ column.format ? column.format(row) : (row[column.key] ?? "—") }}</template>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
    <p v-if="sorted.length > maxRows" class="text-muted-foreground text-xs">Показаны первые {{ maxRows }} из {{ sorted.length }}; в экспорте — все.</p>
  </div>
</template>
