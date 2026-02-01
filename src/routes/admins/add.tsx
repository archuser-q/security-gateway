import { APISIX, type APISIXType } from '@/types/schema/apisix';
import { pipeProduce } from '@/utils/producer';
import { notifications } from '@mantine/notifications';
import { useMutation } from '@tanstack/react-query';
import { createFileRoute, useRouter } from '@tanstack/react-router'
import { putAdminReq } from '@/apis/admin';
import { useTranslation } from 'react-i18next'
import { req } from '@/config/req'
import { zodResolver } from '@hookform/resolvers/zod';
import { FormProvider, useForm } from 'react-hook-form';
import { FormPartAdmin } from '@/components/form-slice/FormPartAdmin';
import { FormSubmitBtn } from '@/components/form/Btn';
import PageHeader from '@/components/page/PageHeader';
import { FormTOCBox } from '@/components/form-slice/FormSection';

const AdminAddForm = () => {
  const { t } = useTranslation();
  const router = useRouter();

  const putAdmin = useMutation({
    mutationFn: (d: APISIXType['AdminPut']) => putAdminReq(req, pipeProduce()(d)),
    async onSuccess(_, res) {
      notifications.show({
        message: t('info.add.success', {name: t('admins.singular')}),
        color: 'green',
      });
      await router.navigate({
        to : '/admins/detail/$username',
        params: { username: res.username },
      });
    },
  });

  const form = useForm({
    resolver: zodResolver(APISIX.AdminPut),
    shouldUnregister: true,
    shouldFocusError: true,
    mode: 'all',
  })

  return (
    <FormProvider {...form}>
      <form 
        onSubmit={form.handleSubmit((d)=> 
          putAdmin.mutateAsync(pipeProduce()(d))
        )}
      >
        <FormPartAdmin/>
        <FormSubmitBtn>{t('form.btn.add')}</FormSubmitBtn>
      </form>
    </FormProvider>
  )
}

function RouteComponent() {
  const { t } = useTranslation();
  return (
    <>
      <PageHeader
        title={t('info.add.title', { name: t('consumers.singular') })}
      />
      <FormTOCBox>
        <AdminAddForm />
      </FormTOCBox>
    </>
  );
}

export const Route = createFileRoute('/admins/add')({
  component: RouteComponent,
})
