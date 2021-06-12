import { handleApiError } from "../api/utils";
import { Button, Form, FormInstance, List, notification, Select, Switch } from "antd";
import { useCallback, useEffect, useState } from 'react';
import { RegistrationKeyInfo, Result, Service } from "wwg-api";
import { useTranslation } from "react-i18next";
import { ClockCircleOutlined, PieChartOutlined, PlusOutlined } from "@ant-design/icons";
import { useHistory } from "react-router";
import Modal from "antd/lib/modal/Modal";

type KeyInfo = RegistrationKeyInfo & {
    registration_key?: string | undefined;
    activated?: boolean | undefined;
};

type Class = { classNumber: number, gradYear: number };
const mockGetClass = async (): Promise<{ classes: Class[] }> => {
    if (Math.random() < 0.2) {
        return Promise.reject({
            result: Result.result.ERROR,
            message: 'Failed to fetch classes'
        });
    }
    return Promise.resolve({
        classes: [{
            classNumber: 2,
            gradYear: 2020
        }, {
            classNumber: 2,
            gradYear: 2019
        }, {
            classNumber: 3,
            gradYear: 2019
        }]
    });
}
const RegistrationKeyForm = (props: { form: FormInstance<{ class: string }>, onSuccess?: () => void }) => {
    const history = useHistory();
    const [classes, setClasses] = useState<Class[]>([]);

    useEffect(() => {
        //Service.getClass()
        mockGetClass()
            .then(res => {
                props.form.setFieldsValue({ class: res.classes.length > 0 ? JSON.stringify(res.classes[0]) : '' })
                setClasses(res.classes);
            })
            .catch(err => handleApiError(err)
                .then(err => {
                    notification.error({
                        message: '失败',
                        description: <><p>未能获取可用班级。</p><p>错误信息: {err.message}</p></>
                    });
                    if (err.requireLogin) {
                        setTimeout(() => history.push('/login', history.location), 1500);
                    }
                }))
    }, [props.form, history]);

    const handleFinish = useCallback((data: { class: string }) => {
        const class_ = JSON.parse(data.class) as Class;
        Service.postRegistrationKey({
            class_number: class_.classNumber,
            grad_year: class_.gradYear,
        })
            .then(res => {
                if (res.result === Result.result.SUCCESS) {
                    notification.success({
                        message: '成功',
                        description: `已成功创建注册码: ${res.registration_key}`
                    });
                    props.onSuccess && props.onSuccess();
                }
                else {
                    return Promise.reject(res.message);
                }
            })
            .catch(err => handleApiError(err)
                .then(err => notification.error({
                    message: '失败',
                    description: <><p>未能添加注册码。</p><p>错误信息: {err.message}</p></>
                })))
    }, [props]);

    return (
        <Form
            form={props.form}
            onFinish={handleFinish}
        >
            <Form.Item
                name='class'
                label='选择班级'
            >
                <Select disabled={classes.length === 0}>
                    {classes.map((value, index) =>
                        <Select.Option
                            key={index}
                            value={JSON.stringify(value)}
                        >
                            {value.gradYear}届 {value.classNumber}班
                        </Select.Option>
                    )}
                </Select>
            </Form.Item>
        </Form>
    )
}

const RegistrationKey = () => {
    const [t] = useTranslation();
    const [visible, setVisible] = useState(false);
    const [keys, setKeys] = useState<KeyInfo[]>([]);
    const [form] = Form.useForm<{ class: string }>();

    const fetchKeys = useCallback(() => {
        Service.getRegistrationKey()
            .then(result => setKeys(result.registration_keys ?? []))
            .catch(err => handleApiError(err)
                .then(res => {
                    notification.error({
                        message: '错误',
                        description: <>未能获取注册码<p>错误信息：{res.message}</p></>
                    });
                }))
    }, [])

    useEffect(() => {
        fetchKeys();
    }, [fetchKeys]);

    return (
        <>
            <Button onClick={() => setVisible(true)}><PlusOutlined /> 添加注册码</Button>
            <List>
                {keys.map((value, index) =>
                    <List.Item
                        key={index}
                        actions={[<Switch
                            checkedChildren='已激活'
                            unCheckedChildren='已禁用'
                            defaultChecked={value.activated}
                            onChange={(checked) => {
                                Service.updateRegistrationKey({
                                    registration_key: value.registration_key,
                                    expiration_date: value.expiration_date,
                                    activate: checked,
                                })
                                    .then(result => {
                                        if (result.result === Result.result.ERROR) {
                                            return Promise.reject(result.message);
                                        }
                                    })
                                    .catch(err => handleApiError(err)
                                        .then(err => notification.error({
                                            message: '错误',
                                            description: err.message
                                        })));
                            }}
                        ></Switch>]}
                    >
                        <List.Item.Meta
                            title={value.registration_key}
                            description={
                                <>
                                    <p><ClockCircleOutlined /> 过期时间: {new Date(value.expiration_date ?? '').toLocaleString()}</p>
                                    <p><PieChartOutlined /> 适用范围: {value.class_number}/{value.grad_year} [{t(value.curriculum ?? '')}]</p>
                                </>
                            }
                        />
                    </List.Item>
                )}
            </List>
            <Modal
                title={t('Add Registration Key')}
                visible={visible}
                onOk={() => {
                    form.submit();
                    setVisible(false);
                }}
                okText={t('Confirm')}
                onCancel={() => setVisible(false)}
                cancelText={t('Cancel')}
            >
                <RegistrationKeyForm form={form} onSuccess={() => fetchKeys()} />
            </Modal>
        </>
    )
}

export default RegistrationKey;
