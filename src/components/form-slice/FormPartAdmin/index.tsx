import { useFormContext } from "react-hook-form";
import { useTranslation } from "react-i18next"
import type { AdminPostType } from "./schema";
import { FormSection } from "../FormSection";
import { FormItemTextInput } from "@/components/form/TextInput";

const FormSectionAdminBasic = () => {
    const { t } = useTranslation();
    const { control } = useFormContext<AdminPostType>();

    return (
        <FormSection legend='Admin'>
            <FormItemTextInput
                control={control}
                name="nationalId"
                label="National ID"
            />
            <FormItemTextInput
                control={control}
                name="password"
                label="Password"
            />
        </FormSection>
    )
}


export const FormPartAdmin = () => {
    return(
        <FormSectionAdminBasic/>
    )
}