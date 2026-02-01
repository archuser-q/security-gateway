import { putAdminReq } from '@/apis/admin';
import { getAdminQueryOptions } from '@/apis/hooks';
import { AdminPutSchema, type AdminPutType } from '@/components/form-slice/FormPartAdmin/schema';
import type { APISIXType } from '@/types/schema/apisix';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useSuspenseQuery } from '@tanstack/react-query';
import { createFileRoute, useNavigate, useParams } from '@tanstack/react-router'
import { useEffect } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { req } from '@/config/req';
import { notifications } from '@mantine/notifications';
import { Button, Group } from '@mantine/core';
import { FormSectionGeneral } from '@/components/form-slice/FormSectionGeneral';
import { FormPartAdmin } from '@/components/form-slice/FormPartAdmin';
import { FormSubmitBtn } from '@/components/form/Btn';
import { useBoolean } from 'react-use';
import PageHeader from '@/components/page/PageHeader';
import { DeleteResourceBtn } from '@/components/page/DeleteResourceBtn';
import { FormTOCBox } from '@/components/form-slice/FormSection';
import { pipeProduce } from '@/utils/producer';

type AdminFormProps = {
  readOnly: boolean;
  setReadOnly: (v:boolean) => void;
  username: string;
}

const AdminDetailForm = (props: AdminFormProps) => {
  const { readOnly, setReadOnly, username }= props;
  const { t } = useTranslation();

  const { data: adminData, refetch } = useSuspenseQuery(
    getAdminQueryOptions(username)
  );

  const form = useForm({
    resolver: zodResolver(AdminPutSchema),
    shouldUnregister: true,
    shouldFocusError: true,
    mode: 'all',
    disabled: readOnly,
  });

  useEffect(() => {
    if (!adminData?.value) return;

    form.reset({
      ...adminData.value,
    });
  }, [adminData, form]);

  const putAdmin = useMutation({
    mutationFn: (d: APISIXType['AdminPut']) => 
      putAdminReq(req, d),
    async onSuccess(){
      notifications.show({
        message: t('info.edit.success', {name: t('admins.singular')}),
        color: 'green',
      });
      await refetch();
      setReadOnly(true);
    }
  })

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit((d)=>putAdmin.mutateAsync(pipeProduce()(d)))}>
        <FormSectionGeneral showID={false} readOnly/>
        <FormPartAdmin/>
        {!readOnly && (
          <Group>
            <FormSubmitBtn>{t('form.btn.save')}</FormSubmitBtn>
            <Button variant="outline" onClick={() => setReadOnly(true)}>
              {t('form.btn.cancel')}
            </Button>
          </Group>
        )}
      </form>
    </FormProvider>
  );
};

type AdminDetailProps = Pick<AdminFormProps, 'username'> & {
  onDeleteSuccess: () => void;
}
const AdminDetail = (props: AdminDetailProps) => {
  const { username, onDeleteSuccess } = props;
  const { t } = useTranslation();
  const [readOnly, setReadOnly] = useBoolean(true);

  return (
    <>
      <PageHeader 
        title={t('info.edit.title', {name: t('admins.singular')})}
        {...(readOnly && {
          title: t('info.detail.title', { name: t('admins.singular')}),
          extra: (
            <Group>
              <Button
                onClick={()=>setReadOnly(false)}
                size="compact-sm"
                variant="gradient"
              >
                {t('form.btn.edit')}
              </Button>
              <DeleteResourceBtn
                mode="detail"
                name={t('admins.singular')}
                target={username}
                api={'${API_ADMINS}/${username}'}
                onSuccess={onDeleteSuccess}
              ></DeleteResourceBtn>
            </Group>
          )
        })}
      />
      <FormTOCBox>
        <AdminDetailForm
          readOnly={readOnly}
          setReadOnly={setReadOnly}
          username={username}  
        />
      </FormTOCBox>
    </>
  )
}
function RouteComponent() {
  const { username } = useParams({ from: '/admins/detail/$username'});
  const navigate = useNavigate();
  return (
    <AdminDetail 
      username={username} 
      onDeleteSuccess={()=>navigate({ to: '/admins'})}
    />
  )
}

export const Route = createFileRoute('/admins/detail/$username')({
  component: RouteComponent,
})
