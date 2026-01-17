import { MindMap, type MindMapOptions } from '@ant-design/graphs';
import { mindmapData } from './config/mindmapConfig/data';

const Mindmap = () => {
  const data = mindmapData();
  const options: MindMapOptions = {
    autoFit: 'view',
    data,
    edge: {
      style: {
        endArrow: false,
      },
    },
    direction: 'right',
    animation: false,
  };
  return(
    <div style={{ padding: '24px' }}>
      <h2 style={{ marginBottom: '24px', fontSize: '20px', fontWeight: 600 }}>
        Route Direction Overview
      </h2>
      <div style={{ height: '400px' }}>
        <MindMap {...options} />
      </div>
    </div>
  )
};

export default Mindmap