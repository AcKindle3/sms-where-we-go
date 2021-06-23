import { Button, Divider, Form, Input, Select, Space, Modal, notification } from "antd";
import { useState } from "react";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Service } from "wwg-api";
import { createNotifyError, handleApiError } from "../api/utils";

type Values = Parameters<typeof Service.publicReportFeedback>[0]

const reasons = ["registration", "reset password", "update info", "improvement", "general"];
const FeedbackForm = ({ isPublic, cb }: { isPublic: boolean, cb?: () => void }) => {
    const [t] = useTranslation();
    const [form] = Form.useForm<Values>();
    const [visible, setVisible] = useState(false);
    const [feedbackUid, setFeedbackUid] = useState('');

    const handleSubmit = useCallback((data: Values) => {
        (isPublic ? Service.publicReportFeedback : Service.userReportFeedback)(data)
            .then(result => {
                if (isPublic && result.feedback_uid !== undefined) {
                    setVisible(true);
                    setFeedbackUid(result.feedback_uid);
                }
                form.resetFields();
                cb && cb();
                notification.success({
                    message: '成功',
                    description: '你的反馈已提交，管理员将会尽快处理'
                });
            })
            .catch(err => handleApiError(err, createNotifyError(t, t('Error'), '未能提交反馈')))
    }, [t, cb, form, isPublic, setFeedbackUid]);

    return (
        <>
            <Form
                form={form}
                onFinish={handleSubmit}
            >
                {isPublic && <>
                    <Form.Item name='name' label='姓名'>
                        <Input placeholder='请输入你的姓名 (选填)' />
                    </Form.Item>
                    <Divider>联系方式 (若无需回复可不填)</Divider>
                    <Form.Item name='email' label='邮箱'>
                        <Input placeholder='请输入你的邮箱 (选填)' />
                    </Form.Item>
                    <Form.Item name='phone_number' label='电话号码'>
                        <Input placeholder='请输入你的电话号码 (选填)' />
                    </Form.Item>
                    <Form.Item name='class_number' label='班级号码'>
                        <Input placeholder='请输入你的班级号码 (如高三 (3)班请填3) (选填)' type='number' />
                    </Form.Item>
                    <Form.Item name='grad_year' label='毕业年份'>
                        <Input placeholder='请输入你的毕业年份 (如2021) (选填)' />
                    </Form.Item>
                </>
                }
                <Divider>反馈</Divider>
                <Form.Item name='reason' label='反馈原因' rules={[{ required: true, message: '请选择反馈原因' }]} required>
                    <Select>
                        {reasons.map(val => (
                            <Select.Option key={val} value={val}>
                                {t(val)}
                            </Select.Option>
                        ))}
                    </Select>
                </Form.Item>
                <Form.Item name='title' label='标题'>
                    <Input placeholder='反馈信息的标题 (选填)' />
                </Form.Item>
                <Form.Item name='content' label='备注'>
                    <Input.TextArea placeholder='对标题和反馈原因的补充信息 (选填)' />
                </Form.Item>
                <Space>
                    <Button type='primary' htmlType='submit'>提交</Button>
                    {!!feedbackUid && <Button type='default' onClick={() => setVisible(true)}>显示反馈码</Button>}
                </Space>
            </Form>
            <Modal title='提交成功!' visible={visible} onOk={() => setVisible(false)} onCancel={() => setVisible(false)} okText={t('Confirm')} cancelText={<></>}>
                你的反馈码
                <p style={{ textAlign: 'center', backgroundColor: 'antiquewhite', fontSize: '1.5rem' }}>{feedbackUid}</p>
                <p>请复制保留以备日后查询</p>
                {!isPublic && <p>你也可以在 反馈-查看 一栏查看你过往的反馈信息及处理结果</p>}
                {(form.getFieldValue('email') !== undefined || form.getFieldValue('phone_number') !== undefined) && <p>我们也会用你留下的电话号码或电子邮箱进行联系</p>}
            </Modal>
        </>
    )
}

export default FeedbackForm;