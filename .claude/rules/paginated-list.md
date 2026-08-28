# Listas Paginadas — useImmediateState + refetch manual

## Regras

- `page` usa `useImmediateState` — garante atualização síncrona antes do `refetch()`.
- Filtros usam `useRecordState` normal.
- `queryKey` **nunca** inclui `page` nem filtros — o refetch usa o closure atual.
- `setPage` passado ao `UtilsTable` **sempre** deve chamar `refetch()` em seguida.
- `useDebouncedEffect` recebe o objeto inteiro de `filters` como dep — não campos individuais.
- Delay padrão do `useDebouncedEffect`: `500` ms.
- `per_page` padrão: `15`.

---

## Estrutura completa

```tsx
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { LayoutInternal } from '@/src/components/layout/Internal';
import { UtilsCard } from '@/src/components/utils/Card';
import { UtilsTable } from '@/src/components/utils/Table';
import { FormTextInput } from '@/src/components/form/TextInput';
import { FormSelect } from '@/src/components/form/Select';
import { Icon } from '@iconify/react';
import { useImmediateState, useRecordState } from '@/src/utils/state';
import { useDebouncedEffect } from '@/src/utils/hooks';
import { getCharges, GET_CHARGES_KEY } from '@/src/resources/charge/services/getCharges';
import type { PaginatedMeta } from '@/src/shared/types/api';

export default function ChargesPage() {
  const [page, setPage] = useImmediateState(1);

  const { state: filters, field: filterField, setValue: setFilterValue } = useRecordState({
    search: '',
    status: '' as string,
  });

  const {
    data: chargesData,
    isFetching: chargesIsFetching,
    refetch: chargesRefetch,
  } = useQuery({
    queryKey: GET_CHARGES_KEY,
    queryFn: ({ signal }) =>
      getCharges({
        signal,
        query: {
          search: filters.search || undefined,
          status: filters.status || undefined,
          page,
          per_page: 15,
        },
      }),
  });

  useDebouncedEffect(() => {
    setPage(1);
    chargesRefetch();
  }, [filters], 500);

  const charges = useMemo(() => chargesData?.data.items ?? [], [chargesData]);
  const chargesMeta = useMemo<Partial<PaginatedMeta>>(() => chargesData?.data.meta ?? {}, [chargesData]);

  return (
    <LayoutInternal title="Cobranças" description="...">
      <UtilsCard className="flex flex-col gap-8">
        <div className="flex items-center gap-4">
          <FormTextInput
            placeholder="Buscar..."
            {...filterField('search')}
            leftSection={<Icon icon="lucide:search" className="text-gray-500" />}
            className="max-w-xs w-full"
          />

          <FormSelect
            placeholder="Status"
            data={STATUS_OPTIONS}
            {...filterField('status')}
            onChange={(v) => {
              setFilterValue('status', v ?? '');
              setPage(1);
            }}
            clearable
            className="w-44"
          />
        </div>

        <UtilsTable
          rows={charges}
          rowKey={({ item }) => item.id}
          loading={chargesIsFetching}
          lastPage={chargesMeta.last_page!}
          page={page}
          setPage={(newPage) => {
            setPage(newPage);
            chargesRefetch();
          }}
          emptyText="Nenhum item encontrado."
          columns={{ /* ... */ }}
          renderCells={{ /* ... */ }}
        />
      </UtilsCard>
    </LayoutInternal>
  );
}
```
