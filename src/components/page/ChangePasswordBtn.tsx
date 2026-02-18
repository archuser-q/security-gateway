import { Button } from "@mantine/core";
import { modals } from "@mantine/modals";
import { useTranslation } from "react-i18next";
import { ChangePasswordForm } from "../form/ChangePasswordForm";

export type ChangePasswordBtnProps = {
    id: string;
};

export const ChangePasswordBtn = ({
  id
}: ChangePasswordBtnProps) => {
    const { t } = useTranslation();

    const openConfirm = () => {
        modals.open({
            title: t('form.admins.title'),
            centered:true,
            children: <ChangePasswordForm id={id}/>
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