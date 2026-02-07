import React from 'react';
import { Tooltip } from 'antd';
import { QuestionCircleOutlined } from '@ant-design/icons';

const HelpTooltip = ({ title, content, placement = 'topRight' }) => {
  return (
    <Tooltip 
      title={
        <div style={{ maxWidth: '300px' }}>
          <div style={{ fontWeight: 'bold', marginBottom: '8px', color: '#fff' }}>
            {title}
          </div>
          <div style={{ lineHeight: '1.4' }}>
            {content}
          </div>
        </div>
      }
      placement={placement}
      overlayStyle={{ maxWidth: '350px' }}
    >
      <QuestionCircleOutlined 
        style={{ 
          color: '#1890ff', 
          fontSize: '16px', 
          marginLeft: '8px',
          cursor: 'help',
          opacity: 0.7,
          transition: 'opacity 0.2s'
        }}
        onMouseEnter={(e) => e.target.style.opacity = '1'}
        onMouseLeave={(e) => e.target.style.opacity = '0.7'}
      />
    </Tooltip>
  );
};

export default HelpTooltip;