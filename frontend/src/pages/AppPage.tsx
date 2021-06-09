import { BarsOutlined, CompassOutlined, SettingOutlined } from '@ant-design/icons';
import { Layout, Menu, Space } from 'antd';
import React from 'react';
import { useHistory } from 'react-router';
import '../app.css';

const { Header, Content } = Layout;
export enum menuOptions {
    MAP = 'map', LIST = 'list', SETTINGS = 'settings', ADMIN = 'admin'
}

const AppPage = ({ activeKey, children }: { activeKey: menuOptions, children: React.ReactNode }) => {
    const history = useHistory();

    return (
        <Layout style={{ minHeight: '100vh' }}>
            <Header className='app-header'>
                <Menu
                    mode='horizontal'
                    activeKey={activeKey}
                >
                    <Menu.Item key='map' onClick={() => history.push('/map')}>
                        <Space>
                            <CompassOutlined /> 地图
                        </Space>
                    </Menu.Item>
                    <Menu.Item key='list' onClick={() => history.push('/list')}>
                        <Space>
                            <BarsOutlined /> 列表
                        </Space>
                    </Menu.Item>
                    <Menu.Item key='settings' onClick={() => history.push('/user')}>
                        <Space>
                            <SettingOutlined /> 设置
                        </Space>
                    </Menu.Item>
                </Menu>
            </Header>
            <Content className='app-content'>
                <div className='app-content-container'>
                    {children}
                </div>
            </Content>
        </Layout>
    )
}

export default AppPage;