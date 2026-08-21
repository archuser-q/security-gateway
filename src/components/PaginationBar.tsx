import { useTranslation } from "react-i18next";
import type { TablePaginationConfig } from 'antd';

export function PaginationBar({ pagination }: { pagination: TablePaginationConfig }) {
  const { t } = useTranslation();

  const current = pagination.current ?? 1;
  const pageSize = pagination.pageSize ?? 10;
  const total = pagination.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="flex items-center justify-between text-sm">
      <span>
        {t('table.total', { total, defaultValue: `Total ${total} items` })}
      </span>
      <div className="flex items-center gap-1">
        <button
          disabled={current <= 1}
          onClick={() => pagination.onChange?.(current - 1, pageSize)}
          className="rounded-md border border-gray-200 px-3 py-1 disabled:opacity-40 hover:bg-gray-50"
        >
          {t('table.prev', 'Prev')}
        </button>
        <span className="px-2">
          {current} / {totalPages}
        </span>
        <button
          disabled={current >= totalPages}
          onClick={() => pagination.onChange?.(current + 1, pageSize)}
          className="rounded-md border border-gray-200 px-3 py-1 disabled:opacity-40 hover:bg-gray-50"
        >
          {t('table.next', 'Next')}
        </button>
      </div>
    </div>
  );
}