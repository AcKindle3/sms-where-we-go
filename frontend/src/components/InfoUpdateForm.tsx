import { Button, Form, Input, notification, Select, Space, Tooltip } from "antd"
import _ from "lodash";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Result, Role, School, Service, Student, StudentVerbose, Visibility } from "wwg-api";
import { handleApiError, ThenType } from "../api/utils";
import { emailPattern, phonePattern } from "./RegistrationForm";
import SchoolSearchTool from "./SchoolSearchTool";

type Values = Parameters<typeof Service.updateStudent>[0];
const { Item } = Form;

const InfoUpdateForm = ({ getStudent }: { getStudent: () => Promise<Partial<Student & StudentVerbose & School & { role?: Role, visibility?: Visibility }> | undefined> }) => {
    const [t] = useTranslation();
    const [form] = Form.useForm<Values>();
    const [schoolUid, setSchoolUid] = useState(0);
    const [initialSchool, setInitialSchool] = useState('');
    const [fields, setFields] = useState<ThenType<ReturnType<typeof getStudent>>>(undefined);
    const [saving, setSaving] = useState(false);
    const getVisibilityDescription = useCallback((visibility: Visibility) => {
        switch (visibility) {
            case Visibility.PRIVATE:
                return t('Only visible to the user');
            case Visibility.CLASS:
                return t('Only visible to the students in the same class');
            case Visibility.CURRICULUM:
                return t('Only visible to the students in the same curriculum');
            case Visibility.YEAR:
                return t('Only visible to the students graduating in the same year');
            case Visibility.STUDENTS:
                return t('Visible to every registered user');
            default:
                return t('');
        }
    }, [t]);

    const getFields = useCallback(async () => {
        if (!!fields) {
            return fields;
        }
        else {
            return getStudent().then(res => {
                const data = {
                    name: res?.name,
                    class_number: res?.class_number,
                    grad_year: res?.grad_year,
                    curriculum: res?.curriculum,
                    phone_number: res?.phone_number,
                    email: res?.email,
                    wxid: res?.wxid,
                    department: res?.department,
                    major: res?.major,
                    visibility: res?.visibility,
                    role: res?.role,
                    school_uid: res?.school_uid ?? -1,
                    school_name: res?.school_name
                };
                setFields(data);
                return data
            });
        }
    }, [fields, setFields, getStudent]);

    const initialize = useCallback(() => {
        getFields()
            .then(res => {
                form.setFieldsValue(res);
                setSchoolUid(res?.school_uid ?? -1);
                setInitialSchool(res?.school_name ?? '');
            });
    }, [getFields, form])

    // eslint-disable-next-line react-hooks/exhaustive-deps
    const doUpdate = useCallback(_.throttle((data) => {
        Service.updateStudent({
            ...data,
            school_uid: schoolUid
        })
            .then((res) => {
                if (res.result === Result.result.SUCCESS) {
                    notification.success({
                        message: '成功',
                        description: '数据已保存',
                    });
                    setFields(undefined);
                }
                else {
                    return Promise.reject(res.message);
                }
            })
            .catch((err) => {
                handleApiError(err)
                    .then((res) => {
                        notification.error({
                            message: '错误',
                            description: `未能更新学生数据。错误信息：${res.message ?? '未知错误'}`
                        })
                    })
            })
            .finally(() => {
                setSaving(false);
            });
    }, 1500), [schoolUid, setFields, setSaving]);

    const handleFinished = useCallback((data: Values) => {
        if (!saving) {
            notification.info({
                message: '信息',
                description: '正在保存',
            });
            setSaving(true);
        }
        doUpdate(data);
    }, [doUpdate, saving]);

    const handleReset = () => {
        initialize();
    };

    useEffect(initialize, [initialize]);

    return <>
        <Form
            form={form}
            onFinish={handleFinished}
        >
            <Item
                name="name"
                label={t("name")}
            >
                <Input placeholder='中文姓名' />
            </Item>
            <Form.Item
                name='phone_number'
                label='电话号码'
                rules={[
                    {
                        validator(_, value) {
                            if (!!value && !value.match(phonePattern)) {
                                return Promise.reject('请正确填写电话号码');
                            }
                            else {
                                return Promise.resolve();
                            }
                        }
                    }
                ]}
                tooltip='电话号码和邮箱请至少填写一项，两者都将能够作为登录的凭证'
            >
                <Input placeholder='请输入电话号码' />
            </Form.Item>
            <Form.Item
                name='email'
                label='邮箱'
                rules={[
                    {
                        validator(_, value) {
                            if (!!value && !value.match(emailPattern)) {
                                return Promise.reject('请正确填写邮箱');
                            }
                            else {
                                return Promise.resolve();
                            }
                        }
                    }
                ]}
            >
                <Input placeholder='请输入邮箱' />
            </Form.Item>
            <Form.Item
                name='wxid'
                label='微信ID'
                tooltip='若已填写微信所绑定的电话号码，或无微信ID，此项可不填'
            >
                <Input placeholder='微信唯一ID (如 asdasdkl202122skwmrt)' />
            </Form.Item>
            <Form.Item
                name='school_uid'
                label='去向院校'
                tooltip='没有找到你的学校？点击右方 + 来添加一个学校。若目前未定去向，此项可不填。海外院校请输入英文名'
            >
                <SchoolSearchTool schoolUid={schoolUid} setSchoolUid={setSchoolUid} initialValue={initialSchool} />
            </Form.Item>
            <Form.Item
                name='department'
                label='学院'
            >
                <Input placeholder='请输入你的学院名称' />
            </Form.Item>
            <Form.Item
                name='major'
                label='专业'
            >
                <Input placeholder='请输入你的专业名称' />
            </Form.Item>
            <Form.Item
                name='visibility'
                label='隐私设置'
                tooltip={t('This setting determines the scope of users who can access your personal information (admin users excluded)')}
            >
                <Select>
                    {Object.entries(Visibility).map(([key, value]) => (
                        <Select.Option key={key} value={value}>
                            <Tooltip title={getVisibilityDescription(value)} className='underdotted'>
                                {t(key.toString())}
                            </Tooltip>
                        </Select.Option>
                    ))
                    }
                </Select>
            </Form.Item>
            <Form.Item>
                <Space>
                    <Button type='primary' htmlType='submit'>保存更改</Button>
                    <Button onClick={handleReset}>重置</Button>
                </Space>
            </Form.Item>
        </Form>
    </>;
}

export default InfoUpdateForm;
