import { useFormContext } from "react-hook-form";
import type { AdminPostType } from "./schema";
import { FormSection } from "../FormSection";
import { FormItemTextInput } from "@/components/form/TextInput";

const FormSectionAdminBasic = () => {
    const { control } = useFormContext<AdminPostType>();
    
    return (
        <FormSection legend='Admin'>
            <FormItemTextInput
                control={control}
                name="username" 
                label="Username"
            />
            <FormItemTextInput
                control={control}
                name="status" 
                label="Status" 
            />
            <FormItemTextInput
                control={control}
                name="desc"  
                label="Description"
            />
        </FormSection>
    );
};

export const FormPartAdmin = () => {
    return (
        <FormSectionAdminBasic />
    );
};