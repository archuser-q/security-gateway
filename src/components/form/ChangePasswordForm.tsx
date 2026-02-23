import { queryClient } from "@/config/queryClient";
import { req } from "@/config/req";
import { useAuth } from "@/context/AuthContext";
import { Button, TextInput } from "@mantine/core";
import { modals } from "@mantine/modals";
import { notifications } from "@mantine/notifications";
import { useState } from "react";
import { useTranslation } from "react-i18next";

type ChangePasswordFormProps = {
    id: string;
    password: string;
}

export const ChangePasswordForm = ({id, password}: ChangePasswordFormProps) => {
    const {t} = useTranslation();
    const auth = useAuth();
    const [oldPassword, setOldPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const handleSubmit = async() => {
        if (auth.user?.role==="admin"){
            const decoded = password ? atob(password) : "";

            if (oldPassword != decoded){
                notifications.show({
                    color: 'red',
                    message: 'Invalid password'
                });
                return;
            }
        }
        if (newPassword != confirmPassword){
            notifications.show({
                color: 'red',
                message: 'Password do not match'
            });
            return;
        }
        await req.patch(`/admins/${id}`,{
            password: newPassword
        });
        await queryClient.invalidateQueries({
            queryKey: ['admins']
        });
        notifications.show({
            color: 'green',
            message: t('info.update.success')
        });
        modals.closeAll();
    };
    return(
        <>
            {auth.user?.role==="admin" && (
                <TextInput 
                    label={t('form.basic.field.oldPassword')}
                    value={oldPassword}
                    onChange={(e)=>setOldPassword(e.currentTarget.value)}
                    data-autofocus
                />
            )}
            <TextInput 
                label={t('form.basic.field.newPassword')}
                value={newPassword}
                onChange={(e)=>setNewPassword(e.currentTarget.value)}
                data-autofocus
            />
            <TextInput 
                label={t('form.basic.field.confirmPassword')}
                value={confirmPassword}
                onChange={(e)=>setConfirmPassword(e.currentTarget.value)}
                data-autofocus
            />
            <Button 
                fullWidth 
                onClick={handleSubmit} 
                mt="md"
            >
                {t('form.btn.save')}
            </Button>
        </>
    )
}