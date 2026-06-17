import { Button } from "@mantine/core";
import { modals } from "@mantine/modals";
import { useTranslation } from "react-i18next";
import { ChangePasswordForm } from "../form/ChangePasswordForm";

export type ChangePasswordBtnProps = {
    username: string
};

export const ChangePasswordBtn = ({
  username
}: ChangePasswordBtnProps) => {
    const { t } = useTranslation();

    const openConfirm = () => {
        modals.open({
            title: t('form.admins.title'),
            centered:true,
            children: <ChangePasswordForm username={username}/>
        })
    }

    return (
        <Button
            size='compact-sm'
            variant="light"
            onClick={openConfirm}
        >
            {t('form.btn.changePassword')}
        </Button>
    )
}