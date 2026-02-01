import { useFormContext } from "react-hook-form";
import type { APISIXType } from '@/types/schema/apisix';
import { FormItemTextInput } from "@/components/form/TextInput";
import { FormPartBasic } from "../FormPartBasic";
import { useTranslation } from "react-i18next";

const FormSectionAdminBasic = () => {
    const { t } = useTranslation();
    const { control } = useFormContext<APISIXType['AdminPut']>();
    
    return (
        <>
            <FormPartBasic
              showName={false}
              before={
                <FormItemTextInput
                  control={control}
                  name="username"
                  label={t('form.consumers.username')}
                  required
                />
              }
            />
        </>
    );
};

export const FormPartAdmin = () => {
    return (
        <FormSectionAdminBasic />
    );
};