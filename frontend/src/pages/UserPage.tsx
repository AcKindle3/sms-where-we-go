import { Card, Layout, notification } from "antd";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useHistory } from "react-router";
import { Service } from "wwg-api";
import { handleApiError } from "../api/utils";
import InfoUpdateForm from "../components/InfoUpdateForm";
import AppPage, { menuOptions } from "./AppPage";

const { Content } = Layout;
const UserPage = () => {
    const [t] = useTranslation();
    const history = useHistory();

    const getCurrentStudent = useCallback(async () => {
        try {
            const res = await Service.getStudent(true);
            if (res.students !== undefined && res.students?.length > 0) {
                return res.students[0];
            }
            else {
                return;
            }
        }
        catch (err) {
            handleApiError(err).then((res) => {
                notification.error({
                    message: "错误",
                    description: t(res.message)
                })
                if (res.requireLogin) {
                    setTimeout(() => {
                        history.push('/login', history.location);
                    }, 200);
                }
            });
        }
    }, [t, history]);

    return (
        <AppPage activeKey={menuOptions.SETTINGS}>
            <Layout className='centered-layout'>
                <Content>
                    <Card>
                        <InfoUpdateForm getStudent={getCurrentStudent} />
                    </Card>
                </Content>
            </Layout>
        </AppPage>
    )
}

export default UserPage;
