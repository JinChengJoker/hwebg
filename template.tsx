import { PlusOutlined } from '@ant-design/icons';
import { Button, message, Drawer, Modal } from 'antd';
import React, { useState, useRef } from 'react';
import { PageContainer, FooterToolbar } from '@ant-design/pro-layout';
import type { ProColumns, ActionType } from '@ant-design/pro-table';
import ProTable from '@ant-design/pro-table';
import type { ProDescriptionsItemProps } from '@ant-design/pro-descriptions';
import ProDescriptions from '@ant-design/pro-descriptions';
import BasicModalForm from '@/components/BasicModalForm';
import lodash from 'lodash';
import type { ProFormColumnsType } from '@ant-design/pro-form';
{{__import_services__}}

const handleCreate = async (fields: {{__create_request_type__}}) => {
  const hide = message.loading('正在添加');
  try {
    await {{__create_service_name__}}({ ...fields });
    hide();
    message.success('添加成功');
    return true;
  } catch (error) {
    hide();
    message.error('添加失败，请重试！');
    return false;
  }
};

const handleUpdate = async (fields: Partial<{{__pb_type__}}>, currentRow: {{__pb_type__}}) => {
  const hide = message.loading('正在修改');
  try {
    await {{__update_service_name__}}(
      { id: currentRow?.id },
      {
        ...currentRow,
        ...fields,
      },
    );
    hide();
    message.success('修改成功');
    return true;
  } catch (error) {
    hide();
    message.error('修改失败，请重试！');
    return false;
  }
};

const handleDel = async (fields: {{__pb_type__}}) => {
  const hide = message.loading('正在删除');
  try {
    await {{__delete_service_name__}}({
      id: fields.id,
    });
    hide();
    message.success('删除成功');
    return true;
  } catch (error) {
    hide();
    message.error('删除失败，请重试');
    return false;
  }
};

const TableList: React.FC = () => {
  const [createModalVisible, setCreateModalVisible] = useState<boolean>(false);
  const [updateModalVisible, setUpdateModalVisible] = useState<boolean>(false);
  const [detailVisible, setDetailVisible] = useState<boolean>(false);
  const actionRef = useRef<ActionType>();
  const [currentRow, setCurrentRow] = useState<{{__pb_type__}}>();
  const [selectedRows, setSelectedRows] = useState<{{__pb_type__}}[]>([]);

  const columns: ProFormColumnsType<{{__pb_type__}}>[] = [
    {
      title: 'ID',
      dataIndex: 'id',
      hideInSearch: true,
      hideInDescriptions: true,
      hideInForm: true,
    },
    {{__columns__}},
    {
      title: '操作',
      dataIndex: 'option',
      valueType: 'option',
      width: 160,
      hideInDescriptions: true,
      render: (_, record) => [
        <a
          key="view"
          onClick={() => {
            setCurrentRow(record);
            setDetailVisible(true);
          }}
        >
          查看
        </a>,
        <a
          key="update"
          onClick={() => {
            setCurrentRow(record);
            setUpdateModalVisible(true);
          }}
        >
          编辑
        </a>,
        <a
          key="del"
          onClick={() => {
            Modal.confirm({
              title: '删除',
              content: '确定删除该项吗？',
              okText: '确认',
              cancelText: '取消',
              onOk: async () => {
                await handleDel(record);
                actionRef.current?.reloadAndRest?.();
              },
            });
          }}
        >
          删除
        </a>,
      ],
    },
  ];

  return (
    <PageContainer>
      <ProTable<{{__pb_type__}}>
        actionRef={actionRef}
        rowKey="id"
        toolBarRender={() => [
          <Button
            type="primary"
            key="primary"
            onClick={() => {
              setCreateModalVisible(true);
            }}
          >
            <PlusOutlined /> 新建
          </Button>,
        ]}
        request={(params) =>
          {{__list_service_name__}}({
            ...lodash.omit(params, ['current', 'pageSize']),
            page: String(params.current),
            page_size: String(params.pageSize),
          })
        }
        columns={columns as ProColumns<{{__pb_type__}}>[]}
        rowSelection={{
          onChange: (_, rows) => {
            setSelectedRows(rows);
          },
        }}
      />
      {selectedRows?.length > 0 && (
        <FooterToolbar
          extra={
            <div>
              已选择{' '}
              <a
                style={{
                  fontWeight: 600,
                }}
              >
                {selectedRows.length}
              </a>{' '}
              项
            </div>
          }
        >
          <Button
            onClick={async () => {
              console.log(selectedRows);
              setSelectedRows([]);
              actionRef.current?.reloadAndRest?.();
            }}
          >
            批量操作
          </Button>
        </FooterToolbar>
      )}

      <BasicModalForm
        width={1000}
        title="新建"
        columns={columns}
        visible={createModalVisible}
        onVisibleChange={setCreateModalVisible}
        modalProps={{
          destroyOnClose: true,
        }}
        onFinish={async (value) => {
          const success = await handleCreate(value as {{__create_request_type__}});
          if (success) {
            setCreateModalVisible(false);
            if (actionRef.current) {
              actionRef.current.reload();
            }
          }
        }}
      />

      <BasicModalForm
        width={1000}
        title="编辑"
        columns={columns}
        visible={updateModalVisible}
        onVisibleChange={setUpdateModalVisible}
        modalProps={{
          destroyOnClose: true,
          onCancel: () => {
            setCurrentRow(undefined);
          },
        }}
        initialValues={currentRow}
        onFinish={async (value) => {
          const success = await handleUpdate(value, currentRow as {{__pb_type__}});
          if (success) {
            setUpdateModalVisible(false);
            setCurrentRow(undefined);
            if (actionRef.current) {
              actionRef.current.reload();
            }
          }
        }}
      />

      <Drawer
        width={600}
        visible={detailVisible}
        onClose={() => {
          setCurrentRow(undefined);
          setDetailVisible(false);
        }}
        closable={false}
      >
        {currentRow?.id && (
          <ProDescriptions<{{__pb_type__}}>
            title={currentRow?.title}
            column={2}
            request={async () => ({
              data: currentRow || {},
            })}
            params={{
              id: currentRow?.id,
            }}
            columns={columns as ProDescriptionsItemProps<{{__pb_type__}}>[]}
          />
        )}
      </Drawer>
    </PageContainer>
  );
};

export default TableList;
