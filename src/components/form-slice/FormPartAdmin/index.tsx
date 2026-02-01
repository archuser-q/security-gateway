import { useFormContext } from "react-hook-form";
import type { AdminPostType } from "./schema";
import { FormItemTextInput } from "@/components/form/TextInput";
import { FormSectionPluginsOnly } from "../FormPartConsumer";
import { FormPartBasic } from "../FormPartBasic";
import { useTranslation } from "react-i18next";

const FormSectionAdminBasic = () => {
    const { t } = useTranslation();
    const { control } = useFormContext<AdminPostType>();
    
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
            <FormSectionPluginsOnly/>
        </>
    );
};

export const FormPartAdmin = () => {
    return (
        <FormSectionAdminBasic />
    );
};