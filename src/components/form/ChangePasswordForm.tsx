import { queryClient } from "@/config/queryClient";
import { req } from "@/config/req";
import { Button, PasswordInput } from "@mantine/core";
import { modals } from "@mantine/modals";
import { notifications } from "@mantine/notifications";
import { useState } from "react";
import { useTranslation } from "react-i18next";

type ChangePasswordFormProps = {
    username: string;
}

export const ChangePasswordForm = ({ username }: ChangePasswordFormProps) => {
    const { t } = useTranslation();
    const [oldPassword, setOldPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const handleSubmit = async () => {
        if (newPassword !== confirmPassword) {
            notifications.show({ color: 'red', message: 'Password do not match' });
            return;
        }
        await req.patch(`/admins/${username}`, {
            old_password: oldPassword,
            password: newPassword
        });
        await queryClient.invalidateQueries({ queryKey: ['admins'] });
        notifications.show({ color: 'green', message: t('info.update.success') });
        modals.closeAll();
    };

    return (
        <>
            <PasswordInput
                label={t('form.basic.field.oldPassword')}
                value={oldPassword}
                onChange={(e) => setOldPassword(e.currentTarget.value)}
                data-autofocus
            />
            <PasswordInput
                label={t('form.basic.field.newPassword')}
                value={newPassword}
                onChange={(e) => setNewPassword(e.currentTarget.value)}
            />
            <PasswordInput
                label={t('form.basic.field.confirmPassword')}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.currentTarget.value)}
            />
            <Button fullWidth onClick={handleSubmit} mt="md">
                {t('form.btn.save')}
            </Button>
        </>
    );
};